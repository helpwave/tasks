export async function consumeOpenAiCompatibleSseStream(
  response: Response,
  onDelta: (text: string) => void
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }
  const decoder = new TextDecoder()
  let lineBuffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    lineBuffer += decoder.decode(value, { stream: true })
    const lines = lineBuffer.split('\n')
    lineBuffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) {
        continue
      }
      const payload = trimmed.slice(5).trim()
      if (payload === '' || payload === '[DONE]') {
        continue
      }
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string | null } }>,
        }
        const piece = json.choices?.[0]?.delta?.content
        if (piece) {
          onDelta(piece)
        }
      } catch {
        continue
      }
    }
  }
  const tail = lineBuffer.trim()
  if (tail.startsWith('data:')) {
    const payload = tail.slice(5).trim()
    if (payload && payload !== '[DONE]') {
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string | null } }>,
        }
        const piece = json.choices?.[0]?.delta?.content
        if (piece) {
          onDelta(piece)
        }
      } catch {
        return
      }
    }
  }
}
