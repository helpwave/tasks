import type { ApolloLink } from '@apollo/client'
import { HttpLink } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { getConfig } from '@/utils/config'

export type GetToken = () => Promise<string | null>

export function createAuthHttpLink(getToken: GetToken): ApolloLink {
  const config = getConfig()
  const authLink = new SetContextLink(async (_prev, _operation) => {
    const token = await getToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return { headers }
  })
  const httpLink = new HttpLink({
    uri: config.graphqlEndpoint,
  })
  return authLink.concat(httpLink)
}
