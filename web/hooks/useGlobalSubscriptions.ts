import React, { useEffect, useRef } from 'react'
import { subscriptionClient, type SubscriptionObserver } from '@/api/gql/subscriptionClient'
import { showNotification, createNotificationForPatientCreated, createNotificationForPatientUpdated, createNotificationForTaskCreated } from '@/utils/pushNotifications'
import { apolloClient } from '@/utils/apolloClient'
import { GET_TASK } from '@/api/queries/tasks'
import { GET_PATIENT } from '@/api/queries/patients'

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
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'TaskType', id: taskId }) })
      apolloClient.cache.gc()
    }

    const handleTaskCreated = async (taskId: string) => {
      apolloClient.cache.evict({ fieldName: 'tasks' })
      apolloClient.cache.gc()

      try {
        const { data: taskData } = await apolloClient.query({
          query: GET_TASK,
          variables: { id: taskId },
          fetchPolicy: 'network-only',
        })
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
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'TaskType', id: taskId }) })
      apolloClient.cache.gc()
    }

    const handlePatientUpdated = async (patientId: string) => {
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'PatientType', id: patientId }) })
      apolloClient.cache.gc()

      if (document.hidden) {
        try {
          const { data: patientData } = await apolloClient.query({
            query: GET_PATIENT,
            variables: { id: patientId },
            fetchPolicy: 'network-only',
          })
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
      apolloClient.cache.evict({ fieldName: 'patients' })
      apolloClient.cache.gc()

      try {
        const { data: patientData } = await apolloClient.query({
          query: GET_PATIENT,
          variables: { id: patientId },
          fetchPolicy: 'network-only',
        })
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
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'PatientType', id: patientId }) })
      apolloClient.cache.gc()
    }

    const handleLocationNodeUpdated = (locationId: string) => {
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'LocationNodeType', id: locationId }) })
      apolloClient.cache.evict({ fieldName: 'locationNodes' })
      apolloClient.cache.gc()
    }

    const handleLocationNodeCreated = (_locationId: string) => {
      apolloClient.cache.evict({ fieldName: 'locationNodes' })
      apolloClient.cache.gc()
    }

    const handleLocationNodeDeleted = (locationId: string) => {
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'LocationNodeType', id: locationId }) })
      apolloClient.cache.evict({ fieldName: 'locationNodes' })
      apolloClient.cache.gc()
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

