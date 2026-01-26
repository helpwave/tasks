import { useMutation, type DocumentNode, type MutationHookOptions } from '@apollo/client/react'

export function createMutationHook<TData, TVariables = Record<string, never>>(
  mutation: DocumentNode,
  defaultOptions?: MutationHookOptions<TData, TVariables>
) {
  return (options?: MutationHookOptions<TData, TVariables>) => {
    return useMutation<TData, TVariables>(mutation, {
      ...defaultOptions,
      ...options,
    })
  }
}
