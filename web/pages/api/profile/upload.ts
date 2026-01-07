import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import formidable from 'formidable'
import sharp from 'sharp'
import { GraphQLClient } from 'graphql-request'
import { getConfig } from '@/utils/config'
import { UpdateProfilePictureDocument } from '@/api/gql/generated'

const PROFILE_PICTURE_DIR = process.env['PROFILE_PICTURE_DIRECTORY'] || path.join(process.cwd(), 'profile')

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

ensureDirectoryExists(PROFILE_PICTURE_DIR).catch(() => {})

export const config = {
  api: {
    bodyParser: false,
  },
}

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields, files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: false,
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ fields, files })
    })
  })
}

function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

async function getCurrentUser(token: string) {
  const config = getConfig()
  const client = new GraphQLClient(config.graphqlEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const query = `
    query GetMe {
      me {
        id
        username
        name
      }
    }
  `

  try {
    const response = await client.request<{ me: { id: string, username: string, name: string } | null }>(query)

    if (!response.me) {
      throw new Error('User not found')
    }

    return response.me
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      throw new Error('Token expired')
    }
    throw new Error('Not authenticated')
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await getCurrentUser(token)
    const { files } = await parseForm(req)

    const file = Array.isArray(files['file']) ? files['file'][0] : files['file']
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' })
    }

    const filePath = Array.isArray(file.filepath) ? file.filepath[0] : file.filepath
    const imageBuffer = await fs.readFile(filePath)

    const processedImage = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    await ensureDirectoryExists(PROFILE_PICTURE_DIR)
    const outputPath = path.join(PROFILE_PICTURE_DIR, `${user.id}.jpg`)
    await fs.writeFile(outputPath, processedImage)

    const timestamp = Date.now()
    const avatarUrl = `/api/profile/${user.id}?v=${timestamp}`

    const config = getConfig()
    const client = new GraphQLClient(config.graphqlEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    await client.request<{ updateProfilePicture: { avatarUrl: string | null } }>(
      UpdateProfilePictureDocument,
      {
        data: {
          avatarUrl,
        },
      }
    )

    return res.status(200).json({ success: true, avatarUrl })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Not authenticated' || error.message === 'Token expired')) {
      return res.status(401).json({ error: 'Authentication required. Please refresh and try again.' })
    }
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

