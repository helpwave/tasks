import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

type CallToolResult = Awaited<ReturnType<Client['callTool']>>

export function toolResultToString(result: CallToolResult): string {
  if (result && typeof result === 'object' && 'content' in result && Array.isArray(result.content)) {
    const parts = result.content.map((block: { type?: string, text?: string }) => {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        return block.text
      }
      return JSON.stringify(block)
    })
    return parts.join('\n')
  }
  if (result && typeof result === 'object' && 'structuredContent' in result && result.structuredContent) {
    return JSON.stringify(result.structuredContent)
  }
  return JSON.stringify(result)
}

type OpenAiToolCall = {
  id: string,
  type: string,
  function: { name: string, arguments: string },
}

type MessageDict = Record<string, unknown>

export async function runWorkingModeWithMcp(options: {
  mcpUrl: string,
  openAiBase: string,
  apiKey: string,
  model: string,
  maxTokens: number,
  systemContent: string,
  userMessages: Array<{ role: 'user' | 'assistant', content: string }>,
}): Promise<{ content: string } | { error: string }> {
  const transport = new StreamableHTTPClientTransport(new URL(options.mcpUrl))
  const client = new Client({ name: 'helpwave-tasks-web', version: '0.1.0' })
  try {
    await client.connect(transport)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not connect to MCP server'
    return {
      error: `${msg}. Start the MCP server (e.g. python -m mcp_server.server) and set ASSISTANT_MCP_URL if it is not http://127.0.0.1:8765/mcp.`,
    }
  }

  try {
    const { tools } = await client.listTools()
    const openAiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description ?? '',
        parameters: t.inputSchema,
      },
    }))

    const messages: MessageDict[] = [
      { role: 'system', content: options.systemContent },
      ...options.userMessages.map((m) => ({ role: m.role, content: m.content })),
    ]

    const endpoint = `${options.openAiBase}/chat/completions`
    const maxRounds = 16

    for (let round = 0; round < maxRounds; round += 1) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          tools: openAiTools,
          tool_choice: 'auto',
          max_tokens: options.maxTokens,
        }),
      })
      const rawText = await res.text()
      let data: unknown
      try {
        data = JSON.parse(rawText) as unknown
      } catch {
        return { error: 'Invalid response from model API' }
      }
      if (!res.ok) {
        const err = data as { error?: { message?: string } }
        return { error: err.error?.message ?? 'Model API error' }
      }

      const choice = (
        data as {
          choices?: Array<{
            message?: {
              content?: string | null,
              tool_calls?: OpenAiToolCall[],
            },
          }>,
        }
      ).choices?.[0]?.message
      if (!choice) {
        return { error: 'Empty model response' }
      }

      const toolCalls = choice.tool_calls
      if (toolCalls && toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: choice.content ?? null,
          tool_calls: toolCalls,
        })
        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>
          } catch {
            args = {}
          }
          try {
            const toolOut = await client.callTool({
              name: tc.function.name,
              arguments: args,
            })
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: toolResultToString(toolOut),
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify({ error: msg }),
            })
          }
        }
        continue
      }

      const text = typeof choice.content === 'string' ? choice.content : ''
      return { content: text.trim() || '—' }
    }
    return { error: 'Stopped after too many tool rounds' }
  } finally {
    try {
      await transport.close()
    } catch {
      void 0
    }
  }
}
