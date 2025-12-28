import { useEffect, useState, useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import {
  useAssignTaskMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetPatientsQuery,
  useGetPropertyDefinitionsQuery,
  useGetTaskQuery,
  useGetUsersQuery,
  useUnassignTaskMutation,
  useUpdateTaskMutation,
  PropertyEntity
} from '@/api/gql/generated'
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DateTimeInput,
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
import { useTasksContext } from '@/hooks/useTasksContext'
import { User } from 'lucide-react'
import { SidePanel } from '@/components/layout/SidePanel'
import { localToUTCWithSameTime, PatientDetailView } from '@/components/patients/PatientDetailView'
import { PropertyList } from '@/components/PropertyList'
import type { PropertyValueInput } from '@/api/gql/generated'

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

  const [titleError, setTitleError] = useState<string | null>(null)
  const [patientIdError, setPatientIdError] = useState<string | null>(null)

  const { data: taskData, isLoading: isLoadingTask, refetch } = useGetTaskQuery(
    { id: taskId! },
    {
      enabled: isEditMode,
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const { data: patientsData } = useGetPatientsQuery(
    { locationId: selectedLocationId },
    {
      enabled: !isEditMode,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  )
  const { data: usersData } = useGetUsersQuery(
    undefined,
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  )

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
    )
  }, [propertyDefinitionsData])

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
    priority: null,
    estimatedTime: null,
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
        priority: (taskData.task.priority as TaskPriority | null) || null,
        estimatedTime: taskData.task.estimatedTime ?? null,
        done: taskData.task.done || false
      })
    } else if (initialPatientId && !taskId) {
      setFormData(prev => ({ ...prev, patientId: initialPatientId }))
    }
  }, [taskData, initialPatientId, taskId])

  const updateLocalState = (updates: Partial<CreateTaskInput>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateTitle = (value: string): boolean => {
    if (!value || !value.trim()) {
      setTitleError(translation('taskTitlePlaceholder') + ' is required')
      return false
    }
    setTitleError(null)
    return true
  }

  const validatePatientId = (value: string | null | undefined): boolean => {
    if (!value || !value.trim()) {
      setPatientIdError(translation('patient') + ' is required')
      return false
    }
    setPatientIdError(null)
    return true
  }

  const isFormValid = useMemo(() => {
    if (isEditMode) return true
    const titleValid = formData.title?.trim() || false
    const patientIdValid = !!formData.patientId
    return titleValid && patientIdValid
  }, [formData.title, formData.patientId, isEditMode])

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
    const titleValid = validateTitle(formData.title || '')
    const patientIdValid = validatePatientId(formData.patientId)

    if (!titleValid || !patientIdValid) {
      return
    }

    createTask({
      data: {
        title: formData.title,
        patientId: formData.patientId,
        description: formData.description,
        assigneeId: formData.assigneeId,
        dueDate: formData.dueDate,
        priority: (formData.priority as TaskPriority | null) || undefined,
        estimatedTime: formData.estimatedTime,
        properties: formData.properties
      } as CreateTaskInput & { priority?: TaskPriority | null, estimatedTime?: number | null }
    })
  }

  const patients = patientsData?.patients || []
  const users = usersData?.users || []

  if (isEditMode && isLoadingTask) {
    return <LoadingContainer/>
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow overflow-hidden flex flex-col">
        <TabView className="h-full flex flex-col">
          <Tab label={translation('overview')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pt-4 pb-24">
              <div className="flex items-center gap-3 ml-4">
                {isEditMode && (
                  <Checkbox
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
                <div className="flex-1">
                  <FormElementWrapper
                    label=""
                    error={titleError || undefined}
                    isShowingError={!!titleError}
                  >
                    {({ isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => (
                      <Input
                        {...bag}
                        id="task-title"
                        name="task-title"
                        value={formData.title || ''}
                        placeholder={translation('taskTitlePlaceholder')}
                        required
                        onChange={e => {
                          updateLocalState({ title: e.target.value })
                          if (isShowingError) {
                            validateTitle(e.target.value)
                          }
                        }}
                        onBlur={() => {
                          if (!isEditMode) {
                            validateTitle(formData.title || '')
                          }
                          persistChanges({ title: formData.title })
                        }}
                        className="flex-1 text-lg py-3"
                      />
                    )}
                  </FormElementWrapper>
                </div>
              </div>

              <FormElementWrapper
                label={translation('patient')}
                error={patientIdError || undefined}
                isShowingError={!!patientIdError}
              >
                {({ isShowingError: _isShowingError, setIsShowingError: _setIsShowingError, ...bag }) => {
                  return (!isEditMode) ? (
                    <Select
                      {...bag}
                      value={formData.patientId}
                      onValueChanged={(value) => {
                        updateLocalState({ patientId: value })
                        validatePatientId(value)
                      }}
                      disabled={isEditMode}
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
              </FormElementWrapper>

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
                  <DateTimeInput
                    {...bag}
                    date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    mode="dateTime"
                    onValueChange={(date) => {
                      updateLocalState({ dueDate: date })
                    }}
                    onEditCompleted={(date) => {
                      updateLocalState({ dueDate: date })
                      persistChanges({ dueDate: date ? localToUTCWithSameTime(date) : null })
                    }}
                    onRemove={() => {
                      updateLocalState({ dueDate: null })
                      persistChanges({ dueDate: null })
                    }}
                  />
                )}
              </FormElementWrapper>

              <FormElementWrapper label="Priority">
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <Select
                    {...bag}
                    value={formData.priority || 'none'}
                    onValueChanged={(value) => {
                      const priorityValue = value === 'none' ? null : (value as TaskPriority)
                      updateLocalState({ priority: priorityValue })
                      persistChanges({ priority: priorityValue })
                    }}
                  >
                    <SelectOption value="none">None</SelectOption>
                    <SelectOption value="P1">P1</SelectOption>
                    <SelectOption value="P2">P2</SelectOption>
                    <SelectOption value="P3">P3</SelectOption>
                    <SelectOption value="P4">P4</SelectOption>
                  </Select>
                )}
              </FormElementWrapper>

              <FormElementWrapper label="Estimated Time (minutes)">
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <Input
                    {...bag}
                    type="number"
                    min="0"
                    step="1"
                    value={formData.estimatedTime?.toString() || ''}
                    placeholder="e.g. 30"
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
                      updateLocalState({ estimatedTime: isNaN(value as number) ? null : value })
                    }}
                    onBlur={() => {
                      persistChanges({ estimatedTime: formData.estimatedTime })
                    }}
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

              {isEditMode && taskId && (
                <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
                  <LoadingButton
                    onClick={() => setIsDeleteDialogOpen(true)}
                    isLoading={isDeleting}
                    color="negative"
                    coloringStyle="outline"
                  >
                    {translation('delete')}
                  </LoadingButton>
                </div>
              )}
            </div>
          </Tab>
          {isEditMode && hasAvailableProperties && (
            <Tab label={translation('properties')} className="h-full overflow-y-auto pr-2">
              <div className="flex flex-col gap-4 pt-4">
                <PropertyList
                  subjectId={taskId!}
                  subjectType="task"
                  fullWidthAddButton={true}
                  propertyValues={taskData?.task?.properties?.map(p => ({
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
                    const existingProperties = taskData?.task?.properties?.map(p => ({
                      definitionId: p.definition.id,
                      textValue: p.textValue,
                      numberValue: p.numberValue,
                      booleanValue: p.booleanValue,
                      dateValue: p.dateValue,
                      dateTimeValue: p.dateTimeValue,
                      selectValue: p.selectValue,
                      multiSelectValues: p.multiSelectValues,
                    })) || []

                    const propertyExists = existingProperties.some(p => p.definitionId === definitionId)

                    const isValueEmpty = (!value.textValue || value.textValue.trim() === '') &&
                      (value.numberValue === undefined || value.numberValue === null) &&
                      (value.boolValue === undefined || value.boolValue === null) &&
                      !value.dateValue &&
                      !value.dateTimeValue &&
                      (!value.singleSelectValue || value.singleSelectValue.trim() === '') &&
                      (!value.multiSelectValue || (Array.isArray(value.multiSelectValue) && value.multiSelectValue.length === 0))

                    if (isValueEmpty && propertyExists) {
                      const updatedProperties = existingProperties.filter(p => p.definitionId !== definitionId)

                      updateTask({
                        id: taskId!,
                        data: {
                          properties: updatedProperties,
                        },
                      })
                    } else if (!isValueEmpty || !propertyExists) {
                      const propertyInput: PropertyValueInput = {
                        definitionId,
                        textValue: value.textValue || null,
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

                      updateTask({
                        id: taskId!,
                        data: {
                          properties: updatedProperties,
                        },
                      })
                    }
                  }}
                />
              </div>
            </Tab>
          )}
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
  )
}