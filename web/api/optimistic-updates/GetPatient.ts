import { useSafeMutation } from '@/hooks/useSafeMutation'
import { fetcher } from '@/api/gql/fetcher'
import { CompleteTaskDocument, ReopenTaskDocument, CreatePatientDocument, AdmitPatientDocument, DischargePatientDocument, DeletePatientDocument, WaitPatientDocument, MarkPatientDeadDocument, UpdatePatientDocument, type CompleteTaskMutation, type CompleteTaskMutationVariables, type ReopenTaskMutation, type ReopenTaskMutationVariables, type CreatePatientMutation, type CreatePatientMutationVariables, type AdmitPatientMutation, type DischargePatientMutation, type DeletePatientMutation, type DeletePatientMutationVariables, type WaitPatientMutation, type MarkPatientDeadMutation, type UpdatePatientMutation, type UpdatePatientMutationVariables, type UpdatePatientInput, PatientState, type FieldType } from '@/api/gql/generated'
import type { GetPatientQuery, GetPatientsQuery, GetGlobalDataQuery } from '@/api/gql/generated'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useQueryClient } from '@tanstack/react-query'

interface UseOptimisticCompleteTaskMutationParams {
  id: string,
  onSuccess?: (data: CompleteTaskMutation, variables: CompleteTaskMutationVariables) => void,
  onError?: (error: Error, variables: CompleteTaskMutationVariables) => void,
}

export function useOptimisticCompleteTaskMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticCompleteTaskMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<CompleteTaskMutation, CompleteTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<CompleteTaskMutation, CompleteTaskMutationVariables>(CompleteTaskDocument, variables)()
    },
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              tasks: data.patient.tasks?.map(task => (
                task.id === variables.id ? { ...task, done: true } : task
              )) || []
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(patient => {
                if (patient.id === id && patient.tasks) {
                  return {
                    ...patient,
                    tasks: patient.tasks.map(task => task.id === variables.id ? { ...task, done: true } : task)
                  }
                }
                return patient
              })
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.me?.tasks) return oldData
          return {
            ...data,
            me: data.me ? {
              ...data.me,
              tasks: data.me.tasks.map(task => task.id === variables.id ? { ...task, done: true } : task)
            } : null
          }
        }
      },
    ],
    affectedQueryKeys: [['GetPatient', { id }], ['GetTasks'], ['GetPatients'], ['GetOverviewData'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticReopenTaskMutationParams {
  id: string,
  onSuccess?: (data: ReopenTaskMutation, variables: ReopenTaskMutationVariables) => void,
  onError?: (error: Error, variables: ReopenTaskMutationVariables) => void,
}

export function useOptimisticReopenTaskMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticReopenTaskMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<ReopenTaskMutation, ReopenTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<ReopenTaskMutation, ReopenTaskMutationVariables>(ReopenTaskDocument, variables)()
    },
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              tasks: data.patient.tasks?.map(task => (
                task.id === variables.id ? { ...task, done: false } : task
              )) || []
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(patient => {
                if (patient.id === id && patient.tasks) {
                  return {
                    ...patient,
                    tasks: patient.tasks.map(task => task.id === variables.id ? { ...task, done: false } : task)
                  }
                }
                return patient
              })
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.me?.tasks) return oldData
          return {
            ...data,
            me: data.me ? {
              ...data.me,
              tasks: data.me.tasks.map(task => task.id === variables.id ? { ...task, done: false } : task)
            } : null
          }
        }
      },
    ],
    affectedQueryKeys: [['GetPatient', { id }], ['GetTasks'], ['GetPatients'], ['GetOverviewData'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticCreatePatientMutationParams {
  onSuccess?: (data: CreatePatientMutation, variables: CreatePatientMutationVariables) => void,
  onError?: (error: Error, variables: CreatePatientMutationVariables) => void,
  onMutate?: () => void,
  onSettled?: () => void,
}

export function useOptimisticCreatePatientMutation({
  onMutate,
  onSettled,
  onSuccess,
  onError,
}: UseOptimisticCreatePatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<CreatePatientMutation, CreatePatientMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<CreatePatientMutation, CreatePatientMutationVariables>(CreatePatientDocument, variables)()
    },
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const newPatient = {
            __typename: 'PatientType' as const,
            id: `temp-${Date.now()}`,
            name: `${variables.data.firstname} ${variables.data.lastname}`.trim(),
            firstname: variables.data.firstname,
            lastname: variables.data.lastname,
            birthdate: variables.data.birthdate,
            sex: variables.data.sex,
            state: variables.data.state || PatientState.Admitted,
            assignedLocation: null,
            assignedLocations: [],
            clinic: null,
            position: null,
            teams: [],
            properties: [],
            tasks: [],
          }
          return {
            ...data,
            patients: {
              ...data.patients,
              data: [...(data.patients?.data || []), newPatient],
            },
            waitingPatients: variables.data.state === PatientState.Wait
              ? {
                  ...data.waitingPatients,
                  data: [...(data.waitingPatients?.data || []), newPatient],
                }
              : data.waitingPatients,
          }
        }
      }
    ],
    affectedQueryKeys: [['GetGlobalData'], ['GetPatients'], ['GetOverviewData']],
    onSuccess,
    onError,
    onMutate,
    onSettled,
  })
}

interface UseOptimisticAdmitPatientMutationParams {
  id: string,
  onSuccess?: (data: AdmitPatientMutation, variables: { id: string }) => void,
  onError?: (error: Error, variables: { id: string }) => void,
}

export function useOptimisticAdmitPatientMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticAdmitPatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<AdmitPatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<AdmitPatientMutation, { id: string }>(AdmitPatientDocument, variables)()
    },
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              state: PatientState.Admitted
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(p =>
                p.id === id ? { ...p, state: PatientState.Admitted } : p)
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          const existingPatient = data.patients.data.find(p => p.id === id)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Admitted }
            : { __typename: 'PatientType' as const, id, state: PatientState.Admitted, assignedLocation: null }
          return {
            ...data,
            patients: {
              ...data.patients,
              data: existingPatient
                ? data.patients.data.map(p => p.id === id ? updatedPatient : p)
                : [...data.patients.data, updatedPatient],
            },
            waitingPatients: {
              ...data.waitingPatients,
              data: data.waitingPatients.data.filter(p => p.id !== id),
            }
          }
        }
      }
    ],
    affectedQueryKeys: [['GetPatients'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticDischargePatientMutationParams {
  id: string,
  onSuccess?: (data: DischargePatientMutation, variables: { id: string }) => void,
  onError?: (error: Error, variables: { id: string }) => void,
}

export function useOptimisticDischargePatientMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticDischargePatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<DischargePatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<DischargePatientMutation, { id: string }>(DischargePatientDocument, variables)()
    },
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              state: PatientState.Discharged
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(p =>
                p.id === id ? { ...p, state: PatientState.Discharged } : p)
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          const existingPatient = data.patients.data.find(p => p.id === id)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Discharged }
            : { __typename: 'PatientType' as const, id, state: PatientState.Discharged, assignedLocation: null }
          return {
            ...data,
            patients: {
              ...data.patients,
              data: existingPatient
                ? data.patients.data.map(p => p.id === id ? updatedPatient : p)
                : [...data.patients.data, updatedPatient],
            },
            waitingPatients: {
              ...data.waitingPatients,
              data: data.waitingPatients.data.filter(p => p.id !== id),
            }
          }
        }
      }
    ],
    affectedQueryKeys: [['GetPatients'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticDeletePatientMutationParams {
  onSuccess?: (data: DeletePatientMutation, variables: DeletePatientMutationVariables) => void,
  onError?: (error: Error, variables: DeletePatientMutationVariables) => void,
}

export function useOptimisticDeletePatientMutation({
  onSuccess,
  onError,
}: UseOptimisticDeletePatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<DeletePatientMutation, DeletePatientMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<DeletePatientMutation, DeletePatientMutationVariables>(DeletePatientDocument, variables)()
    },
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: (data.patients.data || []).filter(p => p.id !== variables.id),
            },
            waitingPatients: {
              ...data.waitingPatients,
              data: (data.waitingPatients.data || []).filter(p => p.id !== variables.id),
            },
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.filter(p => p.id !== variables.id),
            }
          }
        }
      },
      {
        queryKey: ['GetPatient', { id: variables.id }],
        updateFn: () => undefined,
      }
    ],
    affectedQueryKeys: [['GetGlobalData'], ['GetPatients'], ['GetOverviewData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticWaitPatientMutationParams {
  id: string,
  onSuccess?: (data: WaitPatientMutation, variables: { id: string }) => void,
  onError?: (error: Error, variables: { id: string }) => void,
}

export function useOptimisticWaitPatientMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticWaitPatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<WaitPatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<WaitPatientMutation, { id: string }>(WaitPatientDocument, variables)()
    },
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              state: PatientState.Wait
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(p =>
                p.id === id ? { ...p, state: PatientState.Wait } : p)
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          const existingPatient = data.patients.data.find(p => p.id === id)
          const isAlreadyWaiting = data.waitingPatients.data.some(p => p.id === id)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Wait }
            : { __typename: 'PatientType' as const, id, state: PatientState.Wait, assignedLocation: null }
          return {
            ...data,
            patients: {
              ...data.patients,
              data: existingPatient
                ? data.patients.data.map(p => p.id === id ? updatedPatient : p)
                : [...data.patients.data, updatedPatient],
            },
            waitingPatients: {
              ...data.waitingPatients,
              data: isAlreadyWaiting
                ? data.waitingPatients.data
                : [...data.waitingPatients.data, updatedPatient]
            }
          }
        }
      }
    ],
    affectedQueryKeys: [['GetPatients'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticMarkPatientDeadMutationParams {
  id: string,
  onSuccess?: (data: MarkPatientDeadMutation, variables: { id: string }) => void,
  onError?: (error: Error, variables: { id: string }) => void,
}

export function useOptimisticMarkPatientDeadMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticMarkPatientDeadMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  return useSafeMutation<MarkPatientDeadMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<MarkPatientDeadMutation, { id: string }>(MarkPatientDeadDocument, variables)()
    },
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          return {
            ...data,
            patient: {
              ...data.patient,
              state: PatientState.Dead
            }
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients?.data) return oldData
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(p =>
                p.id === id ? { ...p, state: PatientState.Dead } : p)
            }
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          const existingPatient = data.patients.data.find(p => p.id === id)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Dead }
            : { __typename: 'PatientType' as const, id, state: PatientState.Dead, assignedLocation: null }
          return {
            ...data,
            patients: {
              ...data.patients,
              data: existingPatient
                ? data.patients.data.map(p => p.id === id ? updatedPatient : p)
                : [...data.patients.data, updatedPatient],
            },
            waitingPatients: {
              ...data.waitingPatients,
              data: data.waitingPatients.data.filter(p => p.id !== id),
            }
          }
        }
      }
    ],
    affectedQueryKeys: [['GetPatients'], ['GetGlobalData']],
    onSuccess,
    onError,
  })
}

interface UseOptimisticUpdatePatientMutationParams {
  id: string,
  onSuccess?: (data: UpdatePatientMutation, variables: UpdatePatientMutationVariables) => void,
  onError?: (error: Error, variables: UpdatePatientMutationVariables) => void,
}

export function useOptimisticUpdatePatientMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticUpdatePatientMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  const queryClient = useQueryClient()

  return useSafeMutation<UpdatePatientMutation, UpdatePatientMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<UpdatePatientMutation, UpdatePatientMutationVariables>(UpdatePatientDocument, variables)()
    },
    optimisticUpdate: (variables) => {
      const updateData = variables.data || {}
      const locationsData = queryClient.getQueryData(['GetLocations']) as { locationNodes?: Array<{ id: string, title: string, kind: string, parentId?: string | null }> } | undefined
      type PatientType = NonNullable<NonNullable<ReturnType<typeof queryClient.getQueryData<GetPatientQuery>>>['patient']>

      const updatePatientInQuery = (patient: PatientType, updateData: Partial<UpdatePatientInput>) => {
        if (!patient) return patient

        const updated: typeof patient = { ...patient }

        if (updateData.firstname !== undefined) {
          updated.firstname = updateData.firstname || ''
        }
        if (updateData.lastname !== undefined) {
          updated.lastname = updateData.lastname || ''
        }
        if (updateData.sex !== undefined && updateData.sex !== null) {
          updated.sex = updateData.sex
        }
        if (updateData.birthdate !== undefined) {
          updated.birthdate = updateData.birthdate || null
        }
        if (updateData.description !== undefined) {
          updated.description = updateData.description
        }
        if (updateData.clinicId !== undefined) {
          if (updateData.clinicId === null || updateData.clinicId === undefined) {
            updated.clinic = null as unknown as typeof patient.clinic
          } else {
            const clinicLocation = locationsData?.locationNodes?.find(loc => loc.id === updateData.clinicId)
            if (clinicLocation) {
              updated.clinic = {
                ...clinicLocation,
                __typename: 'LocationNodeType' as const,
              } as typeof patient.clinic
            }
          }
        }
        if (updateData.positionId !== undefined) {
          if (updateData.positionId === null) {
            updated.position = null as typeof patient.position
          } else {
            const positionLocation = locationsData?.locationNodes?.find(loc => loc.id === updateData.positionId)
            if (positionLocation) {
              updated.position = {
                ...positionLocation,
                __typename: 'LocationNodeType' as const,
              } as typeof patient.position
            }
          }
        }
        if (updateData.teamIds !== undefined) {
          const teamLocations = locationsData?.locationNodes?.filter(loc => updateData.teamIds?.includes(loc.id)) || []
          updated.teams = teamLocations.map(team => ({
            ...team,
            __typename: 'LocationNodeType' as const,
          })) as typeof patient.teams
        }
        if (updateData.properties !== undefined && updateData.properties !== null) {
          const propertyMap = new Map(updateData.properties.map(p => [p.definitionId, p]))
          const existingPropertyIds = new Set(
            patient.properties?.map(p => p.definition?.id).filter(Boolean) || []
          )
          const newPropertyIds = new Set(updateData.properties.map(p => p.definitionId))

          const existingProperties = patient.properties
            ? patient.properties
              .filter(p => newPropertyIds.has(p.definition?.id))
              .map(p => {
                const newProp = propertyMap.get(p.definition?.id)
                if (!newProp) return p
                return {
                  ...p,
                  textValue: newProp.textValue ?? p.textValue,
                  numberValue: newProp.numberValue ?? p.numberValue,
                  booleanValue: newProp.booleanValue ?? p.booleanValue,
                  dateValue: newProp.dateValue ?? p.dateValue,
                  dateTimeValue: newProp.dateTimeValue ?? p.dateTimeValue,
                  selectValue: newProp.selectValue ?? p.selectValue,
                  multiSelectValues: newProp.multiSelectValues ?? p.multiSelectValues,
                }
              })
            : []
          const newProperties = updateData.properties
            .filter(p => !existingPropertyIds.has(p.definitionId))
            .map(p => {
              const existingProperty = patient?.properties?.find(ep => ep.definition?.id === p.definitionId)
              return {
                __typename: 'PropertyValueType' as const,
                definition: existingProperty?.definition || {
                  __typename: 'PropertyDefinitionType' as const,
                  id: p.definitionId,
                  name: '',
                  description: null,
                  fieldType: 'TEXT' as FieldType,
                  isActive: true,
                  allowedEntities: [],
                  options: [],
                },
                textValue: p.textValue,
                numberValue: p.numberValue,
                booleanValue: p.booleanValue,
                dateValue: p.dateValue,
                dateTimeValue: p.dateTimeValue,
                selectValue: p.selectValue,
                multiSelectValues: p.multiSelectValues,
              }
            })
          updated.properties = [...existingProperties, ...newProperties]
        }

        return updated
      }

      const updates: Array<{ queryKey: unknown[], updateFn: (oldData: unknown) => unknown }> = []

      updates.push({
        queryKey: ['GetPatient', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          const updatedPatient = updatePatientInQuery(data.patient, updateData)
          return {
            ...data,
            patient: updatedPatient
          }
        }
      })

      const allGetPatientsQueries = queryClient.getQueryCache().getAll()
        .filter(query => {
          const key = query.queryKey
          return Array.isArray(key) && key[0] === 'GetPatients'
        })

      for (const query of allGetPatientsQueries) {
        updates.push({
          queryKey: [...query.queryKey] as unknown[],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetPatientsQuery | undefined
            if (!data?.patients?.data) return oldData
            const patientIndex = data.patients.data.findIndex(p => p.id === id)
            if (patientIndex === -1) return oldData
            const patient = data.patients.data[patientIndex]
            if (!patient) return oldData
            const updatedPatient = updatePatientInQuery(patient as unknown as PatientType, updateData)
            if (!updatedPatient) return oldData
            const updatedName = updatedPatient.firstname && updatedPatient.lastname
              ? `${updatedPatient.firstname} ${updatedPatient.lastname}`.trim()
              : updatedPatient.firstname || updatedPatient.lastname || patient.name || ''
            const updatedPatientForList: typeof data.patients.data[0] = {
              ...patient,
              firstname: updateData.firstname !== undefined ? (updateData.firstname || '') : patient.firstname,
              lastname: updateData.lastname !== undefined ? (updateData.lastname || '') : patient.lastname,
              name: updatedName,
              sex: updateData.sex !== undefined && updateData.sex !== null ? updateData.sex : patient.sex,
              birthdate: updateData.birthdate !== undefined ? (updateData.birthdate || null) : patient.birthdate,
              ...('description' in patient && { description: updateData.description !== undefined ? updateData.description : (patient as unknown as PatientType & { description?: string | null }).description }),
              clinic: updateData.clinicId !== undefined
                ? (updateData.clinicId
                  ? (locationsData?.locationNodes?.find(loc => loc.id === updateData.clinicId) as typeof patient.clinic || patient.clinic)
                  : (null as unknown as typeof patient.clinic))
                : patient.clinic,
              position: updateData.positionId !== undefined
                ? (updateData.positionId
                  ? (locationsData?.locationNodes?.find(loc => loc.id === updateData.positionId) as typeof patient.position || patient.position)
                  : (null as unknown as typeof patient.position))
                : patient.position,
              teams: updateData.teamIds !== undefined
                ? (locationsData?.locationNodes?.filter(loc => updateData.teamIds?.includes(loc.id)).map(team => team as typeof patient.teams[0]) || patient.teams)
                : patient.teams,
              properties: updateData.properties !== undefined && updateData.properties !== null
                ? (updatedPatient.properties || patient.properties)
                : patient.properties,
            }
            return {
              ...data,
              patients: {
                ...data.patients,
                data: [
                  ...data.patients.data.slice(0, patientIndex),
                  updatedPatientForList,
                  ...data.patients.data.slice(patientIndex + 1)
                ]
              }
            }
          }
        })
      }

      updates.push({
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data?.patients?.data) return oldData
          const existingPatient = data.patients.data.find(p => p.id === id)
          if (!existingPatient) return oldData
          const updatedPatient = updatePatientInQuery(existingPatient as unknown as PatientType, updateData)
          return {
            ...data,
            patients: {
              ...data.patients,
              data: data.patients.data.map(p => p.id === id ? updatedPatient as typeof existingPatient : p)
            }
          }
        }
      })

      updates.push({
        queryKey: ['GetOverviewData'],
        updateFn: (oldData: unknown) => {
          return oldData
        }
      })

      return updates
    },
    affectedQueryKeys: [
      ['GetPatient', { id }],
      ['GetPatients'],
      ['GetOverviewData'],
      ['GetGlobalData']
    ],
    onSuccess,
    onError,
  })
}
