import { useCallback, useState } from 'react'
import {
  UpdatePatientDocument,
  type UpdatePatientMutation,
  type UpdatePatientMutationVariables
} from '@/api/gql/generated'
import {
  updatePatientOptimisticPlan,
  updatePatientOptimisticPlanKey
} from '@/api/mutations/patients/updatePatient.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: UpdatePatientMutationVariables,
  onCompleted?: (data: UpdatePatientMutation['updatePatient']) => void,
  onError?: (error: Error) => void,
}

export function useUpdatePatient() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<UpdatePatientMutation['updatePatient'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<UpdatePatientMutation, UpdatePatientMutationVariables>({
          document: getParsedDocument(UpdatePatientDocument),
          variables: options.variables,
          optimisticPlan: updatePatientOptimisticPlan,
          optimisticPlanKey: updatePatientOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.updatePatient),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.updatePatient
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
