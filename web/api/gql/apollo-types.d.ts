import type { UseQueryOptions, UseLazyQueryOptions, UseMutationOptions } from '@apollo/client/react'

declare module '@apollo/client' {
  export namespace Apollo {
    export type QueryHookOptions<TData, TVariables> = UseQueryOptions<TData, TVariables>
    export type LazyQueryHookOptions<TData, TVariables> = UseLazyQueryOptions<TData, TVariables>
    export type MutationHookOptions<TData, TVariables> = UseMutationOptions<TData, TVariables>
  }
}
