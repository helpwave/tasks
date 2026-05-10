import type { ApolloCache } from '@apollo/client/cache'
import type { Reference } from '@apollo/client/utilities'
import {
  GetPatientDocument,
  type ClearPatientPropertyMutationVariables,
  type GetPatientQuery
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPatch, OptimisticPlan } from '@/data/mutations/types'

export const clearPatientPropertyOptimisticPlanKey = 'ClearPatientProperty'

export const clearPatientPropertyOptimisticPlan: OptimisticPlan<ClearPatientPropertyMutationVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotByPatientIdRef: { current: Map<string, GetPatientQuery | null> } = {
      current: new Map(),
    }
    const previousPropertiesByPatientIdRef: { current: Map<string, unknown[]> } = {
      current: new Map(),
    }
    const propertyDefinitionId = variables.propertyDefinitionId
    const patientIds = Array.from(
      new Set(Array.isArray(variables.patientIds) ? variables.patientIds : [variables.patientIds])
    )
    const doc = getParsedDocument(GetPatientDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as ClearPatientPropertyMutationVariables
          const targetIds = Array.isArray(v.patientIds) ? v.patientIds : [v.patientIds]
          for (const patientId of targetIds) {
            const existing = cache.readQuery<GetPatientQuery>({
              query: doc,
              variables: { id: patientId },
            })
            snapshotByPatientIdRef.current.set(patientId, existing ?? null)
            const cacheId = cache.identify({ __typename: 'PatientType', id: patientId })
            cache.modify({
              id: cacheId,
              fields: {
                properties: (existingProperties: Reference | readonly unknown[] = [], { readField }) => {
                  if (!Array.isArray(existingProperties)) return existingProperties
                  previousPropertiesByPatientIdRef.current.set(patientId, [...existingProperties])
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
          for (const patientId of patientIds) {
            const cacheId = cache.identify({ __typename: 'PatientType', id: patientId })
            const previousProperties = previousPropertiesByPatientIdRef.current.get(patientId)
            if (previousProperties) {
              cache.modify({
                id: cacheId,
                fields: {
                  properties: () => previousProperties,
                },
              })
            }
            const previous = snapshotByPatientIdRef.current.get(patientId)
            if (!previous) continue
            cache.writeQuery<GetPatientQuery>({
              query: doc,
              variables: { id: patientId },
              data: previous,
            })
          }
        },
      },
    ]
  },
}

registerOptimisticPlan(
  clearPatientPropertyOptimisticPlanKey,
  clearPatientPropertyOptimisticPlan as OptimisticPlan<unknown>
)
