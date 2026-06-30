import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@/api/gql/generated'
import { PatientState } from '@/api/gql/generated'
import { useCreateTask, useDeleteTask, useLocations, usePatients, useTask, useUpdateTask, useUsers, useRefreshingEntityIds } from '@/data'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import {
  Button,
  Checkbox,
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
  FormObserver,
  FlexibleDateTimeInput,
  IconButton,
  AvatarWithStatus
} from '@helpwave/hightide'
import { CenteredLoadingLogo } from '@/components/CenteredLoadingLogo'
import { useTasksContext } from '@/hooks/useTasksContext'
import { User, Flag, Info, PlusIcon, Users, XIcon } from 'lucide-react'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { AssigneeSelect } from './AssigneeSelect'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { DueDateUtils, getTaskDueDateFlexibleInputProps } from '@/utils/dueDate'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { ErrorDialog } from '@/components/ErrorDialog'
import { useCreateDraftDirty } from '@/hooks/useCreateDraftDirty'
import { serializeTaskCreateDraft } from '@/utils/createDraftSnapshots'
import clsx from 'clsx'
import { PriorityUtils } from '@/utils/priority'
import type { DialogState } from '@/types/DialogState'
import { applyDefinedOverrides } from '@/utils/applyDefinedOverrides'

type TaskFormValues = CreateTaskInput & {
  done: boolean,
  assigneeIds?: string[] | null,
  assigneeTeamId?: string | null,
}

export type TaskCreationInitialData = Partial<TaskFormValues> & {
  patientNameFallback?: string,
}

const defaultTaskFormValues: TaskFormValues = {
  title: '',
  description: '',
  patientId: '',
  assigneeIds: [],
  assigneeTeamId: null,
  dueDate: null,
  priority: null,
  estimatedTime: null,
  done: false,
}

interface TaskDataEditorProps {
  id: null | string,
  initialCreationData?: TaskCreationInitialData,
  onListSync?: () => void,
  onCreate?: (taskId: string) => void,
  onUpdate?: () => void,
  onDelete?: () => void,
  onCreateDraftDirtyChange?: (dirty: boolean) => void,
}

export const TaskDataEditor = ({
  id,
  initialCreationData,
  onListSync,
  onCreate,
  onUpdate,
  onDelete,
  onCreateDraftDirtyChange,
}: TaskDataEditorProps) => {
  const translation = useTasksTranslation()
  const { selectedRootLocationIds } = useTasksContext()
  const [errorDialog, setErrorDialog] = useState<DialogState<{ message?: string }>>({ isOpen: false, data: { message: undefined } })
  const [isShowingPatientDialog, setIsShowingPatientDialog] = useState<boolean>(false)
  const [assigneeUserPopupId, setAssigneeUserPopupId] = useState<string | null>(null)

  const isEditMode = id !== null
  const taskId = id
  const { refreshingTaskIds } = useRefreshingEntityIds()

  const { data: taskData, loading: isLoadingTask } = useTask(
    taskId ?? '',
    { skip: !isEditMode }
  )

  const { data: patientsData, refetch: refetchPatients } = usePatients(
    {
      rootLocationIds: selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined,
      states: [PatientState.Admitted, PatientState.Wait],
    },
    { skip: isEditMode }
  )
  const hasRetriedMissingInitialPatientRef = useRef(false)

  const [createTask, { loading: isCreating }] = useCreateTask()
  const [updateTaskMutate] = useUpdateTask()
  const { data: usersData } = useUsers()
  const { data: locationsData } = useLocations()
  const updateTask = (vars: { id: string, data: UpdateTaskInput }) => {
    updateTaskMutate({
      variables: vars,
      onCompleted: () => {
        onUpdate?.()
      },
      onError: (err) => {
        setErrorDialog({
          isOpen: true,
          data: { message: err instanceof Error ? err.message : 'Update failed' },
        })
      },
    }).catch(() => { })
  }

  const [deleteTask, { loading: isDeleting }] = useDeleteTask()

  const createFormInitialValues = useMemo((): TaskFormValues => {
    return applyDefinedOverrides(defaultTaskFormValues, initialCreationData)
  }, [initialCreationData])

  const form = useCreateForm<TaskFormValues>({
    initialValues: createFormInitialValues,
    onFormSubmit: (values) => {
      createTask({
        variables: {
          data: {
            title: values.title,
            patientId: values.patientId || null,
            description: values.description,
            assigneeIds: values.assigneeIds ?? [],
            assigneeTeamId: values.assigneeTeamId,
            dueDate: DueDateUtils.serializeForApi(values.dueDate),
            priority: (values.priority as TaskPriority | null) || undefined,
            estimatedTime: values.estimatedTime,
            properties: values.properties
          } as CreateTaskInput & { priority?: TaskPriority | null, estimatedTime?: number | null }
        },
        onCompleted: (data) => {
          onCreateDraftDirtyChange?.(false)
          onListSync?.()
          if(data?.createTask?.id) {
            onCreate?.(data?.createTask?.id)
          } else {
            console.error('createTask onCompleted: no task id', data)
          }
        },
        onError: (error) => {
          setErrorDialog({ isOpen: true, data: { message: error instanceof Error ? error.message : 'Failed to create task' } })
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
    },
    onValidUpdate: (_, updates) => {
      if (!isEditMode || !taskId || !taskData) return
      const nextDueDate = updates?.dueDate !== undefined
        ? DueDateUtils.serializeForApi(updates.dueDate)
        : undefined
      const data: UpdateTaskInput = {
        title: updates?.title,
        patientId: updates?.patientId === undefined ? undefined : (updates.patientId || null),
        description: updates?.description,
        dueDate: nextDueDate,
        priority: updates?.priority as TaskPriority | null | undefined,
        estimatedTime: updates?.estimatedTime,
        done: updates?.done,
        assigneeIds: updates?.assigneeIds,
        assigneeTeamId: updates?.assigneeTeamId,
      }
      const current = taskData
      const sameTitle = (data.title ?? current.title) === current.title
      const sameDescription = (data.description ?? current.description ?? '') === (current.description ?? '')
      const sameDueDate = (nextDueDate !== undefined ? nextDueDate : (current.dueDate ?? null)) === (current.dueDate ?? null)
      const samePriority = (data.priority ?? current.priority ?? null) === (current.priority ?? null)
      const sameEstimatedTime = (data.estimatedTime ?? current.estimatedTime ?? null) === (current.estimatedTime ?? null)
      const sameDone = (data.done ?? current.done) === current.done
      const currentAssigneeIds = [...(current.assignees?.map((assignee) => assignee.id) ?? [])].sort()
      const nextAssigneeIds = [...(data.assigneeIds ?? currentAssigneeIds)].sort()
      const sameAssigneeIds = currentAssigneeIds.length === nextAssigneeIds.length
        && currentAssigneeIds.every((assigneeId, index) => assigneeId === nextAssigneeIds[index])
      const sameAssigneeTeamId = (data.assigneeTeamId ?? current.assigneeTeam?.id ?? null) === (current.assigneeTeam?.id ?? null)
      const samePatientId = (data.patientId ?? current.patient?.id ?? null) === (current.patient?.id ?? null)
      if (sameTitle && sameDescription && sameDueDate && samePriority && sameEstimatedTime && sameDone && samePatientId && sameAssigneeIds && sameAssigneeTeamId) return
      updateTask({ id: taskId, data })
    }
  })

  const { update: updateForm } = form

  const serializeTaskDraft = useCallback(
    (values: TaskFormValues) => serializeTaskCreateDraft(values),
    []
  )

  useCreateDraftDirty({
    enabled: !isEditMode && onCreateDraftDirtyChange != null,
    store: form.store,
    serialize: serializeTaskDraft,
    onDirtyChange: onCreateDraftDirtyChange,
  })

  useEffect(() => {
    if (taskData && isEditMode) {
      const task = taskData
      updateForm(prev => ({
        ...prev,
        title: task.title,
        description: task.description || '',
        patientId: task.patient?.id || '',
        assigneeIds: task.assignees?.map((assignee) => assignee.id) ?? [],
        assigneeTeamId: task.assigneeTeam?.id || null,
        dueDate: DueDateUtils.parseFromApi(task.dueDate) ?? null,
        priority: (task.priority as TaskPriority | null) || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done || false,
      }))
    } else if (!taskId) {
      updateForm(prev => applyDefinedOverrides(prev, initialCreationData))
    }
  }, [taskData, isEditMode, taskId, updateForm, initialCreationData])

  useEffect(() => {
    hasRetriedMissingInitialPatientRef.current = false
  }, [initialCreationData?.patientId])

  const patients = useMemo(() => {
    const list = patientsData?.patients ?? []
    if (!initialCreationData?.patientId || list.some(patient => patient.id === initialCreationData?.patientId)) {
      return list
    }
    const fallbackName = initialCreationData?.patientNameFallback?.trim()
    if (!fallbackName) return list
    return [
      {
        id: initialCreationData?.patientId,
        name: fallbackName,
      },
      ...list,
    ]
  }, [patientsData?.patients, initialCreationData?.patientId, initialCreationData?.patientNameFallback])

  useEffect(() => {
    if (isEditMode || !initialCreationData?.patientId || hasRetriedMissingInitialPatientRef.current) return
    const hasInitialPatient = (patientsData?.patients ?? []).some(patient => patient.id === initialCreationData?.patientId)
    if (hasInitialPatient) return
    hasRetriedMissingInitialPatientRef.current = true
    refetchPatients()
  }, [isEditMode, initialCreationData?.patientId, patientsData?.patients, refetchPatients])

  const dueDate = useFormObserverKey({ formStore: form.store, formKey: 'dueDate' })?.value ?? null
  const estimatedTime = useFormObserverKey({ formStore: form.store, formKey: 'estimatedTime' })?.value ?? null
  const assigneeIds = useFormObserverKey({ formStore: form.store, formKey: 'assigneeIds' })?.value as string[] | null | undefined
  const assigneeTeamId = useFormObserverKey({ formStore: form.store, formKey: 'assigneeTeamId' })?.value as string | null | undefined
  const selectedAssignees = useMemo(
    () => usersData?.users?.filter((user) => (assigneeIds ?? []).includes(user.id)) ?? [],
    [usersData, assigneeIds]
  )
  const teams = useMemo(
    () => locationsData?.locationNodes?.filter((loc) => loc.kind === 'TEAM') ?? [],
    [locationsData]
  )
  const selectedTeamTitle = useMemo(
    () => (assigneeTeamId ? teams.find((t) => t.id === assigneeTeamId)?.title : undefined),
    [assigneeTeamId, teams]
  )
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
    { value: 'P1', label: translation('sPriority', { priority: 'P1' }) },
    { value: 'P2', label: translation('sPriority', { priority: 'P2' }) },
    { value: 'P3', label: translation('sPriority', { priority: 'P3' }) },
    { value: 'P4', label: translation('sPriority', { priority: 'P4' }) },
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
        <form
          onSubmit={event => { event.preventDefault(); form.submit() }}
          className="flex-col-0 overflow-hidden"
        >
          <div className="flex flex-col gap-6 pt-4 overflow-y-auto px-2 pb-24">
            <div className="flex items-center gap-3">
              <Visibility isVisible={isEditMode}>
                <FormObserver>
                  {({ values: { done, priority } }) => (
                    <Checkbox
                      id="task-done"
                      value={done || false}
                      onValueChange={(checked) => {
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
            >
              {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates }) => {
                return (!isEditMode) ? (
                  <Select
                    {...focusableElementProps} {...interactionStates}
                    value={value || ''}
                    onValueChange={(nextValue) => {
                      onValueChange?.(nextValue)
                      onEditComplete?.(nextValue)
                    }}
                  >
                    <SelectOption value="" label={translation('none') || 'None'} />
                    {patients.map(patient => {
                      return (
                        <SelectOption key={patient.id} value={patient.id} label={patient.name} />
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
                      <User className="size-4" />
                      {taskData?.patient?.name || translation('none') || 'None'}
                    </Button>
                  </div>
                )
              }}
            </FormField>

            <FormField<TaskFormValues, 'assigneeIds'>
              name="assigneeIds"
              label={translation('assignedTo')}
            >
              {() => (
                <div className="flex flex-col gap-2">
                  <AssigneeSelect
                    value={assigneeTeamId ? `team:${assigneeTeamId}` : ''}
                    onValueChanged={(value) => {
                      updateForm(prev => {
                        if (!value) {
                          return { ...prev, assigneeIds: [], assigneeTeamId: null }
                        }
                        if (value.startsWith('team:')) {
                          return { ...prev, assigneeIds: [], assigneeTeamId: value.replace('team:', '') }
                        }
                        const currentAssigneeIds = prev.assigneeIds ?? []
                        if (currentAssigneeIds.includes(value)) {
                          return prev
                        }
                        return { ...prev, assigneeIds: [...currentAssigneeIds, value], assigneeTeamId: null }
                      }, isEditMode)
                    }}
                    multiUserSelect={true}
                    onMultiUserIdsSelected={(ids) => {
                      if (ids.length === 0) return
                      updateForm(prev => ({
                        ...prev,
                        assigneeIds: [...new Set([...(prev.assigneeIds ?? []), ...ids])],
                        assigneeTeamId: null,
                      }), isEditMode)
                    }}
                    allowTeams={true}
                    allowUnassigned={true}
                    excludeUserIds={assigneeIds ?? []}
                  />
                  {(selectedAssignees.length > 0 || assigneeTeamId) && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-2 max-w-full"
                        >
                          <div className="flex-row-2 items-center min-w-0 gap-2 flex-1">
                            <AvatarWithStatus
                              status={assignee?.isOnline === undefined ? 'unknown' : assignee.isOnline ? 'online' : 'offline'}
                              image={{
                                avatarUrl: assignee.avatarUrl ?? 'https://cdn.helpwave.de/boringavatar.svg',
                                alt: assignee.name
                              }}
                            />
                            <span className="truncate text-sm">{assignee.name}</span>
                          </div>
                          <IconButton
                            tooltip={translation('userInformation')}
                            coloringStyle="text"
                            color="neutral"
                            onClick={() => setAssigneeUserPopupId(assignee.id)}
                          >
                            <Info className="size-4" />
                          </IconButton>
                          <IconButton
                            tooltip={translation('clear')}
                            coloringStyle="text"
                            color="neutral"
                            onClick={() => {
                              updateForm(prev => ({
                                ...prev,
                                assigneeIds: (prev.assigneeIds ?? []).filter((id) => id !== assignee.id),
                              }), isEditMode)
                            }}
                          >
                            <XIcon className="size-4" />
                          </IconButton>
                        </div>
                      ))}
                      {assigneeTeamId && (
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-2 max-w-full">
                          <div className="flex-row-2 items-center min-w-0 gap-2 flex-1 px-0.5">
                            <Users className="size-5 text-description shrink-0" />
                            <span className="truncate text-sm">{selectedTeamTitle ?? translation('locationType', { type: 'TEAM' })}</span>
                          </div>
                          <IconButton
                            tooltip={translation('clear')}
                            coloringStyle="text"
                            color="neutral"
                            onClick={() => {
                              updateForm(prev => ({ ...prev, assigneeTeamId: null }), isEditMode)
                            }}
                          >
                            <XIcon className="size-4" />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </FormField>

            <FormField<TaskFormValues, 'dueDate'>
              name="dueDate"
              label={translation('dueDate')}
            >
              {({ dataProps: { value }, focusableElementProps, interactionStates, other: { updateValue } }) => {
                const commitDueDate = (next: Date | null) => {
                  updateValue(next)
                }
                return (
                  <FlexibleDateTimeInput
                    key={isEditMode ? `${taskId}-${dueDate?.getTime() ?? 'pending'}` : 'create'}
                    {...getTaskDueDateFlexibleInputProps()}
                    {...focusableElementProps}
                    {...interactionStates}
                    value={value ?? null}
                    onValueChange={commitDueDate}
                    onEditComplete={commitDueDate}
                  />
                )
              }}
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
                    <SelectOption value="none" iconAppearance="right" label={translation('priorityNone')} />
                    {priorities.map(({ value, label }) => (
                      <SelectOption key={value} value={value} iconAppearance="right" label={label}>
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
                <DateDisplay date={expectedFinishDate} mode="relative" showTime={true} />
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
                          onListSync?.()
                          onDelete?.()
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
                onClick={form.submit}
                disabled={isCreating}
              >
                <PlusIcon className="size-4" />
                {isCreating ? 'Creating...' : translation('create')}
              </Button>
            </div>
          )}

          <ErrorDialog
            isOpen={errorDialog.isOpen}
            onClose={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
            message={errorDialog.data.message}
          />
        </form>
        <Drawer
          isOpen={isShowingPatientDialog}
          onClose={() => setIsShowingPatientDialog(false)}
          alignment="right"
          titleElement={translation('editPatient')}
          description={undefined}
          noScrolling
        >
          <PatientDetailView
            patientId={taskData?.patient?.id}
            onClose={() => setIsShowingPatientDialog(false)}
            onSuccess={() => { }}
          />
        </Drawer>
        <UserInfoPopup
          userId={assigneeUserPopupId}
          isOpen={!!assigneeUserPopupId}
          onClose={() => setAssigneeUserPopupId(null)}
        />
      </FormProvider>
    </>
  )
}
