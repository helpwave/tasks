import type { ApolloCache } from '@apollo/client/cache'
import {
  GetTaskDocument,
  type GetTaskQuery,
  type UpdateTaskInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type UpdateTaskVariables = {
  id: string,
  data: UpdateTaskInput,
  clientMutationId?: string,
}

export const updateTaskOptimisticPlanKey = 'UpdateTask'

export const updateTaskOptimisticPlan: OptimisticPlan<UpdateTaskVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetTaskQuery | null } = { current: null }
    const taskId = variables.id
    const data = variables.data
    const doc = getParsedDocument(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdateTaskVariables
          const existing = cache.readQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null

          const id = cache.identify({ __typename: 'TaskType', id: taskId })
          cache.modify({
            id,
            fields: {
              title: (prev: string) =>
                data.title !== undefined ? data.title ?? '' : prev,
              description: (prev: string | null) =>
                data.description !== undefined ? data.description : prev,
              done: (prev: boolean) =>
                data.done !== undefined ? data.done ?? false : prev,
              dueDate: (prev: string | null) =>
                data.dueDate !== undefined ? data.dueDate ?? null : prev,
              priority: (prev: string | null) =>
                data.priority !== undefined ? data.priority : prev,
              estimatedTime: (prev: number | null) =>
                data.estimatedTime !== undefined ? data.estimatedTime : prev,
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdateTaskVariables
          const previous = snapshotRef.current
          if (!previous) return
          cache.writeQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
            data: previous,
          })
        },
      },
    ]
  },
}

registerOptimisticPlan(updateTaskOptimisticPlanKey, updateTaskOptimisticPlan as OptimisticPlan<unknown>)
