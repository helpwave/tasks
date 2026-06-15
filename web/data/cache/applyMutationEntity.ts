import type { ApolloClient } from '@apollo/client/core'
import {
  PATIENT_CONFIRMED_FIELDS,
  TASK_CONFIRMED_FIELDS,
  type ConfirmedEntityType
} from './confirmedEntitySnapshots'

const PATIENT_TYPENAME = 'PatientType'
const TASK_TYPENAME = 'TaskType'

export function findEntityInMutationResult(
  entityType: ConfirmedEntityType,
  entityId: string,
  data: Record<string, unknown>
): Record<string, unknown> | undefined {
  const typename = entityType === 'Patient' ? PATIENT_TYPENAME : TASK_TYPENAME
  const queue: unknown[] = Object.values(data)

  while (queue.length > 0) {
    const value = queue.shift()
    if (value == null || typeof value !== 'object') continue

    if (Array.isArray(value)) {
      queue.push(...value)
      continue
    }

    const record = value as Record<string, unknown>
    if (record['__typename'] === typename && record['id'] === entityId) {
      return record
    }

    queue.push(...Object.values(record))
  }

  return undefined
}

export function applyMutationEntityToCache(
  client: ApolloClient,
  entityType: ConfirmedEntityType,
  entityId: string,
  entity: Record<string, unknown>
): void {
  const typename = entityType === 'Patient' ? PATIENT_TYPENAME : TASK_TYPENAME
  const cacheId = client.cache.identify({ __typename: typename, id: entityId })
  if (!cacheId) return

  const fieldNames = entityType === 'Patient' ? PATIENT_CONFIRMED_FIELDS : TASK_CONFIRMED_FIELDS
  const fields: Record<string, () => unknown> = {}

  for (const field of fieldNames) {
    if (field in entity) {
      const value = entity[field]
      fields[field] = () => value
    }
  }

  if (Object.keys(fields).length === 0) return

  client.cache.modify({ id: cacheId, fields })
}
