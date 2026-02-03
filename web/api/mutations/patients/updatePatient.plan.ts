import type { ApolloCache } from '@apollo/client/cache'
import type { Reference } from '@apollo/client/utilities'
import {
  GetPatientDocument,
  type GetPatientQuery,
  type UpdatePatientInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
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
          const existingProps = existing?.patient?.properties ?? []
          const mergeProperties = (_prev: Reference | readonly unknown[]) => {
            if (!data.properties) return existingProps
            return data.properties.map((inp) => {
              const existingProp = existingProps.find(
                (p) => (p as { definition: { id: string } }).definition.id === inp.definitionId
              )
              if (existingProp) {
                const cur = existingProp as Record<string, unknown>
                return {
                  ...cur,
                  textValue: inp.textValue ?? cur['textValue'] ?? null,
                  numberValue: inp.numberValue ?? cur['numberValue'] ?? null,
                  booleanValue: inp.booleanValue ?? cur['booleanValue'] ?? null,
                  dateValue: inp.dateValue ?? cur['dateValue'] ?? null,
                  dateTimeValue: inp.dateTimeValue ?? cur['dateTimeValue'] ?? null,
                  selectValue: inp.selectValue ?? cur['selectValue'] ?? null,
                  multiSelectValues: inp.multiSelectValues ?? cur['multiSelectValues'] ?? null,
                  userValue: inp.userValue ?? cur['userValue'] ?? null,
                }
              }
              return {
                __typename: 'PropertyValueType',
                id: `attachment-${patientId}-${inp.definitionId}`,
                definition: { __ref: `PropertyDefinitionType:${inp.definitionId}` },
                textValue: inp.textValue ?? null,
                numberValue: inp.numberValue ?? null,
                booleanValue: inp.booleanValue ?? null,
                dateValue: inp.dateValue ?? null,
                dateTimeValue: inp.dateTimeValue ?? null,
                selectValue: inp.selectValue ?? null,
                multiSelectValues: inp.multiSelectValues ?? null,
                userValue: inp.userValue ?? null,
              }
            })
          }
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
