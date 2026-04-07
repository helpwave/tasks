import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

export const config = {
  api: {
    responseLimit: false,
  },
}

const focusSchema = z.enum(['general', 'tasks', 'patients'])

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
  focus: focusSchema,
})

const FOCUS_SYSTEM: Record<z.infer<typeof focusSchema>, string> = {
  general:
    'The user chose the focus "Using the app". Explain UI navigation, settings, saved views, locations, and how the app is structured. Do not invent features that are not typical for a task and ward management app.',
  tasks:
    'The user chose the focus "Tasks & workflows". Explain how tasks work in helpwave tasks: creating, assigning, completing, priorities, due dates, teams, and related views. Stay generic; do not claim to see live data unless the user pasted it.',
  patients:
    'The user chose the focus "Patients". Explain patient list behavior, states, and workflows only at a high level. Do not ask for or repeat real patient identifiers or clinical details. If the user pastes sensitive-looking data, refuse and remind them this is a demo.',
}

const BASE_SYSTEM = `You are the in-app assistant for helpwave tasks, a demo hospital task and ward-management product.
Be concise, actionable, and accurate. If you are unsure, say so.
Never request API keys or passwords. Never instruct users to bypass security.
This chat does not have live access to their database; describe how to use the product, not their private data.`

function normalizeBaseUrl(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (!t) {
    return 'https://api.openai.com/v1'
  }
  return t.replace(/\/$/, '')
}

type ErrorPayload = { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorPayload | void>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const { messages, model, apiKey, baseUrl, focus } = parsed.data
  const maxTokensRaw = process.env['ASSISTANT_MAX_OUTPUT_TOKENS'] ?? '2048'
  const maxTokens = Math.min(8192, Math.max(256, Number.parseInt(maxTokensRaw, 10) || 2048))

  const systemContent = `${BASE_SYSTEM}\n\n${FOCUS_SYSTEM[focus]}`
  const upstreamMessages = [
    { role: 'system' as const, content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`
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
