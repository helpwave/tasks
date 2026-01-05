import React, { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscriptionClient, type SubscriptionObserver } from '@/api/gql/subscriptionClient'
import { showNotification, createNotificationForPatientCreated, createNotificationForPatientUpdated, createNotificationForTaskCreated } from '@/utils/pushNotifications'
import { fetcher } from '@/api/gql/fetcher'
import { GetTaskDocument, GetPatientDocument, type GetTaskQuery, type GetPatientQuery } from '@/api/gql/generated'

const TASK_UPDATED_SUBSCRIPTION = `
  subscription TaskUpdated($taskId: ID, $rootLocationIds: [ID!]) {
    taskUpdated(taskId: $taskId, rootLocationIds: $rootLocationIds)
  }
`

const TASK_CREATED_SUBSCRIPTION = `
  subscription TaskCreated($rootLocationIds: [ID!]) {
    taskCreated(rootLocationIds: $rootLocationIds)
  }
`

const TASK_DELETED_SUBSCRIPTION = `
  subscription TaskDeleted($rootLocationIds: [ID!]) {
    taskDeleted(rootLocationIds: $rootLocationIds)
  }
`

const PATIENT_UPDATED_SUBSCRIPTION = `
  subscription PatientUpdated($patientId: ID, $rootLocationIds: [ID!]) {
    patientUpdated(patientId: $patientId, rootLocationIds: $rootLocationIds)
  }
`

const PATIENT_CREATED_SUBSCRIPTION = `
  subscription PatientCreated($rootLocationIds: [ID!]) {
    patientCreated(rootLocationIds: $rootLocationIds)
  }
`

const PATIENT_STATE_CHANGED_SUBSCRIPTION = `
  subscription PatientStateChanged($patientId: ID, $rootLocationIds: [ID!]) {
    patientStateChanged(patientId: $patientId, rootLocationIds: $rootLocationIds)
  }
`

const LOCATION_NODE_UPDATED_SUBSCRIPTION = `
  subscription LocationNodeUpdated($locationId: ID) {
    locationNodeUpdated(locationId: $locationId)
  }
`

const LOCATION_NODE_CREATED_SUBSCRIPTION = `
  subscription LocationNodeCreated {
    locationNodeCreated
  }
`

const LOCATION_NODE_DELETED_SUBSCRIPTION = `
  subscription LocationNodeDeleted {
    locationNodeDeleted
  }
`

export function useGlobalSubscriptions(selectedRootLocationIds?: string[]) {
  const queryClient = useQueryClient()
  const unsubscribeRefs = useRef<Array<() => void>>([])
  const prevLocationIdsRef = useRef<string>('')

  const locationKey = selectedRootLocationIds?.sort().join(',') || ''

  const shouldInvalidateForLocation = React.useCallback((queryKey: unknown[]): boolean => {
    if (!selectedRootLocationIds || selectedRootLocationIds.length === 0) {
      return true
    }

    const queryKeyStr = JSON.stringify(queryKey)
    if (queryKeyStr.includes('GetGlobalData') || queryKeyStr.includes('GetOverviewData')) {
      return true
    }

    if (queryKeyStr.includes('GetPatients') || queryKeyStr.includes('GetTasks')) {
      const queryKeyObj = queryKey[1] as { rootLocationIds?: string[] } | undefined
      if (queryKeyObj?.rootLocationIds) {
        const queryRootIds = queryKeyObj.rootLocationIds.sort().join(',')
        const selectedRootIds = selectedRootLocationIds.sort().join(',')
        return queryRootIds === selectedRootIds
      }
      return true
    }

    return true
  }, [selectedRootLocationIds])

  useEffect(() => {
    if (prevLocationIdsRef.current === locationKey) {
      return
    }

    prevLocationIdsRef.current = locationKey

    const unsubscribes: Array<() => void> = []
    const variables = selectedRootLocationIds && selectedRootLocationIds.length > 0
      ? { rootLocationIds: selectedRootLocationIds }
      : undefined

    const handleTaskUpdated = (taskId: string) => {
      queryClient.invalidateQueries({ queryKey: ['GetTask', { id: taskId }], type: 'active' })
      queryClient.invalidateQueries({
        queryKey: ['GetTasks'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetPatients'], type: 'active' })
    }

    const handleTaskCreated = async (taskId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['GetTasks'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetPatients'], type: 'active' })

      try {
        const taskData = await fetcher<GetTaskQuery, { id: string }>(GetTaskDocument, { id: taskId })()
        if (taskData?.task) {
          const notification = createNotificationForTaskCreated(taskData.task.title, taskId)
          const registration = await navigator.serviceWorker.ready.catch(() => null)
          await showNotification(registration, notification.title, notification)
        }
      } catch {
        void 0
      }
    }

    const handleTaskDeleted = (taskId: string) => {
      queryClient.removeQueries({ queryKey: ['GetTask', { id: taskId }] })
      queryClient.invalidateQueries({
        queryKey: ['GetTasks'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetPatients'], type: 'active' })
    }

    const handlePatientUpdated = async (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: ['GetPatient', { id: patientId }], type: 'active' })
      queryClient.invalidateQueries({
        queryKey: ['GetPatients'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })

      if (document.hidden) {
        try {
          const patientData = await fetcher<GetPatientQuery, { id: string }>(GetPatientDocument, { id: patientId })()
          if (patientData?.patient) {
            const patientName = patientData.patient.firstname && patientData.patient.lastname
              ? `${patientData.patient.firstname} ${patientData.patient.lastname}`.trim()
              : patientData.patient.firstname || patientData.patient.lastname || 'Unknown Patient'
            const notification = createNotificationForPatientUpdated(patientName, patientId)
            const registration = await navigator.serviceWorker.ready.catch(() => null)
            await showNotification(registration, notification.title, notification)
          }
        } catch {
          void 0
        }
      }
    }

    const handlePatientCreated = async (patientId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['GetPatients'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })

      try {
        const patientData = await fetcher<GetPatientQuery, { id: string }>(GetPatientDocument, { id: patientId })()
        if (patientData?.patient) {
          const patientName = patientData.patient.firstname && patientData.patient.lastname
            ? `${patientData.patient.firstname} ${patientData.patient.lastname}`.trim()
            : patientData.patient.firstname || patientData.patient.lastname || 'Unknown Patient'
          const notification = createNotificationForPatientCreated(patientName, patientId)
          const registration = await navigator.serviceWorker.ready.catch(() => null)
          await showNotification(registration, notification.title, notification)
        }
      } catch {
        void 0
      }
    }

    const handlePatientStateChanged = (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: ['GetPatient', { id: patientId }], type: 'active' })
      queryClient.invalidateQueries({
        queryKey: ['GetPatients'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetOverviewData'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
    }

    const handleLocationNodeUpdated = (locationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['GetLocationNode', { id: locationId }], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetLocations'], type: 'active' })
      queryClient.invalidateQueries({
        queryKey: ['GetPatients'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: ['GetTasks'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
    }

    const handleLocationNodeCreated = (_locationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['GetLocations'], type: 'active' })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
    }

    const handleLocationNodeDeleted = (locationId: string) => {
      queryClient.removeQueries({ queryKey: ['GetLocationNode', { id: locationId }] })
      queryClient.invalidateQueries({ queryKey: ['GetLocations'], type: 'active' })
      queryClient.invalidateQueries({
        queryKey: ['GetPatients'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: ['GetTasks'],
        predicate: (query) => shouldInvalidateForLocation(query.queryKey as unknown[]),
        type: 'active'
      })
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'], type: 'active' })
    }

    const createObserver = (handler: (id: string) => void): SubscriptionObserver => ({
      next: (message) => {
        let id: string | null = null

        if (typeof message === 'string') {
          id = message
        } else if (message && typeof message === 'object') {
          if ('data' in message && message.data && typeof message.data === 'object') {
            const data = message.data as Record<string, unknown>
            const firstKey = Object.keys(data)[0]
            if (firstKey && typeof data[firstKey] === 'string') {
              id = data[firstKey] as string
            }
          } else if ('payload' in message && typeof message.payload === 'string') {
            id = message.payload
          }
        }

        if (id) {
          handler(id)
        }
      },
      error: (_error) => {

      },
      complete: () => {
      }
    })

    subscriptionClient.subscribe(TASK_UPDATED_SUBSCRIPTION, variables, createObserver(handleTaskUpdated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(TASK_CREATED_SUBSCRIPTION, variables, createObserver(handleTaskCreated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(TASK_DELETED_SUBSCRIPTION, variables, createObserver(handleTaskDeleted))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(PATIENT_UPDATED_SUBSCRIPTION, variables, createObserver(handlePatientUpdated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(PATIENT_CREATED_SUBSCRIPTION, variables, createObserver(handlePatientCreated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(PATIENT_STATE_CHANGED_SUBSCRIPTION, variables, createObserver(handlePatientStateChanged))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(LOCATION_NODE_UPDATED_SUBSCRIPTION, undefined, createObserver(handleLocationNodeUpdated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(LOCATION_NODE_CREATED_SUBSCRIPTION, undefined, createObserver(handleLocationNodeCreated))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    subscriptionClient.subscribe(LOCATION_NODE_DELETED_SUBSCRIPTION, undefined, createObserver(handleLocationNodeDeleted))
      .then(unsubscribe => unsubscribes.push(unsubscribe))
      .catch(() => {})

    unsubscribeRefs.current = unsubscribes

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
      unsubscribeRefs.current = []
    }
  }, [queryClient, locationKey, shouldInvalidateForLocation, selectedRootLocationIds])
}

