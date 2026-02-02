import { useCallback, useState } from 'react'
import {
  CompleteTaskDocument,
  type CompleteTaskMutation,
  type CompleteTaskMutationVariables
} from '@/api/gql/generated'
import {
  completeTaskOptimisticPlan,
  completeTaskOptimisticPlanKey
} from '@/api/mutations/tasks/completeTask.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: CompleteTaskMutationVariables,
  onCompleted?: (data: CompleteTaskMutation['completeTask']) => void,
  onError?: (error: Error) => void,
}

export function useCompleteTask() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<CompleteTaskMutation['completeTask'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<CompleteTaskMutation, CompleteTaskMutationVariables>({
          document: getParsedDocument(CompleteTaskDocument),
          variables: options.variables,
          optimisticPlan: completeTaskOptimisticPlan,
          optimisticPlanKey: completeTaskOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.completeTask),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.completeTask
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
