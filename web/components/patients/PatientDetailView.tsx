import { useEffect, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, UpdatePatientInput } from '@/api/gql/generated'
import { Sex, useCreatePatientMutation, useUpdatePatientMutation, useGetPatientQuery } from '@/api/gql/generated'
import {
  Input,
  LoadingButton,
  Select,
  SelectOption,
  Tab,
  TabView,
  LoadingContainer,
  FormElementWrapper,
  Button
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { DateInput } from '@/components/ui/DateInput'
import { CheckCircle2, Circle, Clock, MapPin } from 'lucide-react'
import { PropertyList } from '@/components/PropertyList'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import type { LocationNodeType } from '@/api/gql/generated'

interface PatientDetailViewProps {
  patientId?: string,
  onClose: () => void,
  onSuccess: () => void,
}

const toISODate = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultBirthdate = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return toISODate(d)
}

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="typography-label-sm font-bold text-text-secondary">{label}</label>
    {children}
  </div>
)

export const PatientDetailView = ({ patientId, onClose, onSuccess }: PatientDetailViewProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const isEditMode = !!patientId

  const { data: patientData, isLoading: isLoadingPatient } = useGetPatientQuery(
    { id: patientId! },
    { enabled: isEditMode }
  )

  const [fullName, setFullName] = useState('')
  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    sex: Sex.Female,
    assignedLocationIds: selectedLocationId ? [selectedLocationId] : [],
    birthdate: getDefaultBirthdate()
  })
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<LocationNodeType[]>([])

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
      setFullName(`${firstname} ${lastname}`)
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
    // Only include assignedLocationIds if there are locations selected
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

  const tasks = patientData?.patient?.tasks || []
  const openTasks = tasks.filter(t => !t.done)
  const closedTasks = tasks.filter(t => t.done)

  if (isEditMode && isLoadingPatient) {
    return <LoadingContainer />
  }

  return (
    <div className="flex-col-0 h-full bg-surface">
      <div className="flex-none mb-6">
        <div className="typography-title-lg text-primary">
          {fullName || translation('newPatient')}
        </div>
      </div>

      <div className="flex-col-0 flex-grow overflow-hidden">
        <TabView className="h-full flex-col-0">
          <Tab label={translation('overview')} className="h-full overflow-x-visible pr-2">
            <div className="flex-col-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={translation('firstName')}>
                  <Input
                    value={formData.firstname}
                    placeholder={translation('firstName')}
                    onChange={e => {
                      const val = e.target.value
                      setFullName(`${val} ${formData.lastname}`)
                      updateLocalState({ firstname: val })
                    }}
                    onBlur={() => persistChanges({ firstname: formData.firstname })}
                  />
                </FormField>
                <FormField label={translation('lastName')}>
                  <Input
                    value={formData.lastname}
                    placeholder={translation('lastName')}
                    onChange={e => {
                      const val = e.target.value
                      setFullName(`${formData.firstname} ${val}`)
                      updateLocalState({ lastname: val })
                    }}
                    onBlur={() => persistChanges({ lastname: formData.lastname })}
                  />
                </FormField>
              </div>

              <FormElementWrapper label={translation('birthdate')}>
                {(bag) => (
                  <DateInput
                    {...bag}
                    date={new Date(formData.birthdate as string)}
                    onValueChange={date => {
                      const dateStr = toISODate(date)
                      updateLocalState({ birthdate: dateStr })
                      persistChanges({ birthdate: dateStr })
                    }}
                  />
                )}
              </FormElementWrapper>


              <FormField label={translation('sex')}>
                <Select
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
              </FormField>

              <FormField label={translation('assignedLocation')}>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
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
                      <MapPin className="size-4" />
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
                        ×
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
                          <MapPin className="size-3" />
                          {location.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          </Tab>

          {patientId && (
            <Tab label={translation('properties')} className="h-full overflow-y-auto pr-2 pt-2 pb-16">
              <PropertyList subjectId={patientId} subjectType="patient"/>
            </Tab>
          )}

          <Tab label={translation('tasks')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4">
              <div>
                <h3 className="typography-label-md font-bold mb-3 flex items-center gap-2">
                  <Circle className="size-4 text-warning"/>
                  {translation('openTasks')} ({openTasks.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {openTasks.length === 0 &&
                    <div className="text-description italic">{translation('noOpenTasks')}</div>}
                  {openTasks.map(task => (
                    <div key={task.id}
                         className="p-3 rounded-lg border border-divider bg-surface hover:border-primary transition-colors cursor-pointer">
                      <div className="font-semibold">{task.title}</div>
                      {task.description &&
                        <div className="text-sm text-description mt-1 line-clamp-2">{task.description}</div>}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-warning">
                          <Clock className="size-3"/>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="opacity-75">
                <h3 className="typography-label-md font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-positive"/>
                  {translation('closedTasks')} ({closedTasks.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {closedTasks.length === 0 &&
                    <div className="text-description italic">{translation('noClosedTasks')}</div>}
                  {closedTasks.map(task => (
                    <div key={task.id} className="p-3 rounded-lg border border-divider bg-surface-subdued">
                      <div className="font-semibold line-through text-description">{task.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

      <LocationSelectionDialog
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
        onSelect={handleLocationSelect}
        initialSelectedIds={selectedLocations.map(loc => loc.id)}
        multiSelect={true}
      />
    </div>
  )
}