import { useEffect, useState, useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import { PatientState } from '@/api/gql/generated'
import { useCreateTask, useDeleteTask, usePatients, useTask, useUpdateTask, useAssignTask, useAssignTaskToTeam, useUnassignTask, useRefreshingEntityIds } from '@/data'
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
import { CenteredLoadingLogo } from '@/components/CenteredLoadingLogo'
import { useTasksContext } from '@/hooks/useTasksContext'
import { User, Flag } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { AssigneeSelect } from './AssigneeSelect'
import { localToUTCWithSameTime, PatientDetailView } from '@/components/patients/PatientDetailView'
import { ErrorDialog } from '@/components/ErrorDialog'
import clsx from 'clsx'
import { PriorityUtils } from '@/utils/priority'

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
  const { refreshingTaskIds } = useRefreshingEntityIds()

  const { data: taskData, loading: isLoadingTask } = useTask(
    taskId ?? '',
    { skip: !isEditMode }
  )

  const { data: patientsData } = usePatients(
    {
      rootLocationIds: selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined,
      states: [PatientState.Admitted, PatientState.Wait],
    },
    { skip: isEditMode }
  )

  const [createTask, { loading: isCreating }] = useCreateTask()
  const [updateTaskMutate] = useUpdateTask()
  const [assignTask] = useAssignTask()
  const [assignTaskToTeam] = useAssignTaskToTeam()
  const [unassignTask] = useUnassignTask()
  const updateTask = (vars: { id: string, data: UpdateTaskInput }) => {
    updateTaskMutate({
      variables: vars,
      onCompleted: () => onSuccess?.(),
      onError: (err) => {
        setErrorDialog({
          isOpen: true,
          message: err instanceof Error ? err.message : 'Update failed',
        })
      },
    }).catch(() => {})
  }

  const [deleteTask, { loading: isDeleting }] = useDeleteTask()

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
        variables: {
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
        },
        onCompleted: () => {
          onSuccess?.()
          onClose?.()
        },
        onError: (error) => {
          setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create task' })
        },
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
      if (!isEditMode || !taskId || !taskData) return
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
      const current = taskData
      const sameTitle = (data.title ?? current.title) === current.title
      const sameDescription = (data.description ?? current.description ?? '') === (current.description ?? '')
      const sameDueDate = (data.dueDate ?? current.dueDate ?? null) === (current.dueDate ?? null)
      const samePriority = (data.priority ?? current.priority ?? null) === (current.priority ?? null)
      const sameEstimatedTime = (data.estimatedTime ?? current.estimatedTime ?? null) === (current.estimatedTime ?? null)
      const sameDone = (data.done ?? current.done) === current.done
      const sameAssigneeId = (data.assigneeId ?? current.assignee?.id ?? null) === (current.assignee?.id ?? null)
      const sameAssigneeTeamId = (data.assigneeTeamId ?? current.assigneeTeam?.id ?? null) === (current.assigneeTeam?.id ?? null)
      if (sameTitle && sameDescription && sameDueDate && samePriority && sameEstimatedTime && sameDone && sameAssigneeId && sameAssigneeTeamId) return
      updateTask({ id: taskId, data })
    }
  })

  const { update: updateForm } = form

  useEffect(() => {
    if (taskData && isEditMode) {
      const task = taskData
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
  }, [taskData, isEditMode, initialPatientId, taskId, updateForm])

  const patients = patientsData?.patients || []

  const dueDate = useFormObserverKey({ formStore: form.store, formKey: 'dueDate' })?.value ?? null
  const estimatedTime = useFormObserverKey({ formStore: form.store, formKey: 'estimatedTime' })?.value ?? null
  const expectedFinishDate = useMemo(() => {
    if (!dueDate || !estimatedTime) return null
    const finishDate = new Date(dueDate)
    finishDate.setMinutes(finishDate.getMinutes() + estimatedTime)
    return finishDate
  }, [dueDate, estimatedTime])

  if (isEditMode && isLoadingTask) {
    return <CenteredLoadingLogo />
  }

  const priorities = [
    { value: 'P1', label: translation('priority', { priority: 'P1' }) },
    { value: 'P2', label: translation('priority', { priority: 'P2' }) },
    { value: 'P3', label: translation('priority', { priority: 'P3' }) },
    { value: 'P4', label: translation('priority', { priority: 'P4' }) },
  ]

  const isRefreshing = isEditMode && taskId != null && refreshingTaskIds.has(taskId)

  return (
    <>
      {isRefreshing && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-neutral-100 dark:bg-neutral-800 mb-4">
          <LoadingContainer className="size-5 shrink-0" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{translation('refreshing')}</span>
        </div>
      )}
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
                        PriorityUtils.toCheckboxColor(priority as TaskPriority | null | undefined))}
                    />
                  )}
                </FormObserver>
              </Visibility>
              <div className="flex-1">
                <FormField<TaskFormValues, 'title'>
                  name="title"
                  label={translation('task')}
                  required
                  showRequiredIndicator={!isEditMode}
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
              required
              showRequiredIndicator={!isEditMode}
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
                      { taskData?.patient?.name}
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
                <AssigneeSelect
                  value={dataProps.value ?? ''}
                  onValueChanged={(value) => {
                    updateForm(prev => {
                      if (value.startsWith('team:')) {
                        return { ...prev, assigneeId: null, assigneeTeamId: value.replace('team:', '') }
                      }
                      return { ...prev, assigneeId: value || null, assigneeTeamId: null }
                    })
                    if (isEditMode && taskId) {
                      if (!value || value === '') {
                        unassignTask({
                          variables: { id: taskId },
                          onCompleted: () => onSuccess?.(),
                        }).catch(() => {})
                      } else if (value.startsWith('team:')) {
                        assignTaskToTeam({
                          variables: { id: taskId, teamId: value.replace('team:', '') },
                          onCompleted: () => onSuccess?.(),
                        }).catch(() => {})
                      } else {
                        assignTask({
                          variables: { id: taskId, userId: value },
                          onCompleted: () => onSuccess?.(),
                        }).catch(() => {})
                      }
                    }
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
                    <SelectOption value="none" iconAppearance="right">{translation('priorityNone')}</SelectOption>
                    {priorities.map(({ value, label }) => (
                      <SelectOption key={value} value={value} iconAppearance="right">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${PriorityUtils.toBackgroundColor(value as TaskPriority | null | undefined)}`} />
                          <span>{label}</span>
                        </div>
                      </SelectOption>
                    ))}
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
                      deleteTask({
                        variables: { id: taskId },
                        onCompleted: () => {
                          onSuccess?.()
                          onClose?.()
                        },
                      })
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
            patientId={taskData?.patient?.id}
            onClose={() => setIsShowingPatientDialog(false)}
            onSuccess={() => {}}
          />
        </Drawer>
      </FormProvider>
    </>
  )
}
