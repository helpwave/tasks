import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { runWorkingModeWithMcp } from '@/lib/assistant/workingModeMcp'

export const config = {
  api: {
    responseLimit: false,
  },
}

const modeSchema = z.enum(['info', 'working'])

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(24_000),
      })
    )
    .max(40),
  model: z.string().min(1).max(128),
  apiKey: z.string().min(1).max(512),
  baseUrl: z.string().max(512).optional(),
  mode: modeSchema,
})

const INFO_SYSTEM = `You are the in-app assistant for helpwave tasks, a demo hospital task and ward-management product.
This mode is INFO only: explain how to use the app (navigation, tasks, patients, locations, settings, saved views).
You do not have tools or live data—describe the product clearly. If unsure, say so.
Never ask users for API keys or passwords.`

const WORKING_SYSTEM = `You are the in-app assistant for helpwave tasks in WORKING mode.
You have MCP tools wired to the real GraphQL API (patients, tasks, assignments, health checks, etc.).
Use tools whenever the user needs current data or wants to create, update, or complete something.
Keep answers concise; briefly summarize what tools returned when helpful.`

function normalizeBaseUrl(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (!t) {
    return 'https://api.openai.com/v1'
  }
  return t.replace(/\/$/, '')
}

function defaultMcpUrl(): string {
  const fromEnv = process.env['ASSISTANT_MCP_URL']?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  return 'http://127.0.0.1:8765/mcp'
}

type ErrorPayload = { error: string }
type JsonOkPayload = { content: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorPayload | JsonOkPayload | void>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const { messages, model, apiKey, baseUrl, mode } = parsed.data
  const maxTokensRaw = process.env['ASSISTANT_MAX_OUTPUT_TOKENS'] ?? '2048'
  const maxTokens = Math.min(8192, Math.max(256, Number.parseInt(maxTokensRaw, 10) || 2048))
  const openAiBase = normalizeBaseUrl(baseUrl)

  if (mode === 'working') {
    const mcpUrl = defaultMcpUrl()
    const result = await runWorkingModeWithMcp({
      mcpUrl,
      openAiBase,
      apiKey,
      model,
      maxTokens,
      systemContent: WORKING_SYSTEM,
      userMessages: messages,
    })
    if ('error' in result) {
      return res.status(502).json({ error: result.error })
    }
    return res.status(200).json({ content: result.content })
  }

  const systemContent = INFO_SYSTEM
  const upstreamMessages = [
    { role: 'system' as const, content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const endpoint = `${openAiBase}/chat/completions`
  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: upstreamMessages,
        max_tokens: maxTokens,
        stream: true,
      }),
    })
  } catch {
    return res.status(502).json({ error: 'Could not reach the model API' })
  }

  if (!upstreamResponse.ok) {
    const rawText = await upstreamResponse.text()
    let errMsg = 'Model API error'
    try {
      const json = JSON.parse(rawText) as { error?: { message?: string } }
      if (typeof json.error?.message === 'string') {
        errMsg = json.error.message
      }
    } catch {
      if (rawText.trim()) {
        errMsg = rawText.slice(0, 500)
      }
    }
    return res.status(502).json({ error: errMsg })
  }

  const upstreamBody = upstreamResponse.body
  if (!upstreamBody) {
    return res.status(502).json({ error: 'Empty response from model API' })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const reader = upstreamBody.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      res.write(Buffer.from(value))
    }
    res.end()
  } catch {
    try {
      res.end()
    } catch {
      return
    }
  }
}
