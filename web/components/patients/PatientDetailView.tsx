import { useEffect, useMemo, useState } from 'react'
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
  Select,
  SelectOption,
  Tab,
  TabView
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { CheckCircle2, ChevronDown, Circle, Clock, MapPin, PlusIcon, XIcon } from 'lucide-react'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import clsx from 'clsx'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { SmartDate } from '@/utils/date'
import { formatLocationPath } from '@/utils/location'

const toISODate = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const localToUTCWithSameTime = (d: Date) => {
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
              <Clock className="size-3"/>
              <SmartDate date={new Date(task.dueDate)} mode="relative" showTime={false}/>
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
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const isEditMode = !!patientId

  const { data: patientData, isLoading: isLoadingPatient, refetch } = useGetPatientQuery(
    { id: patientId! },
    { enabled: isEditMode }
  )

  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: () => refetch() })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: () => refetch() })

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    sex: Sex.Female,
    assignedLocationIds: selectedLocationId ? [selectedLocationId] : [],
    birthdate: getDefaultBirthdate(),
    state: PatientState.Wait,
    ...initialCreateData,
  })
  const [isWaiting, setIsWaiting] = useState(false)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<LocationNodeType[]>([])
  const [isMarkDeadDialogOpen, setIsMarkDeadDialogOpen] = useState(false)
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false)

  useEffect(() => {
    if (patientData?.patient) {
      const { firstname, lastname, sex, birthdate, assignedLocations } = patientData.patient
      setFormData({
        firstname,
        lastname,
        sex,
        birthdate: toISODate(birthdate),
        assignedLocationIds: assignedLocations.map(loc => loc.id)
      })
      setSelectedLocations(assignedLocations as LocationNodeType[])
    }
  }, [patientData])

  const { mutate: createPatient, isLoading: isCreating } = useCreatePatientMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const { mutate: updatePatient } = useUpdatePatientMutation({
    onSuccess: () => {
      onSuccess()
      refetch()
    }
  })

  const { mutate: admitPatient } = useAdmitPatientMutation({
    onSuccess: () => {
      onSuccess()
      refetch()
    }
  })

  const { mutate: dischargePatient } = useDischargePatientMutation({
    onSuccess: () => {
      onSuccess()
      refetch()
    }
  })

  const { mutate: markPatientDead } = useMarkPatientDeadMutation({
    onSuccess: () => {
      onSuccess()
      refetch()
    }
  })

  const { mutate: waitPatient } = useWaitPatientMutation({
    onSuccess: () => {
      onSuccess()
      refetch()
    }
  })

  const persistChanges = (updates: Partial<UpdatePatientInput>) => {
    if (updates.firstname !== undefined && !updates.firstname?.trim()) return
    if (updates.lastname !== undefined && !updates.lastname?.trim()) return

    if (isEditMode && patientId) {
      updatePatient({
        id: patientId,
        data: updates as UpdatePatientInput
      })
    }
  }

  const updateLocalState = (updates: Partial<CreatePatientInput>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = () => {
    if (!formData.firstname.trim() || !formData.lastname.trim()) return

    const dataToSend = { ...formData }
    dataToSend.state = isWaiting ? PatientState.Wait : PatientState.Admitted

    if (!dataToSend.assignedLocationIds || dataToSend.assignedLocationIds.length === 0) {
      delete dataToSend.assignedLocationIds
    }

    createPatient({ data: dataToSend })
  }

  const handleLocationSelect = (locations: LocationNodeType[]) => {
    setSelectedLocations(locations)
    const locationIds = locations.map(loc => loc.id)
    updateLocalState({ assignedLocationIds: locationIds })
    persistChanges({ assignedLocationIds: locationIds })
    setIsLocationDialogOpen(false)
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

  const startDate = useMemo(() => {
    const year = new Date()
    year.setFullYear(year.getFullYear() - 100)
    return year
  }, [])

  const endDate = useMemo(() => {
    return new Date()
  }, [])

  if (isEditMode && isLoadingPatient) {
    return <LoadingContainer/>
  }

  const patientName = patientData?.patient ? `${patientData.patient.firstname} ${patientData.patient.lastname}` : ''
  const patientLocation = selectedLocations.length > 0 ? selectedLocations.map(loc => formatLocationPath(loc)).join(' ▸ ') : ''

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
            {patientData?.patient?.state && (
              <PatientStateChip state={patientData.patient.state}/>
            )}
          </div>
          {patientLocation && (
            <div className="flex items-center gap-1 text-sm text-description">
              <MapPin className="size-3"/>
              {patientLocation}
            </div>
          )}
        </div>
      )}
      <div className="flex-col-0 flex-grow overflow-hidden">
        <TabView className="h-full flex-col-0">
          <Tab label={translation('tasks')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-4 pt-4">
              {isEditMode && (
                <div className="mb-2">
                  <Button
                    startIcon={<PlusIcon/>}
                    onClick={() => setIsCreatingTask(true)}
                    className="w-full"
                  >
                    {translation('addTask')}
                  </Button>
                </div>
              )}
              <div>
                <button
                  onClick={() => setOpenExpanded(!openExpanded)}
                  className="text-lg font-bold mb-3 flex items-center gap-2 w-full text-left"
                >
                  <ChevronDown className={clsx('size-5 transition-transform', { '-rotate-90': !openExpanded })}/>
                  <Circle className="size-5 text-warning"/>
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
                  <ChevronDown className={clsx('size-5 transition-transform', { '-rotate-90': !closedExpanded })}/>
                  <CheckCircle2 className="size-5 text-positive"/>
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

          <Tab label={translation('patientData')} className="flex-col-6 px-1 pt-4 h-full overflow-x-visible ">
            <div className="grid grid-cols-2 gap-4">
              <FormElementWrapper label={translation('firstName')}>
                {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                  <Input
                    {...bag}
                    value={formData.firstname}
                    placeholder={translation('firstName')}
                    onChange={e => {
                      const val = e.target.value
                      updateLocalState({ firstname: val })
                    }}
                    onBlur={() => persistChanges({ firstname: formData.firstname })}
                  />
                )}
              </FormElementWrapper>
              <FormElementWrapper label={translation('lastName')}>
                {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                  <Input
                    {...bag}
                    value={formData.lastname}
                    placeholder={translation('lastName')}
                    onChange={e => {
                      const val = e.target.value
                      updateLocalState({ lastname: val })
                    }}
                    onBlur={() => persistChanges({ lastname: formData.lastname })}
                  />
                )}
              </FormElementWrapper>
            </div>

            <FormElementWrapper label={translation('birthdate')}>
              {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                <DateTimeInput
                  {...bag}
                  date={new Date(formData.birthdate as string)}
                  pickerProps={{
                    start: startDate,
                    end: endDate
                  }}
                  mode="date"
                  onValueChange={(date) => {
                    // TODO fix this later when hightide use UTC strings only
                    const dateStr = toISODate(date)
                    updateLocalState({ birthdate: dateStr })
                  }}
                  onEditCompleted={(date) => {
                    updateLocalState({ birthdate: toISODate(date) })
                    persistChanges({ birthdate: toISODate(localToUTCWithSameTime(date)) })
                  }}
                  onRemove={() => {
                    updateLocalState({ birthdate: null })
                    persistChanges({ birthdate: null })
                  }}
                />
              )}
            </FormElementWrapper>


            <FormElementWrapper label={translation('sex')}>
              {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                <Select
                  {...bag}
                  value={formData.sex}
                  onValueChanged={(value) => {
                    updateLocalState({ sex: value as Sex })
                    persistChanges({ sex: value as Sex })
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

            <FormElementWrapper label={translation('assignedLocation')}>
              {({ isShowingError: _, setIsShowingError: _2, ...bag }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      {...bag}
                      value={selectedLocations.length > 0
                        ? selectedLocations.map(loc => loc.title).join(', ')
                        : ''}
                      placeholder={translation('selectLocation')}
                      readOnly
                      className="flex-grow"
                    />
                    <Button
                      onClick={() => setIsLocationDialogOpen(true)}
                      layout="icon"
                      title={translation('selectLocation')}
                    >
                      <MapPin className="size-4"/>
                    </Button>
                    {selectedLocations.length > 0 && (
                      <Button
                        onClick={() => {
                          setSelectedLocations([])
                          updateLocalState({ assignedLocationIds: [] })
                          persistChanges({ assignedLocationIds: [] })
                        }}
                        layout="icon"
                        color="neutral"
                        title={translation('clear')}
                      >
                        <XIcon className="size-5"/>
                      </Button>
                    )}
                  </div>
                  {selectedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedLocations.map(location => (
                        <span
                          key={location.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-subdued text-sm"
                        >
                          <MapPin className="size-3"/>
                          {location.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormElementWrapper>
          </Tab>

        </TabView>
      </div>

      {!isEditMode && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isCreating}
          >
            {translation('create')}
          </LoadingButton>
        </div>
      )}

      {isEditMode && patientId && patientData?.patient && patientData.patient.state !== PatientState.Dead && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <Button
            onClick={() => setIsMarkDeadDialogOpen(true)}
            color="negative"
            coloringStyle="text"
          >
            {translation('markPatientDead')}
          </Button>
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
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
        onSelect={handleLocationSelect}
        initialSelectedIds={selectedLocations.map(loc => loc.id)}
        multiSelect={true}
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
