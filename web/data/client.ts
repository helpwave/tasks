import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { buildCacheConfig } from './cache/policies'
import { createAuthHttpLink } from './link/http'
import { createWsLink } from './link/ws'
import type { GetToken } from './link/http'

export type CreateApolloClientOptions = {
  getToken: GetToken,
}

export function createApolloClient(options: CreateApolloClientOptions): ApolloClient {
  const { getToken } = options
  const http = createAuthHttpLink(getToken)
  const ws = createWsLink(getToken)
  const link =
    typeof window !== 'undefined'
      ? ApolloLink.split(
        ({ query }) => {
          const def = getMainDefinition(query)
          return def.kind === 'OperationDefinition' && def.operation === 'subscription'
        },
        ws,
        http
      )
      : http

  return new ApolloClient({
    link,
    cache: new InMemoryCache(buildCacheConfig()),
    devtools: { enabled: process.env.NODE_ENV === 'development' },
  })
}
