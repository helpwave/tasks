import { parse } from 'graphql'
import type { ApolloCache } from '@apollo/client/cache'
import { GetPatientDocument, type GetPatientQuery } from '@/api/gql/generated'
import { PatientState } from '@/api/gql/generated'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type MarkPatientDeadVariables = { id: string, clientMutationId?: string }

export const markPatientDeadOptimisticPlanKey = 'MarkPatientDead'

export const markPatientDeadOptimisticPlan: OptimisticPlan<MarkPatientDeadVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetPatientQuery | null } = { current: null }
    const patientId = variables.id
    const doc = parse(GetPatientDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as MarkPatientDeadVariables
          const existing = cache.readQuery<GetPatientQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'PatientType', id: patientId })
          cache.modify({
            id,
            fields: {
              state: () => PatientState.Dead,
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as MarkPatientDeadVariables
          const previous = snapshotRef.current
          if (!previous) return
          cache.writeQuery<GetPatientQuery>({
            query: doc,
            variables: { id: v.id },
            data: previous,
          })
        },
      },
    ]
  },
}

registerOptimisticPlan(markPatientDeadOptimisticPlanKey, markPatientDeadOptimisticPlan as OptimisticPlan<unknown>)
