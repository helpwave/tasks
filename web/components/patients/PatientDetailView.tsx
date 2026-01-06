import { useEffect, useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, LocationNodeType, UpdatePatientInput } from '@/api/gql/generated'
import {
  PatientState,
  PropertyEntity,
  Sex,
  type FieldType,
  useGetPatientQuery,
  useGetPropertyDefinitionsQuery
} from '@/api/gql/generated'
import { useAtomicMutation } from '@/hooks/useAtomicMutation'
import { useSafeMutation } from '@/hooks/useSafeMutation'
import { fetcher } from '@/api/gql/fetcher'
import { UpdatePatientDocument, type UpdatePatientMutation, type UpdatePatientMutationVariables, AdmitPatientDocument, DischargePatientDocument, WaitPatientDocument, MarkPatientDeadDocument, CreatePatientDocument, DeletePatientDocument, type AdmitPatientMutation, type DischargePatientMutation, type WaitPatientMutation, type MarkPatientDeadMutation, type CreatePatientMutation, type DeletePatientMutation, type CreatePatientMutationVariables, type DeletePatientMutationVariables, type GetPatientQuery, type GetPatientsQuery, CompleteTaskDocument, ReopenTaskDocument, type CompleteTaskMutation, type ReopenTaskMutation, type CompleteTaskMutationVariables, type ReopenTaskMutationVariables, type GetGlobalDataQuery } from '@/api/gql/generated'
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DateTimeInput,
  FormElementWrapper,
  Input,
  LoadingButton,
  LoadingContainer,
  ProgressIndicator,
  Select,
  SelectOption,
  Tab,
  TabView,
  Textarea,
  Tooltip
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { CheckCircle2, ChevronDown, Circle, PlusIcon, XIcon, Building2, Locate, Users } from 'lucide-react'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { AuditLogTimeline } from '@/components/AuditLogTimeline'
import { LocationChips } from '@/components/patients/LocationChips'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import clsx from 'clsx'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { TaskCardView } from '@/components/tasks/TaskCardView'
import { formatLocationPath, formatLocationPathFromId } from '@/utils/location'
import { useGetLocationsQuery } from '@/api/gql/generated'
import type { PropertyValueInput } from '@/api/gql/generated'
import { PropertyList } from '@/components/PropertyList'
import { ErrorDialog } from '@/components/ErrorDialog'

type ExtendedCreatePatientInput = CreatePatientInput & {
  clinicId?: string,
  positionId?: string,
  teamIds?: string[],
}

const toISODate = (d: Date | string | null | undefined): string | null => {
  if (!d) return null
  const date = typeof d === 'string' ? new Date(d) : d
  if (!(date instanceof Date) || isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const localToUTCWithSameTime = (d: Date | null | undefined): Date | null => {
  if (!d) return null
  return new Date(Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  ))
}

const getDefaultBirthdate = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return toISODate(d)
}

interface PatientDetailViewProps {
  patientId?: string,
  onClose: () => void,
  onSuccess: () => void,
  initialCreateData?: Partial<CreatePatientInput>,
}

export const PatientDetailView = ({
  patientId,
  onClose,
  onSuccess,
  initialCreateData = {}
}: PatientDetailViewProps) => {
  const translation = useTasksTranslation()
  const queryClient = useQueryClient()
  const { selectedLocationId, selectedRootLocationIds, rootLocations } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  const firstSelectedRootLocationId = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds[0] : undefined
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const isEditMode = !!patientId

  const { data: patientData, isLoading: isLoadingPatient } = useGetPatientQuery(
    { id: patientId! },
    {
      enabled: isEditMode,
      refetchOnMount: true,
    }
  )

  const { data: locationsData } = useGetLocationsQuery(
    undefined,
    {
      refetchOnWindowFocus: true,
    }
  )

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
    )
  }, [propertyDefinitionsData])

  const locationsMap = useMemo(() => {
    if (!locationsData?.locationNodes) return new Map()
    const map = new Map<string, { id: string, title: string, parentId?: string | null }>()
    locationsData.locationNodes.forEach(loc => {
      map.set(loc.id, { id: loc.id, title: loc.title, parentId: loc.parentId || null })
    })
    return map
  }, [locationsData])

  const [optimisticTaskUpdates, setOptimisticTaskUpdates] = useState<Map<string, boolean>>(new Map())

  const { mutate: completeTask } = useSafeMutation<CompleteTaskMutation, CompleteTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<CompleteTaskMutation, CompleteTaskMutationVariables>(CompleteTaskDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(patient => {
              if (patient.id === patientId && patient.tasks) {
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
    ],
    invalidateQueries: [['GetPatient', { id: patientId }], ['GetTasks'], ['GetPatients'], ['GetOverviewData'], ['GetGlobalData']],
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['GetPatient', { id: patientId }] })
      onSuccess()
    },
    onError: (error, variables) => {
      setOptimisticTaskUpdates(prev => {
        const next = new Map(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const { mutate: reopenTask } = useSafeMutation<ReopenTaskMutation, ReopenTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<ReopenTaskMutation, ReopenTaskMutationVariables>(ReopenTaskDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(patient => {
              if (patient.id === patientId && patient.tasks) {
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
    ],
    invalidateQueries: [['GetPatient', { id: patientId }], ['GetTasks'], ['GetPatients'], ['GetOverviewData'], ['GetGlobalData']],
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['GetPatient', { id: patientId }] })
      onSuccess()
    },
    onError: (error, variables) => {
      setOptimisticTaskUpdates(prev => {
        const next = new Map(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    sex: Sex.Female,
    assignedLocationIds: selectedLocationId ? [selectedLocationId] : [],
    birthdate: getDefaultBirthdate(),
    state: PatientState.Wait,
    clinicId: undefined,
    description: null,
    ...initialCreateData,
  } as CreatePatientInput & { clinicId?: string, positionId?: string, teamIds?: string[] })
  const [isWaiting, setIsWaiting] = useState(false)
  const [isClinicDialogOpen, setIsClinicDialogOpen] = useState(false)
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false)
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<LocationNodeType | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<LocationNodeType | null>(null)
  const [selectedTeams, setSelectedTeams] = useState<LocationNodeType[]>([])
  const [isMarkDeadDialogOpen, setIsMarkDeadDialogOpen] = useState(false)
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean, message?: string }>({ isOpen: false })

  const [firstnameError, setFirstnameError] = useState<string | null>(null)
  const [lastnameError, setLastnameError] = useState<string | null>(null)
  const [clinicError, setClinicError] = useState<string | null>(null)
  const [birthdateError, setBirthdateError] = useState<string | null>(null)
  const [sexError, setSexError] = useState<string | null>(null)

  useEffect(() => {
    if (patientData?.patient) {
      const patient = patientData.patient
      const { firstname, lastname, sex, birthdate, assignedLocations, clinic, position, teams, description } = patient
      setFormData(prev => ({
        ...prev,
        firstname,
        lastname,
        sex,
        birthdate: toISODate(birthdate),
        assignedLocationIds: assignedLocations.map(loc => loc.id),
        clinicId: clinic?.id || undefined,
        positionId: position?.id || undefined,
        teamIds: teams?.map(t => t.id) || undefined,
        description: description || null,
      } as CreatePatientInput & { clinicId?: string, positionId?: string, teamIds?: string[] }))
      setSelectedClinic(clinic ? (clinic as LocationNodeType) : null)
      setSelectedPosition(position ? (position as LocationNodeType) : null)
      setSelectedTeams((teams || []) as LocationNodeType[])
    }
  }, [patientData])

  useEffect(() => {
    if (!isEditMode && locationsData?.locationNodes && !formData.clinicId) {
      let clinicLocation: LocationNodeType | undefined
      if (firstSelectedRootLocationId) {
        const selectedRootLocation = locationsData.locationNodes.find(
          loc => loc.id === firstSelectedRootLocationId && loc.kind === 'CLINIC'
        )
        if (selectedRootLocation) {
          clinicLocation = selectedRootLocation as LocationNodeType
        }
      }
      if (!clinicLocation && rootLocations && rootLocations.length > 0) {
        const firstClinic = rootLocations.find(loc => loc.kind === 'CLINIC')
        if (firstClinic) {
          clinicLocation = firstClinic as LocationNodeType
        }
      }
      if (clinicLocation) {
        setSelectedClinic(clinicLocation)
        setFormData(prev => ({
          ...prev,
          clinicId: clinicLocation!.id,
        }))
      }
    }
  }, [isEditMode, firstSelectedRootLocationId, locationsData, formData.clinicId, rootLocations])

  const { mutate: createPatient, isLoading: isCreating } = useSafeMutation<CreatePatientMutation, CreatePatientMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<CreatePatientMutation, CreatePatientMutationVariables>(CreatePatientDocument, variables)()
    },
    queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
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
            patients: [...(data.patients || []), newPatient],
            waitingPatients: variables.data.state === PatientState.Wait
              ? [...(data.waitingPatients || []), newPatient]
              : data.waitingPatients || [],
          }
        }
      }
    ],
    invalidateQueries: [['GetGlobalData'], ['GetPatients'], ['GetOverviewData']],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create patient' })
    },
  })

  const { updateField, flush } = useAtomicMutation<UpdatePatientMutation, { id: string, data: UpdatePatientInput }>({
    mutationFn: async (variables) => {
      return fetcher<UpdatePatientMutation, UpdatePatientMutationVariables>(
        UpdatePatientDocument,
        variables
      )()
    },
    queryKey: ['GetPatient', { id: patientId }],
    timeoutMs: 3000,
    immediateFields: ['clinicId', 'positionId', 'teamIds', 'properties'] as unknown as (keyof { id: string, data: UpdatePatientInput })[],
    onChangeFields: ['sex'] as unknown as (keyof { id: string, data: UpdatePatientInput })[],
    onBlurFields: ['firstname', 'lastname', 'description', 'birthdate'] as unknown as (keyof { id: string, data: UpdatePatientInput })[],
    onCloseFields: ['birthdate'] as unknown as (keyof { id: string, data: UpdatePatientInput })[],
    getChecksum: (data) => data?.updatePatient?.checksum || null,
    invalidateQueries: [
      ['GetPatient', { id: patientId }],
      ['GetPatients'],
      ['GetOverviewData'],
      ['GetGlobalData']
    ],
    optimisticUpdate: (variables) => {
      const updates: Array<{ queryKey: unknown[], updateFn: (oldData: unknown) => unknown }> = []
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

      updates.push({
        queryKey: ['GetPatient', { id: patientId }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientQuery | undefined
          if (!data?.patient) return oldData
          const updatedPatient = updatePatientInQuery(data.patient, variables.data || {})
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
            if (!data?.patients) return oldData
            const patientIndex = data.patients.findIndex(p => p.id === patientId)
            if (patientIndex === -1) return oldData
            const patient = data.patients[patientIndex]
            if (!patient) return oldData
            const updatedPatient = updatePatientInQuery(patient as unknown as PatientType, variables.data || {})
            if (!updatedPatient) return oldData
            const updatedName = updatedPatient.firstname && updatedPatient.lastname
              ? `${updatedPatient.firstname} ${updatedPatient.lastname}`.trim()
              : updatedPatient.firstname || updatedPatient.lastname || patient.name || ''
            const updateData = variables.data || {}
            const updatedPatientForList: typeof data.patients[0] = {
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
              patients: [
                ...data.patients.slice(0, patientIndex),
                updatedPatientForList,
                ...data.patients.slice(patientIndex + 1)
              ]
            }
          }
        })
      }

      return updates
    },
  })

  useEffect(() => {
    return () => {
      if (isEditMode) {
        flush()
      }
    }
  }, [isEditMode, flush])

  const { mutate: admitPatient } = useSafeMutation<AdmitPatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<AdmitPatientMutation, { id: string }>(AdmitPatientDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(p =>
              p.id === patientId ? { ...p, state: PatientState.Admitted } : p)
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const existingPatient = data.patients.find(p => p.id === patientId)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Admitted }
            : { __typename: 'PatientType' as const, id: patientId, state: PatientState.Admitted, assignedLocation: null }
          return {
            ...data,
            patients: existingPatient
              ? data.patients.map(p => p.id === patientId ? updatedPatient : p)
              : [...data.patients, updatedPatient],
            waitingPatients: data.waitingPatients.filter(p => p.id !== patientId)
          }
        }
      }
    ],
    invalidateQueries: [['GetPatients'], ['GetGlobalData']],
    onSuccess: () => {
      onSuccess()
    },
  })

  const { mutate: dischargePatient } = useSafeMutation<DischargePatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<DischargePatientMutation, { id: string }>(DischargePatientDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(p =>
              p.id === patientId ? { ...p, state: PatientState.Discharged } : p)
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const existingPatient = data.patients.find(p => p.id === patientId)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Discharged }
            : { __typename: 'PatientType' as const, id: patientId, state: PatientState.Discharged, assignedLocation: null }
          return {
            ...data,
            patients: existingPatient
              ? data.patients.map(p => p.id === patientId ? updatedPatient : p)
              : [...data.patients, updatedPatient],
            waitingPatients: data.waitingPatients.filter(p => p.id !== patientId)
          }
        }
      }
    ],
    invalidateQueries: [['GetPatients'], ['GetGlobalData']],
    onSuccess: () => {
      onSuccess()
    },
  })

  const { mutate: markPatientDead } = useSafeMutation<MarkPatientDeadMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<MarkPatientDeadMutation, { id: string }>(MarkPatientDeadDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(p =>
              p.id === patientId ? { ...p, state: PatientState.Dead } : p)
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const existingPatient = data.patients.find(p => p.id === patientId)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Dead }
            : { __typename: 'PatientType' as const, id: patientId, state: PatientState.Dead, assignedLocation: null }
          return {
            ...data,
            patients: existingPatient
              ? data.patients.map(p => p.id === patientId ? updatedPatient : p)
              : [...data.patients, updatedPatient],
            waitingPatients: data.waitingPatients.filter(p => p.id !== patientId)
          }
        }
      }
    ],
    invalidateQueries: [['GetPatients'], ['GetGlobalData']],
    onSuccess: () => {
      onSuccess()
    },
  })

  const { mutate: waitPatient } = useSafeMutation<WaitPatientMutation, { id: string }>({
    mutationFn: async (variables) => {
      return fetcher<WaitPatientMutation, { id: string }>(WaitPatientDocument, variables)()
    },
    queryKey: ['GetPatient', { id: patientId }],
    optimisticUpdate: () => [
      {
        queryKey: ['GetPatient', { id: patientId }],
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
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.map(p =>
              p.id === patientId ? { ...p, state: PatientState.Wait } : p)
          }
        }
      },
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const existingPatient = data.patients.find(p => p.id === patientId)
          const isAlreadyWaiting = data.waitingPatients.some(p => p.id === patientId)
          const updatedPatient = existingPatient
            ? { ...existingPatient, state: PatientState.Wait }
            : { __typename: 'PatientType' as const, id: patientId, state: PatientState.Wait, assignedLocation: null }
          return {
            ...data,
            patients: existingPatient
              ? data.patients.map(p => p.id === patientId ? updatedPatient : p)
              : [...data.patients, updatedPatient],
            waitingPatients: isAlreadyWaiting
              ? data.waitingPatients
              : [...data.waitingPatients, updatedPatient]
          }
        }
      }
    ],
    invalidateQueries: [['GetPatients'], ['GetGlobalData']],
    onSuccess: () => {
      onSuccess()
    },
  })

  const { mutate: deletePatient } = useSafeMutation<DeletePatientMutation, DeletePatientMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<DeletePatientMutation, DeletePatientMutationVariables>(DeletePatientDocument, variables)()
    },
    queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
    optimisticUpdate: (variables) => [
      {
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          return {
            ...data,
            patients: (data.patients || []).filter(p => p.id !== variables.id),
            waitingPatients: (data.waitingPatients || []).filter(p => p.id !== variables.id),
          }
        }
      },
      {
        queryKey: ['GetPatients'],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetPatientsQuery | undefined
          if (!data?.patients) return oldData
          return {
            ...data,
            patients: data.patients.filter(p => p.id !== variables.id),
          }
        }
      },
      {
        queryKey: ['GetPatient', { id: variables.id }],
        updateFn: () => undefined,
      }
    ],
    invalidateQueries: [['GetGlobalData'], ['GetPatients'], ['GetOverviewData']],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      onClose()
    },
  })

  const handleFieldUpdate = (updates: Partial<UpdatePatientInput>, triggerType?: 'onChange' | 'onBlur' | 'onClose') => {
    if (!isEditMode || !patientId) return
    if (updates.firstname !== undefined && !updates.firstname?.trim()) return
    if (updates.lastname !== undefined && !updates.lastname?.trim()) return
    updateField({ id: patientId, data: updates }, triggerType)
  }

  const updateLocalState = (updates: Partial<CreatePatientInput>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateFirstname = (value: string): boolean => {
    if (!value || !value.trim()) {
      setFirstnameError(translation('firstName') + ' is required')
      return false
    }
    setFirstnameError(null)
    return true
  }

  const validateLastname = (value: string): boolean => {
    if (!value || !value.trim()) {
      setLastnameError(translation('lastName') + ' is required')
      return false
    }
    setLastnameError(null)
    return true
  }

  const validateClinic = (clinic?: LocationNodeType | null): boolean => {
    const clinicToValidate = clinic !== undefined ? clinic : selectedClinic
    if (!clinicToValidate || !clinicToValidate.id) {
      setClinicError(translation('clinic') + ' is required')
      return false
    }
    setClinicError(null)
    return true
  }

  const validateBirthdate = (value: string | null | undefined): boolean => {
    if (!value || !value.trim()) {
      setBirthdateError(translation('birthdate') + ' is required')
      return false
    }
    setBirthdateError(null)
    return true
  }

  const validateSex = (value: Sex | null | undefined): boolean => {
    if (!value) {
      setSexError(translation('sex') + ' is required')
      return false
    }
    setSexError(null)
    return true
  }

  const isFormValid = useMemo(() => {
    if (isEditMode) return true
    const firstnameValid = formData.firstname?.trim() || false
    const lastnameValid = formData.lastname?.trim() || false
    const clinicValid = !!selectedClinic?.id
    const birthdateValid = !!formData.birthdate && formData.birthdate.trim() !== ''
    const sexValid = !!formData.sex
    return firstnameValid && lastnameValid && clinicValid && birthdateValid && sexValid
  }, [formData.firstname, formData.lastname, formData.birthdate, formData.sex, selectedClinic, isEditMode])

  const handleSubmit = () => {
    const firstnameValid = validateFirstname(formData.firstname || '')
    const lastnameValid = validateLastname(formData.lastname || '')
    const clinicValid = validateClinic()
    const birthdateValid = validateBirthdate(formData.birthdate)
    const sexValid = validateSex(formData.sex)

    if (!firstnameValid || !lastnameValid || !clinicValid || !birthdateValid || !sexValid || !selectedClinic) {
      return
    }

    const dataToSend = {
      ...formData,
      clinicId: selectedClinic.id,
      state: isWaiting ? PatientState.Wait : PatientState.Admitted,
    } as ExtendedCreatePatientInput

    if (selectedPosition) {
      dataToSend.positionId = selectedPosition.id
    }

    if (selectedTeams.length > 0) {
      dataToSend.teamIds = selectedTeams.map(t => t.id)
    }

    if (!dataToSend.assignedLocationIds || dataToSend.assignedLocationIds.length === 0) {
      delete dataToSend.assignedLocationIds
    }
    if (!dataToSend.positionId) {
      delete dataToSend.positionId
    }
    if (!dataToSend.teamIds || dataToSend.teamIds.length === 0) {
      delete dataToSend.teamIds
    }

    createPatient({ data: dataToSend })
  }

  const handleClinicSelect = (locations: LocationNodeType[]) => {
    const clinic = locations[0]
    if (clinic) {
      setSelectedClinic(clinic)
      updateLocalState({ clinicId: clinic.id } as Partial<ExtendedCreatePatientInput>)
      if (isEditMode) {
        handleFieldUpdate({ clinicId: clinic.id })
      } else {
        validateClinic(clinic)
      }
    } else {
      setSelectedClinic(null)
      updateLocalState({ clinicId: undefined } as Partial<ExtendedCreatePatientInput>)
      if (isEditMode) {
        handleFieldUpdate({ clinicId: undefined })
      } else {
        validateClinic(null)
      }
    }
    setIsClinicDialogOpen(false)
  }

  const handlePositionSelect = (locations: LocationNodeType[]) => {
    const position = locations[0]
    if (position) {
      setSelectedPosition(position)
      updateLocalState({ positionId: position.id } as Partial<ExtendedCreatePatientInput>)
      if (isEditMode) {
        handleFieldUpdate({ positionId: position.id })
      }
    } else {
      setSelectedPosition(null)
      updateLocalState({ positionId: undefined } as Partial<ExtendedCreatePatientInput>)
      if (isEditMode) {
        handleFieldUpdate({ positionId: null })
      }
    }
    setIsPositionDialogOpen(false)
  }

  const handleTeamsSelect = (locations: LocationNodeType[]) => {
    setSelectedTeams(locations)
    const teamIds = locations.map(loc => loc.id)
    updateLocalState({ teamIds } as Partial<ExtendedCreatePatientInput>)
    if (isEditMode) {
      handleFieldUpdate({ teamIds })
    }
    setIsTeamsDialogOpen(false)
  }

  const sexOptions = [
    { label: translation('male'), value: Sex.Male },
    { label: translation('female'), value: Sex.Female },
    { label: translation('diverse'), value: Sex.Unknown }
  ]

  const [openExpanded, setOpenExpanded] = useState(true)
  const [closedExpanded, setClosedExpanded] = useState(false)

  const sortByDueDate = <T extends { dueDate?: string | null }>(tasks: T[]): T[] => {
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }

  const tasks = useMemo(() => {
    const baseTasks = patientData?.patient?.tasks || []
    return baseTasks.map(task => {
      const optimisticDone = optimisticTaskUpdates.get(task.id)
      if (optimisticDone !== undefined) {
        return { ...task, done: optimisticDone }
      }
      return task
    })
  }, [patientData?.patient?.tasks, optimisticTaskUpdates])

  const openTasks = useMemo(() => sortByDueDate(tasks.filter(t => !t.done)), [tasks])
  const closedTasks = useMemo(() => sortByDueDate(tasks.filter(t => t.done)), [tasks])
  const totalTasks = openTasks.length + closedTasks.length
  const taskProgress = totalTasks === 0 ? 0 : openTasks.length / totalTasks

  const patientName = patientData?.patient ? `${patientData.patient.firstname} ${patientData.patient.lastname}` : ''
  const displayLocation = useMemo(() => {
    if (patientData?.patient?.position) {
      return [patientData.patient.position]
    }
    if (selectedClinic) {
      return [selectedClinic]
    }
    if (patientData?.patient?.assignedLocations && patientData.patient.assignedLocations.length > 0) {
      return patientData.patient.assignedLocations
    }
    return []
  }, [patientData?.patient?.position, patientData?.patient?.assignedLocations, selectedClinic])

  const startDate = useMemo(() => {
    const year = new Date()
    year.setFullYear(year.getFullYear() - 100)
    return year
  }, [])

  const endDate = useMemo(() => {
    return new Date()
  }, [])

  useEffect(() => {
    setOptimisticTaskUpdates(new Map())
  }, [patientData?.patient?.tasks])

  const handleToggleDone = (taskId: string, done: boolean) => {
    setOptimisticTaskUpdates(prev => {
      const next = new Map(prev)
      next.set(taskId, done)
      return next
    })
    if (done) {
      setClosedExpanded(true)
      completeTask({ id: taskId })
    } else {
      setOpenExpanded(true)
      reopenTask({ id: taskId })
    }
  }

  if (isEditMode && isLoadingPatient) {
    return <LoadingContainer />
  }

  return (
    <div className="flex-col-0 h-full bg-surface">
      {isEditMode && patientName && (
        <div className="px-1 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">{patientName}</div>
            <div className="flex items-center gap-2">
              {totalTasks > 0 && (
                <Tooltip
                  tooltip={`${translation('openTasks')}: ${openTasks.length}\n${translation('closedTasks')}: ${closedTasks.length}`}
                  position="top"
                  tooltipClassName="whitespace-pre-line"
                >
                  <div className="w-12">
                    <ProgressIndicator progress={taskProgress} rotation={-90} />
                  </div>
                </Tooltip>
              )}
              {patientData?.patient?.state && (
                <PatientStateChip state={patientData.patient.state} />
              )}
            </div>
          </div>
          {displayLocation.length > 0 && (
            <div className="flex items-center gap-1">
              <LocationChips locations={displayLocation} disableLink={false} />
            </div>
          )}
        </div>
      )}
      <div className="flex-col-0 flex-grow overflow-hidden">
        <TabView className="h-full flex-col-0">
          {isEditMode && (
            <Tab label={translation('tasks')} className="h-full overflow-y-auto pr-2">
              <div className="flex flex-col gap-4 pt-4">
                <div className="mb-2">
                  <Button
                    startIcon={<PlusIcon />}
                    onClick={() => setIsCreatingTask(true)}
                    className="w-full"
                  >
                    {translation('addTask')}
                  </Button>
                </div>
                <div>
                  <button
                    onClick={() => setOpenExpanded(!openExpanded)}
                    className="text-lg font-bold mb-3 flex items-center gap-2 w-full text-left"
                  >
                    <ChevronDown className={clsx('size-5 transition-transform', { '-rotate-90': !openExpanded })} />
                    <Circle className="size-5 text-warning" />
                    {translation('openTasks')} ({openTasks.length})
                  </button>
                  {openExpanded && (
                    <div className="flex flex-col gap-2">
                      {openTasks.length === 0 &&
                        <div className="text-description italic">{translation('noOpenTasks')}</div>}
                      {openTasks.map(task => (
                        <TaskCardView
                          key={task.id}
                          task={task}
                          onClick={(t) => setTaskId(t.id)}
                          onToggleDone={(taskId, done) => handleToggleDone(taskId, done)}
                          showPatient={false}
                          showAssignee={!!(task.assignee || task.assigneeTeam)}
                          fullWidth={true}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="opacity-75">
                  <button
                    onClick={() => setClosedExpanded(!closedExpanded)}
                    className="text-lg font-bold mb-3 flex items-center gap-2 w-full text-left"
                  >
                    <ChevronDown className={clsx('size-5 transition-transform', { '-rotate-90': !closedExpanded })} />
                    <CheckCircle2 className="size-5 text-positive" />
                    {translation('closedTasks')} ({closedTasks.length})
                  </button>
                  {closedExpanded && (
                    <div className="flex flex-col gap-2">
                      {closedTasks.length === 0 &&
                        <div className="text-description italic">{translation('noClosedTasks')}</div>}
                      {closedTasks.map(task => (
                        <TaskCardView
                          key={task.id}
                          task={task}
                          onClick={(t) => setTaskId(t.id)}
                          onToggleDone={(taskId, done) => handleToggleDone(taskId, done)}
                          showPatient={false}
                          showAssignee={!!(task.assignee || task.assigneeTeam)}
                          fullWidth={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Tab>
          )}

          {isEditMode && hasAvailableProperties && (
            <Tab label={translation('properties')} className="h-full overflow-y-auto pr-2">
              <div className="flex flex-col gap-4 pt-4">
                <PropertyList
                  subjectId={patientId!}
                  subjectType="patient"
                  fullWidthAddButton={true}
                  propertyValues={patientData?.patient?.properties?.map(p => ({
                    definition: {
                      id: p.definition.id,
                      name: p.definition.name,
                      description: p.definition.description,
                      fieldType: p.definition.fieldType,
                      isActive: p.definition.isActive,
                      allowedEntities: p.definition.allowedEntities,
                      options: p.definition.options,
                    },
                    textValue: p.textValue,
                    numberValue: p.numberValue,
                    booleanValue: p.booleanValue,
                    dateValue: p.dateValue,
                    dateTimeValue: p.dateTimeValue,
                    selectValue: p.selectValue,
                    multiSelectValues: p.multiSelectValues,
                  }))}
                  onPropertyValueChange={(definitionId, value) => {
                    const existingProperties = patientData?.patient?.properties?.map(p => ({
                      definitionId: p.definition.id,
                      textValue: p.textValue,
                      numberValue: p.numberValue,
                      booleanValue: p.booleanValue,
                      dateValue: p.dateValue,
                      dateTimeValue: p.dateTimeValue,
                      selectValue: p.selectValue,
                      multiSelectValues: p.multiSelectValues,
                    })) || []

                    if (value === null) {
                      const updatedProperties = existingProperties.filter(p => p.definitionId !== definitionId)
                      handleFieldUpdate({ properties: updatedProperties })
                      return
                    }

                    const propertyInput: PropertyValueInput = {
                      definitionId,
                      textValue: value.textValue !== undefined ? (value.textValue !== null && value.textValue.trim() !== '' ? value.textValue : '') : null,
                      numberValue: value.numberValue ?? null,
                      booleanValue: value.boolValue ?? null,
                      dateValue: value.dateValue && !isNaN(value.dateValue.getTime()) ? value.dateValue.toISOString().split('T')[0] : null,
                      dateTimeValue: value.dateTimeValue && !isNaN(value.dateTimeValue.getTime()) ? value.dateTimeValue.toISOString() : null,
                      selectValue: value.singleSelectValue || null,
                      multiSelectValues: (value.multiSelectValue && value.multiSelectValue.length > 0) ? value.multiSelectValue : null,
                    }

                    const updatedProperties = [
                      ...existingProperties.filter(p => p.definitionId !== definitionId),
                      propertyInput,
                    ]

                    handleFieldUpdate({ properties: updatedProperties })
                  }}
                />
              </div>
            </Tab>
          )}

          <Tab label={translation('patientData')} className="flex-col-6 px-1 pt-4 h-full overflow-x-visible overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormElementWrapper
                label={translation('firstName')}
                error={firstnameError || undefined}
                isShowingError={!!firstnameError}
              >
                {({ isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                  <Input
                    {...bag}
                    value={formData.firstname}
                    placeholder={translation('firstName')}
                    required
                    onChange={e => {
                      const val = e.target.value
                      updateLocalState({ firstname: val })
                      if (isShowingError) {
                        validateFirstname(val)
                      }
                    }}
                    onBlur={() => {
                      validateFirstname(formData.firstname || '')
                      if (isEditMode) {
                        handleFieldUpdate({ firstname: formData.firstname }, 'onBlur')
                      }
                    }}
                  />
                )}
              </FormElementWrapper>
              <FormElementWrapper
                label={translation('lastName')}
                error={lastnameError || undefined}
                isShowingError={!!lastnameError}
              >
                {({ isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                  <Input
                    {...bag}
                    value={formData.lastname}
                    placeholder={translation('lastName')}
                    required
                    onChange={e => {
                      const val = e.target.value
                      updateLocalState({ lastname: val })
                      if (isShowingError) {
                        validateLastname(val)
                      }
                    }}
                    onBlur={() => {
                      validateLastname(formData.lastname || '')
                      if (isEditMode) {
                        handleFieldUpdate({ lastname: formData.lastname }, 'onBlur')
                      }
                    }}
                  />
                )}
              </FormElementWrapper>
            </div>

            <FormElementWrapper
              label={translation('birthdate')}
              error={birthdateError || undefined}
              isShowingError={!!birthdateError}
            >
              {({ isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                <DateTimeInput
                  {...bag}
                  date={formData.birthdate ? new Date(formData.birthdate as string) : undefined}
                  pickerProps={{
                    start: startDate,
                    end: endDate
                  }}
                  mode="date"
                  required={true}
                  onValueChange={(date) => {
                    const dateStr = toISODate(date)
                    updateLocalState({ birthdate: dateStr })
                    if (isShowingError) {
                      validateBirthdate(dateStr)
                    }
                  }}
                  onEditCompleted={(date) => {
                    if (date) {
                      const utcDate = localToUTCWithSameTime(date)
                      const isoDate = utcDate ? toISODate(utcDate) : null
                      updateLocalState({ birthdate: isoDate })
                      if (isEditMode) {
                        handleFieldUpdate({ birthdate: isoDate }, 'onClose')
                      }
                    }
                  }}
                  onRemove={() => {
                    updateLocalState({ birthdate: null })
                    if (isEditMode) {
                      handleFieldUpdate({ birthdate: null })
                    } else {
                      validateBirthdate(null)
                    }
                  }}
                />
              )}
            </FormElementWrapper>

            <FormElementWrapper
              label={translation('sex')}
              error={sexError || undefined}
              isShowingError={!!sexError}
            >
              {({ isShowingError: _isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                <Select
                  {...bag}
                  value={formData.sex}
                  onValueChanged={(value) => {
                    updateLocalState({ sex: value as Sex })
                    if (isEditMode) {
                      handleFieldUpdate({ sex: value as Sex }, 'onChange')
                    }
                    validateSex(value as Sex)
                  }}
                >
                  {sexOptions.map(option => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </Select>
              )}
            </FormElementWrapper>

            <FormElementWrapper label={translation('description')}>
              {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                <Textarea
                  {...bag}
                  value={formData.description || ''}
                  placeholder={translation('descriptionPlaceholder')}
                    onChange={e => updateLocalState({ description: e.target.value })}
                    onBlur={() => {
                      if (isEditMode) {
                        handleFieldUpdate({ description: formData.description }, 'onBlur')
                      }
                    }}
                />
              )}
            </FormElementWrapper>

            {!isEditMode && (
              <FormElementWrapper label="">
                {() => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isWaiting}
                      onCheckedChange={setIsWaiting}
                    />
                    <span>{translation('waitingForPatient')}</span>
                  </div>
                )}
              </FormElementWrapper>
            )}

            {isEditMode && patientId && patientData?.patient && (() => {
              const patient = patientData.patient
              return (
                <FormElementWrapper label={translation('patientActions')}>
                  {() => (
                    <div className="flex gap-4 flex-wrap">
                      {patient.state !== PatientState.Admitted && (
                        <Button
                          onClick={() => admitPatient({ id: patientId })}
                          color="positive"
                        >
                          {translation('admitPatient')}
                        </Button>
                      )}
                      {patient.state !== PatientState.Discharged && (
                        <Button
                          onClick={() => setIsDischargeDialogOpen(true)}
                          color="neutral"
                          coloringStyle="outline"
                        >
                          {translation('dischargePatient')}
                        </Button>
                      )}
                      {patient.state !== PatientState.Wait && (
                        <Button
                          onClick={() => waitPatient({ id: patientId })}
                          color="warning"
                        >
                          {translation('waitPatient')}
                        </Button>
                      )}
                    </div>
                  )}
                </FormElementWrapper>
              )
            })()}

            <FormElementWrapper
              label={translation('clinic') + ' *'}
              error={clinicError || undefined}
              isShowingError={!!clinicError}
            >
              {({ isShowingError: _isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      {...bag}
                      value={selectedClinic ? (locationsMap.size > 0 ? formatLocationPathFromId(selectedClinic.id, locationsMap) : formatLocationPath(selectedClinic)) : ''}
                      placeholder={translation('selectClinic')}
                      readOnly
                      className="flex-grow cursor-pointer"
                      required
                      onClick={() => setIsClinicDialogOpen(true)}
                    />
                    <Button
                      onClick={() => setIsClinicDialogOpen(true)}
                      layout="icon"
                      title={translation('selectClinic')}
                    >
                      <Building2 className="size-4" />
                    </Button>
                    {selectedClinic && !isEditMode && (
                      <Button
                        onClick={() => {
                          setSelectedClinic(null)
                          updateLocalState({ clinicId: undefined } as Partial<ExtendedCreatePatientInput>)
                          if (isEditMode) {
                            handleFieldUpdate({ clinicId: undefined })
                          } else {
                            validateClinic(null)
                          }
                        }}
                        layout="icon"
                        color="neutral"
                        title={translation('clear')}
                      >
                        <XIcon className="size-5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </FormElementWrapper>

            <FormElementWrapper label={translation('position')}>
              {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      {...bag}
                      value={selectedPosition ? (locationsMap.size > 0 ? formatLocationPathFromId(selectedPosition.id, locationsMap) : formatLocationPath(selectedPosition)) : ''}
                      placeholder={translation('selectPosition')}
                      readOnly
                      className="flex-grow cursor-pointer"
                      onClick={() => setIsPositionDialogOpen(true)}
                    />
                    <Button
                      onClick={() => setIsPositionDialogOpen(true)}
                      layout="icon"
                      title={translation('selectPosition')}
                    >
                      <Locate className="size-4" />
                    </Button>
                    {selectedPosition && (
                      <Button
                        onClick={() => {
                          setSelectedPosition(null)
                          updateLocalState({ positionId: undefined } as Partial<ExtendedCreatePatientInput>)
                          if (isEditMode) {
                            handleFieldUpdate({ positionId: null })
                          }
                        }}
                        layout="icon"
                        color="neutral"
                        title={translation('clear')}
                      >
                        <XIcon className="size-5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </FormElementWrapper>

            <FormElementWrapper label={translation('teams')}>
              {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      {...bag}
                      value={selectedTeams.length > 0
                        ? selectedTeams.map(loc => locationsMap.size > 0 ? formatLocationPathFromId(loc.id, locationsMap) : formatLocationPath(loc)).join(', ')
                        : ''}
                      placeholder={translation('selectTeams')}
                      readOnly
                      className="flex-grow cursor-pointer"
                      onClick={() => setIsTeamsDialogOpen(true)}
                    />
                    <Button
                      onClick={() => setIsTeamsDialogOpen(true)}
                      layout="icon"
                      title={translation('selectTeams')}
                    >
                      <Users className="size-4" />
                    </Button>
                    {selectedTeams.length > 0 && (
                      <Button
                        onClick={() => {
                          setSelectedTeams([])
                          updateLocalState({ teamIds: [] } as Partial<ExtendedCreatePatientInput>)
                          if (isEditMode) {
                            handleFieldUpdate({ teamIds: [] })
                          }
                        }}
                        layout="icon"
                        color="neutral"
                        title={translation('clear')}
                      >
                        <XIcon className="size-5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </FormElementWrapper>

            {isEditMode && patientId && patientData?.patient && (
              <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
                {patientData.patient.state !== PatientState.Dead && (
                  <Button
                    onClick={() => setIsMarkDeadDialogOpen(true)}
                    color="negative"
                    coloringStyle="outline"
                  >
                    {translation('markPatientDead')}
                  </Button>
                )}
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  color="negative"
                  coloringStyle="outline"
                >
                  {translation('deletePatient') ?? 'Delete Patient'}
                </Button>
              </div>
            )}
          </Tab>

          {isEditMode && patientId && (
            <Tab label="Audit Log" className="flex-col-6 px-1 pt-4 h-full overflow-x-visible overflow-y-auto">
              <AuditLogTimeline caseId={patientId} enabled={true} />
            </Tab>
          )}
        </TabView>
      </div>

      {!isEditMode && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isCreating}
            disabled={!isFormValid}
          >
            {translation('create')}
          </LoadingButton>
        </div>
      )}

      <ConfirmDialog
        isOpen={isMarkDeadDialogOpen}
        onCancel={() => setIsMarkDeadDialogOpen(false)}
        onConfirm={() => {
          if (patientId) {
            markPatientDead({ id: patientId })
          }
          setIsMarkDeadDialogOpen(false)
        }}
        titleElement={translation('markPatientDead')}
        description={translation('markPatientDeadConfirmation')}
        confirmType="negative"
      />

      <ConfirmDialog
        isOpen={isDischargeDialogOpen}
        onCancel={() => setIsDischargeDialogOpen(false)}
        onConfirm={() => {
          if (patientId) {
            dischargePatient({ id: patientId })
          }
          setIsDischargeDialogOpen(false)
        }}
        titleElement={translation('dischargePatient')}
        description={translation('dischargePatientConfirmation')}
        confirmType="neutral"
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (patientId) {
            deletePatient({ id: patientId })
          }
          setIsDeleteDialogOpen(false)
        }}
        titleElement={translation('deletePatient') ?? 'Delete Patient'}
        description={translation('deletePatientConfirmation') ?? 'Are you sure you want to delete this patient? This action cannot be undone.'}
        confirmType="negative"
      />

      <LocationSelectionDialog
        isOpen={isClinicDialogOpen}
        onClose={() => setIsClinicDialogOpen(false)}
        onSelect={handleClinicSelect}
        initialSelectedIds={selectedClinic ? [selectedClinic.id] : []}
        multiSelect={false}
        useCase="clinic"
      />
      <LocationSelectionDialog
        isOpen={isPositionDialogOpen}
        onClose={() => setIsPositionDialogOpen(false)}
        onSelect={handlePositionSelect}
        initialSelectedIds={selectedPosition ? [selectedPosition.id] : []}
        multiSelect={false}
        useCase="position"
      />
      <LocationSelectionDialog
        isOpen={isTeamsDialogOpen}
        onClose={() => setIsTeamsDialogOpen(false)}
        onSelect={handleTeamsSelect}
        initialSelectedIds={selectedTeams.map(loc => loc.id)}
        multiSelect={true}
        useCase="teams"
      />
      <SidePanel
        isOpen={!!taskId || isCreatingTask}
        onClose={() => {
          setTaskId(null)
          setIsCreatingTask(false)
        }}
        title={taskId ? translation('editTask') : translation('createTask')}
      >
        <TaskDetailView
          taskId={taskId}
          initialPatientId={isCreatingTask ? patientId : undefined}
          onSuccess={() => {
            onSuccess()
            setIsCreatingTask(false)
          }}
          onClose={() => {
            setTaskId(null)
            setIsCreatingTask(false)
          }}
        />
      </SidePanel>
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false })}
        message={errorDialog.message}
      />
    </div>
  )
}
