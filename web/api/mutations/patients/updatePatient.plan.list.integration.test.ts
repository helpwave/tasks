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

function readListPatients(cache: InMemoryCache, variables: typeof LIST_VARIABLES = LIST_VARIABLES) {
  return cache.readQuery<GetPatientsQuery>({
    query: getParsedDocument(GetPatientsDocument),
    variables,
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

  it('keeps multi-page list reads complete after an inline property edit', () => {
    const filters = [{
      fieldKey: 'sex',
      operator: 'IN',
      value: { uuidValues: ['MALE', 'FEMALE', 'UNKNOWN'] },
    }]
    const listVarsPage0 = {
      rootLocationIds: ['root-1'],
      states: ['ADMITTED', 'WAIT', 'DISCHARGED', 'DEAD'],
      filters,
      pagination: { pageIndex: 0, pageSize: 25 },
    }
    const listVarsPage1 = { ...listVarsPage0, pagination: { pageIndex: 1, pageSize: 25 } }

    function makePatient(index: number) {
      return {
        __typename: 'PatientType' as const,
        id: `p-${index}`,
        name: `Patient ${index}`,
        firstname: 'Patient',
        lastname: String(index),
        birthdate: '1990-01-01',
        sex: 'MALE' as const,
        state: 'ADMITTED' as const,
        updateDate: null,
        assignedLocation: null,
        assignedLocations: [],
        clinic: null,
        position: null,
        teams: [],
        tasks: [],
        properties: index === 5 ? [{
          __typename: 'PropertyValueType' as const,
          id: `prop-${index}`,
          definition: {
            __typename: 'PropertyDefinitionType' as const,
            id: 'def-living-will',
            name: 'Living Will',
            description: null,
            fieldType: 'FIELD_TYPE_TEXT',
            isActive: true,
            allowedEntities: ['PATIENT'],
            options: [],
          },
          textValue: 'old',
          numberValue: null,
          booleanValue: null,
          dateValue: null,
          dateTimeValue: null,
          selectValue: null,
          multiSelectValues: null,
          userValue: null,
          user: null,
          team: null,
        }] : [],
      }
    }

    const page0 = Array.from({ length: 25 }, (_, i) => makePatient(i))
    const page1 = Array.from({ length: 3 }, (_, i) => makePatient(25 + i))

    const cache = new InMemoryCache(buildCacheConfig())
    cache.writeQuery<GetPatientsQuery>({
      query: GetPatientsDocument,
      variables: listVarsPage0,
      data: ({ patients: page0, patientsTotal: 28 } as unknown) as GetPatientsQuery,
    })
    cache.writeQuery<GetPatientsQuery>({
      query: GetPatientsDocument,
      variables: listVarsPage1,
      data: ({ patients: page1, patientsTotal: 28 } as unknown) as GetPatientsQuery,
    })

    const variables = {
      id: 'p-5',
      data: { properties: [{ definitionId: 'def-living-will', textValue: 'updated' }] },
    }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    for (const vars of [listVarsPage0, listVarsPage1]) {
      const diff = cache.diff<GetPatientsQuery>({
        query: getParsedDocument(GetPatientsDocument),
        variables: vars,
        optimistic: true,
        returnPartialData: true,
      })
      expect(diff.complete).toBe(true)
      expect(diff.result?.patients?.length).toBeGreaterThan(0)
    }

    const edited = readListPatients(cache, listVarsPage0)?.find((patient) => patient.id === 'p-5')
    expect(edited?.properties?.[0]?.textValue).toBe('updated')
    expect(edited?.properties?.[0]?.definition?.name).toBe('Living Will')
  })
})
