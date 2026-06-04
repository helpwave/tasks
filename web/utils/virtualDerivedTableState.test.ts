import { describe, expect, it } from 'vitest'
import type { ColumnFiltersState } from '@tanstack/react-table'
import type { PatientViewModel } from '@/components/tables/PatientList'
import { applyVirtualDerivedPatients } from '@/utils/virtualDerivedTableState'

function patient(id: string, state: string): PatientViewModel {
  return {
    id,
    name: id,
    firstname: id,
    lastname: id,
    clinic: null,
    birthdate: new Date('2000-01-01'),
    sex: 'UNKNOWN',
    state,
    position: null,
    openTasksCount: 0,
    closedTasksCount: 0,
    tasks: [],
    properties: [],
  } as unknown as PatientViewModel
}

function stateFilter(operator: string, tags: string[]): ColumnFiltersState {
  return [
    {
      id: 'state',
      value: {
        operator,
        dataType: 'singleTag',
        parameter: { searchTags: tags },
      },
    },
  ] as unknown as ColumnFiltersState
}

const patients = [
  patient('a', 'ADMITTED'),
  patient('b', 'WAIT'),
  patient('c', 'DISCHARGED'),
  patient('d', 'DEAD'),
]

describe('applyVirtualDerivedPatients - state filter', () => {
  it('"contains" keeps only the selected states', () => {
    const result = applyVirtualDerivedPatients(
      patients,
      stateFilter('contains', ['DISCHARGED', 'DEAD']),
      [],
      ''
    )
    expect(result.map(p => p.state).sort()).toEqual(['DEAD', 'DISCHARGED'])
  })

  it('"does not contain" excludes the selected states (issue #227)', () => {
    const result = applyVirtualDerivedPatients(
      patients,
      stateFilter('notContains', ['DISCHARGED', 'DEAD']),
      [],
      ''
    )
    expect(result.map(p => p.state).sort()).toEqual(['ADMITTED', 'WAIT'])
  })

  it('"equals" keeps the single selected state', () => {
    const result = applyVirtualDerivedPatients(
      patients,
      stateFilter('equals', ['ADMITTED']),
      [],
      ''
    )
    expect(result.map(p => p.state)).toEqual(['ADMITTED'])
  })

  it('"not equals" excludes the single selected state', () => {
    const result = applyVirtualDerivedPatients(
      patients,
      stateFilter('notEquals', ['ADMITTED']),
      [],
      ''
    )
    expect(result.map(p => p.state).sort()).toEqual(['DEAD', 'DISCHARGED', 'WAIT'])
  })

  it('an empty selection does not filter anything out', () => {
    const result = applyVirtualDerivedPatients(
      patients,
      stateFilter('notContains', []),
      [],
      ''
    )
    expect(result).toHaveLength(4)
  })
})
