import { useEffect, useState, useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, LocationNodeType, UpdatePatientInput } from '@/api/gql/generated'
import {
  PatientState,
  Sex,
  useAdmitPatientMutation,
  useCompleteTaskMutation,
  useCreatePatientMutation,
  useDischargePatientMutation,
  useGetPatientQuery,
  useMarkPatientDeadMutation,
  useReopenTaskMutation,
  useUpdatePatientMutation,
  useWaitPatientMutation
} from '@/api/gql/generated'
import { useQueryClient } from '@tanstack/react-query'
import type { ButtonProps } from '@helpwave/hightide'
import {
  Avatar,
  Button,
  CheckboxUncontrolled,
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
  Tooltip
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { CheckCircle2, ChevronDown, Circle, Clock, PlusIcon, XIcon, Building2, Locate, Users } from 'lucide-react'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { LocationChips } from '@/components/patients/LocationChips'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import clsx from 'clsx'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { SmartDate } from '@/utils/date'
import { formatLocationPath, formatLocationPathFromId } from '@/utils/location'
import { useGetLocationsQuery } from '@/api/gql/generated'

type ExtendedCreatePatientInput = CreatePatientInput & {
  clinicId?: string,
  positionId?: string,
  teamIds?: string[],
}

type ExtendedUpdatePatientInput = UpdatePatientInput & {
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

type TaskCardProps = ButtonProps & {
  task: {
    id: string,
    title: string,
    description?: string | null,
    done: boolean,
    dueDate?: string | null,
    assignee?: { id: string, name: string, avatarUrl?: string | null } | null,
  },
  onToggleDone: (done: boolean) => void,
}

function TaskCard({ task, onToggleDone, ...props }: TaskCardProps) {
  const descriptionPreview = task.description && task.description.length > 80
    ? task.description.slice(0, 80) + '...'
    : task.description

  return (
    <button
      {...props}
      className="border-2 p-3 rounded-lg text-left w-full transition-colors hover:border-primary bg-transparent"
    >
      <div className="flex items-start gap-3 w-full">
        <div onClick={(e) => e.stopPropagation()}>
          <CheckboxUncontrolled
            checked={task.done}
            onCheckedChange={(checked) => onToggleDone(!checked)}
            className="rounded-full mt-0.5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div
              className={clsx(
                'font-semibold',
                { 'line-through text-description': task.done }
              )}
            >
              {task.title}
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1 text-xs text-description shrink-0">
                <Avatar
                  fullyRounded={true}
                  size="sm"
                  image={{
                    avatarUrl: task.assignee.avatarUrl || 'https://cdn.helpwave.de/boringavatar.svg',
                    alt: task.assignee.name
                  }}
                />
                <span>{task.assignee.name}</span>
              </div>
            )}
          </div>
          {descriptionPreview && !task.done && (
            <div className="text-sm text-description mt-1">{descriptionPreview}</div>
          )}
          {task.dueDate && !task.done && (
            <div className="flex items-center gap-1 mt-2 text-xs text-warning">
              <Clock className="size-3" />
              <SmartDate date={new Date(task.dueDate)} mode="relative" showTime={false} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
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
  const { selectedLocationId } = useTasksContext()
  const queryClient = useQueryClient()
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const isEditMode = !!patientId

  const { data: patientData, isLoading: isLoadingPatient, refetch } = useGetPatientQuery(
    { id: patientId! },
    {
      enabled: isEditMode,
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const { data: locationsData } = useGetLocationsQuery(
    undefined,
    {
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  )

  const locationsMap = useMemo(() => {
    if (!locationsData?.locationNodes) return new Map()
    const map = new Map<string, { id: string, title: string, parentId?: string | null }>()
    locationsData.locationNodes.forEach(loc => {
      map.set(loc.id, { id: loc.id, title: loc.title, parentId: loc.parentId || null })
    })
    return map
  }, [locationsData])

  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: () => refetch() })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: () => refetch() })

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    sex: Sex.Female,
    assignedLocationIds: selectedLocationId ? [selectedLocationId] : [],
    birthdate: getDefaultBirthdate(),
    state: PatientState.Wait,
    clinicId: undefined,
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

  // Validation state for required fields
  const [firstnameError, setFirstnameError] = useState<string | null>(null)
  const [lastnameError, setLastnameError] = useState<string | null>(null)
  const [clinicError, setClinicError] = useState<string | null>(null)
  const [birthdateError, setBirthdateError] = useState<string | null>(null)
  const [sexError, setSexError] = useState<string | null>(null)

  useEffect(() => {
    if (patientData?.patient) {
      const patient = patientData.patient
      const { firstname, lastname, sex, birthdate, assignedLocations, clinic, position, teams } = patient
      setFormData({
        firstname,
        lastname,
        sex,
        birthdate: toISODate(birthdate),
        assignedLocationIds: assignedLocations.map(loc => loc.id),
        clinicId: clinic?.id || undefined,
        positionId: position?.id || undefined,
        teamIds: teams?.map(t => t.id) || undefined,
      } as CreatePatientInput & { clinicId?: string, positionId?: string, teamIds?: string[] })
      setSelectedClinic(clinic ? (clinic as LocationNodeType) : null)
      setSelectedPosition(position ? (position as LocationNodeType) : null)
      setSelectedTeams((teams || []) as LocationNodeType[])
    }
  }, [patientData])

  const { mutate: createPatient, isLoading: isCreating } = useCreatePatientMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      onClose()
    }
  })

  const { mutate: updatePatient } = useUpdatePatientMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      refetch()
    }
  })

  const { mutate: admitPatient } = useAdmitPatientMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      refetch()
    }
  })

  const { mutate: dischargePatient } = useDischargePatientMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      refetch()
    }
  })

  const { mutate: markPatientDead } = useMarkPatientDeadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      refetch()
    }
  })

  const { mutate: waitPatient } = useWaitPatientMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      refetch()
    }
  })

  const persistChanges = (updates: Partial<UpdatePatientInput>) => {
    if (updates.firstname !== undefined && !updates.firstname?.trim()) return
    if (updates.lastname !== undefined && !updates.lastname?.trim()) return

    const cleanedUpdates: Partial<UpdatePatientInput> = { ...updates }
    if (cleanedUpdates.clinicId === '' || cleanedUpdates.clinicId === undefined) {
      delete cleanedUpdates.clinicId
    }
    if (cleanedUpdates.positionId === '' || cleanedUpdates.positionId === undefined) {
      cleanedUpdates.positionId = null
    }
    if (cleanedUpdates.teamIds === undefined) {
      delete cleanedUpdates.teamIds
    }

    if (isEditMode && patientId && Object.keys(cleanedUpdates).length > 0) {
      updatePatient({
        id: patientId,
        data: cleanedUpdates as UpdatePatientInput
      })
    }
  }

  const updateLocalState = (updates: Partial<CreatePatientInput>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Validation functions
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

  // Check if form is valid (for create mode)
  const isFormValid = useMemo(() => {
    if (isEditMode) return true // Edit mode doesn't need validation for submission
    const firstnameValid = formData.firstname?.trim() || false
    const lastnameValid = formData.lastname?.trim() || false
    const clinicValid = !!selectedClinic?.id
    const birthdateValid = !!formData.birthdate && formData.birthdate.trim() !== ''
    const sexValid = !!formData.sex
    return firstnameValid && lastnameValid && clinicValid && birthdateValid && sexValid
  }, [formData.firstname, formData.lastname, formData.birthdate, formData.sex, selectedClinic, isEditMode])

  const handleSubmit = () => {
    // Validate all required fields
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
        persistChanges({ clinicId: clinic.id } as Partial<ExtendedUpdatePatientInput>)
      }
      validateClinic(clinic)
    } else {
      setSelectedClinic(null)
      updateLocalState({ clinicId: undefined } as Partial<ExtendedCreatePatientInput>)
      if (isEditMode) {
        persistChanges({ clinicId: undefined } as Partial<ExtendedUpdatePatientInput>)
      }
      validateClinic(null)
    }
    setIsClinicDialogOpen(false)
  }

  const handlePositionSelect = (locations: LocationNodeType[]) => {
    const position = locations[0]
    if (position) {
      setSelectedPosition(position)
      updateLocalState({ positionId: position.id } as Partial<ExtendedCreatePatientInput>)
      persistChanges({ positionId: position.id } as Partial<ExtendedUpdatePatientInput>)
    } else {
      setSelectedPosition(null)
      updateLocalState({ positionId: undefined } as Partial<ExtendedCreatePatientInput>)
      persistChanges({ positionId: undefined } as Partial<ExtendedUpdatePatientInput>)
    }
    setIsPositionDialogOpen(false)
  }

  const handleTeamsSelect = (locations: LocationNodeType[]) => {
    setSelectedTeams(locations)
    const teamIds = locations.map(loc => loc.id)
    updateLocalState({ teamIds } as Partial<ExtendedCreatePatientInput>)
    persistChanges({ teamIds } as Partial<ExtendedUpdatePatientInput>)
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

  const tasks = patientData?.patient?.tasks || []
  const openTasks = sortByDueDate(tasks.filter(t => !t.done))
  const closedTasks = sortByDueDate(tasks.filter(t => t.done))
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

  if (isEditMode && isLoadingPatient) {
    return <LoadingContainer />
  }

  const handleToggleDone = (taskId: string, done: boolean) => {
    if (done) {
      completeTask({ id: taskId })
    } else {
      reopenTask({ id: taskId })
    }
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
              <div className="flex flex-col gap-4 pt-4 pb-24">
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
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setTaskId(task.id)}
                          onToggleDone={(done) => handleToggleDone(task.id, done)}
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
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setTaskId(task.id)}
                          onToggleDone={(done) => handleToggleDone(task.id, done)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Tab>
          )}

          <Tab label={translation('patientData')} className="flex-col-6 px-1 pt-4 h-full overflow-x-visible overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
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
                      persistChanges({ firstname: formData.firstname })
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
                      persistChanges({ lastname: formData.lastname })
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
                    // TODO fix this later when hightide use UTC strings only
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
                      persistChanges({ birthdate: isoDate })
                    }
                  }}
                  onRemove={() => {
                    updateLocalState({ birthdate: null })
                    persistChanges({ birthdate: null })
                    if (!isEditMode) {
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
                    persistChanges({ sex: value as Sex })
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

            {!isEditMode && (
              <FormElementWrapper label="">
                {() => (
                  <div className="flex items-center gap-2">
                    <CheckboxUncontrolled
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
                    <div className="flex gap-2 flex-wrap">
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
                            persistChanges({ clinicId: undefined } as Partial<ExtendedUpdatePatientInput>)
                          }
                          validateClinic(null)
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
                          persistChanges({ positionId: undefined } as Partial<ExtendedUpdatePatientInput>)
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
                          persistChanges({ teamIds: [] } as Partial<ExtendedUpdatePatientInput>)
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

            {isEditMode && patientId && patientData?.patient && patientData.patient.state !== PatientState.Dead && (
              <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
                <Button
                  onClick={() => setIsMarkDeadDialogOpen(true)}
                  color="negative"
                  coloringStyle="outline"
                >
                  {translation('markPatientDead')}
                </Button>
              </div>
            )}
          </Tab>

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
            refetch().catch(console.error)
            setIsCreatingTask(false)
          }}
          onClose={() => {
            setTaskId(null)
            setIsCreatingTask(false)
          }}
        />
      </SidePanel>
    </div>
  )
}
