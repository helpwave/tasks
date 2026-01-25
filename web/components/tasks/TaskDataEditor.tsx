import { useEffect, useState, useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import {
  PatientState,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetPatientsQuery,
  useGetTaskQuery
} from '@/api/gql/generated'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import {
  Button,
  Checkbox,
  DateTimeInput,
  FormProvider,
  FormField,
  Input,
  LoadingContainer,
  Select,
  SelectOption,
  Textarea,
  useCreateForm,
  Drawer,
  useFormObserverKey,
  Visibility,
  FormObserver
} from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { User, Flag } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { AssigneeSelect } from './AssigneeSelect'
import { localToUTCWithSameTime, PatientDetailView } from '@/components/patients/PatientDetailView'
import { useOptimisticUpdateTaskMutation } from '@/api/optimistic-updates/GetTask'
import { ErrorDialog } from '@/components/ErrorDialog'
import clsx from 'clsx'

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

const getPriorityCheckboxColor = (priority: TaskPriority | null | undefined): string => {
  if (!priority) return ''
  switch (priority) {
  case 'P1':
    return 'border-green-500 text-green-500 data-[checked]:bg-green-500/30'
  case 'P2':
    return 'border-blue-500 text-blue-500 data-[checked]:bg-blue-500/30'
  case 'P3':
    return 'border-orange-500 text-orange-500 data-[checked]:bg-orange-500/30'
  case 'P4':
    return 'border-red-500 text-red-500 data-[checked]:bg-red-500/30'
  default:
    return ''
  }
}

type TaskFormValues = CreateTaskInput & {
  done: boolean,
  assigneeTeamId?: string | null,
}

interface TaskDataEditorProps {
  id: null | string,
  initialPatientId?: string,
  onSuccess?: () => void,
  onClose?: () => void,
}

export const TaskDataEditor = ({
  id,
  initialPatientId,
  onSuccess,
  onClose,
}: TaskDataEditorProps) => {
  const translation = useTasksTranslation()
  const { selectedRootLocationIds } = useTasksContext()
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean, message?: string }>({ isOpen: false })
  const [isShowingPatientDialog, setIsShowingPatientDialog] = useState<boolean>(false)

  const isEditMode = id !== null
  const taskId = id

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

  const [isCreating, setIsCreating] = useState<boolean>(false)
  const { mutate: createTask } = useCreateTaskMutation({
    onMutate: () => {
      setIsCreating(true)
    },
    onSettled: () => {
      setIsCreating(false)
    },
    onSuccess: async () => {
      onSuccess?.()
      onClose?.()
    },
    onError: (error) => {
      setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create task' })
    },
  })

  const { mutate: updateTask } = useOptimisticUpdateTaskMutation({
    id: taskId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { mutate: deleteTask } = useDeleteTaskMutation({
    onMutate: () => {
      setIsDeleting(true)
    },
    onSettled: () => {
      setIsDeleting(false)
    },
    onSuccess: () => {
      onSuccess?.()
      onClose?.()
    },
  })

  const form = useCreateForm<TaskFormValues>({
    initialValues: {
      title: '',
      description: '',
      patientId: initialPatientId || '',
      assigneeId: null,
      assigneeTeamId: null,
      dueDate: null,
      priority: null,
      estimatedTime: null,
      done: false,
    },
    onFormSubmit: (values) => {
      createTask({
        data: {
          title: values.title,
          patientId: values.patientId,
          description: values.description,
          assigneeId: values.assigneeId,
          assigneeTeamId: values.assigneeTeamId,
          dueDate: values.dueDate ? localToUTCWithSameTime(values.dueDate)?.toISOString() : null,
          priority: (values.priority as TaskPriority | null) || undefined,
          estimatedTime: values.estimatedTime,
          properties: values.properties
        } as CreateTaskInput & { priority?: TaskPriority | null, estimatedTime?: number | null }
      })
    },
    validators: {
      title: (value) => {
        if (!value || !value.trim()) {
          return translation('taskTitlePlaceholder') + ' is required'
        }
        return null
      },
      patientId: (value) => {
        if (!value || !value.trim()) {
          return translation('patient') + ' is required'
        }
        return null
      },
    },
    onValidUpdate: (_, updates) => {
      if (isEditMode && taskId) {
        const data: UpdateTaskInput = {
          title: updates?.title,
          description: updates?.description,
          dueDate: updates?.dueDate ? localToUTCWithSameTime(updates.dueDate)?.toISOString() : undefined,
          priority: updates?.priority as TaskPriority | null | undefined,
          estimatedTime: updates?.estimatedTime,
          done: updates?.done,
          assigneeId: updates?.assigneeId,
          assigneeTeamId: updates?.assigneeTeamId,
        }
        updateTask({ id: taskId, data })
      }
    }
  })

  const { update: updateForm } = form

  useEffect(() => {
    if (taskData?.task && isEditMode) {
      const task = taskData.task
      updateForm(prev => ({
        ...prev,
        title: task.title,
        description: task.description || '',
        patientId: task.patient?.id || '',
        assigneeId: task.assignee?.id || null,
        assigneeTeamId: task.assigneeTeam?.id || null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: (task.priority as TaskPriority | null) || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done || false,
      }))
    } else if (initialPatientId && !taskId) {
      updateForm(prev => ({ ...prev, patientId: initialPatientId }))
    }
  }, [taskData?.task, isEditMode, initialPatientId, taskId, updateForm])

  const patients = patientsData?.patients || []

  const dueDate = useFormObserverKey({ formStore: form.store, key: 'dueDate' })?.value ?? null
  const estimatedTime = useFormObserverKey({ formStore: form.store, key: 'estimatedTime' })?.value ?? null
  const expectedFinishDate = useMemo(() => {
    if (!dueDate || !estimatedTime) return null
    const finishDate = new Date(dueDate)
    finishDate.setMinutes(finishDate.getMinutes() + estimatedTime)
    return finishDate
  }, [dueDate, estimatedTime])

  if (isEditMode && isLoadingTask) {
    return <LoadingContainer/>
  }

  return (
    <>
      <FormProvider state={form}>
        <form onSubmit={event => { event.preventDefault(); form.submit() }}>
          <div className="flex flex-col gap-6 pt-4 pb-24">
            <div className="flex items-center gap-3">
              <Visibility isVisible={isEditMode}>
                <FormObserver>
                  {({ values: { done, priority } }) => (
                    <Checkbox
                      id="task-done"
                      value={done || false}
                      onValueChange={(checked) => {
                        // TODO replace with form.update when it allows setting the update trigger
                        form.store.setValue('done', checked, true)
                      }}
                      className={clsx('rounded-full scale-125',
                        getPriorityCheckboxColor(priority))}
                    />
                  )}
                </FormObserver>
              </Visibility>
              <div className="flex-1">
                <FormField<TaskFormValues, 'title'>
                  name="title"
                  label=""
                >
                  {({ dataProps, focusableElementProps, interactionStates }) => (
                    <Input
                      {...dataProps} {...focusableElementProps} {...interactionStates}
                      placeholder={translation('taskTitlePlaceholder')}
                      className="flex-1 text-lg py-3"
                    />
                  )}
                </FormField>
              </div>
            </div>

            <FormField<TaskFormValues, 'patientId'>
              name="patientId"
              label={translation('patient')}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => {
                return (!isEditMode) ? (
                  <Select
                    {...dataProps as FormFieldDataHandling<string>} {...focusableElementProps} {...interactionStates}
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
                  <div id={focusableElementProps.id}>
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
            </FormField>

            <FormField<TaskFormValues, 'assigneeId'>
              name="assigneeId"
              label={translation('assignedTo')}
            >
              {({ dataProps }) => (
                // TODO add interaction states to AssigneeSelect
                <AssigneeSelect
                  value={dataProps.value ?? ''}
                  onValueChanged={(value) => {
                    updateForm(prev => {
                      if(value.startsWith('team:')) {
                        return ({
                          ...prev, assigneeId: null, assigneeTeamId: value.replace('team:', '') })
                      } else {
                        return ({ ...prev, assigneeId: value, assigneeTeamId: null })
                      }
                    })
                  }}
                  allowTeams={true}
                  allowUnassigned={true}
                />
              )}
            </FormField>

            <FormField<TaskFormValues, 'dueDate'>
              name="dueDate"
              label={translation('dueDate')}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => (
                <DateTimeInput
                  {...dataProps} {...focusableElementProps} {...interactionStates}
                  value={dataProps.value ?? undefined}
                  isControlled={true}
                  mode="dateTime"
                />
              )}
            </FormField>

            <FormField<TaskFormValues, 'priority'>
              name="priority"
              label={translation('priorityLabel') ?? 'Priority'}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => {
                const priorityValue = dataProps.value || 'none'
                return (
                  <Select
                    {...dataProps as FormFieldDataHandling<string>} {...focusableElementProps} {...interactionStates}
                    value={priorityValue === null ? 'none' : priorityValue}
                    onValueChange={(value) => {
                      const priority = value === 'none' ? null : (value as TaskPriority)
                      dataProps.onValueChange?.(priority)
                      dataProps.onEditComplete?.(priority)
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
            </FormField>

            <FormField<TaskFormValues, 'estimatedTime'>
              name="estimatedTime"
              label={translation('estimatedTime') ?? 'Estimated Time (minutes)'}
            >
              {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates }) => (
                <Input
                  {...focusableElementProps} {...interactionStates}
                  type="number"
                  min="0"
                  step="1"
                  value={value?.toString() || ''}
                  placeholder="e.g. 30"
                  onChange={(e) => {
                    const numValue = e.target.value === '' ? null : parseInt(e.target.value, 10)
                    onValueChange?.(isNaN(numValue as number) ? null : numValue)
                  }}
                  onBlur={() => {
                    onEditComplete?.(value)
                  }}
                />
              )}
            </FormField>

            {expectedFinishDate && (
              <div className="flex items-center gap-2">
                <Flag className="size-4" />
                <SmartDate date={expectedFinishDate} mode="relative" showTime={true} />
              </div>
            )}

            <FormField<TaskFormValues, 'description'>
              name="description"
              label={translation('description')}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => (
                <Textarea
                  {...dataProps} {...focusableElementProps} {...interactionStates}
                  value={dataProps.value || ''}
                  placeholder={translation('descriptionPlaceholder')}
                  minLength={4}
                />
              )}
            </FormField>

            {isEditMode && taskId && (
              <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
                <Button
                  onClick={() => {
                    if (taskId) {
                      deleteTask({ id: taskId })
                    }
                  }}
                  disabled={isDeleting}
                  color="negative"
                  coloringStyle="outline"
                >
                  {isDeleting ? 'Deleting...' : translation('delete')}
                </Button>
              </div>
            )}
          </div>

          {!isEditMode && (
            <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
              <Button
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : translation('create')}
              </Button>
            </div>
          )}

          <ErrorDialog
            isOpen={errorDialog.isOpen}
            onClose={() => setErrorDialog({ isOpen: false })}
            message={errorDialog.message}
          />
        </form>
        <Drawer
          isOpen={isShowingPatientDialog}
          onClose={() => setIsShowingPatientDialog(false)}
          alignment="right"
          titleElement={translation('editPatient')}
          description={undefined}
        >
          <PatientDetailView
            patientId={taskData?.task?.patient?.id}
            onClose={() => setIsShowingPatientDialog(false)}
            onSuccess={() => {}}
          />
        </Drawer>
      </FormProvider>
    </>
  )
}
