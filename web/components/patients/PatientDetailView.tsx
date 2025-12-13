import { useEffect, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, TaskType, UpdatePatientInput } from '@/api/gql/generated'
import { Sex, useCreatePatientMutation, useUpdatePatientMutation } from '@/api/gql/generated'
import { Input, Select, SelectOption, LoadingButton, TabView, Tab } from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { PopupDatePicker } from '@/components/ui/PopupDatePicker'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface PatientDetailViewProps {
  patientId?: string,
  initialData?: Partial<CreatePatientInput> & {
    tasks?: TaskType[],
    name?: string,
  },
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

export const PatientDetailView = ({ patientId, initialData, onClose, onSuccess }: PatientDetailViewProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const isEditMode = !!patientId

  const [fullName, setFullName] = useState(initialData?.name || '')

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    sex: Sex.Female,
    assignedLocationId: selectedLocationId ?? '',
    ...initialData,
    birthdate: initialData?.birthdate ? toISODate(initialData.birthdate) : getDefaultBirthdate()
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        birthdate: initialData.birthdate ? toISODate(initialData.birthdate) : prev.birthdate
      }))

      if (initialData.firstname && initialData.lastname) {
        setFullName(`${initialData.firstname} ${initialData.lastname}`)
      } else if (initialData.name) {
        setFullName(initialData.name)
      }
    }
  }, [initialData])

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
    if (!dataToSend.assignedLocationId) {
      delete dataToSend.assignedLocationId
    }
    createPatient({ data: dataToSend })
  }

  const sexOptions = [
    { label: translation('male'), value: Sex.Male },
    { label: translation('female'), value: Sex.Female },
    { label: translation('diverse'), value: Sex.Unknown }
  ]

  const tasks = initialData?.tasks || []
  const openTasks = tasks.filter(t => !t.done)
  const closedTasks = tasks.filter(t => t.done)

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-none mb-6">
        <div className="typography-title-lg text-primary">
          {fullName}
        </div>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        <TabView className="h-full flex flex-col">
          <Tab label={translation('overview')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4">
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

              <PopupDatePicker
                label={translation('birthdate')}
                date={new Date(formData.birthdate as string)}
                onDateChange={date => {
                  const dateStr = toISODate(date)
                  updateLocalState({ birthdate: dateStr })
                  persistChanges({ birthdate: dateStr })
                }}
              />

              <FormField label={translation('sex')}>
                <Select
                  value={formData.sex}
                  onValueChanged={(value) => {
                    updateLocalState({ sex: value as Sex })
                    persistChanges({ sex: value as Sex })
                  }}
                  contentPanelProps={{ containerClassName: 'z-[100]' }}
                >
                  {sexOptions.map(option => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </Select>
              </FormField>
            </div>
          </Tab>

          <Tab label={translation('tasks')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4">
              <div>
                <h3 className="typography-label-md font-bold mb-3 flex items-center gap-2">
                  <Circle className="size-4 text-warning" />
                  {translation('openTasks')} ({openTasks.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {openTasks.length === 0 && <div className="text-description italic">{translation('noOpenTasks')}</div>}
                  {openTasks.map(task => (
                    <div key={task.id} className="p-3 rounded-lg border border-divider bg-surface hover:border-primary transition-colors cursor-pointer">
                      <div className="font-semibold">{task.title}</div>
                      {task.description && <div className="text-sm text-description mt-1 line-clamp-2">{task.description}</div>}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-warning">
                          <Clock className="size-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="opacity-75">
                <h3 className="typography-label-md font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-positive" />
                  {translation('closedTasks')} ({closedTasks.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {closedTasks.length === 0 && <div className="text-description italic">{translation('noClosedTasks')}</div>}
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
    </div>
  )
}
