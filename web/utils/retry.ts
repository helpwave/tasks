export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000,
  backoffFactor = 2
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return executeWithRetry(fn, retries - 1, delay * backoffFactor, backoffFactor)
  }
}
