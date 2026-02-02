import { useCallback, useRef, useState } from 'react'
import {
  DischargePatientDocument,
  GetGlobalDataDocument,
  type DischargePatientMutation,
  type DischargePatientMutationVariables
} from '@/api/gql/generated'
import {
  dischargePatientOptimisticPlan,
  dischargePatientOptimisticPlanKey
} from '@/api/mutations/patients/dischargePatient.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

type MutateOptions = {
  variables: DischargePatientMutationVariables,
  onCompleted?: (data: DischargePatientMutation['dischargePatient']) => void,
  onError?: (error: Error) => void,
}

export function useDischargePatient() {
  const client = useApolloClientOptional()
  const clientRef = useRef(client)
  clientRef.current = client
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<DischargePatientMutation['dischargePatient'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<DischargePatientMutation, DischargePatientMutationVariables>({
          document: getParsedDocument(DischargePatientDocument),
          variables: options.variables,
          optimisticPlan: dischargePatientOptimisticPlan,
          optimisticPlanKey: dischargePatientOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.dischargePatient),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        clientRef.current?.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
        return data?.dischargePatient
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
