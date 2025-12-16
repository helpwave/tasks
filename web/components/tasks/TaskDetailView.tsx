import { useEffect, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput } from '@/api/gql/generated'
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useAssignTaskMutation,
  useUnassignTaskMutation,
  useGetPatientsQuery,
  useGetUsersQuery,
  useGetTaskQuery
} from '@/api/gql/generated'
import {
  Input,
  LoadingButton,
  Select,
  SelectOption,
  Tab,
  TabView,
  Textarea,
  DateTimePicker,
  LoadingContainer
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { PropertyList } from '@/components/PropertyList'

interface TaskDetailViewProps {
  taskId?: string,
  onClose: () => void,
  onSuccess: () => void,
}

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="typography-label-sm font-bold text-text-secondary">{label}</label>
    {children}
  </div>
)

export const TaskDetailView = ({ taskId, onClose, onSuccess }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const isEditMode = !!taskId

  const { data: taskData, isLoading: isLoadingTask } = useGetTaskQuery(
    { id: taskId! },
    { enabled: isEditMode }
  )

  const { data: patientsData } = useGetPatientsQuery(
    { locationId: selectedLocationId },
    { enabled: !isEditMode }
  )
  const { data: usersData } = useGetUsersQuery()

  const { mutate: createTask, isLoading: isCreating } = useCreateTaskMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const { mutate: updateTask } = useUpdateTaskMutation({
    onSuccess: () => onSuccess()
  })

  const { mutate: assignTask } = useAssignTaskMutation({
    onSuccess: () => onSuccess()
  })

  const { mutate: unassignTask } = useUnassignTaskMutation({
    onSuccess: () => onSuccess()
  })

  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
    title: '',
    description: '',
    patientId: '',
    assigneeId: null,
    dueDate: null,
  })

  useEffect(() => {
    if (taskData?.task) {
      setFormData({
        title: taskData.task.title,
        description: taskData.task.description || '',
        patientId: taskData.task.patient?.id || '',
        assigneeId: taskData.task.assignee?.id || null,
        dueDate: taskData.task.dueDate ? new Date(taskData.task.dueDate) : null
      })
    }
  }, [taskData])

  const updateLocalState = (updates: Partial<CreateTaskInput>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const persistChanges = (updates: Partial<UpdateTaskInput>) => {
    if (isEditMode && taskId) {
      if (updates.title !== undefined && !updates.title?.trim()) return

      updateTask({
        id: taskId,
        data: updates as UpdateTaskInput
      })
    }
  }

  const handleAssigneeChange = (value: string) => {
    const newAssigneeId = value === 'unassigned' ? null : value

    updateLocalState({ assigneeId: newAssigneeId })

    if (isEditMode && taskId) {
      if (newAssigneeId) {
        assignTask({ id: taskId, userId: newAssigneeId })
      } else {
        unassignTask({ id: taskId })
      }
    }
  }

  const handleSubmit = () => {
    if (!formData.title?.trim() || !formData.patientId) return

    createTask({
      data: {
        title: formData.title,
        patientId: formData.patientId,
        description: formData.description,
        assigneeId: formData.assigneeId,
        dueDate: formData.dueDate,
        properties: formData.properties
      } as CreateTaskInput
    })
  }

  const patients = patientsData?.patients || []
  const users = usersData?.users || []

  if (isEditMode && isLoadingTask) {
    return <LoadingContainer />
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-none mb-6">
        <div className="typography-title-lg text-primary">
          {isEditMode ? translation('editTask') : translation('createTask')}
        </div>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        <TabView className="h-full flex flex-col">
          <Tab label={translation('overview')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4">

              <FormField label={translation('title')}>
                <Input
                  value={formData.title || ''}
                  placeholder={translation('taskTitlePlaceholder')}
                  onChange={e => updateLocalState({ title: e.target.value })}
                  onBlur={() => persistChanges({ title: formData.title })}
                />
              </FormField>

              <FormField label={translation('patient')}>
                <Select
                  value={formData.patientId}
                  onValueChanged={(value) => updateLocalState({ patientId: value })}
                  disabled={isEditMode}
                  contentPanelProps={{ containerClassName: 'z-[100]' }}
                >
                  {patients.map(p => (
                    <SelectOption key={p.id} value={p.id}>
                      {p.name}
                    </SelectOption>
                  ))}
                  {isEditMode && taskData?.task?.patient && !patients.find(p => p.id === taskData.task?.patient?.id) && (
                    <SelectOption value={taskData.task.patient.id}>{taskData.task.patient.name}</SelectOption>
                  )}
                </Select>
              </FormField>

              <FormField label={translation('assignedTo')}>
                <Select
                  value={formData.assigneeId || 'unassigned'}
                  onValueChanged={handleAssigneeChange}
                >
                  <SelectOption value="unassigned">{translation('unassigned')}</SelectOption>
                  {users.map(u => (
                    <SelectOption key={u.id} value={u.id}>
                      {u.name}
                    </SelectOption>
                  ))}
                </Select>
              </FormField>

              <FormField label={translation('dueDate')}>
                <DateTimePicker
                  value={formData.dueDate ? new Date(formData.dueDate) : undefined}
                  onChange={(date) => {
                    updateLocalState({ dueDate: date })
                    persistChanges({ dueDate: date })
                  }}
                />
              </FormField>

              <FormField label={translation('description')}>
                <Textarea
                  value={formData.description || ''}
                  placeholder={translation('descriptionPlaceholder')}
                  onChange={e => updateLocalState({ description: e.target.value })}
                  onBlur={() => persistChanges({ description: formData.description })}
                  minLength={4}
                />
              </FormField>

            </div>
          </Tab>

          {taskId && (
            <Tab label={translation('properties')} className="h-full overflow-y-auto pr-2 pt-2 pb-16">
              <PropertyList subjectId={taskId} subjectType="task" />
            </Tab>
          )}
        </TabView>
      </div>

      {!isEditMode && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isCreating}
            disabled={!formData.title?.trim() || !formData.patientId}
          >
            {translation('create')}
          </LoadingButton>
        </div>
      )}
    </div>
  )
}