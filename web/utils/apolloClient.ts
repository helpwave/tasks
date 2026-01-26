import { ApolloClient, from } from '@apollo/client'
import { authLink, errorLink, httpLink } from './apolloLinks'
import { cache } from './apolloCache'

const link = from([errorLink, authLink, httpLink])

export const apolloClient = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
