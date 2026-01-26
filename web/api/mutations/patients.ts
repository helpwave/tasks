import { gql, useMutation } from '@apollo/client/react'
import { GET_PATIENT, GET_PATIENTS } from '../queries/patients'
import { GET_GLOBAL_DATA } from '../queries/global'
import { useTasksContext } from '@/hooks/useTasksContext'
import { apolloClient } from '@/utils/apolloClient'

export const CREATE_PATIENT = gql`
  mutation CreatePatient($data: CreatePatientInput!) {
    createPatient(data: $data) {
      id
      name
      firstname
      lastname
      birthdate
      sex
      state
      assignedLocation {
        id
        title
      }
      assignedLocations {
        id
        title
      }
      clinic {
        id
        title
        kind
      }
      position {
        id
        title
        kind
      }
      teams {
        id
        title
        kind
      }
    }
  }
`

export const UPDATE_PATIENT = gql`
  mutation UpdatePatient($id: ID!, $data: UpdatePatientInput!) {
    updatePatient(id: $id, data: $data) {
      id
      name
      firstname
      lastname
      birthdate
      sex
      state
      checksum
      assignedLocation {
        id
        title
      }
      assignedLocations {
        id
        title
      }
      clinic {
        id
        title
        kind
      }
      position {
        id
        title
        kind
      }
      teams {
        id
        title
        kind
      }
      properties {
        definition {
          id
          name
          description
          fieldType
          isActive
          allowedEntities
          options
        }
        textValue
        numberValue
        booleanValue
        dateValue
        dateTimeValue
        selectValue
        multiSelectValues
      }
    }
  }
`

export const DELETE_PATIENT = gql`
  mutation DeletePatient($id: ID!) {
    deletePatient(id: $id)
  }
`

export const ADMIT_PATIENT = gql`
  mutation AdmitPatient($id: ID!) {
    admitPatient(id: $id) {
      id
      state
    }
  }
`

export const DISCHARGE_PATIENT = gql`
  mutation DischargePatient($id: ID!) {
    dischargePatient(id: $id) {
      id
      state
    }
  }
`

export const WAIT_PATIENT = gql`
  mutation WaitPatient($id: ID!) {
    waitPatient(id: $id) {
      id
      state
    }
  }
`

export const MARK_PATIENT_DEAD = gql`
  mutation MarkPatientDead($id: ID!) {
    markPatientDead(id: $id) {
      id
      state
    }
  }
`

export interface CreatePatientVariables {
  data: {
    firstname: string
    lastname: string
    birthdate: string
    sex: string
    clinicId: string
    state?: string | null
    assignedLocationId?: string | null
    assignedLocationIds?: Array<string> | null
    positionId?: string | null
    teamIds?: Array<string> | null
    description?: string | null
    properties?: Array<{
      definitionId: string
      textValue?: string | null
      numberValue?: number | null
      booleanValue?: boolean | null
      dateValue?: string | null
      dateTimeValue?: string | null
      selectValue?: string | null
      multiSelectValues?: Array<string> | null
    }> | null
  }
}

export interface UpdatePatientVariables {
  id: string
  data: {
    firstname?: string | null
    lastname?: string | null
    birthdate?: string | null
    sex?: string | null
    clinicId?: string | null
    positionId?: string | null
    teamIds?: Array<string> | null
    description?: string | null
    properties?: Array<{
      definitionId: string
      textValue?: string | null
      numberValue?: number | null
      booleanValue?: boolean | null
      dateValue?: string | null
      dateTimeValue?: string | null
      selectValue?: string | null
      multiSelectValues?: Array<string> | null
    }> | null
  }
}

export interface DeletePatientVariables {
  id: string
}

export interface AdmitPatientVariables {
  id: string
}

export interface DischargePatientVariables {
  id: string
}

export interface WaitPatientVariables {
  id: string
}

export interface MarkPatientDeadVariables {
  id: string
}

export function useCreatePatientMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(CREATE_PATIENT, {
    optimisticResponse: (variables) => ({
      createPatient: {
        __typename: 'PatientType',
        id: `temp-${Date.now()}`,
        name: `${variables.data.firstname} ${variables.data.lastname}`.trim(),
        firstname: variables.data.firstname,
        lastname: variables.data.lastname,
        birthdate: variables.data.birthdate,
        sex: variables.data.sex,
        state: variables.data.state || 'ADMITTED',
        assignedLocation: null,
        assignedLocations: [],
        clinic: null,
        position: null,
        teams: [],
      },
    }),
    update: (cache, { data }) => {
      if (!data?.createPatient) return

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData) {
        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: [...(globalData.patients?.data || []), data.createPatient],
            },
            waitingPatients: variables.data.state === 'WAIT'
              ? {
                  ...globalData.waitingPatients,
                  data: [...(globalData.waitingPatients?.data || []), data.createPatient],
                }
              : globalData.waitingPatients,
          },
        })
      }
    },
  })
}

export function useUpdatePatientMutation(patientId: string) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(UPDATE_PATIENT, {
    optimisticResponse: (variables) => {
      const cache = apolloClient.cache
      const existingPatient = cache.readQuery({
        query: GET_PATIENT,
        variables: { id: patientId },
      })?.patient

      if (!existingPatient) return undefined

      return {
        updatePatient: {
          __typename: 'PatientType',
          id: patientId,
          ...existingPatient,
          ...variables.data,
          name: variables.data.firstname && variables.data.lastname
            ? `${variables.data.firstname} ${variables.data.lastname}`.trim()
            : existingPatient.name,
        },
      }
    },
    update: (cache, { data }) => {
      if (!data?.updatePatient) return

      cache.modify({
        id: cache.identify({ __typename: 'PatientType', id: data.updatePatient.id }),
        fields: {
          firstname: () => data.updatePatient.firstname,
          lastname: () => data.updatePatient.lastname,
          name: () => data.updatePatient.name,
          birthdate: () => data.updatePatient.birthdate,
          sex: () => data.updatePatient.sex,
          state: () => data.updatePatient.state,
          clinic: () => data.updatePatient.clinic,
          position: () => data.updatePatient.position,
          teams: () => data.updatePatient.teams,
          properties: () => data.updatePatient.properties,
        },
      })
    },
  })
}

export function useDeletePatientMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(DELETE_PATIENT, {
    update: (cache, _, { variables }) => {
      if (!variables?.id) return

      cache.evict({ id: cache.identify({ __typename: 'PatientType', id: variables.id }) })
      cache.gc()

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData?.patients?.data) {
        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: globalData.patients.data.filter(p => p.id !== variables.id),
            },
            waitingPatients: {
              ...globalData.waitingPatients,
              data: globalData.waitingPatients.data.filter(p => p.id !== variables.id),
            },
          },
        })
      }
    },
  })
}

export function useAdmitPatientMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(ADMIT_PATIENT, {
    optimisticResponse: (variables) => ({
      admitPatient: {
        __typename: 'PatientType',
        id: variables.id,
        state: 'ADMITTED',
      },
    }),
    update: (cache, { data }) => {
      if (!data?.admitPatient) return

      const patientId = data.admitPatient.id

      cache.modify({
        id: cache.identify({ __typename: 'PatientType', id: patientId }),
        fields: {
          state: () => 'ADMITTED',
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData) {
        const existingPatient = globalData.patients?.data?.find(p => p.id === patientId)
        const updatedPatient = existingPatient
          ? { ...existingPatient, state: 'ADMITTED' }
          : { __typename: 'PatientType' as const, id: patientId, state: 'ADMITTED', assignedLocation: null }

        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: existingPatient
                ? globalData.patients.data.map(p => p.id === patientId ? updatedPatient : p)
                : [...(globalData.patients?.data || []), updatedPatient],
            },
            waitingPatients: {
              ...globalData.waitingPatients,
              data: globalData.waitingPatients.data.filter(p => p.id !== patientId),
            },
          },
        })
      }
    },
  })
}

export function useDischargePatientMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(DISCHARGE_PATIENT, {
    optimisticResponse: (variables) => ({
      dischargePatient: {
        __typename: 'PatientType',
        id: variables.id,
        state: 'DISCHARGED',
      },
    }),
    update: (cache, { data }) => {
      if (!data?.dischargePatient) return

      const patientId = data.dischargePatient.id

      cache.modify({
        id: cache.identify({ __typename: 'PatientType', id: patientId }),
        fields: {
          state: () => 'DISCHARGED',
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData) {
        const existingPatient = globalData.patients?.data?.find(p => p.id === patientId)
        const updatedPatient = existingPatient
          ? { ...existingPatient, state: 'DISCHARGED' }
          : { __typename: 'PatientType' as const, id: patientId, state: 'DISCHARGED', assignedLocation: null }

        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: existingPatient
                ? globalData.patients.data.map(p => p.id === patientId ? updatedPatient : p)
                : [...(globalData.patients?.data || []), updatedPatient],
            },
            waitingPatients: {
              ...globalData.waitingPatients,
              data: globalData.waitingPatients.data.filter(p => p.id !== patientId),
            },
          },
        })
      }
    },
  })
}

export function useWaitPatientMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(WAIT_PATIENT, {
    optimisticResponse: (variables) => ({
      waitPatient: {
        __typename: 'PatientType',
        id: variables.id,
        state: 'WAIT',
      },
    }),
    update: (cache, { data }) => {
      if (!data?.waitPatient) return

      const patientId = data.waitPatient.id

      cache.modify({
        id: cache.identify({ __typename: 'PatientType', id: patientId }),
        fields: {
          state: () => 'WAIT',
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData) {
        const existingPatient = globalData.patients?.data?.find(p => p.id === patientId)
        const isAlreadyWaiting = globalData.waitingPatients?.data?.some(p => p.id === patientId)
        const updatedPatient = existingPatient
          ? { ...existingPatient, state: 'WAIT' }
          : { __typename: 'PatientType' as const, id: patientId, state: 'WAIT', assignedLocation: null }

        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: existingPatient
                ? globalData.patients.data.map(p => p.id === patientId ? updatedPatient : p)
                : [...(globalData.patients?.data || []), updatedPatient],
            },
            waitingPatients: {
              ...globalData.waitingPatients,
              data: isAlreadyWaiting
                ? globalData.waitingPatients.data
                : [...(globalData.waitingPatients?.data || []), updatedPatient],
            },
          },
        })
      }
    },
  })
}

export function useMarkPatientDeadMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(MARK_PATIENT_DEAD, {
    optimisticResponse: (variables) => ({
      markPatientDead: {
        __typename: 'PatientType',
        id: variables.id,
        state: 'DEAD',
      },
    }),
    update: (cache, { data }) => {
      if (!data?.markPatientDead) return

      const patientId = data.markPatientDead.id

      cache.modify({
        id: cache.identify({ __typename: 'PatientType', id: patientId }),
        fields: {
          state: () => 'DEAD',
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData) {
        const existingPatient = globalData.patients?.data?.find(p => p.id === patientId)
        const updatedPatient = existingPatient
          ? { ...existingPatient, state: 'DEAD' }
          : { __typename: 'PatientType' as const, id: patientId, state: 'DEAD', assignedLocation: null }

        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            patients: {
              ...globalData.patients,
              data: existingPatient
                ? globalData.patients.data.map(p => p.id === patientId ? updatedPatient : p)
                : [...(globalData.patients?.data || []), updatedPatient],
            },
            waitingPatients: {
              ...globalData.waitingPatients,
              data: globalData.waitingPatients.data.filter(p => p.id !== patientId),
            },
          },
        })
      }
    },
  })
}
