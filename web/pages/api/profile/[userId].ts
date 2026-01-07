import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

const PROFILE_PICTURE_DIR = process.env['PROFILE_PICTURE_DIRECTORY'] || path.join(process.cwd(), 'profile')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const userIdWithoutQuery = userId.split('?')[0] || userId
    const sanitizedUserId = path.basename(userIdWithoutQuery)
    const filePath = path.join(PROFILE_PICTURE_DIR, `${sanitizedUserId}.jpg`)

    try {
      const imageBuffer = await fs.readFile(filePath)

      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.status(200).send(imageBuffer)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'Profile picture not found' })
      }
      throw error
    }
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

