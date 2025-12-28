import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

type FeedbackData = {
  url?: string,
  feedback: string,
  timestamp: string,
  username: string,
  userId?: string,
}

const FEEDBACK_DIR = process.env['FEEDBACK_DIR'] || path.join(process.cwd(), 'feedback')
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'data.json')

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

ensureDirectoryExists(FEEDBACK_DIR).catch(console.error)

async function readFeedbackFile(): Promise<FeedbackData[]> {
  try {
    await ensureDirectoryExists(FEEDBACK_DIR)
    const filePath = path.resolve(FEEDBACK_FILE)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(fileContent)
    if (!Array.isArray(parsed)) {
      console.warn('Feedback file does not contain an array, resetting to empty array')
      return []
    }
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    console.error('Error reading feedback file:', error)
    return []
  }
}

async function writeFeedbackFile(data: FeedbackData[]) {
  await ensureDirectoryExists(FEEDBACK_DIR)
  const filePath = path.resolve(FEEDBACK_FILE)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const feedbackData: FeedbackData = req.body

    if (!feedbackData.feedback || !feedbackData.timestamp || !feedbackData.username) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const existingFeedback = await readFeedbackFile()
    existingFeedback.push(feedbackData)
    await writeFeedbackFile(existingFeedback)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

