'use client'

import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { LoadingAnimation } from '@helpwave/hightide'
import { LoginPage } from '@/components/pages/login'
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
  /** These URLs try to log in, but ignore failures */
  unprotectedURLs?: string[],
  /** These URLs ignore authentication completely */
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
      return
    }

    restoreSession()
      .then((identity) => {
        if (identity) {
          console.debug('Loaded identity')
          setAuthState({ identity, isLoading: false })
          onTokenExpiringCallback(async () => {
            console.debug('Token expiring, refreshing...')
            const renewed = await renewToken()
            setAuthState({
              identity: renewed ?? undefined,
              isLoading: false,
            })
          })
        } else {
          if (!isUnprotected) {
            console.debug('Trying to login...')
            login(
              config.auth.redirect_uri +
              `?redirect_uri=${encodeURIComponent(window.location.href)}`
            ).catch(console.error)
          } else {
            console.debug('Logging out...')
            removeUser()
              .then(() => {
                setAuthState({ isLoading: false })
              })
              .catch(console.error)
          }
        }
      })
      .catch(async () => {
        if (!isUnprotected) {
          console.debug('Login error, Trying to login...')
          login(
            config.auth.redirect_uri +
            `?redirect_uri=${encodeURIComponent(window.location.href)}`
          ).catch(console.error)
        } else {
          console.debug('Login error, logging out...')
          removeUser()
            .then(() => {
              setAuthState({ isLoading: false })
            })
            .catch(console.error)
        }
      })
  }, [isIgnored, isUnprotected])

  const logoutAndReset = useCallback(() => {
    logout()
      .then(() => removeUser().then(() => setAuthState({ isLoading: true, identity: undefined })))
      .catch(console.error)
  }, [])

  let content: ReactNode = children
  if (!isUnprotected && !isIgnored && !identity) {
    if (isLoading) {
      content = (
        <div className="flex-col-0 items-center justify-center w-screen h-screen">
          <LoadingAnimation loadingText="Logging in..."/>
        </div>
      )
    } else {
      content = (
        <LoginPage
          login={async () => {
            await login(
              config.auth.redirect_uri +
              `?redirect_uri=${encodeURIComponent(window.location.href)}`
            )
            return true
          }}
        />
      )
    }
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
