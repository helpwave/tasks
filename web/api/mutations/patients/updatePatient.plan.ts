import { parse } from 'graphql'
import type { ApolloCache } from '@apollo/client/cache'
import {
  GetPatientDocument,
  type GetPatientQuery,
  type UpdatePatientInput
} from '@/api/gql/generated'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

type UpdatePatientVariables = {
  id: string,
  data: UpdatePatientInput,
  clientMutationId?: string,
}

export const updatePatientOptimisticPlanKey = 'UpdatePatient'

export const updatePatientOptimisticPlan: OptimisticPlan<UpdatePatientVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetPatientQuery | null } = { current: null }
    const patientId = variables.id
    const data = variables.data
    const doc = parse(GetPatientDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdatePatientVariables
          const existing = cache.readQuery<GetPatientQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null
          const id = cache.identify({ __typename: 'PatientType', id: patientId })
          cache.modify({
            id,
            fields: {
              firstname: (prev: string) =>
                data.firstname !== undefined ? data.firstname ?? '' : prev,
              lastname: (prev: string) =>
                data.lastname !== undefined ? data.lastname ?? '' : prev,
              birthdate: (prev: unknown) =>
                data.birthdate !== undefined ? data.birthdate : prev,
              sex: (prev: string | null) =>
                (data.sex !== undefined ? data.sex : prev) ?? '',
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdatePatientVariables
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

registerOptimisticPlan(updatePatientOptimisticPlanKey, updatePatientOptimisticPlan as OptimisticPlan<unknown>)
