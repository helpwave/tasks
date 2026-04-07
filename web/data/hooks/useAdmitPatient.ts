import { useCallback, useRef, useState } from 'react'
import {
  AdmitPatientDocument,
  GetGlobalDataDocument,
  type AdmitPatientMutation,
  type AdmitPatientMutationVariables
} from '@/api/gql/generated'
import {
  admitPatientOptimisticPlan,
  admitPatientOptimisticPlanKey
} from '@/api/mutations/patients/admitPatient.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

type MutateOptions = {
  variables: AdmitPatientMutationVariables,
  onCompleted?: (data: AdmitPatientMutation['admitPatient']) => void,
  onError?: (error: Error) => void,
}

export function useAdmitPatient() {
  const client = useApolloClientOptional()
  const clientRef = useRef(client)
  clientRef.current = client
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<AdmitPatientMutation['admitPatient'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<AdmitPatientMutation, AdmitPatientMutationVariables>({
          document: getParsedDocument(AdmitPatientDocument),
          variables: options.variables,
          optimisticPlan: admitPatientOptimisticPlan,
          optimisticPlanKey: admitPatientOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.admitPatient),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        clientRef.current?.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
        return data?.admitPatient
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
