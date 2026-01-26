import { useQuery, type DocumentNode, type QueryHookOptions } from '@apollo/client/react'

export function createQueryHook<TData, TVariables = Record<string, never>>(
  query: DocumentNode,
  defaultOptions?: QueryHookOptions<TData, TVariables>
) {
  return (variables?: TVariables, options?: QueryHookOptions<TData, TVariables>) => {
    return useQuery<TData, TVariables>(query, {
      ...defaultOptions,
      ...options,
      variables: variables as TVariables,
    })
  }
}
