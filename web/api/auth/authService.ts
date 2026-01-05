'use client'

import { getConfig } from '@/utils/config'
import { executeWithRetry } from '@/utils/retry'
import type { User } from 'oidc-client-ts'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

const config = getConfig()

let restoreSessionLock: Promise<User | undefined> | null = null
let lastRestoreSessionResult: User | undefined | null = null
let lastRestoreSessionTime: number = 0
const RESTORE_SESSION_CACHE_MS = 2000

interface ErrorWithResponse {
  response?: { status?: number, data?: { status?: number } },
  status?: number,
  message?: string,
}

const isAuthenticationServerUnavailable = (error: unknown): boolean => {
  if (!error) return false

  const err = error as ErrorWithResponse
  const status = err?.response?.status || err?.status ||
                 (err?.response?.data?.status) ||
                 (typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : null)

  if (status === 400 || status === 503 || status === 502) {
    return true
  }

  if (err?.message && (
    err.message.includes('fetch') ||
    err.message.includes('network') ||
    err.message.includes('Failed to fetch') ||
    err.message.includes('ECONNREFUSED')
  )) {
    return true
  }

  if (err?.message && (
    err.message.includes('metadata') ||
    err.message.includes('well-known') ||
    err.message.includes('configuration')
  )) {
    return true
  }

  return false
}

const createUserManager = () => {
  return new UserManager({
    authority: config.auth.issuer,
    client_id: config.auth.clientId,
    redirect_uri: config.auth.redirect_uri,
    response_type: 'code',
    scope: 'openid profile email organization',
    post_logout_redirect_uri: config.auth.post_logout_redirect_uri,
    userStore: typeof window !== 'undefined' ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
    automaticSilentRenew: false,
  })
}

export const userManager = createUserManager()

export const signUp = () => {
  return executeWithRetry(
    () => userManager.signinRedirect(),
    3,
    500,
    2,
    (error) => isAuthenticationServerUnavailable(error)
  )
}

export const login = async (returnUrl?: string) => {
  return executeWithRetry(
    () => userManager.signinRedirect({
      state: { returnUrl: returnUrl || window.location.href }
    }),
    3,
    500,
    2,
    (error) => isAuthenticationServerUnavailable(error)
  )
}

export const handleCallback = async () => {
  return await executeWithRetry(
    () => userManager.signinRedirectCallback(),
    3,
    500,
    2,
    (error) => isAuthenticationServerUnavailable(error)
  )
}

export const logout = () => {
  return userManager.signoutRedirect()
}

export const getUser = async (): Promise<User | null> => {
  return await executeWithRetry(
    () => userManager.getUser(),
    3,
    500,
    2,
    (error) => isAuthenticationServerUnavailable(error)
  )
}

export const renewToken = async (): Promise<User | null> => {
  try {
    return await executeWithRetry(
      () => userManager.signinSilent(),
      3,
      500,
      2,
      (error) => isAuthenticationServerUnavailable(error)
    )
  } catch {
    return null
  }
}

export const removeUser = async () => {
  return await userManager.removeUser()
}

export const restoreSession = async (): Promise<User | undefined> => {
  if (typeof window === 'undefined') return

  const now = Date.now()
  if (restoreSessionLock === null &&
      lastRestoreSessionResult !== null &&
      (now - lastRestoreSessionTime) < RESTORE_SESSION_CACHE_MS) {
    return lastRestoreSessionResult ?? undefined
  }

  if (restoreSessionLock !== null) {
    return await restoreSessionLock
  }

  restoreSessionLock = (async (): Promise<User | undefined> => {
    try {
      const user = await executeWithRetry(
        () => userManager.getUser(),
        3,
        500,
        2,
        (error) => isAuthenticationServerUnavailable(error)
      )

      if (!user) {
        lastRestoreSessionResult = undefined
        lastRestoreSessionTime = now
        return undefined
      }

      if (user.expired) {
        const refreshedUser = await renewToken()
        const result = refreshedUser ?? undefined
        lastRestoreSessionResult = result
        lastRestoreSessionTime = now
        return result
      }

      lastRestoreSessionResult = user
      lastRestoreSessionTime = now
      return user
    } catch (error) {
      if (!isAuthenticationServerUnavailable(error)) {
        throw error
      }
      lastRestoreSessionResult = undefined
      lastRestoreSessionTime = now
      return undefined
    } finally {
      setTimeout(() => {
        restoreSessionLock = null
      }, 100)
    }
  })()

  return await restoreSessionLock
}

export const onTokenExpiringCallback = (callback: () => void) => {
  userManager.events.addAccessTokenExpiring(callback)
}
