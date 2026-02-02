import { useCallback, useRef, useState } from 'react'
import {
  GetGlobalDataDocument,
  MarkPatientDeadDocument,
  type MarkPatientDeadMutation,
  type MarkPatientDeadMutationVariables
} from '@/api/gql/generated'
import {
  markPatientDeadOptimisticPlan,
  markPatientDeadOptimisticPlanKey
} from '@/api/mutations/patients/markPatientDead.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

type MutateOptions = {
  variables: MarkPatientDeadMutationVariables,
  onCompleted?: (data: MarkPatientDeadMutation['markPatientDead']) => void,
  onError?: (error: Error) => void,
}

export function useMarkPatientDead() {
  const client = useApolloClientOptional()
  const clientRef = useRef(client)
  clientRef.current = client
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<MarkPatientDeadMutation['markPatientDead'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>({
          document: getParsedDocument(MarkPatientDeadDocument),
          variables: options.variables,
          optimisticPlan: markPatientDeadOptimisticPlan,
          optimisticPlanKey: markPatientDeadOptimisticPlanKey,
          entityType: 'Patient',
          onSuccess: (d) => options.onCompleted?.(d.markPatientDead),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        clientRef.current?.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
        return data?.markPatientDead
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
