'use client'

import { getConfig } from '@/utils/config'
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts'

const config = getConfig()

const createUserManager = () => {
  return new UserManager({
    authority: config.auth.issuer,
    client_id: config.auth.clientId,
    redirect_uri: config.auth.redirect_uri,
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: config.auth.post_logout_redirect_uri,
    userStore: typeof window !== 'undefined' ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
  })
}

export const userManager = createUserManager()

export const signUp = () => {
  return userManager.signinRedirect()
}

export const login = async (returnUrl?: string) => {
  return userManager.signinRedirect({
    state: { returnUrl: returnUrl || window.location.href }
  })
}

export const handleCallback = async () => {
  return await userManager.signinRedirectCallback()
}

export const logout = () => {
  return userManager.signoutRedirect()
}

export const getUser = async (): Promise<User | null> => {
  return await userManager.getUser()
}

export const renewToken = async (): Promise<User | null> => {
  try {
    return await userManager.signinSilent()
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
  try {
    const user = await userManager.getUser()
    if (!user) return undefined

    if (user.expired) {
      console.debug('Access token expired, attempting silent refresh...')
      const refreshedUser = await renewToken()
      return refreshedUser ?? undefined
    }

    return user
  } catch (error) {
    console.warn('Session restoration failed:', error)
    return undefined
  }
}

export const onTokenExpiringCallback = (callback: () => void) => {
  userManager.events.addAccessTokenExpiring(callback)
}
