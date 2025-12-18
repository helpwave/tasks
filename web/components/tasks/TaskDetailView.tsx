import { useEffect, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput } from '@/api/gql/generated'
import {
  useAssignTaskMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetPatientsQuery,
  useGetTaskQuery,
  useGetUsersQuery,
  useUnassignTaskMutation,
  useUpdateTaskMutation
} from '@/api/gql/generated'
import {
  Button,
  CheckboxUncontrolled,
  ConfirmDialog,
  FormElementWrapper,
  Input,
  LoadingButton,
  LoadingContainer,
  Select,
  SelectOption,
  Tab,
  TabView,
  Textarea
} from '@helpwave/hightide'
import { ValidatedFormElementWrapper, FormValidationProvider, useFormValidationContext } from '@/components/ui/Form'
import { useTasksContext } from '@/hooks/useTasksContext'
import { User } from 'lucide-react'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { DateInput } from '@/components/ui/DateInput'

interface TaskDetailViewProps {
  taskId: string | null,
  onClose: () => void,
  onSuccess: () => void,
  initialPatientId?: string,
}

export const TaskDetailView = ({ taskId, onClose, onSuccess, initialPatientId }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const [isShowingPatientDialog, setIsShowingPatientDialog] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const isEditMode = !!taskId

  const { data: taskData, isLoading: isLoadingTask, refetch } = useGetTaskQuery(
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
    onSuccess: () => {
      refetch()
      onSuccess()
    }
  })

  const { mutate: assignTask } = useAssignTaskMutation({
    onSuccess: () => onSuccess()
  })

  const { mutate: unassignTask } = useUnassignTaskMutation({
    onSuccess: () => onSuccess()
  })

  const { mutate: deleteTask, isLoading: isDeleting } = useDeleteTaskMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const [formData, setFormData] = useState<Partial<CreateTaskInput & { done: boolean }>>({
    title: '',
    description: '',
    patientId: initialPatientId || '',
    assigneeId: null,
    dueDate: null,
    done: false,
  })

  useEffect(() => {
    if (taskData?.task) {
      setFormData({
        title: taskData.task.title,
        description: taskData.task.description || '',
        patientId: taskData.task.patient?.id || '',
        assigneeId: taskData.task.assignee?.id || null,
        dueDate: taskData.task.dueDate ? new Date(taskData.task.dueDate) : null,
        done: taskData.task.done || false
      })
    } else if (initialPatientId && !taskId) {
      setFormData(prev => ({ ...prev, patientId: initialPatientId }))
    }
  }, [taskData, initialPatientId, taskId])

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

  const validationContext = useFormValidationContext()

  const isFormValid = (() => {
    if (!validationContext) return true
    return validationContext.isFormValid()
  })()

  const handleSubmit = () => {
    if (validationContext) {
      validationContext.validateAll()
    }

    const checkAndSubmit = () => {
      if (!formData.title?.trim() || !formData.patientId) {
        return
      }

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

    requestAnimationFrame(() => {
      setTimeout(checkAndSubmit, 0)
    })
  }

  const patients = patientsData?.patients || []
  const users = usersData?.users || []

  if (isEditMode && isLoadingTask) {
    return <LoadingContainer/>
  }

  return (
    <FormValidationProvider>
      <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow overflow-hidden flex flex-col">
        <TabView className="h-full flex flex-col">
          <Tab label={translation('overview')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center gap-3 ml-4">
                {isEditMode && (
                  <CheckboxUncontrolled
                    id="task-done"
                    checked={formData.done || false}
                    onCheckedChange={(checked) => {
                      if (!taskId) return
                      const newDoneValue = !checked
                      updateLocalState({ done: newDoneValue } as Partial<CreateTaskInput & { done: boolean }>)
                      updateTask({
                        id: taskId,
                        data: { done: newDoneValue } as UpdateTaskInput
                      })
                    }}
                    className="rounded-full scale-125"
                  />
                )}
                <ValidatedFormElementWrapper
                  value={formData.title}
                  required={true}
                >
                  {({ invalid, ...bag }) => (
                    <Input
                      {...bag}
                      id="task-title"
                      name="task-title"
                      value={formData.title || ''}
                      placeholder={translation('taskTitlePlaceholder')}
                      onChange={e => updateLocalState({ title: e.target.value })}
                      onBlur={() => persistChanges({ title: formData.title })}
                      className="flex-1 text-lg py-3"
                      invalid={invalid}
                    />
                  )}
                </ValidatedFormElementWrapper>
              </div>

              <ValidatedFormElementWrapper
                label={translation('patient')}
                value={formData.patientId}
                required={!isEditMode}
              >
                {({ invalid, ...bag }) => {
                  return (!isEditMode) ? (
                    <Select
                      {...bag}
                      value={formData.patientId}
                      onValueChanged={(value) => updateLocalState({ patientId: value })}
                      disabled={isEditMode}
                      invalid={invalid}
                    >
                      {patients.map(patient => {
                        return (
                          <SelectOption key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectOption>
                        )
                      })}
                    </Select>
                  ) : (
                    <div id={bag.id}>
                      <Button
                        color="neutral"
                        onClick={() => setIsShowingPatientDialog(true)}
                        className="w-fit"
                      >
                        <User className="size-4"/>
                        { taskData?.task?.patient?.name}
                      </Button>
                    </div>
                  )
                }}
              </ValidatedFormElementWrapper>

              <FormElementWrapper label={translation('assignedTo')}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <Select
                    {...bag}
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
                )}
              </FormElementWrapper>

              <FormElementWrapper label={translation('dueDate')}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <DateInput
                    {...bag}
                    date={formData.dueDate}
                    onValueChange={(date) => {
                      updateLocalState({ dueDate: date })
                      persistChanges({ dueDate: date })
                    }}
                    onRemove={() => {
                      updateLocalState({ dueDate: null })
                      persistChanges({ dueDate: null })
                    }}
                    mode="dateTime"
                  />
                )}
              </FormElementWrapper>

              <FormElementWrapper label={translation('description')}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <Textarea
                    {...bag}
                    value={formData.description || ''}
                    placeholder={translation('descriptionPlaceholder')}
                    onChange={e => updateLocalState({ description: e.target.value })}
                    onBlur={() => persistChanges({ description: formData.description })}
                    minLength={4}
                  />
                )}
              </FormElementWrapper>
            </div>
          </Tab>
        </TabView>
      </div>

      <SidePanel
        isOpen={isShowingPatientDialog}
        onClose={() => setIsShowingPatientDialog(false)}
        title={translation('editPatient')}
      >
        <PatientDetailView
          patientId={formData.patientId}
          onClose={() => setIsShowingPatientDialog(false)}
          onSuccess={refetch}
        />
      </SidePanel>

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

      {isEditMode && taskId && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <LoadingButton
            onClick={() => setIsDeleteDialogOpen(true)}
            isLoading={isDeleting}
            color="neutral"
            coloringStyle="outline"
          >
            {translation('delete')}
          </LoadingButton>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (taskId) {
            deleteTask({ id: taskId })
          }
          setIsDeleteDialogOpen(false)
        }}
        titleElement={translation('delete')}
        description={translation('deleteTaskConfirmation')}
        confirmType="negative"
      />
      </div>
    </FormValidationProvider>
  )
}