import { describe, expect, it } from 'vitest'
import { InMemoryCache } from '@apollo/client/cache'
import { buildCacheConfig } from '@/data/cache/policies'
import { GetPatientDocument, GetPatientsDocument, Sex, type GetPatientQuery, type GetPatientsQuery } from '@/api/gql/generated'
import { updatePatientOptimisticPlan } from './updatePatient.plan'

function seedPatient(cache: InMemoryCache) {
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
          properties: [],
        },
      ],
      patientsTotal: 1,
    } as unknown) as GetPatientsQuery,
  })
}

function readName(cache: InMemoryCache): string | undefined {
  const id = cache.identify({ __typename: 'PatientType', id: 'patient-1' })
  return cache.extract()[id!]?.['name'] as string | undefined
}

describe('updatePatientOptimisticPlan name sync', () => {
  it('optimistically recomputes the server-computed name when the lastname changes', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedPatient(cache)

    const variables = { id: 'patient-1', data: { lastname: 'Smith' } }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    expect(readName(cache)).toBe('Jane Smith')
  })

  it('recomputes the name when the firstname changes, keeping the existing lastname', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedPatient(cache)

    const variables = { id: 'patient-1', data: { firstname: 'Janet' } }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    expect(readName(cache)).toBe('Janet Doe')
  })

  it('leaves the name untouched when neither name part changes', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedPatient(cache)

    const variables = { id: 'patient-1', data: { sex: Sex.Male } }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    expect(readName(cache)).toBe('Jane Doe')
  })
})

const FULL_PROPERTY = {
  __typename: 'PropertyValueType',
  id: 'prop-1',
  definition: {
    __typename: 'PropertyDefinitionType',
    id: 'def-1',
    name: 'Patientenverfuegung',
    description: null,
    fieldType: 'FIELD_TYPE_SELECT',
    isActive: true,
    allowedEntities: ['PATIENT'],
    options: ['Liegt sicher nicht vor'],
  },
  textValue: null,
  numberValue: null,
  booleanValue: null,
  dateValue: null,
  dateTimeValue: null,
  selectValue: 'def-1-opt-0',
  multiSelectValues: null,
  userValue: null,
  user: null,
  team: null,
}

function seedPatientDetailWithProperty(cache: InMemoryCache) {
  cache.writeQuery<GetPatientQuery>({
    query: GetPatientDocument,
    variables: { id: 'patient-1' },
    data: ({
      patient: {
        __typename: 'PatientType',
        id: 'patient-1',
        name: 'Jane Doe',
        firstname: 'Jane',
        lastname: 'Doe',
        birthdate: '1990-01-01',
        sex: 'FEMALE',
        state: 'ADMITTED',
        description: null,
        checksum: 'c1',
        updateDate: null,
        assignedLocation: null,
        assignedLocations: [],
        clinic: null,
        position: null,
        teams: [],
        tasks: [],
        properties: [FULL_PROPERTY],
      },
    } as unknown) as GetPatientQuery,
  })
}

describe('updatePatientOptimisticPlan keeps the cached read complete', () => {
  // Regression: a rename on a patient that *has* a property used to re-serialise
  // the cached `properties`, dropping the normalized `definition` sub-fields and
  // leaving the entity read incomplete. That incompleteness made the active
  // cache-first/cache-and-network queries revalidate over the network before the
  // mutation committed, and those stale responses overwrote the optimistic
  // update — so the rename never showed until a full reload.
  it('does not make the entity read incomplete when renaming a patient with properties', () => {
    const cache = new InMemoryCache(buildCacheConfig())
    seedPatientDetailWithProperty(cache)

    const variables = { id: 'patient-1', data: { lastname: 'Smith', birthdate: null } }
    const [patch] = updatePatientOptimisticPlan.getPatches(variables)
    patch!.apply(cache, variables)

    const diff = cache.diff<GetPatientQuery>({
      query: GetPatientDocument,
      variables: { id: 'patient-1' },
      optimistic: true,
      returnPartialData: true,
    })
    const patient = diff.result?.patient

    expect(diff.complete).toBe(true)
    expect(patient?.lastname).toBe('Smith')
    expect(patient?.name).toBe('Jane Smith')
    // The non-nullable birthdate must survive an "unchanged" (null) input.
    expect(patient?.birthdate).toBe('1990-01-01')
    // The normalized property definition must remain intact.
    expect(patient?.properties?.[0]?.definition?.name).toBe('Patientenverfuegung')
  })
})
