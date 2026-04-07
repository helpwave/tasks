import type { PendingMutationRecord } from './types'

const inMemoryQueue: PendingMutationRecord[] = []

export function addPendingMutation(record: PendingMutationRecord): void {
  inMemoryQueue.push(record)
}

export function removePendingMutation(clientMutationId: string): void {
  const index = inMemoryQueue.findIndex((r) => r.clientMutationId === clientMutationId)
  if (index !== -1) {
    inMemoryQueue.splice(index, 1)
  }
}

export function getPendingMutations(): PendingMutationRecord[] {
  return [...inMemoryQueue]
}

export function getPendingMutation(clientMutationId: string): PendingMutationRecord | undefined {
  return inMemoryQueue.find((r) => r.clientMutationId === clientMutationId)
}

export function hasPendingMutationForEntity(
  entityType: 'Task' | 'Patient',
  entityId: string
): boolean {
  return inMemoryQueue.some((r) => {
    const v = r.variables as Record<string, unknown>
    if (entityType === 'Task' && typeof v?.['id'] === 'string') {
      return v['id'] === entityId
    }
    if (entityType === 'Patient' && typeof v?.['id'] === 'string') {
      return v['id'] === entityId
    }
    return false
  })
}
