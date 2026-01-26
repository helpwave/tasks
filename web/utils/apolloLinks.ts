import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { HttpLink } from '@apollo/client'
import { getUser, login, removeUser } from '@/api/auth/authService'
import { getConfig } from '@/utils/config'

const config = getConfig()

export const httpLink = new HttpLink({
  uri: config.graphqlEndpoint,
})

export const authLink = setContext(async (_, { headers }) => {
  const user = await getUser()
  const token = user?.access_token

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'FORBIDDEN') {
        removeUser().then(() => {
          login()
        })
      }
    })
  }

  if (networkError) {
    const error = networkError as any
    const status = error?.statusCode || error?.status

    if (status === 401) {
      removeUser().then(() => {
        login()
      })
    }

    const responseData = error?.response || error?.result
    const errorObject = typeof responseData === 'string' ? JSON.parse(responseData) : responseData

    const isInvalidGrant =
      errorObject?.error === 'invalid_grant' &&
      errorObject?.error_description === 'Token is not active'

    if (isInvalidGrant) {
      removeUser().then(() => {
        login()
      })
    }
  }
})
