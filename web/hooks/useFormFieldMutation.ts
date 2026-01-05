import { useQueryClient } from '@tanstack/react-query'
import { useSafeMutation } from './useSafeMutation'
import type { SafeMutationOptions } from './useSafeMutation'

export interface FormFieldMutationOptions<TData, TVariables> extends Omit<SafeMutationOptions<TData, TVariables, { previousData?: TData }>, 'mutationFn' | 'onMutate'> {
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKey: unknown[],
  getOptimisticUpdate?: (variables: TVariables) => (oldData: TData | undefined) => TData | undefined,
}

export function useFormFieldMutation<TData, TVariables extends Record<string, unknown>>({
  mutationFn,
  queryKey,
  getOptimisticUpdate,
  ...safeMutationOptions
}: FormFieldMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useSafeMutation<TData, TVariables, { previousData?: TData }>({
    ...safeMutationOptions,
    mutationFn,
    queryKey,
    onMutate: async (variables) => {
      if (getOptimisticUpdate) {
        const optimisticUpdate = getOptimisticUpdate(variables)
        await queryClient.cancelQueries({ queryKey })
        const previousData = queryClient.getQueryData<TData>(queryKey)
        const optimisticData = optimisticUpdate(previousData)
        if (optimisticData !== undefined) {
          queryClient.setQueryData(queryKey, optimisticData)
        }
        return { previousData }
      }
      return { previousData: undefined }
    },
    onError: async (error, variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      if (safeMutationOptions.onError) {
        await safeMutationOptions.onError(error, variables, context)
      }
    },
  })
}

