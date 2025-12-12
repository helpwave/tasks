'use client'

import type { ComponentType, PropsWithChildren } from 'react'
import { useEffect, createContext, useContext, useState } from 'react'
import { LoadingAnimation } from '@helpwave/hightide'
import { login, logout, onTokenExpiringCallback, removeUser, renewToken, restoreSession } from '@/api/auth/authService'
import type { User } from 'oidc-client-ts'
import { usePathname } from 'next/navigation'

type AuthContextType = {
  identity: User,
  logout: () => void,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthState = {
  identity?: User,
  isLoading: boolean,
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [authState, setAuthState] = useState<AuthState>({ isLoading: true })
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/auth/callback') {
      setAuthState({ isLoading: false, identity: undefined })
      return
    }

    let isMounted = true

    const initAuth = async () => {
      try {
        const identity = await restoreSession()

        if (isMounted) {
          if (identity) {
            setAuthState({ identity, isLoading: false })

            onTokenExpiringCallback(async () => {
              const refreshedIdentity = await renewToken()
              setAuthState({
                identity: refreshedIdentity ?? undefined,
                isLoading: false,
              })
            })
          } else {
            await login()
          }
        }
      } catch {
        if (isMounted) {
          await removeUser()
          await login()
        }
      }
    }

    initAuth()

    return () => { isMounted = false }
  }, [pathname])

  if (pathname === '/auth/callback') {
    return <>{children}</>
  }

  if (authState.isLoading || !authState.identity) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen">
        <LoadingAnimation loadingText="Redirecting to login..." />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ identity: authState.identity, logout }}>
      {children}
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
  const authHeader = {
    Authorization: `Bearer ${context.identity.access_token}`,
  }
  return { ...context, authHeader }
}
