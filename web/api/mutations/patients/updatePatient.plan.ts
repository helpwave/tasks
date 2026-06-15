import type { ApolloCache } from '@apollo/client/cache'
import {
  GetPatientDocument,
  type GetPatientQuery,
  type UpdatePatientInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'
import { buildOptimisticProperties, readEntityProperties, applyOptimisticPropertyScalars, getNewOptimisticProperties } from '@/api/mutations/shared/optimisticProperties'

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
          const fields: Record<string, (prev: unknown, details: { readField: (field: string) => unknown }) => unknown> = {
            firstname: (prev) =>
              data.firstname !== undefined ? data.firstname ?? '' : prev,
            lastname: (prev) =>
              data.lastname !== undefined ? data.lastname ?? '' : prev,
            // `name` is a server-computed field (`${firstname} ${lastname}`) that
            // the patient list/card render. Keep it in sync optimistically so the
            // rename shows immediately instead of waiting for a full list refetch.
            name: (prev, { readField }) => {
              if (data.firstname === undefined && data.lastname === undefined) return prev
              const firstname = data.firstname !== undefined
                ? data.firstname ?? ''
                : ((readField('firstname') as string | undefined) ?? '')
              const lastname = data.lastname !== undefined
                ? data.lastname ?? ''
                : ((readField('lastname') as string | undefined) ?? '')
              return `${firstname} ${lastname}`
            },
            // `birthdate` is non-nullable; the editor sends `null` to mean "unchanged",
            // so only overwrite when an actual value is provided.
            birthdate: (prev) =>
              data.birthdate != null ? data.birthdate : prev,
            sex: (prev) =>
              (data.sex !== undefined ? data.sex : prev) ?? '',
          }
          // Only touch `properties` when the mutation actually changes them. Rewriting
          // the field for an unrelated edit (e.g. a rename) re-serialises the cached
          // property objects and would drop the normalized `definition`/`user`/`team`
          // sub-fields, leaving the entity read *incomplete*. An incomplete read makes
          // the active cache-first/cache-and-network queries revalidate over the network
          // before this mutation commits, and those stale responses then overwrite the
          // optimistic update — so the UI never reflects the change until a full reload.
          if (data.properties !== undefined) {
            const existingProps = readEntityProperties(cache, 'PatientType', patientId)
            const optimisticProperties = buildOptimisticProperties(existingProps, data.properties, patientId)
            applyOptimisticPropertyScalars(cache, optimisticProperties)
            const newProperties = getNewOptimisticProperties(optimisticProperties)
            if (newProperties.length > 0) {
              fields['properties'] = (existing) => {
                const current = Array.isArray(existing) ? existing : []
                return [...current, ...newProperties]
              }
            }
          }
          cache.modify({ id, fields })
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
