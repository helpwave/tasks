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

const isKeycloakUnavailable = (error: any): boolean => {
  if (!error) return false
  
  const status = error?.response?.status || error?.status || 
                 (error?.response?.data?.status) ||
                 (typeof error === 'object' && 'status' in error ? error.status : null)
  
  if (status === 400 || status === 503 || status === 502) {
    return true
  }
  
  if (error?.message && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('ECONNREFUSED')
  )) {
    return true
  }
  
  if (error?.message && (
    error.message.includes('metadata') ||
    error.message.includes('well-known') ||
    error.message.includes('configuration')
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
    (error) => isKeycloakUnavailable(error)
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
    (error) => isKeycloakUnavailable(error)
  )
}

export const handleCallback = async () => {
  return await executeWithRetry(
    () => userManager.signinRedirectCallback(),
    3,
    500,
    2,
    (error) => isKeycloakUnavailable(error)
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
    (error) => isKeycloakUnavailable(error)
  )
}

export const renewToken = async (): Promise<User | null> => {
  try {
    return await executeWithRetry(
      () => userManager.signinSilent(),
      3,
      500,
      2,
      (error) => isKeycloakUnavailable(error)
    )
  } catch (error) {
    console.warn('Silent token renewal failed:', error)
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
        (error) => isKeycloakUnavailable(error)
      )
      
      if (!user) {
        lastRestoreSessionResult = undefined
        lastRestoreSessionTime = now
        return undefined
      }

      if (user.expired) {
        console.debug('Access token expired, attempting silent refresh...')
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
      if (isKeycloakUnavailable(error)) {
        console.debug('Keycloak not ready yet, session restoration will retry:', error)
      } else {
        console.warn('Session restoration failed:', error)
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
