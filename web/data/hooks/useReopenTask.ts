import { useCallback, useState } from 'react'
import {
  ReopenTaskDocument,
  type ReopenTaskMutation,
  type ReopenTaskMutationVariables
} from '@/api/gql/generated'
import {
  reopenTaskOptimisticPlan,
  reopenTaskOptimisticPlanKey
} from '@/api/mutations/tasks/reopenTask.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: ReopenTaskMutationVariables,
  onCompleted?: (data: ReopenTaskMutation['reopenTask']) => void,
  onError?: (error: Error) => void,
}

export function useReopenTask() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<ReopenTaskMutation['reopenTask'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<ReopenTaskMutation, ReopenTaskMutationVariables>({
          document: getParsedDocument(ReopenTaskDocument),
          variables: options.variables,
          optimisticPlan: reopenTaskOptimisticPlan,
          optimisticPlanKey: reopenTaskOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.reopenTask),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.reopenTask
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
