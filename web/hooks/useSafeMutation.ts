import type { UseMutationOptions } from '@tanstack/react-query'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { cleanGraphQLInput, extractConflictError } from '@/utils/graphql'

export type ConflictResolutionStrategy = 'auto-merge' | 'manual' | 'overwrite'

export interface SafeMutationOptions<TData, TVariables, TContext> extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>,
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>,
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void | Promise<void>,
  onConflict?: (
    error: Error,
    variables: TVariables,
    context: TContext | undefined,
    strategy: ConflictResolutionStrategy
  ) => Promise<boolean> | boolean,
  handleConflict?: (
    error: Error,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<'keep-local' | 'use-server' | 'merge'>,
  conflictResolutionStrategy?: ConflictResolutionStrategy,
  affectedQueryKeys?: unknown[][],
  optimisticUpdate?: (variables: TVariables) => {
    queryKey: unknown[],
    updateFn: (oldData: unknown) => unknown,
  }[],
}

export function useSafeMutation<
  TData = unknown,
  TVariables = unknown,
  TContext = unknown
>({
  mutationFn,
  onMutate,
  onSuccess,
  onError,
  onConflict,
  handleConflict,
  conflictResolutionStrategy = 'manual',
  affectedQueryKeys = [],
  optimisticUpdate,
  ...options
}: SafeMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVariables, TContext & { previousData?: Map<unknown[], unknown> }>({
    ...options,
    mutationFn: async (variables) => {
      const cleanedVariables = cleanGraphQLInput(variables as Record<string, unknown>) as TVariables
      return mutationFn(cleanedVariables)
    },
    onMutate: async (variables, options) => {
      const previousData = new Map<unknown[], unknown>()

      if (optimisticUpdate) {
        const updates = optimisticUpdate(variables)
        for (const { queryKey: optQueryKey, updateFn } of updates) {
          await queryClient.cancelQueries({ queryKey: optQueryKey })
          const oldData = queryClient.getQueryData(optQueryKey)
          previousData.set(optQueryKey, oldData)
          const newData = updateFn(oldData)
          if (newData !== undefined) {
            queryClient.setQueryData(optQueryKey, newData)
          }
        }
      }

      const context = onMutate ? await onMutate(variables, options) : undefined as TContext
      return { ...context, previousData } as TContext & { previousData: Map<unknown[], unknown> }
    },
    onSuccess: async (data, variables, context) => {
      for (const key of affectedQueryKeys) {
        await queryClient.invalidateQueries({ queryKey: key })
      }

      if (onSuccess) {
        await onSuccess(data, variables, context)
      }
    },
    onError: async (error, variables, context) => {
      if (optimisticUpdate && context?.previousData) {
        const updates = optimisticUpdate(variables)
        for (const { queryKey: optQueryKey } of updates) {
          const oldData = context.previousData.get(optQueryKey)
          if (oldData !== undefined) {
            queryClient.setQueryData(optQueryKey, oldData)
          } else {
            queryClient.removeQueries({ queryKey: optQueryKey })
          }
        }
      }

      const conflictInfo = extractConflictError(error)

      if (conflictInfo.isConflict) {
        if (handleConflict) {
          try {
            const choice = await handleConflict(error, variables, context)

            if (choice === 'keep-local') {
              const cleanedVariables = cleanGraphQLInput(variables as Record<string, unknown>) as TVariables
              const result = await mutationFn(cleanedVariables)

              for (const key of affectedQueryKeys) {
                await queryClient.invalidateQueries({ queryKey: key })
              }

              if (onSuccess) {
                await onSuccess(result, variables, context)
              }
              return
            } else if (choice === 'use-server') {
              for (const key of affectedQueryKeys) {
                await queryClient.invalidateQueries({ queryKey: key })
              }
              return
            } else if (choice === 'merge') {
              if (onError) {
                await onError(error, variables, context)
              }
              return
            }
          } catch (conflictError) {
            if (onError) {
              await onError(conflictError as Error, variables, context)
            }
            return
          }
        } else if (onConflict) {
          const shouldRetry = await onConflict(
            error,
            variables,
            context,
            conflictResolutionStrategy
          )

          if (shouldRetry) {
            try {
              const cleanedVariables = cleanGraphQLInput(variables as Record<string, unknown>) as TVariables
              const result = await mutationFn(cleanedVariables)

              for (const key of affectedQueryKeys) {
                await queryClient.invalidateQueries({ queryKey: key })
              }

              if (onSuccess) {
                await onSuccess(result, variables, context)
              }

              return
            } catch (retryError) {
              if (onError) {
                await onError(retryError as Error, variables, context)
              }
              return
            }
          }
        }
      }

      if (onError) {
        await onError(error, variables, context)
      }
    },
  })
}

