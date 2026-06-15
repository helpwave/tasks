import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApolloClient } from '@apollo/client/core'
import {
  clearEntityMutated,
  markEntityMutated,
  mergePatientUpdatedIntoCache,
  reloadEntityAfterMutation,
  shouldSkipMergePatient,
  shouldSkipMergeTask
} from './handler'
import { getRefreshingPatientIds } from './refreshingEntities'

const noPending = () => false

beforeEach(() => {
  clearEntityMutated('Task', 'task-1')
  clearEntityMutated('Patient', 'patient-1')
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('echo detection', () => {
  it('does not skip when the entity was never mutated locally', () => {
    expect(
      shouldSkipMergeTask('task-1', {}, { conflictStrategy: 'defer', getPendingForEntity: noPending })
    ).toBe(false)
  })

  it('treats a recent local mutation as an echo when no mutation id is provided', () => {
    markEntityMutated('Task', 'task-1', 'mut-1')
    expect(
      shouldSkipMergeTask('task-1', {}, { conflictStrategy: 'defer', getPendingForEntity: noPending })
    ).toBe(true)
  })

  it('skips when the payload mutation id matches our own in-flight mutation', () => {
    markEntityMutated('Task', 'task-1', 'mut-1')
    expect(
      shouldSkipMergeTask(
        'task-1',
        { clientMutationId: 'mut-1' },
        { conflictStrategy: 'defer', getPendingForEntity: noPending }
      )
    ).toBe(true)
  })

  it('never suppresses a concurrent change carrying a different mutation id', () => {
    markEntityMutated('Task', 'task-1', 'mut-1')
    expect(
      shouldSkipMergeTask(
        'task-1',
        { clientMutationId: 'other-client-mut' },
        { conflictStrategy: 'defer', getPendingForEntity: noPending }
      )
    ).toBe(false)
  })

  it('stops treating a mutation as an echo once the window elapses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    markEntityMutated('Task', 'task-1', 'mut-1')
    vi.setSystemTime(new Date('2026-01-01T00:00:06Z'))
    expect(
      shouldSkipMergeTask('task-1', {}, { conflictStrategy: 'defer', getPendingForEntity: noPending })
    ).toBe(false)
  })

  it('clears the echo marker after a mutation settles', () => {
    markEntityMutated('Patient', 'patient-1', 'mut-9')
    clearEntityMutated('Patient', 'patient-1')
    expect(
      shouldSkipMergePatient('patient-1', {}, { conflictStrategy: 'defer', getPendingForEntity: noPending })
    ).toBe(false)
  })
})

describe('reloadEntityAfterMutation', () => {
  it('refetches active lists and toggles the refreshing gate', async () => {
    let gatedDuringRefetch = false
    const client = {
      refetchQueries: vi.fn().mockImplementation(() => {
        gatedDuringRefetch = getRefreshingPatientIds().has('patient-1')
        return Promise.resolve([])
      }),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Patient', 'patient-1')

    expect(client.refetchQueries).toHaveBeenCalled()
    expect(gatedDuringRefetch).toBe(true)
    expect(getRefreshingPatientIds().has('patient-1')).toBe(false)
  })

  it('refetches the global data query so sidebar counts stay in sync', async () => {
    const includedOperationNames: string[] = []
    const client = {
      refetchQueries: vi.fn().mockImplementation((options: { include?: Array<{ definitions?: Array<{ name?: { value?: string } }> }> }) => {
        for (const doc of options.include ?? []) {
          const name = doc.definitions?.[0]?.name?.value
          if (name) includedOperationNames.push(name)
        }
        return Promise.resolve([])
      }),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Task', 'task-1')

    expect(includedOperationNames).toContain('GetGlobalData')
  })

  it('releases the refreshing gate even when the reload fails', async () => {
    const client = {
      refetchQueries: vi.fn().mockRejectedValue(new Error('network down')),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Patient', 'patient-1')

    expect(getRefreshingPatientIds().has('patient-1')).toBe(false)
  })
})

describe('mergePatientUpdatedIntoCache', () => {
  it('writes server data when force is enabled', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        data: {
          patient: {
            __typename: 'PatientType',
            id: 'patient-1',
            firstname: 'Updated',
            updateDate: '2026-01-02T00:00:00Z',
          },
        },
      }),
      cache: {
        readQuery: vi.fn().mockReturnValue({ patient: { updateDate: '2026-01-02T00:00:00Z' } }),
        writeQuery: vi.fn(),
      },
      refetchQueries: vi.fn().mockResolvedValue([]),
    } as unknown as ApolloClient

    await mergePatientUpdatedIntoCache(
      client,
      'patient-1',
      { patientId: 'patient-1' },
      { conflictStrategy: 'server-wins', force: true }
    )

    expect(client.cache.writeQuery).toHaveBeenCalled()
  })
})

describe('pending-mutation conflict strategy', () => {
  it('defers a server update while a local mutation is pending', () => {
    const pending = (type: 'Task' | 'Patient', id: string) => type === 'Task' && id === 'task-1'
    expect(
      shouldSkipMergeTask('task-1', {}, { conflictStrategy: 'defer', getPendingForEntity: pending })
    ).toBe(true)
  })

  it('does not defer under the server-wins strategy', () => {
    const pending = () => true
    expect(
      shouldSkipMergeTask('task-1', {}, { conflictStrategy: 'server-wins', getPendingForEntity: pending })
    ).toBe(false)
  })
})
