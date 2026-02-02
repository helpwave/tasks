import { useEffect, useRef } from 'react'
import { parse } from 'graphql'
import type { ApolloClient } from '@apollo/client/core'
import {
  mergeTaskUpdatedIntoCache,
  mergePatientUpdatedIntoCache,
  shouldSkipMergeTask,
  shouldSkipMergePatient,
  type MergeSubscriptionOptions
} from './handler'
import {
  addRefreshingTask,
  removeRefreshingTask,
  addRefreshingPatient,
  removeRefreshingPatient
} from './refreshingEntities'
import { GetGlobalDataDocument } from '@/api/gql/generated'
import { getParsedDocument } from '../hooks/queryHelpers'

const TASK_UPDATED = `
  subscription TaskUpdated($taskId: ID, $rootLocationIds: [ID!]) {
    taskUpdated(taskId: $taskId, rootLocationIds: $rootLocationIds)
  }
`

const PATIENT_UPDATED = `
  subscription PatientUpdated($patientId: ID, $rootLocationIds: [ID!]) {
    patientUpdated(patientId: $patientId, rootLocationIds: $rootLocationIds)
  }
`

const PATIENT_CREATED = `
  subscription PatientCreated($rootLocationIds: [ID!]) {
    patientCreated(rootLocationIds: $rootLocationIds)
  }
`

function extractIdFromPayload(message: unknown): string | null {
  if (typeof message === 'string') return message
  if (message && typeof message === 'object') {
    if ('data' in message && message.data && typeof message.data === 'object') {
      const data = message.data as Record<string, unknown>
      const firstKey = Object.keys(data)[0]
      if (firstKey && typeof data[firstKey] === 'string') {
        return data[firstKey] as string
      }
    }
    if ('payload' in message && typeof (message as { payload?: unknown }).payload === 'string') {
      return (message as { payload: string }).payload
    }
  }
  return null
}

export function useApolloGlobalSubscriptions(
  client: ApolloClient | null,
  _selectedRootLocationIds: string[] | undefined,
  options: MergeSubscriptionOptions
): void {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!client) return

    const taskUpdatedDoc = parse(TASK_UPDATED)
    const taskSub = client
      .subscribe({
        query: taskUpdatedDoc,
        variables: {},
      })
      .subscribe({
        next: async (result: unknown) => {
          const value = result as { data?: Record<string, unknown> }
          const payload = value.data
          const taskId =
            payload?.['taskUpdated'] ?? extractIdFromPayload(result)
          if (typeof taskId !== 'string') return
          const payloadObj = typeof payload === 'object' && payload !== null ? { taskId, ...payload } : { taskId }
          if (shouldSkipMergeTask(taskId, payloadObj, optionsRef.current)) return
          addRefreshingTask(taskId)
          try {
            await mergeTaskUpdatedIntoCache(client, taskId, payloadObj, optionsRef.current).catch(
              () => {}
            )
            client.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
          } finally {
            removeRefreshingTask(taskId)
          }
        },
        error: () => {},
      })

    const patientUpdatedDoc = parse(PATIENT_UPDATED)
    const patientSub = client
      .subscribe({
        query: patientUpdatedDoc,
        variables: {},
      })
      .subscribe({
        next: async (result: unknown) => {
          const value = result as { data?: Record<string, unknown> }
          const payload = value.data
          const patientId =
            payload?.['patientUpdated'] ?? extractIdFromPayload(result)
          if (typeof patientId !== 'string') return
          const payloadObj = typeof payload === 'object' && payload !== null ? { patientId, ...payload } : { patientId }
          if (shouldSkipMergePatient(patientId, payloadObj, optionsRef.current)) return
          addRefreshingPatient(patientId)
          try {
            await mergePatientUpdatedIntoCache(client, patientId, payloadObj, optionsRef.current).catch(
              () => {}
            )
            client.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
          } finally {
            removeRefreshingPatient(patientId)
          }
        },
        error: () => {},
      })

    const patientCreatedDoc = parse(PATIENT_CREATED)
    const patientCreatedSub = client
      .subscribe({
        query: patientCreatedDoc,
        variables: {},
      })
      .subscribe({
        next: async (result: unknown) => {
          const value = result as { data?: Record<string, unknown> }
          const payload = value.data
          const patientId =
            payload?.['patientCreated'] ?? extractIdFromPayload(result)
          if (typeof patientId !== 'string') return
          const payloadObj = typeof payload === 'object' && payload !== null ? { patientId, ...payload } : { patientId }
          if (shouldSkipMergePatient(patientId, payloadObj, optionsRef.current)) return
          addRefreshingPatient(patientId)
          try {
            await mergePatientUpdatedIntoCache(client, patientId, payloadObj, optionsRef.current).catch(
              () => {}
            )
            client.refetchQueries({ include: [getParsedDocument(GetGlobalDataDocument)] })
          } finally {
            removeRefreshingPatient(patientId)
          }
        },
        error: () => {},
      })

    return () => {
      taskSub.unsubscribe()
      patientSub.unsubscribe()
      patientCreatedSub.unsubscribe()
    }
  }, [client])
}
