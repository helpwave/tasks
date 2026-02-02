import { parse } from 'graphql'
import type { ApolloCache } from '@apollo/client/cache'
import { GetTaskDocument, type GetTaskQuery } from '@/api/gql/generated'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type CompleteTaskVariables = { id: string, clientMutationId?: string }

export const completeTaskOptimisticPlanKey = 'CompleteTask'

export const completeTaskOptimisticPlan: OptimisticPlan<CompleteTaskVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetTaskQuery | null } = { current: null }
    const taskId = variables.id
    const doc = parse(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as CompleteTaskVariables
          const existing = cache.readQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'TaskType', id: taskId })
          cache.modify({
            id,
            fields: {
              done: () => true,
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as CompleteTaskVariables
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

registerOptimisticPlan(completeTaskOptimisticPlanKey, completeTaskOptimisticPlan as OptimisticPlan<unknown>)
