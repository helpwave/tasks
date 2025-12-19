interface ErrorWithResponse {
  response?: { status?: number },
  status?: number,
  message?: string,
}

export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000,
  backoffFactor = 2,
  shouldRetry?: (error: unknown) => boolean
): Promise<T> => {
  try {
    return await fn()
  } catch (error: unknown) {
    if (shouldRetry && !shouldRetry(error)) {
      throw error
    }

    if (retries <= 0) throw error

    const err = error as ErrorWithResponse
    const authenticationServerOnline = err?.response?.status !== 400 &&
                                      err?.status !== 400 &&
                                      !(err?.message && err.message.includes('400'))

    const initialDelay = !authenticationServerOnline ? Math.min(delay, 500) : delay

    await new Promise((resolve) => setTimeout(resolve, initialDelay))
    return executeWithRetry(fn, retries - 1, initialDelay * backoffFactor, backoffFactor, shouldRetry)
  }
}
