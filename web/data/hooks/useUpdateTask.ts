import { useCallback, useState } from 'react'
import {
  UpdateTaskDocument,
  type UpdateTaskMutation,
  type UpdateTaskMutationVariables
} from '@/api/gql/generated'
import {
  updateTaskOptimisticPlan,
  updateTaskOptimisticPlanKey
} from '@/api/mutations/tasks/updateTask.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: UpdateTaskMutationVariables,
  onCompleted?: (data: UpdateTaskMutation['updateTask']) => void,
  onError?: (error: Error) => void,
}

export function useUpdateTask() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<UpdateTaskMutation['updateTask'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<UpdateTaskMutation, UpdateTaskMutationVariables>({
          document: getParsedDocument(UpdateTaskDocument),
          variables: options.variables,
          optimisticPlan: updateTaskOptimisticPlan,
          optimisticPlanKey: updateTaskOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.updateTask),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.updateTask
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
