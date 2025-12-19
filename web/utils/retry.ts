export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000,
  backoffFactor = 2,
  shouldRetry?: (error: any) => boolean
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (shouldRetry && !shouldRetry(error)) {
      throw error
    }
    
    if (retries <= 0) throw error
    
    const isKeycloakNotReady = error?.response?.status === 400 || 
                               error?.status === 400 ||
                               (error?.message && error.message.includes('400'))
    
    const initialDelay = isKeycloakNotReady ? Math.min(delay, 500) : delay
    
    await new Promise((resolve) => setTimeout(resolve, initialDelay))
    return executeWithRetry(fn, retries - 1, initialDelay * backoffFactor, backoffFactor, shouldRetry)
  }
}
