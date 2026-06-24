import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApolloClient } from '@apollo/client/core'
import {
  clearEntityMutated,
  markEntityMutated,
  mergePatientUpdatedIntoCache,
  patientListRefetchDocuments,
  refetchActiveDocuments,
  reloadEntityAfterMutation,
  shouldSkipMergePatient,
  shouldSkipMergeTask,
  taskListRefetchDocuments
} from './handler'
import type { DocumentNode } from 'graphql'
import { getRefreshingPatientIds } from './refreshingEntities'

function operationNames(docs: readonly DocumentNode[]): string[] {
  const names: string[] = []
  for (const doc of docs) {
    for (const def of doc.definitions) {
      if ('name' in def && def.name?.value) {
        names.push(def.name.value)
      }
    }
  }
  return names
}

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
  it('holds the gate during the single-entity refetch, then refetches lists and clears it', async () => {
    let gatedDuringEntityFetch = false
    const client = {
      query: vi.fn().mockImplementation(() => {
        gatedDuringEntityFetch = getRefreshingPatientIds().has('patient-1')
        return Promise.resolve({
          data: { patient: { __typename: 'PatientType', id: 'patient-1', updateDate: '2026-01-02T00:00:00Z' } },
        })
      }),
      cache: {
        readQuery: vi.fn().mockReturnValue({ patient: { updateDate: '2026-01-01T00:00:00Z' } }),
        writeQuery: vi.fn(),
      },
      refetchQueries: vi.fn().mockResolvedValue([]),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Patient', 'patient-1')

    expect(client.query).toHaveBeenCalled()
    expect(client.refetchQueries).toHaveBeenCalled()
    expect(gatedDuringEntityFetch).toBe(true)
    expect(getRefreshingPatientIds().has('patient-1')).toBe(false)
  })

  it('ignores echo markers while reloading after a local mutation', async () => {
    markEntityMutated('Patient', 'patient-1', 'mut-1')
    const client = {
      query: vi.fn().mockResolvedValue({
        data: { patient: { __typename: 'PatientType', id: 'patient-1', updateDate: '2026-01-02T00:00:00Z' } },
      }),
      cache: {
        readQuery: vi.fn().mockReturnValue({ patient: { updateDate: '2026-01-02T00:00:00Z' } }),
        writeQuery: vi.fn(),
      },
      refetchQueries: vi.fn().mockResolvedValue([]),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Patient', 'patient-1')

    expect(client.query).toHaveBeenCalled()
    expect(client.cache.writeQuery).toHaveBeenCalled()
  })

  it('writes server data even when updateDate matches the cached value during reload', async () => {
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

  it('refetches the global data query so sidebar counts stay in sync', async () => {
    const includedOperationNames: string[] = []
    const client = {
      query: vi.fn().mockResolvedValue({
        data: { task: { __typename: 'TaskType', id: 'task-1', updateDate: '2026-01-02T00:00:00Z' } },
      }),
      cache: {
        readQuery: vi.fn().mockReturnValue({ task: { updateDate: '2026-01-01T00:00:00Z' } }),
        writeQuery: vi.fn(),
      },
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
      query: vi.fn().mockRejectedValue(new Error('network down')),
      cache: { readQuery: vi.fn(), writeQuery: vi.fn() },
      refetchQueries: vi.fn(),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Patient', 'patient-1')

    expect(getRefreshingPatientIds().has('patient-1')).toBe(false)
  })

  it('still refetches the lists when the single-entity reload fails', async () => {
    const client = {
      query: vi.fn().mockRejectedValue(new Error('network down')),
      cache: { readQuery: vi.fn(), writeQuery: vi.fn() },
      refetchQueries: vi.fn().mockResolvedValue([]),
    } as unknown as ApolloClient

    await reloadEntityAfterMutation(client, 'Task', 'task-1')

    expect(client.refetchQueries).toHaveBeenCalled()
  })
})

describe('list refetch documents', () => {
  it('refetches the task list itself when a task changes (local or remote)', () => {
    expect(operationNames(taskListRefetchDocuments())).toContain('GetTasks')
  })

  it('refetches the patient list itself when a patient changes (local or remote)', () => {
    expect(operationNames(patientListRefetchDocuments())).toContain('GetPatients')
  })

  it('keeps cross-entity lists and global counts in sync for both entity types', () => {
    const taskDocs = operationNames(taskListRefetchDocuments())
    const patientDocs = operationNames(patientListRefetchDocuments())
    expect(taskDocs).toEqual(expect.arrayContaining(['GetTasks', 'GetPatients', 'GetGlobalData']))
    expect(patientDocs).toEqual(expect.arrayContaining(['GetPatients', 'GetTasks', 'GetGlobalData']))
  })
})

describe('refetchActiveDocuments', () => {
  it('only refetches documents whose query is currently active', async () => {
    let included: string[] = []
    const client = {
      getObservableQueries: () => new Set([{ queryName: 'GetPatients' }]),
      refetchQueries: vi.fn().mockImplementation((options: { include?: DocumentNode[] }) => {
        included = operationNames(options.include ?? [])
        return Promise.resolve([])
      }),
    } as unknown as ApolloClient

    await refetchActiveDocuments(client, patientListRefetchDocuments())

    expect(included).toEqual(['GetPatients'])
  })

  it('does not call refetchQueries when none of the target queries are active', async () => {
    const client = {
      getObservableQueries: () => new Set([{ queryName: 'GetUsers' }]),
      refetchQueries: vi.fn(),
    } as unknown as ApolloClient

    await refetchActiveDocuments(client, patientListRefetchDocuments())

    expect(client.refetchQueries).not.toHaveBeenCalled()
  })

  it('refetches all documents when the client cannot report active queries', async () => {
    const client = {
      refetchQueries: vi.fn().mockResolvedValue([]),
    } as unknown as ApolloClient

    await refetchActiveDocuments(client, patientListRefetchDocuments())

    expect(client.refetchQueries).toHaveBeenCalled()
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
