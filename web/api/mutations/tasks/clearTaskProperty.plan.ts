import type { ApolloCache } from '@apollo/client/cache'
import type { Reference } from '@apollo/client/utilities'
import {
  GetTaskDocument,
  type ClearTaskPropertyMutationVariables,
  type GetTaskQuery
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPatch, OptimisticPlan } from '@/data/mutations/types'

export const clearTaskPropertyOptimisticPlanKey = 'ClearTaskProperty'

export const clearTaskPropertyOptimisticPlan: OptimisticPlan<ClearTaskPropertyMutationVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotByTaskIdRef: { current: Map<string, GetTaskQuery | null> } = {
      current: new Map(),
    }
    const previousPropertiesByTaskIdRef: { current: Map<string, unknown[]> } = {
      current: new Map(),
    }
    const propertyDefinitionId = variables.propertyDefinitionId
    const taskIds = Array.from(
      new Set(Array.isArray(variables.taskIds) ? variables.taskIds : [variables.taskIds])
    )
    const doc = getParsedDocument(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as ClearTaskPropertyMutationVariables
          const targetIds = Array.isArray(v.taskIds) ? v.taskIds : [v.taskIds]
          for (const taskId of targetIds) {
            const existing = cache.readQuery<GetTaskQuery>({
              query: doc,
              variables: { id: taskId },
            })
            snapshotByTaskIdRef.current.set(taskId, existing ?? null)
            const cacheId = cache.identify({ __typename: 'TaskType', id: taskId })
            cache.modify({
              id: cacheId,
              fields: {
                properties: (existingProperties: Reference | readonly unknown[] = [], { readField }) => {
                  if (!Array.isArray(existingProperties)) return existingProperties
                  previousPropertiesByTaskIdRef.current.set(taskId, [...existingProperties])
                  return existingProperties.filter((property) => {
                    const definition = readField('definition', property) as Reference | undefined
                    if (!definition) return true
                    const definitionId = readField('id', definition) as string | undefined
                    if (!definitionId) return true
                    return definitionId !== propertyDefinitionId
                  })
                },
              },
            })
          }
        },
        rollback(cache: ApolloCache): void {
          for (const taskId of taskIds) {
            const cacheId = cache.identify({ __typename: 'TaskType', id: taskId })
            const previousProperties = previousPropertiesByTaskIdRef.current.get(taskId)
            if (previousProperties) {
              cache.modify({
                id: cacheId,
                fields: {
                  properties: () => previousProperties,
                },
              })
            }
            const previous = snapshotByTaskIdRef.current.get(taskId)
            if (!previous) continue
            cache.writeQuery<GetTaskQuery>({
              query: doc,
              variables: { id: taskId },
              data: previous,
            })
          }
        },
      },
    ]
  },
}

registerOptimisticPlan(
  clearTaskPropertyOptimisticPlanKey,
  clearTaskPropertyOptimisticPlan as OptimisticPlan<unknown>
)
