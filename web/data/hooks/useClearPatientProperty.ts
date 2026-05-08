import { useCallback, useState } from 'react'
import {
  ClearPatientPropertyDocument,
  type ClearPatientPropertyMutation,
  type ClearPatientPropertyMutationVariables
} from '@/api/gql/generated'
import {
  clearPatientPropertyOptimisticPlan,
  clearPatientPropertyOptimisticPlanKey
} from '@/api/mutations/patients/clearPatientProperty.plan'
import type { OptimisticPlan } from '@/data/mutations/types'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: ClearPatientPropertyMutationVariables,
  onCompleted?: (data: ClearPatientPropertyMutation['clearPatientProperty']) => void,
  onError?: (error: Error) => void,
}

export function useClearPatientProperty() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (
      options: MutateOptions
    ): Promise<ClearPatientPropertyMutation['clearPatientProperty'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<
          ClearPatientPropertyMutation,
          ClearPatientPropertyMutationVariables
        >({
          document: getParsedDocument(ClearPatientPropertyDocument),
          variables: options.variables,
          optimisticPlan: clearPatientPropertyOptimisticPlan as OptimisticPlan<ClearPatientPropertyMutationVariables>,
          optimisticPlanKey: clearPatientPropertyOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.clearPatientProperty),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.clearPatientProperty
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
