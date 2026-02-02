import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import type { ApolloLink } from '@apollo/client/link'
import { createClient } from 'graphql-ws'
import { getConfig } from '@/utils/config'
import type { GetToken } from './http'
import { setConnectionStatus } from '../connectionStatus'

export function createWsLink(getToken: GetToken): ApolloLink {
  const config = getConfig()
  const wsUrl = config.graphqlEndpoint.replace(/^http/, 'ws').replace(/^https/, 'wss')
  const client = createClient({
    url: wsUrl,
    connectionParams: async () => {
      const token = await getToken()
      return token ? { authorization: `Bearer ${token}` } : {}
    },
    on: {
      connecting: () => setConnectionStatus('connecting'),
      connected: () => setConnectionStatus('connected'),
      closed: () => setConnectionStatus('disconnected'),
      error: () => setConnectionStatus('disconnected'),
    },
  })
  return new GraphQLWsLink(client)
}
