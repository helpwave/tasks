import { describe, expect, it, afterEach } from 'vitest'
import {
  clearConfirmedEntitySnapshot,
  mergeFieldWithConfirmedSnapshot,
  setConfirmedEntitySnapshot
} from './confirmedEntitySnapshots'

afterEach(() => {
  clearConfirmedEntitySnapshot('Patient', 'patient-1')
})

describe('mergeFieldWithConfirmedSnapshot', () => {
  it('keeps confirmed values when a stale list refetch arrives', () => {
    setConfirmedEntitySnapshot('Patient', 'patient-1', {
      firstname: 'Updated',
      checksum: 'new-checksum',
    })

    const merge = mergeFieldWithConfirmedSnapshot('Patient', 'firstname')
    const result = merge(
      'Updated',
      'Old',
      { readField: (field: string) => (field === 'id' ? 'patient-1' : undefined) } as never
    )

    expect(result).toBe('Updated')
  })

  it('accepts incoming values once the server catches up', () => {
    setConfirmedEntitySnapshot('Patient', 'patient-1', {
      firstname: 'Updated',
    })

    const merge = mergeFieldWithConfirmedSnapshot('Patient', 'firstname')
    const result = merge(
      'Updated',
      'Updated',
      { readField: (field: string) => (field === 'id' ? 'patient-1' : undefined) } as never
    )

    expect(result).toBe('Updated')
  })

  it('uses the confirmed snapshot when the cache field is still empty', () => {
    setConfirmedEntitySnapshot('Patient', 'patient-1', {
      lastname: 'Updated',
    })

    const merge = mergeFieldWithConfirmedSnapshot('Patient', 'lastname')
    const result = merge(
      undefined,
      'Old',
      { readField: (field: string) => (field === 'id' ? 'patient-1' : undefined) } as never
    )

    expect(result).toBe('Updated')
  })
})
