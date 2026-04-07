import { useCallback, useState } from 'react'
import {
  AddTaskAssigneeDocument,
  type AddTaskAssigneeMutation,
  type AddTaskAssigneeMutationVariables
} from '@/api/gql/generated'
import {
  assignTaskOptimisticPlan,
  assignTaskOptimisticPlanKey
} from '@/api/mutations/tasks/assignTask.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: AddTaskAssigneeMutationVariables,
  onCompleted?: (data: AddTaskAssigneeMutation['addTaskAssignee']) => void,
  onError?: (error: Error) => void,
}

export function useAssignTask() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<AddTaskAssigneeMutation['addTaskAssignee'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<AddTaskAssigneeMutation, AddTaskAssigneeMutationVariables>({
          document: getParsedDocument(AddTaskAssigneeDocument),
          variables: options.variables,
          optimisticPlan: assignTaskOptimisticPlan,
          optimisticPlanKey: assignTaskOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.addTaskAssignee),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.addTaskAssignee
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
