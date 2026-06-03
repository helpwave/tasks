import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearEntityMutated,
  markEntityMutated,
  shouldSkipMergePatient,
  shouldSkipMergeTask
} from './handler'

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
