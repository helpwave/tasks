'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import type { ApolloClient } from '@apollo/client/core'
import { getUser } from '@/api/auth/authService'
import {
  createApolloClient,
  rehydrateCache,
  replayPendingMutations,
  schedulePersistCache
} from '@/data'
import { MySavedViewsDocument } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'

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
    rehydrateCache(client.cache)
      .then(() => replayPendingMutations(client.cache))
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true))
  }, [client])

  useEffect(() => {
    if (!isReady) return
    void client
      .query({
        query: getParsedDocument(MySavedViewsDocument),
        fetchPolicy: 'cache-first',
      })
      .then(() => {
        schedulePersistCache(client.cache)
      })
      .catch(() => {})
  }, [client, isReady])

  return (
    <ApolloClientContext.Provider value={isReady ? client : null}>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </ApolloClientContext.Provider>
  )
}
