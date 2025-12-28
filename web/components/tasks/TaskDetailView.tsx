import { useEffect, useState, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import {
  useAssignTaskMutation,
  useAssignTaskToTeamMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetLocationsQuery,
  useGetPatientsQuery,
  useGetPropertyDefinitionsQuery,
  useGetTaskQuery,
  useGetUsersQuery,
  useUnassignTaskMutation,
  useUnassignTaskFromTeamMutation,
  useUpdateTaskMutation,
  PropertyEntity,
  type GetTaskQuery
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
  const queryClient = useQueryClient()
  const [isShowingPatientDialog, setIsShowingPatientDialog] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const isEditMode = !!taskId

  const [titleError, setTitleError] = useState<string | null>(null)
  const [patientIdError, setPatientIdError] = useState<string | null>(null)

  const dirtyFieldsRef = useRef<Set<string>>(new Set())
  const lastServerUpdateRef = useRef<number>(0)
  const fieldUpdateTimestampsRef = useRef<Map<string, number>>(new Map())

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

  const { data: locationsData } = useGetLocationsQuery(
    undefined,
    {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    }
  )

  const teams = useMemo(() => {
    if (!locationsData?.locationNodes) return []
    return locationsData.locationNodes.filter(loc => loc.kind === 'TEAM')
  }, [locationsData])

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
    onSuccess: (data, variables) => {
      if (data?.updateTask && taskId) {
        queryClient.setQueryData<GetTaskQuery>(
          ['GetTask', { id: taskId }],
          (oldData) => {
            if (!oldData?.task) {
              return { task: data.updateTask } as GetTaskQuery
            }
            const mergedTask = {
              ...oldData.task,
              ...data.updateTask,
              patient: data.updateTask.patient || oldData.task.patient,
              assignee: data.updateTask.assignee || oldData.task.assignee,
            }
            if ('priority' in data.updateTask) {
              mergedTask.priority = data.updateTask.priority
            } else {
              mergedTask.priority = oldData.task.priority
            }
            if ('estimatedTime' in data.updateTask) {
              mergedTask.estimatedTime = data.updateTask.estimatedTime
            } else {
              mergedTask.estimatedTime = oldData.task.estimatedTime
            }
            if (oldData.task.properties) {
              mergedTask.properties = oldData.task.properties
            }
            return { task: mergedTask } as GetTaskQuery
          }
        )
        const now = Date.now()
        lastServerUpdateRef.current = now
        if (variables?.data) {
          Object.keys(variables.data).forEach(key => {
            if (variables.data[key as keyof UpdateTaskInput] !== undefined) {
              fieldUpdateTimestampsRef.current.set(key, now)
              dirtyFieldsRef.current.delete(key)
            }
          })
        }
      }
      onSuccess()
    }
  })

  const { mutate: assignTask } = useAssignTaskMutation({
    onSuccess: () => {
      refetch()
      onSuccess()
    }
  })

  const { mutate: unassignTask } = useUnassignTaskMutation({
    onSuccess: () => {
      refetch()
      onSuccess()
    }
  })

  const { mutate: assignTaskToTeam } = useAssignTaskToTeamMutation({
    onSuccess: () => {
      refetch()
      onSuccess()
    }
  })

  const { mutate: unassignTaskFromTeam } = useUnassignTaskFromTeamMutation({
    onSuccess: () => {
      refetch()
      onSuccess()
    }
  })

  const { mutate: deleteTask, isLoading: isDeleting } = useDeleteTaskMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const [formData, setFormData] = useState<Partial<CreateTaskInput & { done: boolean, assigneeTeamId?: string | null }>>({
    title: '',
    description: '',
    patientId: initialPatientId || '',
    assigneeId: null,
    assigneeTeamId: null,
    dueDate: null,
    priority: null,
    estimatedTime: null,
    done: false,
  })

  useEffect(() => {
    if (taskData?.task && isEditMode) {
      const task = taskData.task
      const updateTime = Date.now()
      const GRACE_PERIOD_MS = 5000

      if (updateTime <= lastServerUpdateRef.current + 100) {
        return
      }

      setFormData(prev => {
        const newPriority = (task.priority as TaskPriority | null) || null
        const newEstimatedTime = task.estimatedTime ?? null
        const newDueDate = task.dueDate ? new Date(task.dueDate) : null

        const shouldPreserveField = (fieldName: string): boolean => {
          const lastUpdate = fieldUpdateTimestampsRef.current.get(fieldName)
          if (lastUpdate && (updateTime - lastUpdate) < GRACE_PERIOD_MS) {
            return true
          }
          return dirtyFieldsRef.current.has(fieldName)
        }

        const hasDirtyFields = dirtyFieldsRef.current.size > 0 || Array.from(fieldUpdateTimestampsRef.current.values()).some(ts => (updateTime - ts) < GRACE_PERIOD_MS)

        if (hasDirtyFields) {
          const merged: Partial<CreateTaskInput & { done: boolean, assigneeTeamId?: string | null }> = {
            title: shouldPreserveField('title') ? prev.title : task.title,
            description: shouldPreserveField('description') ? prev.description : (task.description || ''),
            patientId: shouldPreserveField('patientId') ? prev.patientId : (task.patient?.id || ''),
            assigneeId: shouldPreserveField('assigneeId') ? prev.assigneeId : (task.assignee?.id || null),
            assigneeTeamId: shouldPreserveField('assigneeTeamId') ? prev.assigneeTeamId : (task.assigneeTeam?.id || null),
            dueDate: shouldPreserveField('dueDate') ? prev.dueDate : newDueDate,
            priority: shouldPreserveField('priority') ? prev.priority : newPriority,
            estimatedTime: shouldPreserveField('estimatedTime') ? prev.estimatedTime : newEstimatedTime,
            done: shouldPreserveField('done') ? prev.done : (task.done || false),
          }
          return { ...prev, ...merged }
        }

        const priorityChanged = prev.priority !== newPriority
        const estimatedTimeChanged = prev.estimatedTime !== newEstimatedTime
        const shouldPreservePriority = shouldPreserveField('priority')
        const shouldPreserveEstimatedTime = shouldPreserveField('estimatedTime')

        if (
          prev.title === task.title &&
          prev.description === (task.description || '') &&
          prev.patientId === (task.patient?.id || '') &&
          prev.assigneeId === (task.assignee?.id || null) &&
          prev.assigneeTeamId === (task.assigneeTeam?.id || null) &&
          prev.dueDate?.getTime() === newDueDate?.getTime() &&
          (priorityChanged ? shouldPreservePriority : prev.priority === newPriority) &&
          (estimatedTimeChanged ? shouldPreserveEstimatedTime : prev.estimatedTime === newEstimatedTime) &&
          prev.done === task.done
        ) {
          return prev
        }

        return {
          title: task.title,
          description: task.description || '',
          patientId: task.patient?.id || '',
          assigneeId: task.assignee?.id || null,
          assigneeTeamId: task.assigneeTeam?.id || null,
          dueDate: newDueDate,
          priority: shouldPreservePriority ? prev.priority : newPriority,
          estimatedTime: shouldPreserveEstimatedTime ? prev.estimatedTime : newEstimatedTime,
          done: task.done || false
        }
      })
    } else if (initialPatientId && !taskId) {
      setFormData(prev => ({ ...prev, patientId: initialPatientId }))
    }
  }, [taskData?.task, isEditMode, initialPatientId, taskId])

  const updateLocalState = (updates: Partial<CreateTaskInput>, markDirty = false) => {
    if (markDirty) {
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof CreateTaskInput] !== undefined) {
          dirtyFieldsRef.current.add(key)
        }
      })
    }
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

      Object.keys(updates).forEach(key => {
        if (updates[key as keyof UpdateTaskInput] !== undefined) {
          dirtyFieldsRef.current.add(key)
        }
      })

      const now = Date.now()
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof UpdateTaskInput] !== undefined) {
          fieldUpdateTimestampsRef.current.set(key, now)
        }
      })

      updateTask({
        id: taskId,
        data: updates as UpdateTaskInput
      }, {
        onSuccess: (data) => {
          if (data?.updateTask) {
            setFormData(prev => ({
              ...prev,
              ...(updates.title !== undefined && { title: data.updateTask.title }),
              ...(updates.description !== undefined && { description: data.updateTask.description || '' }),
              ...(updates.dueDate !== undefined && {
                dueDate: data.updateTask.dueDate ? new Date(data.updateTask.dueDate) : null
              }),
              ...(updates.priority !== undefined && {
                priority: (data.updateTask.priority as TaskPriority | null) || null
              }),
              ...(updates.estimatedTime !== undefined && {
                estimatedTime: data.updateTask.estimatedTime ?? null
              }),
              ...(updates.done !== undefined && { done: data.updateTask.done || false }),
              patientId: data.updateTask.patient?.id || prev.patientId,
            }))
          }
        }
      })
    }
  }

  const handleAssigneeChange = (value: string) => {
    if (value === 'unassigned') {
      updateLocalState({ assigneeId: null, assigneeTeamId: null })
      if (isEditMode && taskId) {
        if (taskData?.task?.assigneeTeam) {
          unassignTaskFromTeam({ id: taskId })
        } else {
          unassignTask({ id: taskId })
        }
      }
      return
    }

    const isTeam = value.startsWith('team:')
    const assigneeId = isTeam ? value.replace('team:', '') : value

    if (isTeam) {
      updateLocalState({ assigneeId: null, assigneeTeamId: assigneeId })
      if (isEditMode && taskId) {
        assignTaskToTeam({ id: taskId, teamId: assigneeId })
      }
    } else {
      updateLocalState({ assigneeId, assigneeTeamId: null })
      if (isEditMode && taskId) {
        assignTask({ id: taskId, userId: assigneeId })
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
        assigneeTeamId: formData.assigneeTeamId,
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
                          updateLocalState({ title: e.target.value }, true)
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
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => {
                  const currentAssigneeValue = taskData?.task?.assigneeTeam?.id
                    ? `team:${taskData.task.assigneeTeam.id}`
                    : (formData.assigneeId || taskData?.task?.assignee?.id || 'unassigned')
                  return (
                    <Select
                      {...bag}
                      value={currentAssigneeValue}
                      onValueChanged={handleAssigneeChange}
                    >
                      <SelectOption value="unassigned">{translation('unassigned')}</SelectOption>
                      {users.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-description">{translation('users') ?? 'Users'}</div>
                          {users.map(u => (
                            <SelectOption key={u.id} value={u.id}>
                              {u.name}
                            </SelectOption>
                          ))}
                        </>
                      )}
                      {teams.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-description">{translation('teams')}</div>
                          {teams.map(team => (
                            <SelectOption key={team.id} value={`team:${team.id}`}>
                              {team.title}
                            </SelectOption>
                          ))}
                        </>
                      )}
                    </Select>
                  )
                }}
              </FormElementWrapper>

              <FormElementWrapper label={translation('dueDate')}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <DateTimeInput
                    {...bag}
                    date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    mode="dateTime"
                    onValueChange={(date) => {
                      updateLocalState({ dueDate: date }, true)
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

              <FormElementWrapper label={translation('priorityLabel') ?? 'Priority'}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => {
                  const getPriorityDotColor = (priority: string | null | undefined): string => {
                    if (!priority) return ''
                    switch (priority) {
                      case 'P1':
                        return 'bg-green-500'
                      case 'P2':
                        return 'bg-blue-500'
                      case 'P3':
                        return 'bg-orange-500'
                      case 'P4':
                        return 'bg-red-500'
                      default:
                        return ''
                    }
                  }
                  return (
                    <Select
                      {...bag}
                      value={formData.priority || 'none'}
                      onValueChanged={(value) => {
                        const priorityValue = value === 'none' ? null : (value as TaskPriority)
                        updateLocalState({ priority: priorityValue }, true)
                        persistChanges({ priority: priorityValue })
                      }}
                    >
                      <SelectOption value="none">{translation('priorityNone')}</SelectOption>
                      <SelectOption value="P1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDotColor('P1')}`} />
                          <span>{translation('priority', { priority: 'P1' })}</span>
                        </div>
                      </SelectOption>
                      <SelectOption value="P2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDotColor('P2')}`} />
                          <span>{translation('priority', { priority: 'P2' })}</span>
                        </div>
                      </SelectOption>
                      <SelectOption value="P3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDotColor('P3')}`} />
                          <span>{translation('priority', { priority: 'P3' })}</span>
                        </div>
                      </SelectOption>
                      <SelectOption value="P4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDotColor('P4')}`} />
                          <span>{translation('priority', { priority: 'P4' })}</span>
                        </div>
                      </SelectOption>
                    </Select>
                  )
                }}
              </FormElementWrapper>

              <FormElementWrapper label={translation('estimatedTime') ?? 'Estimated Time (minutes)'}>
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
                      updateLocalState({ estimatedTime: isNaN(value as number) ? null : value }, true)
                    }}
                    onBlur={() => {
                      persistChanges({
                        estimatedTime: formData.estimatedTime,
                        priority: formData.priority
                      })
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
                    onChange={e => updateLocalState({ description: e.target.value }, true)}
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