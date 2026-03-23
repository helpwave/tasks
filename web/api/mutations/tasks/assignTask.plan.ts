import type { ApolloCache } from '@apollo/client/cache'
import { GetTaskDocument, type GetTaskQuery } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type AssignTaskVariables = { id: string, userId: string, clientMutationId?: string }

export const assignTaskOptimisticPlanKey = 'AssignTask'

export const assignTaskOptimisticPlan: OptimisticPlan<AssignTaskVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetTaskQuery | null } = { current: null }
    const taskId = variables.id
    const userId = variables.userId
    const doc = getParsedDocument(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as AssignTaskVariables
          const existing = cache.readQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'TaskType', id: taskId })
          cache.modify({
            id,
            fields: {
              assignees: (existing: ReadonlyArray<{ __ref: string }> | undefined = []) => {
                const ref = `UserType:${userId}`
                if (existing.some((entry) => entry.__ref === ref)) {
                  return existing
                }
                return [...existing, { __ref: ref }]
              },
              assigneeTeam: () => null,
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as AssignTaskVariables
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

registerOptimisticPlan(assignTaskOptimisticPlanKey, assignTaskOptimisticPlan as OptimisticPlan<unknown>)
