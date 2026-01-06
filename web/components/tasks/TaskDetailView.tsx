import { useEffect, useState, useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import {
  PatientState,
  PropertyEntity,
  useAssignTaskMutation,
  useAssignTaskToTeamMutation,
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetLocationsQuery,
  useGetPatientsQuery,
  useGetPropertyDefinitionsQuery,
  useGetTaskQuery,
  useGetUsersQuery,
  useReopenTaskMutation,
  useUnassignTaskMutation,
  useUnassignTaskFromTeamMutation,
  UpdateTaskDocument,
  type GetTaskQuery,
  type PropertyValueInput,
  type UpdateTaskMutation,
  type UpdateTaskMutationVariables
} from '@/api/gql/generated'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
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
import { User, Flag } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { AssigneeSelect } from './AssigneeSelect'
import { SidePanel } from '@/components/layout/SidePanel'
import { localToUTCWithSameTime, PatientDetailView } from '@/components/patients/PatientDetailView'
import { PropertyList } from '@/components/PropertyList'
import { ErrorDialog } from '@/components/ErrorDialog'
import { useAtomicMutation } from '@/hooks/useAtomicMutation'
import { fetcher } from '@/api/gql/fetcher'

interface TaskDetailViewProps {
  taskId: string | null,
  onClose: () => void,
  onSuccess: () => void,
  initialPatientId?: string,
}

export const TaskDetailView = ({ taskId, onClose, onSuccess, initialPatientId }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()
  const queryClient = useQueryClient()
  const { selectedRootLocationIds } = useTasksContext()
  const [isShowingPatientDialog, setIsShowingPatientDialog] = useState<boolean>(false)
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean, message?: string }>({ isOpen: false })
  const isEditMode = !!taskId

  const [titleError, setTitleError] = useState<string | null>(null)
  const [patientIdError, setPatientIdError] = useState<string | null>(null)

  const { data: taskData, isLoading: isLoadingTask } = useGetTaskQuery(
    { id: taskId! },
    {
      enabled: isEditMode,
      refetchOnMount: true,
    }
  )

  const { data: patientsData } = useGetPatientsQuery(
    {
      rootLocationIds: selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined,
      states: [PatientState.Admitted, PatientState.Wait],
    },
    {
      enabled: !isEditMode,
    }
  )

  const { data: usersData } = useGetUsersQuery(undefined, {})
  const { data: locationsData } = useGetLocationsQuery(undefined, {})


  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
    )
  }, [propertyDefinitionsData])

  const { mutate: createTask, isLoading: isCreating } = useCreateTaskMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      await queryClient.invalidateQueries({ queryKey: ['GetOverviewData'] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create task' })
    },
  })

  const { updateField, flush } = useAtomicMutation<UpdateTaskMutation, { id: string, data: UpdateTaskInput }>({
    mutationFn: async (variables) => {
      return fetcher<UpdateTaskMutation, UpdateTaskMutationVariables>(
        UpdateTaskDocument,
        variables
      )()
    },
    queryKey: ['GetTask', { id: taskId }],
    timeoutMs: 3000,
    immediateFields: ['assigneeId', 'assigneeTeamId'] as unknown as (keyof { id: string, data: UpdateTaskInput })[],
    onChangeFields: ['priority', 'done'] as unknown as (keyof { id: string, data: UpdateTaskInput })[],
    onBlurFields: ['title', 'description'] as unknown as (keyof { id: string, data: UpdateTaskInput })[],
    onCloseFields: ['dueDate'] as unknown as (keyof { id: string, data: UpdateTaskInput })[],
    getChecksum: (data) => data?.updateTask?.checksum || null,
    invalidateQueries: [['GetTask', { id: taskId }], ['GetTasks'], ['GetPatients'], ['GetOverviewData'], ['GetGlobalData']],
  })

  const { mutate: assignTask } = useAssignTaskMutation({
    onMutate: async (variables) => {
      if (!taskId) return
      await queryClient.cancelQueries({ queryKey: ['GetTask', { id: taskId }] })
      const previousData = queryClient.getQueryData<GetTaskQuery>(['GetTask', { id: taskId }])
      const user = usersData?.users?.find(u => u.id === variables.userId)
      if (previousData?.task && user) {
        queryClient.setQueryData<GetTaskQuery>(['GetTask', { id: taskId }], {
          ...previousData,
          task: {
            ...previousData.task,
            assignee: {
              __typename: 'UserType' as const,
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              lastOnline: user.lastOnline,
              isOnline: user.isOnline ?? false,
            },
            assigneeTeam: null,
          },
        })
      }
      return { previousData }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData && taskId) {
        queryClient.setQueryData(['GetTask', { id: taskId }], context.previousData)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
    },
  })

  const { mutate: unassignTask } = useUnassignTaskMutation({
    onMutate: async () => {
      if (!taskId) return
      await queryClient.cancelQueries({ queryKey: ['GetTask', { id: taskId }] })
      const previousData = queryClient.getQueryData<GetTaskQuery>(['GetTask', { id: taskId }])
      if (previousData?.task) {
        queryClient.setQueryData<GetTaskQuery>(['GetTask', { id: taskId }], {
          ...previousData,
          task: {
            ...previousData.task,
            assignee: null,
            assigneeTeam: null,
          },
        })
      }
      return { previousData }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData && taskId) {
        queryClient.setQueryData(['GetTask', { id: taskId }], context.previousData)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
    },
  })

  const { mutate: assignTaskToTeam } = useAssignTaskToTeamMutation({
    onMutate: async (variables) => {
      if (!taskId) return
      await queryClient.cancelQueries({ queryKey: ['GetTask', { id: taskId }] })
      const previousData = queryClient.getQueryData<GetTaskQuery>(['GetTask', { id: taskId }])
      const team = locationsData?.locationNodes?.find(loc => loc.id === variables.teamId && loc.kind === 'TEAM')
      if (previousData?.task && team) {
        queryClient.setQueryData<GetTaskQuery>(['GetTask', { id: taskId }], {
          ...previousData,
          task: {
            ...previousData.task,
            assignee: null,
            assigneeTeam: {
              __typename: 'LocationNodeType' as const,
              id: team.id,
              title: team.title,
              kind: team.kind,
            },
          },
        })
      }
      return { previousData }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData && taskId) {
        queryClient.setQueryData(['GetTask', { id: taskId }], context.previousData)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
    },
  })

  const { mutate: unassignTaskFromTeam } = useUnassignTaskFromTeamMutation({
    onMutate: async () => {
      if (!taskId) return
      await queryClient.cancelQueries({ queryKey: ['GetTask', { id: taskId }] })
      const previousData = queryClient.getQueryData<GetTaskQuery>(['GetTask', { id: taskId }])
      if (previousData?.task) {
        queryClient.setQueryData<GetTaskQuery>(['GetTask', { id: taskId }], {
          ...previousData,
          task: {
            ...previousData.task,
            assignee: null,
            assigneeTeam: null,
          },
        })
      }
      return { previousData }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData && taskId) {
        queryClient.setQueryData(['GetTask', { id: taskId }], context.previousData)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
    },
  })

  const { mutate: completeTask } = useCompleteTaskMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetTask', { id: taskId }] })
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      await queryClient.invalidateQueries({ queryKey: ['GetOverviewData'] })
      const patientId = taskData?.task?.patient?.id
      if (patientId) {
        await queryClient.invalidateQueries({ queryKey: ['GetPatient', { id: patientId }] })
      }
      onSuccess()
    },
  })

  const { mutate: reopenTask } = useReopenTaskMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetTask', { id: taskId }] })
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      await queryClient.invalidateQueries({ queryKey: ['GetOverviewData'] })
      const patientId = taskData?.task?.patient?.id
      if (patientId) {
        await queryClient.invalidateQueries({ queryKey: ['GetPatient', { id: patientId }] })
      }
      onSuccess()
    },
  })

  const { mutate: deleteTask, isLoading: isDeleting } = useDeleteTaskMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onSuccess()
      onClose()
    },
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
      setFormData({
        title: task.title,
        description: task.description || '',
        patientId: task.patient?.id || '',
        assigneeId: task.assignee?.id || null,
        assigneeTeamId: task.assigneeTeam?.id || null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: (task.priority as TaskPriority | null) || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done || false,
      })
    } else if (initialPatientId && !taskId) {
      setFormData(prev => ({ ...prev, patientId: initialPatientId }))
    }
  }, [taskData?.task, isEditMode, initialPatientId, taskId])

  useEffect(() => {
    return () => {
      if (isEditMode) {
        flush()
      }
    }
  }, [isEditMode, flush])

  const updateLocalState = (updates: Partial<CreateTaskInput & { done: boolean, assigneeTeamId?: string | null }>) => {
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

  const handleFieldUpdate = (updates: Partial<UpdateTaskInput>, triggerType?: 'onChange' | 'onBlur' | 'onClose') => {
    if (!isEditMode || !taskId) return
    updateField({ id: taskId, data: updates }, triggerType)
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
        dueDate: formData.dueDate ? localToUTCWithSameTime(formData.dueDate)?.toISOString() : null,
        priority: (formData.priority as TaskPriority | null) || undefined,
        estimatedTime: formData.estimatedTime,
        properties: formData.properties
      } as CreateTaskInput & { priority?: TaskPriority | null, estimatedTime?: number | null }
    })
  }

  const patients = patientsData?.patients || []

  const expectedFinishDate = useMemo(() => {
    if (!formData.dueDate || !formData.estimatedTime) return null
    const finishDate = new Date(formData.dueDate)
    finishDate.setMinutes(finishDate.getMinutes() + formData.estimatedTime)
    return finishDate
  }, [formData.dueDate, formData.estimatedTime])

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
                      updateLocalState({ done: checked })
                      if (checked) {
                        completeTask({ id: taskId })
                      } else {
                        reopenTask({ id: taskId })
                      }
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
                          } else if (taskId) {
                            handleFieldUpdate({ title: formData.title }, 'onBlur')
                          }
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
                    <AssigneeSelect
                      {...bag}
                      value={currentAssigneeValue}
                      onValueChanged={handleAssigneeChange}
                      allowTeams={true}
                      allowUnassigned={true}
                    />
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
                      updateLocalState({ dueDate: date })
                    }}
                    onEditCompleted={(date) => {
                      updateLocalState({ dueDate: date })
                      if (isEditMode && taskId) {
                        handleFieldUpdate({ dueDate: date ? localToUTCWithSameTime(date)?.toISOString() : null }, 'onClose')
                      }
                    }}
                    onRemove={() => {
                      updateLocalState({ dueDate: null })
                      if (isEditMode && taskId) {
                        handleFieldUpdate({ dueDate: null }, 'onClose')
                      }
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
                        updateLocalState({ priority: priorityValue })
                        if (isEditMode && taskId) {
                          handleFieldUpdate({ priority: priorityValue }, 'onChange')
                        }
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
                      updateLocalState({ estimatedTime: isNaN(value as number) ? null : value })
                    }}
                    onBlur={() => {
                      if (isEditMode && taskId) {
                        handleFieldUpdate({
                          estimatedTime: formData.estimatedTime,
                        })
                      }
                    }}
                  />
                )}
              </FormElementWrapper>

              {expectedFinishDate && (
                <div className="flex items-center gap-2">
                  <Flag className="size-4" />
                  <SmartDate date={expectedFinishDate} mode="relative" showTime={true} />
                </div>
              )}

              <FormElementWrapper label={translation('description')}>
                {({ isShowingError: _1, setIsShowingError: _2, ...bag }) => (
                  <Textarea
                    {...bag}
                    value={formData.description || ''}
                    placeholder={translation('descriptionPlaceholder')}
                    onChange={e => updateLocalState({ description: e.target.value })}
                    onBlur={() => {
                      if (isEditMode && taskId) {
                        handleFieldUpdate({ description: formData.description }, 'onBlur')
                      }
                    }}
                    minLength={4}
                  />
                )}
              </FormElementWrapper>

              {isEditMode && taskId && (
                <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
                  <LoadingButton
                    onClick={() => {
                      if (taskId) {
                        deleteTask({ id: taskId })
                      }
                    }}
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
                    if (!taskId) return

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
          onSuccess={onSuccess}
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

      <ErrorDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false })}
        message={errorDialog.message}
      />
    </div>
  )
}
