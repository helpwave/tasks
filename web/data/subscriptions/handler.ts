import type { ApolloClient } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import { GetTaskDocument, GetPatientDocument, GetTasksDocument, GetPatientsDocument, GetGlobalDataDocument } from '@/api/gql/generated'
import { getParsedDocument } from '../hooks/queryHelpers'
import { hasPendingMutationForEntity } from '../mutations/queue'
import {
  addRefreshingTask,
  removeRefreshingTask,
  addRefreshingPatient,
  removeRefreshingPatient
} from './refreshingEntities'

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
  ignoreEcho?: boolean,
  force?: boolean,
}

const reloadAfterMutationOptions: MergeSubscriptionOptions = {
  conflictStrategy: 'server-wins',
  ignoreEcho: true,
  force: true,
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
  if (payloadClientMutationId) {
    return payloadClientMutationId === recent.clientMutationId
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
  if (!options.ignoreEcho && isLikelyEcho('Task', taskId, payload.clientMutationId)) return

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
    !options.force &&
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
  if (!options.ignoreEcho && isLikelyEcho('Patient', patientId, payload.clientMutationId)) return

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
    !options.force &&
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

export function taskListRefetchDocuments() {
  return [
    getParsedDocument(GetTasksDocument),
    getParsedDocument(GetPatientsDocument),
    getParsedDocument(GetPatientDocument),
    getParsedDocument(GetGlobalDataDocument),
  ]
}

export function patientListRefetchDocuments() {
  return [
    getParsedDocument(GetPatientsDocument),
    getParsedDocument(GetTasksDocument),
    getParsedDocument(GetPatientDocument),
    getParsedDocument(GetGlobalDataDocument),
  ]
}

function getDocumentOperationName(document: DocumentNode): string | null {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition' && definition.name?.value) {
      return definition.name.value
    }
  }
  return null
}

function activeQueryNames(client: ApolloClient): Set<string> | null {
  const getter = (client as { getObservableQueries?: unknown }).getObservableQueries
  if (typeof getter !== 'function') return null
  const names = new Set<string>()
  for (const observable of client.getObservableQueries('active')) {
    if (observable.queryName) names.add(observable.queryName)
  }
  return names
}

export function refetchActiveDocuments(
  client: ApolloClient,
  documents: DocumentNode[]
): Promise<unknown> {
  const active = activeQueryNames(client)
  const include = active === null
    ? documents
    : documents.filter((document) => {
      const name = getDocumentOperationName(document)
      return name !== null && active.has(name)
    })
  if (include.length === 0) return Promise.resolve()
  try {
    return Promise.resolve(client.refetchQueries({ include }))
  } catch {
    return Promise.resolve()
  }
}

export async function reloadEntityAfterMutation(
  client: ApolloClient,
  entityType: 'Task' | 'Patient',
  entityId: string
): Promise<void> {
  if (entityType === 'Task') {
    addRefreshingTask(entityId)
    try {
      await mergeTaskUpdatedIntoCache(
        client,
        entityId,
        { taskId: entityId },
        reloadAfterMutationOptions
      )
    } catch {
      void 0
    } finally {
      removeRefreshingTask(entityId)
    }
    void refetchActiveDocuments(client, taskListRefetchDocuments())
    return
  }

  addRefreshingPatient(entityId)
  try {
    await mergePatientUpdatedIntoCache(
      client,
      entityId,
      { patientId: entityId },
      reloadAfterMutationOptions
    )
  } catch {
    void 0
  } finally {
    removeRefreshingPatient(entityId)
  }
  void refetchActiveDocuments(client, patientListRefetchDocuments())
}
