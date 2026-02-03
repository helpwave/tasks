import { useCallback, useState } from 'react'
import {
  AssignTaskToTeamDocument,
  type AssignTaskToTeamMutation,
  type AssignTaskToTeamMutationVariables
} from '@/api/gql/generated'
import {
  assignTaskToTeamOptimisticPlan,
  assignTaskToTeamOptimisticPlanKey
} from '@/api/mutations/tasks/assignTaskToTeam.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: AssignTaskToTeamMutationVariables,
  onCompleted?: (data: AssignTaskToTeamMutation['assignTaskToTeam']) => void,
  onError?: (error: Error) => void,
}

export function useAssignTaskToTeam() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<AssignTaskToTeamMutation['assignTaskToTeam'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>({
          document: getParsedDocument(AssignTaskToTeamDocument),
          variables: options.variables,
          optimisticPlan: assignTaskToTeamOptimisticPlan,
          optimisticPlanKey: assignTaskToTeamOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.assignTaskToTeam),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.assignTaskToTeam
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
