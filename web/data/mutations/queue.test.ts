import { beforeEach, describe, expect, it } from 'vitest'
import {
  addPendingMutation,
  getPendingMutation,
  getPendingMutations,
  hasPendingMutationForEntity,
  removePendingMutation
} from './queue'
import type { PendingMutationRecord } from './types'

function record(clientMutationId: string, id: string): PendingMutationRecord {
  return {
    clientMutationId,
    document: 'mutation {}',
    variables: { id },
    optimisticPlanKey: 'test-plan',
    createdAt: Date.now(),
  }
}

beforeEach(() => {
  for (const r of getPendingMutations()) {
    removePendingMutation(r.clientMutationId)
  }
})

describe('pending mutation queue', () => {
  it('tracks and retrieves a pending mutation by id', () => {
    addPendingMutation(record('mut-1', 'task-1'))
    expect(getPendingMutation('mut-1')?.clientMutationId).toBe('mut-1')
    expect(getPendingMutations()).toHaveLength(1)
  })

  it('reports a pending mutation for the affected entity', () => {
    addPendingMutation(record('mut-1', 'task-1'))
    expect(hasPendingMutationForEntity('Task', 'task-1')).toBe(true)
    expect(hasPendingMutationForEntity('Task', 'task-2')).toBe(false)
  })

  it('removes a settled mutation so it no longer blocks updates', () => {
    addPendingMutation(record('mut-1', 'task-1'))
    removePendingMutation('mut-1')
    expect(getPendingMutation('mut-1')).toBeUndefined()
    expect(hasPendingMutationForEntity('Task', 'task-1')).toBe(false)
  })

  it('keeps insertion order for replay', () => {
    addPendingMutation(record('mut-1', 'task-1'))
    addPendingMutation(record('mut-2', 'task-2'))
    addPendingMutation(record('mut-3', 'task-3'))
    expect(getPendingMutations().map((r) => r.clientMutationId)).toEqual(['mut-1', 'mut-2', 'mut-3'])
  })

  it('returns a copy so external mutation cannot corrupt the queue', () => {
    addPendingMutation(record('mut-1', 'task-1'))
    const snapshot = getPendingMutations()
    snapshot.pop()
    expect(getPendingMutations()).toHaveLength(1)
  })
})
