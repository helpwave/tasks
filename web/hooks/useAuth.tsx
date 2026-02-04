'use client'

import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { HelpwaveLogo } from '@helpwave/hightide'
import { login, logout, onTokenExpiringCallback, removeUser, renewToken, restoreSession } from '@/api/auth/authService'
import type { User } from 'oidc-client-ts'
import { getConfig } from '@/utils/config'
import { usePathname } from 'next/navigation'

const config = getConfig()

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

export const AuthProvider = ({
  children,
  unprotectedURLs = [],
  ignoredURLs = []
}: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({ isLoading: true })
  const { isLoading, identity } = authState

  const pathname = usePathname()
  const isUnprotected = !!pathname && unprotectedURLs.some(pattern =>
    pathname.startsWith(pattern))
  const isIgnored = !!pathname && ignoredURLs.some(pattern =>
    pathname.startsWith(pattern))

  useEffect(() => {
    if(isIgnored) {
      setAuthState({ isLoading: false })
      return
    }

    let isMounted = true

    restoreSession()
      .then((identity) => {
        if (!isMounted) return

        if (identity) {
          setAuthState({ identity, isLoading: false })
          onTokenExpiringCallback(async () => {
            const renewed = await renewToken()
            if (isMounted) {
              setAuthState({
                identity: renewed ?? undefined,
                isLoading: false,
              })
            }
          })
        } else {
          if (!isUnprotected) {
            login(
              config.auth.redirect_uri +
              `?redirect_uri=${encodeURIComponent(window.location.href)}`
            ).catch(() => {
            })
          } else {
            removeUser()
              .then(() => {
                if (isMounted) {
                  setAuthState({ isLoading: false })
                }
              })
              .catch(() => {})
          }
        }
      })
      .catch(async (error) => {
        if (!isMounted) return

        const isAuthenticationServerUnavailable = error?.response?.status === 400 ||
                                                error?.status === 400 ||
                                                (error?.message && error.message.includes('400'))

        if (!isUnprotected) {
          if (isAuthenticationServerUnavailable) {
            setAuthState({ isLoading: false })
          } else {
            login(
              config.auth.redirect_uri +
              `?redirect_uri=${encodeURIComponent(window.location.href)}`
            ).catch(() => {
            })
          }
        } else {
          removeUser()
            .then(() => {
              if (isMounted) {
                setAuthState({ isLoading: false })
              }
            })
            .catch(() => {})
        }
      })

    return () => {
      isMounted = false
    }
  }, [isIgnored, isUnprotected])

  const logoutAndReset = useCallback(() => {
    logout()
      .then(() => removeUser().then(() => setAuthState({ isLoading: true, identity: undefined })))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isIgnored || isUnprotected || identity || isLoading) return
    login(
      config.auth.redirect_uri +
      `?redirect_uri=${encodeURIComponent(window.location.href)}`
    ).catch(() => {})
  }, [identity, isLoading, isIgnored, isUnprotected])

  const authLoadingContent = (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface">
      <HelpwaveLogo
        animate="loading"
        color="currentColor"
        height={128}
        width={128}
      />
    </div>
  )

  let content: ReactNode = children
  if (!isUnprotected && !isIgnored && !identity) {
    content = authLoadingContent
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        logout: logoutAndReset,
        authHeader: authState.identity ? {
          Authorization: `Bearer ${authState.identity?.access_token}`,
        } : undefined
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
