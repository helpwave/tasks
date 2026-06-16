import { describe, expect, it } from 'vitest'
import { InMemoryCache } from '@apollo/client/cache'
import { buildCacheConfig } from '@/data/cache/policies'
import { GetPatientsDocument, type GetPatientsQuery } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { updatePatientOptimisticPlan } from './updatePatient.plan'
import { paginatedListItemKey } from '@/utils/paginatedListItemKey'

const LIST_VARIABLES = {
  rootLocationIds: ['root-1'],
  states: ['ADMITTED', 'WAIT', 'DISCHARGED', 'DEAD'],
  pagination: { pageIndex: 0, pageSize: 25 },
}

function seedListPatient(cache: InMemoryCache) {
  cache.writeQuery<GetPatientsQuery>({
    query: GetPatientsDocument,
    variables: LIST_VARIABLES,
    data: ({
      patients: [
        {
          __typename: 'PatientType',
          id: 'p-1',
          name: 'Doe, Jane',
          firstname: 'Jane',
          lastname: 'Doe',
          birthdate: '1990-01-01',
          sex: 'FEMALE',
          state: 'ADMITTED',
          updateDate: null,
          assignedLocation: null,
          assignedLocations: [],
          clinic: null,
          position: null,
          teams: [],
          tasks: [],
          properties: [
            {
              __typename: 'PropertyValueType',
              id: 'prop-uuid-1',
              definition: {
                __typename: 'PropertyDefinitionType',
                id: 'def-allergy',
                name: 'Allergy',
                description: null,
                fieldType: 'FIELD_TYPE_TEXT',
                isActive: true,
                allowedEntities: ['PATIENT'],
                options: [],
              },
              textValue: 'Penicillin',
              numberValue: null,
              booleanValue: null,
              dateValue: null,
              dateTimeValue: null,
              selectValue: null,
              multiSelectValues: null,
              userValue: null,
              user: null,
              team: null,
            },
          ],
        },
      ],
      patientsTotal: 1,
    } as unknown) as GetPatientsQuery,
  })
}

function readListPatients(cache: InMemoryCache) {
  return cache.readQuery<GetPatientsQuery>({
    query: getParsedDocument(GetPatientsDocument),
    variables: LIST_VARIABLES,
    optimistic: true,
  })?.patients
}

describe('updatePatientOptimisticPlan list integration', () => {
  it('updates the cached list patient property value after an inline edit', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedListPatient(cache)

    const variables = {
      id: 'p-1',
      data: {
        properties: [{ definitionId: 'def-allergy', textValue: 'Latex' }],
      },
    }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    const diff = cache.diff({
      query: getParsedDocument(GetPatientsDocument),
      variables: LIST_VARIABLES,
      optimistic: true,
      returnPartialData: true,
    })
    expect(diff.complete).toBe(true)

    const patients = readListPatients(cache)
    const allergy = patients?.[0]?.properties?.find(
      (property) => property.definition.id === 'def-allergy'
    )
    expect(allergy?.textValue).toBe('Latex')
    expect(allergy?.definition?.name).toBe('Allergy')
  })

  it('changes the paginated list item key so accumulated pagination detects the update', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedListPatient(cache)
    const before = readListPatients(cache)!

    const variables = {
      id: 'p-1',
      data: {
        properties: [{ definitionId: 'def-allergy', textValue: 'Latex' }],
      },
    }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    const after = readListPatients(cache)!
    expect(paginatedListItemKey(before[0]!)).not.toBe(paginatedListItemKey(after[0]!))
  })
})
