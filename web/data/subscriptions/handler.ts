import type { ApolloClient } from '@apollo/client/core'
import { GetTaskDocument, GetPatientDocument } from '@/api/gql/generated'
import { getParsedDocument } from '../hooks/queryHelpers'
import { hasPendingMutationForEntity } from '../mutations/queue'

export type SubscriptionPayload = {
  taskId?: string,
  patientId?: string,
  locationId?: string,
  clientMutationId?: string,
  updateDate?: string,
}

export type ConflictStrategy = 'defer' | 'server-wins'

export type MergeSubscriptionOptions = {
  conflictStrategy: ConflictStrategy,
  getPendingForEntity?: (entityType: 'Task' | 'Patient', entityId: string) => boolean,
}

const ECHO_WINDOW_MS = 5000
const recentMutationsByEntity = new Map<string, { clientMutationId: string, at: number }>()

export function markEntityMutated(
  entityType: 'Task' | 'Patient',
  entityId: string,
  clientMutationId: string
): void {
  const key = `${entityType}:${entityId}`
  recentMutationsByEntity.set(key, { clientMutationId, at: Date.now() })
}

export function clearEntityMutated(entityType: 'Task' | 'Patient', entityId: string): void {
  recentMutationsByEntity.delete(`${entityType}:${entityId}`)
}

function isLikelyEcho(
  entityType: 'Task' | 'Patient',
  entityId: string,
  payloadClientMutationId?: string
): boolean {
  const key = `${entityType}:${entityId}`
  const recent = recentMutationsByEntity.get(key)
  if (!recent) return false
  if (payloadClientMutationId && payloadClientMutationId === recent.clientMutationId) {
    return true
  }
  if (Date.now() - recent.at < ECHO_WINDOW_MS) {
    return true
  }
  return false
}

export function shouldSkipMergeTask(
  taskId: string,
  payload: SubscriptionPayload,
  options: MergeSubscriptionOptions
): boolean {
  const getPending =
    options.getPendingForEntity ?? ((type, id) => hasPendingMutationForEntity(type, id))
  if (getPending('Task', taskId) && options.conflictStrategy === 'defer') return true
  if (isLikelyEcho('Task', taskId, payload.clientMutationId)) return true
  return false
}

export function shouldSkipMergePatient(
  patientId: string,
  payload: SubscriptionPayload,
  options: MergeSubscriptionOptions
): boolean {
  const getPending =
    options.getPendingForEntity ?? ((type, id) => hasPendingMutationForEntity(type, id))
  if (getPending('Patient', patientId) && options.conflictStrategy === 'defer') return true
  if (isLikelyEcho('Patient', patientId, payload.clientMutationId)) return true
  return false
}

export async function mergeTaskUpdatedIntoCache(
  client: ApolloClient,
  taskId: string,
  payload: SubscriptionPayload,
  options: MergeSubscriptionOptions
): Promise<void> {
  const getPending =
    options.getPendingForEntity ?? ((type, id) => hasPendingMutationForEntity(type, id))
  if (getPending('Task', taskId)) {
    if (options.conflictStrategy === 'defer') return
  }
  if (isLikelyEcho('Task', taskId, payload.clientMutationId)) return

  const doc = getParsedDocument(GetTaskDocument)
  const result = await client.query<{ task?: unknown }>({
    query: doc,
    variables: { id: taskId },
    fetchPolicy: 'network-only',
  })
  const data = result.data as { task?: unknown } | undefined
  const incoming = data?.task
  if (!incoming) return

  const cache = client.cache
  const existing = cache.readQuery<{ task?: { updateDate?: string } }>({
    query: doc,
    variables: { id: taskId },
  })
  const existingUpdateDate = existing?.task?.updateDate
  const incomingUpdateDate = (incoming as { updateDate?: string }).updateDate
  if (
    existingUpdateDate &&
    incomingUpdateDate &&
    new Date(incomingUpdateDate) <= new Date(existingUpdateDate)
  ) {
    return
  }

  cache.writeQuery({
    query: doc,
    variables: { id: taskId },
    data: { task: incoming },
  })
}

export async function mergePatientUpdatedIntoCache(
  client: ApolloClient,
  patientId: string,
  payload: SubscriptionPayload,
  options: MergeSubscriptionOptions
): Promise<void> {
  const getPending =
    options.getPendingForEntity ?? ((type, id) => hasPendingMutationForEntity(type, id))
  if (getPending('Patient', patientId)) {
    if (options.conflictStrategy === 'defer') return
  }
  if (isLikelyEcho('Patient', patientId, payload.clientMutationId)) return

  const doc = getParsedDocument(GetPatientDocument)
  const result = await client.query<{ patient?: unknown }>({
    query: doc,
    variables: { id: patientId },
    fetchPolicy: 'network-only',
  })
  const data = result.data as { patient?: unknown } | undefined
  const incoming = data?.patient
  if (!incoming) return

  const cache = client.cache
  const existing = cache.readQuery<{ patient?: { updateDate?: string } }>({
    query: doc,
    variables: { id: patientId },
  })
  const existingUpdateDate = existing?.patient?.updateDate
  const incomingUpdateDate = (incoming as { updateDate?: string }).updateDate
  if (
    existingUpdateDate &&
    incomingUpdateDate &&
    new Date(incomingUpdateDate) <= new Date(existingUpdateDate)
  ) {
    return
  }

  cache.writeQuery({
    query: doc,
    variables: { id: patientId },
    data: { patient: incoming },
  })
}

export function mergeSubscriptionIntoCache(
  client: ApolloClient,
  payload: SubscriptionPayload,
  options: MergeSubscriptionOptions
): Promise<void> {
  if (payload.taskId) {
    return mergeTaskUpdatedIntoCache(client, payload.taskId, payload, options)
  }
  if (payload.patientId) {
    return mergePatientUpdatedIntoCache(client, payload.patientId, payload, options)
  }
  return Promise.resolve()
}
