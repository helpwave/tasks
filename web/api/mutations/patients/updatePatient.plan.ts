import type { ApolloCache } from '@apollo/client/cache'
import {
  GetPatientDocument,
  type GetPatientQuery,
  type UpdatePatientInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'
import { buildOptimisticProperties, readEntityProperties } from '@/api/mutations/shared/optimisticProperties'

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
    const doc = getParsedDocument(GetPatientDocument)

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
          // Read the current properties from the normalized entity (populated by
          // the list query) so real property uuids are preserved even when the
          // patient detail query was never run.
          const existingProps = readEntityProperties(cache, 'PatientType', patientId)
          const mergeProperties = () => buildOptimisticProperties(existingProps, data.properties, patientId)
          cache.modify({
            id,
            fields: {
              firstname: (prev: string) =>
                data.firstname !== undefined ? data.firstname ?? '' : prev,
              lastname: (prev: string) =>
                data.lastname !== undefined ? data.lastname ?? '' : prev,
              name: (prev: string, { readField }) => {
                if (data.firstname === undefined && data.lastname === undefined) return prev
                const first = data.firstname !== undefined
                  ? (data.firstname ?? '')
                  : (readField('firstname') as string ?? '')
                const last = data.lastname !== undefined
                  ? (data.lastname ?? '')
                  : (readField('lastname') as string ?? '')
                return `${first} ${last}`.trim() || prev
              },
              birthdate: (prev: unknown) =>
                data.birthdate !== undefined ? data.birthdate : prev,
              sex: (prev: string | null) =>
                (data.sex !== undefined ? data.sex : prev) ?? '',
              properties: mergeProperties,
            },
          })
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              patients(existing, { readField }) {
                if (!Array.isArray(existing)) return existing
                const hasPatient = existing.some(
                  (ref) => readField('id', ref) === patientId
                )
                if (!hasPatient) return existing
                return [...existing]
              },
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
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              patients(existing, { readField }) {
                if (!Array.isArray(existing)) return existing
                const hasPatient = existing.some(
                  (ref) => readField('id', ref) === v.id
                )
                if (!hasPatient) return existing
                return [...existing]
              },
            },
          })
        },
      },
    ]
  },
}

registerOptimisticPlan(updatePatientOptimisticPlanKey, updatePatientOptimisticPlan as OptimisticPlan<unknown>)
