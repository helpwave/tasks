'use client'

import { getConfig } from '@/utils/config'

import type { User } from 'oidc-client-ts'
import { UserManager } from 'oidc-client-ts'

const config = getConfig()


const userManager = new UserManager({
    authority: config.auth.issuer,
    client_id: config.auth.clientId,
    redirect_uri: config.auth.redirect_uri,
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: config.auth.post_logout_redirect_uri,
})

export const signUp = () => {
    return userManager.signinRedirect()
}

export const login = (redirectURI?: string) => {
    return userManager.signinRedirect({ redirect_uri: redirectURI })
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

export const renewToken = async () => {
    return await userManager.signinSilent()
}

export const removeUser = async () => {
    return await userManager.removeUser()
}

export const restoreSession = async (): Promise<User | undefined> => {
    if (typeof window === 'undefined') return
    const user = await userManager.getUser()
    if (!user) return

    if (user.expired) {
        try {
            console.debug('Access token expired, refreshing...')
            const refreshedUser = await renewToken()
            return refreshedUser ?? undefined
        } catch (error) {
            console.debug('Silent token renewal failed', error)
            return
        }
    }

    return user
}

export const onTokenExpiringCallback = (callback: () => void) => {
    userManager.events.addAccessTokenExpiring(callback)
}
