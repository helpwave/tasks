import type { ApolloCache } from '@apollo/client/cache'
import { GetTaskDocument, type GetTaskQuery } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type AssignTaskToTeamVariables = { id: string, teamId: string, clientMutationId?: string }

export const assignTaskToTeamOptimisticPlanKey = 'AssignTaskToTeam'

export const assignTaskToTeamOptimisticPlan: OptimisticPlan<AssignTaskToTeamVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetTaskQuery | null } = { current: null }
    const taskId = variables.id
    const teamId = variables.teamId
    const doc = getParsedDocument(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as AssignTaskToTeamVariables
          const existing = cache.readQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'TaskType', id: taskId })
          cache.modify({
            id,
            fields: {
              assignee: () => null,
              assigneeTeam: (_existing, { toReference }) =>
                toReference({ __typename: 'LocationNodeType', id: teamId }, true),
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as AssignTaskToTeamVariables
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

registerOptimisticPlan(assignTaskToTeamOptimisticPlanKey, assignTaskToTeamOptimisticPlan as OptimisticPlan<unknown>)
