import { useCallback, useRef, useState } from 'react'
import {
  GetGlobalDataDocument,
  WaitPatientDocument,
  type WaitPatientMutation,
  type WaitPatientMutationVariables
} from '@/api/gql/generated'
import {
  waitPatientOptimisticPlan,
  waitPatientOptimisticPlanKey
} from '@/api/mutations/patients/waitPatient.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

type MutateOptions = {
  variables: WaitPatientMutationVariables,
  onCompleted?: (data: WaitPatientMutation['waitPatient']) => void,
  onError?: (error: Error) => void,
}

export function useWaitPatient() {
  const client = useApolloClientOptional()
  const clientRef = useRef(client)
  clientRef.current = client
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<WaitPatientMutation['waitPatient'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<WaitPatientMutation, WaitPatientMutationVariables>({
          document: getParsedDocument(WaitPatientDocument),
          variables: options.variables,
          optimisticPlan: waitPatientOptimisticPlan,
          optimisticPlanKey: waitPatientOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.waitPatient),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        clientRef.current?.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
        return data?.waitPatient
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
