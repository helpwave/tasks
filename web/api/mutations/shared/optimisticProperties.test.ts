import { describe, expect, it } from 'vitest'
import { InMemoryCache } from '@apollo/client/cache'
import { buildCacheConfig } from '@/data/cache/policies'
import { GetPatientsDocument, type GetPatientsQuery } from '@/api/gql/generated'
import { buildOptimisticProperties, readEntityProperties, applyOptimisticPropertyScalars, type OptimisticPropertyValue } from './optimisticProperties'

function makeProp(over: Partial<OptimisticPropertyValue> & { id: string, definitionId: string }): OptimisticPropertyValue {
  return {
    __typename: 'PropertyValueType',
    id: over.id,
    definition: { id: over.definitionId },
    textValue: over.textValue ?? null,
    numberValue: over.numberValue ?? null,
    booleanValue: over.booleanValue ?? null,
    dateValue: over.dateValue ?? null,
    dateTimeValue: over.dateTimeValue ?? null,
    selectValue: over.selectValue ?? null,
    multiSelectValues: over.multiSelectValues ?? null,
    userValue: over.userValue ?? null,
  }
}

describe('buildOptimisticProperties', () => {
  it('preserves the real uuid of an edited property instead of replacing it with a synthetic id', () => {
    const existing = [makeProp({ id: 'real-uuid-1', definitionId: 'def-1', textValue: 'old' })]
    const result = buildOptimisticProperties(
      existing,
      [{ definitionId: 'def-1', textValue: 'new' }],
      'patient-1'
    )
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('real-uuid-1')
    expect(result[0]!.textValue).toBe('new')
  })

  it('keeps untouched properties (with their uuids) when editing one of several', () => {
    const existing = [
      makeProp({ id: 'uuid-1', definitionId: 'def-1', textValue: 'a' }),
      makeProp({ id: 'uuid-2', definitionId: 'def-2', numberValue: 5 }),
    ]
    // The caller passes the full set of property inputs (see mergePropertyChangeIntoInputs).
    const result = buildOptimisticProperties(
      existing,
      [
        { definitionId: 'def-1', textValue: 'a' },
        { definitionId: 'def-2', numberValue: 9 },
      ],
      'patient-1'
    )
    const byId = Object.fromEntries(result.map(p => [p.id, p]))
    expect(byId['uuid-1']!.textValue).toBe('a')
    expect(byId['uuid-2']!.numberValue).toBe(9)
    // No synthetic attachment ids were introduced.
    expect(result.every(p => !String(p.id).startsWith('attachment-'))).toBe(true)
  })

  it('creates a synthetic attachment id only for genuinely new properties', () => {
    const result = buildOptimisticProperties(
      [],
      [{ definitionId: 'def-new', textValue: 'x' }],
      'patient-1'
    )
    expect(result[0]!.id).toBe('attachment-patient-1-def-new')
  })
})

describe('readEntityProperties', () => {
  it('reads the current property values (with uuids) from the normalized list entity', () => {
    const cache = new InMemoryCache(buildCacheConfig())
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
            assignedLocation: null,
            assignedLocations: [],
            clinic: null,
            position: null,
            teams: [],
            tasks: [],
            properties: [
              {
                __typename: 'PropertyValueType',
                id: 'real-uuid-1',
                definition: {
                  __typename: 'PropertyDefinitionType',
                  id: 'def-1',
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

    const props = readEntityProperties(cache, 'PatientType', 'patient-1')
    expect(props).toHaveLength(1)
    expect(props[0]!.id).toBe('real-uuid-1')
    expect((props[0]!.definition as { id: string }).id).toBe('def-1')
  })

  it('returns an empty array when the entity is not in the cache', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    expect(readEntityProperties(cache, 'PatientType', 'missing')).toEqual([])
  })
})

describe('applyOptimisticPropertyScalars', () => {
  it('writes scalar updates onto normalized PropertyValueType entities', () => {
    const cache = new InMemoryCache(buildCacheConfig())
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
            assignedLocation: null,
            assignedLocations: [],
            clinic: null,
            position: null,
            teams: [],
            tasks: [],
            properties: [
              {
                __typename: 'PropertyValueType',
                id: 'real-uuid-1',
                definition: {
                  __typename: 'PropertyDefinitionType',
                  id: 'def-1',
                  name: 'DOB',
                  description: null,
                  fieldType: 'FIELD_TYPE_DATE',
                  isActive: true,
                  allowedEntities: ['PATIENT'],
                  options: [],
                },
                textValue: null,
                numberValue: null,
                booleanValue: null,
                dateValue: '2000-01-01',
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

    applyOptimisticPropertyScalars(cache, [
      makeProp({ id: 'real-uuid-1', definitionId: 'def-1', dateValue: '2003-03-03' }),
    ])

    const props = readEntityProperties(cache, 'PatientType', 'patient-1')
    expect(props[0]?.dateValue).toBe('2003-03-03')
  })
})
