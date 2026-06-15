import { describe, expect, it } from 'vitest'
import { InMemoryCache } from '@apollo/client/cache'
import { buildCacheConfig } from '@/data/cache/policies'
import { GetPatientsDocument, Sex, type GetPatientsQuery } from '@/api/gql/generated'
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
