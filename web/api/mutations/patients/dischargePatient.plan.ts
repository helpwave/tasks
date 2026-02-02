import type { ApolloCache } from '@apollo/client/cache'
import { GetPatientDocument, type GetPatientQuery, PatientState } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type DischargePatientVariables = { id: string, clientMutationId?: string }

export const dischargePatientOptimisticPlanKey = 'DischargePatient'

export const dischargePatientOptimisticPlan: OptimisticPlan<DischargePatientVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetPatientQuery | null } = { current: null }
    const patientId = variables.id
    const doc = getParsedDocument(GetPatientDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as DischargePatientVariables
          const existing = cache.readQuery<GetPatientQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'PatientType', id: patientId })
          cache.modify({
            id,
            fields: {
              state: () => PatientState.Discharged,
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as DischargePatientVariables
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

registerOptimisticPlan(dischargePatientOptimisticPlanKey, dischargePatientOptimisticPlan as OptimisticPlan<unknown>)
