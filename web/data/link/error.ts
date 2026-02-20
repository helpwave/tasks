import { onError } from '@apollo/client/link/error'
import { removeUser, dispatchSessionExpired } from '@/api/auth/authService'

function isSessionExpiredError(error: unknown): boolean {
  const err = error as { statusCode?: number, message?: string, response?: { status?: number } }
  const status = err?.statusCode ?? err?.response?.status
  if (status === 401) return true
  const msg = (err?.message ?? '').toLowerCase()
  if (msg.includes('token is not active') || msg.includes('invalid_grant') || msg.includes('session expired')) {
    return true
  }
  return false
}

export function createSessionExpiredErrorLink() {
  return onError(({ error, operation, forward }) => {
    if (!isSessionExpiredError(error)) {
      return forward(operation)
    }
    removeUser()
      .then(() => dispatchSessionExpired())
      .catch(() => dispatchSessionExpired())
  })
}
