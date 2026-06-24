import { describe, expect, it } from 'vitest'
import { InMemoryCache } from '@apollo/client/cache'
import { buildCacheConfig } from './policies'
import { GetPatientsDocument, type GetPatientsQuery } from '@/api/gql/generated'

type TestProperty = {
  id: string,
  definitionId: string,
  selectValue?: string | null,
  textValue?: string | null,
}

function makeProperty(prop: TestProperty) {
  return {
    __typename: 'PropertyValueType',
    id: prop.id,
    definition: {
      __typename: 'PropertyDefinitionType',
      id: prop.definitionId,
      name: 'Property',
      description: null,
      fieldType: 'FIELD_TYPE_SELECT',
      isActive: true,
      allowedEntities: ['PATIENT'],
      options: ['a', 'b'],
    },
    textValue: prop.textValue ?? null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    dateTimeValue: null,
    selectValue: prop.selectValue ?? null,
    multiSelectValues: null,
    userValue: null,
    user: null,
    team: null,
  }
}

function writePatientWithProperties(cache: InMemoryCache, properties: TestProperty[]) {
  cache.writeQuery<GetPatientsQuery>({
    query: GetPatientsDocument,
    variables: { pagination: { pageIndex: 0, pageSize: 25 } },
    data: ({
      patients: [
        {
          __typename: 'PatientType',
          id: 'patient-1',
          name: 'Jane Doe',
          firstname: 'Jane',
          lastname: 'Doe',
          birthdate: '1990-01-01',
          sex: 'FEMALE',
          state: 'ADMITTED',
          updateDate: '2026-01-01T00:00:00Z',
          assignedLocation: null,
          assignedLocations: [],
          clinic: null,
          position: null,
          teams: [],
          tasks: [],
          properties: properties.map(makeProperty),
        },
      ],
      patientsTotal: 1,
    } as unknown) as GetPatientsQuery,
  })
}

function readPatientProperties(cache: InMemoryCache): Array<{ definition: { id: string }, selectValue: string | null }> {
  const data = cache.readQuery<GetPatientsQuery>({
    query: GetPatientsDocument,
    variables: { pagination: { pageIndex: 0, pageSize: 25 } },
  })
  return (data?.patients?.[0]?.properties ?? []) as unknown as Array<{ definition: { id: string }, selectValue: string | null }>
}

describe('patient properties cache policy', () => {
  it('reflects a canonical server response that removes a property (clearing a selection)', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    writePatientWithProperties(cache, [
      { id: 'uuid-keep', definitionId: 'def-keep', selectValue: 'def-keep-opt-0' },
      { id: 'uuid-clear', definitionId: 'def-clear', selectValue: 'def-clear-opt-1' },
    ])

    // Server reload after the user cleared the `def-clear` selection: the
    // canonical response no longer contains that property.
    writePatientWithProperties(cache, [
      { id: 'uuid-keep', definitionId: 'def-keep', selectValue: 'def-keep-opt-0' },
    ])

    const props = readPatientProperties(cache)
    expect(props.map(p => p.definition.id)).toEqual(['def-keep'])
  })

  it('reflects a canonical server response that changes a selection value', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    writePatientWithProperties(cache, [
      { id: 'uuid-1', definitionId: 'def-1', selectValue: 'def-1-opt-0' },
    ])

    writePatientWithProperties(cache, [
      { id: 'uuid-1', definitionId: 'def-1', selectValue: 'def-1-opt-1' },
    ])

    const props = readPatientProperties(cache)
    expect(props).toHaveLength(1)
    expect(props[0]!.selectValue).toBe('def-1-opt-1')
  })
})
