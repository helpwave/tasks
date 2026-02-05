'use client'

import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { HelpwaveLogo } from '@helpwave/hightide'
import type { User } from 'oidc-client-ts'
import { usePathname } from 'next/navigation'
import { getConfig } from '@/utils/config'
import {
  login,
  logout,
  onTokenExpiringCallback,
  removeUser,
  renewToken,
  restoreSession
} from '@/api/auth/authService'

type AuthState = {
  identity?: User,
  isLoading: boolean,
}

type AuthContextType = AuthState & {
  authHeader?: {
    Authorization: string,
  },
  logout: () => void,
}

const AuthContext = createContext<AuthContextType | null>(null)

type AuthProviderProps = PropsWithChildren & {
  unprotectedURLs?: string[],
  ignoredURLs?: string[],
}

const isAuthCallbackUrl = () => {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  return url.searchParams.has('code') && url.searchParams.has('state')
}

export const AuthProvider = ({
  children,
  unprotectedURLs = [],
  ignoredURLs = [],
}: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({ isLoading: true })
  const { isLoading, identity } = authState

  const pathname = usePathname() ?? ''
  const redirectInFlightRef = useRef(false)

  const routePolicy = useMemo<'ignored' | 'unprotected' | 'protected'>(() => {
    if (!pathname) return 'protected'
    const ignored = ignoredURLs.some((p) => pathname.startsWith(p)) || isAuthCallbackUrl()
    if (ignored) return 'ignored'
    const unprotected = unprotectedURLs.some((p) => pathname.startsWith(p))
    return unprotected ? 'unprotected' : 'protected'
  }, [pathname, ignoredURLs, unprotectedURLs])

  useEffect(() => {
    redirectInFlightRef.current = false
  }, [pathname])

  const redirectToLogin = useCallback(async () => {
    if (redirectInFlightRef.current) return
    redirectInFlightRef.current = true
    try {
      const { auth } = getConfig()
      const returnTo = window.location.href
      await login(`${auth.redirect_uri}?redirect_uri=${encodeURIComponent(returnTo)}`)
    } catch {
      void 0
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let unsubscribe: void | (() => void)

    const run = async () => {
      if (routePolicy === 'ignored') {
        if (mounted) setAuthState({ isLoading: false, identity: undefined })
        return
      }

      if (mounted) setAuthState((prev) => ({ ...prev, isLoading: true }))

      try {
        const user = await restoreSession()
        if (!mounted) return

        if (user) {
          setAuthState({ identity: user, isLoading: false })
          unsubscribe = onTokenExpiringCallback(async () => {
            const renewed = await renewToken()
            if (mounted) setAuthState({ identity: renewed ?? undefined, isLoading: false })
          }) as unknown as void | (() => void)
          return
        }

        setAuthState({ identity: undefined, isLoading: false })
        if (routePolicy === 'protected') await redirectToLogin()
      } catch (error: unknown) {
        if (!mounted) return

        const err = error as { response?: { status?: number }, status?: number, message?: string } | null
        const status =
          err?.response?.status ??
          err?.status ??
          (err?.message?.includes('400') ? 400 : undefined)

        const authServerUnavailable = status === 400

        setAuthState({ identity: undefined, isLoading: false })
        if (routePolicy === 'protected' && !authServerUnavailable) await redirectToLogin()
      }
    }

    run().catch(() => { })

    return () => {
      mounted = false
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [routePolicy, redirectToLogin])

  const logoutAndReset = useCallback(() => {
    logout()
      .then(() => removeUser().then(() => setAuthState({ isLoading: true, identity: undefined })))
      .catch(() => { })
  }, [])

  const authLoadingContent = (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface">
      <HelpwaveLogo animate="loading" color="currentColor" height={128} width={128} />
    </div>
  )

  let content: ReactNode = children
  if (routePolicy === 'protected' && (isLoading || !identity)) {
    content = authLoadingContent
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        logout: logoutAndReset,
        authHeader: identity
          ? { Authorization: `Bearer ${identity.access_token}` }
          : undefined,
      }}
    >
      {content}
    </AuthContext.Provider>
  )
}

export const withAuth = <P extends object>(Component: ComponentType<P>) => {
  const WrappedComponent = (props: P) => (
    <AuthProvider>
      <Component {...props} />
    </AuthProvider>
  )
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`
  return WrappedComponent
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
