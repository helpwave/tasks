import { useCallback } from 'react'
import { mutateOptimistic } from '@/data'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

export function useMutateOptimistic() {
  const client = useApolloClientOptional()
  return useCallback(
    <TData, TVariables>(
      options: Parameters<typeof mutateOptimistic<TData, TVariables>>[1]
    ): ReturnType<typeof mutateOptimistic<TData, TVariables>> => {
      if (!client) {
        return Promise.reject(new Error('Apollo client not available'))
      }
      return mutateOptimistic(client, options)
    },
    [client]
  )
}
