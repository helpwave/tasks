import type { FieldMergeFunction } from '@apollo/client/cache'

export type ConfirmedEntityType = 'Task' | 'Patient'

type Snapshot = Record<string, unknown>

const snapshots = new Map<string, Snapshot>()

function snapshotKey(entityType: ConfirmedEntityType, entityId: string): string {
  return `${entityType}:${entityId}`
}

export const PATIENT_CONFIRMED_FIELDS = [
  'firstname',
  'lastname',
  'name',
  'birthdate',
  'sex',
  'state',
  'description',
  'checksum',
] as const

export const TASK_CONFIRMED_FIELDS = [
  'title',
  'description',
  'done',
  'dueDate',
  'priority',
  'estimatedTime',
  'checksum',
  'updateDate',
] as const

export function setConfirmedEntitySnapshot(
  entityType: ConfirmedEntityType,
  entityId: string,
  snapshot: Snapshot
): void {
  snapshots.set(snapshotKey(entityType, entityId), { ...snapshot })
}

export function getConfirmedEntitySnapshot(
  entityType: ConfirmedEntityType,
  entityId: string
): Snapshot | undefined {
  return snapshots.get(snapshotKey(entityType, entityId))
}

export function clearConfirmedEntitySnapshot(
  entityType: ConfirmedEntityType,
  entityId: string
): void {
  snapshots.delete(snapshotKey(entityType, entityId))
}

export function mergeFieldWithConfirmedSnapshot(
  entityType: ConfirmedEntityType,
  field: string
): FieldMergeFunction {
  return (existing, incoming, { readField }) => {
    const id = readField<string>('id')
    if (!id) return incoming ?? existing

    const snapshot = getConfirmedEntitySnapshot(entityType, id)
    if (!snapshot || !(field in snapshot)) return incoming ?? existing

    const confirmed = snapshot[field]
    if (incoming === confirmed) return incoming
    if (incoming !== confirmed && (existing === confirmed || existing === undefined)) {
      return confirmed as typeof incoming
    }
    return incoming ?? existing
  }
}

export function buildConfirmedFieldPolicies(
  entityType: ConfirmedEntityType,
  fields: readonly string[]
): Record<string, { merge: FieldMergeFunction }> {
  return Object.fromEntries(
    fields.map(field => [field, { merge: mergeFieldWithConfirmedSnapshot(entityType, field) }])
  )
}
