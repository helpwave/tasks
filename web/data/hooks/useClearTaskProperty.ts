import { useCallback, useState } from 'react'
import {
  ClearTaskPropertyDocument,
  type ClearTaskPropertyMutation,
  type ClearTaskPropertyMutationVariables
} from '@/api/gql/generated'
import {
  clearTaskPropertyOptimisticPlan,
  clearTaskPropertyOptimisticPlanKey
} from '@/api/mutations/tasks/clearTaskProperty.plan'
import type { OptimisticPlan } from '@/data/mutations/types'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: ClearTaskPropertyMutationVariables,
  onCompleted?: (data: ClearTaskPropertyMutation['clearTaskProperty']) => void,
  onError?: (error: Error) => void,
}

export function useClearTaskProperty() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (
      options: MutateOptions
    ): Promise<ClearTaskPropertyMutation['clearTaskProperty'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<
          ClearTaskPropertyMutation,
          ClearTaskPropertyMutationVariables
        >({
          document: getParsedDocument(ClearTaskPropertyDocument),
          variables: options.variables,
          optimisticPlan: clearTaskPropertyOptimisticPlan as OptimisticPlan<ClearTaskPropertyMutationVariables>,
          optimisticPlanKey: clearTaskPropertyOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.clearTaskProperty),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.clearTaskProperty
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        options.onError?.(err)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [mutateOptimisticFn, onConflict]
  )

  return [mutate, { loading, error, data: undefined }] as const
}
