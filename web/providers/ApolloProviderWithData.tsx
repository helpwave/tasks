'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import type { ApolloClient } from '@apollo/client/core'
import { getUser } from '@/api/auth/authService'
import {
  createApolloClient,
  rehydrateCache,
  replayPendingMutations
} from '@/data'

const ApolloClientContext = createContext<ApolloClient | null>(null)

export function useApolloClientOptional(): ApolloClient | null {
  return useContext(ApolloClientContext)
}

export function ApolloProviderWithData({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<ReturnType<typeof createApolloClient> | null>(null)
  if (!clientRef.current) {
    const getToken = () => getUser().then((u) => u?.access_token ?? null)
    clientRef.current = createApolloClient({ getToken })
  }
  const client = clientRef.current
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const navEntry = typeof performance !== 'undefined' && performance.getEntriesByType?.('navigation')?.[0]
    const isPageReload = navEntry && 'type' in navEntry && (navEntry as { type: string }).type === 'reload'

    if (isPageReload) {
      client.clearStore().then(() => setIsReady(true))
      return
    }

    rehydrateCache(client.cache)
      .then(() => replayPendingMutations(client.cache))
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true))
  }, [client])

  return (
    <ApolloClientContext.Provider value={isReady ? client : null}>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </ApolloClientContext.Provider>
  )
}
