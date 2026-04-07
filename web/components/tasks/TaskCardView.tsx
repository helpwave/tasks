import { Button, Checkbox, Tooltip } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { Clock, Combine, User, Users, Flag } from 'lucide-react'
import clsx from 'clsx'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { useRouter } from 'next/router'
import type { TaskPriority } from '@/api/gql/generated'
import { useCompleteTask, useReopenTask } from '@/data'
import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { PriorityUtils } from '@/utils/priority'
import { ExpandableTextBlock } from '@/components/common/ExpandableTextBlock'
import { TaskPresetSourceDialog } from '@/components/tasks/TaskPresetSourceDialog'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type FlexibleTask = {
  id: string,
  name?: string,
  title?: string,
  description?: string | null,
  done: boolean,
  dueDate?: Date | string | null,
  priority?: string | null,
  estimatedTime?: number | null,
  updateDate?: Date | string | null,
  patient?: {
    id: string,
    name: string,
    locations?: Array<{
      id: string,
      title: string,
      parent?: { id: string, title: string, parent?: { id: string, title: string } | null } | null,
    }>,
  },
  assignee?: {
    id: string,
    name: string,
    avatarURL?: string | null,
    avatarUrl?: string | null,
    isOnline?: boolean | null,
  } | null,
  assigneeTeam?: {
    id: string,
    title: string,
  } | null,
  sourceTaskPresetId?: string | null,
}

type TaskCardViewProps = {
  task: FlexibleTask | TaskViewModel,
  onToggleDone?: (taskId: string, done: boolean) => void,
  onClick?: (task: FlexibleTask | TaskViewModel) => void,
  showAssignee?: boolean,
  showPatient?: boolean,
  className?: string,
  fullWidth?: boolean,
  extraContent?: ReactNode,
}

const isOverdue = (dueDate: Date | undefined, done: boolean): boolean => {
  if (!dueDate || done) return false
  return dueDate.getTime() < Date.now()
}

const isCloseToDueDate = (dueDate: Date | undefined, done: boolean): boolean => {
  if (!dueDate || done) return false
  const now = Date.now()
  const dueTime = dueDate.getTime()
  const oneHour = 60 * 60 * 1000
  return dueTime > now && dueTime - now <= oneHour
}

const toDate = (date: Date | string | null | undefined): Date | undefined => {
  if (!date) return undefined
  if (date instanceof Date) return date
  return new Date(date)
}

export const TaskCardView = ({ task, onToggleDone: _onToggleDone, onClick, showAssignee: _showAssignee = false, showPatient = true, className, fullWidth: _fullWidth = false, extraContent }: TaskCardViewProps) => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const [presetDialogId, setPresetDialogId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null)
  const pendingCheckedRef = useRef<boolean | null>(null)
  const flexibleTask = task as FlexibleTask
  const taskName = task.name || flexibleTask.title || ''
  const descriptionPreview = task.description
  const displayDone = optimisticDone !== null ? optimisticDone : task.done

  const [completeTask] = useCompleteTask()
  const [reopenTask] = useReopenTask()

  const dueDate = toDate(task.dueDate)
  const overdue = dueDate ? isOverdue(dueDate, task.done) : false
  const closeToDue = dueDate ? isCloseToDueDate(dueDate, task.done) : false
  const dueDateColorClass = overdue ? '!text-red-500' : closeToDue ? '!text-orange-500' : ''
  const assigneeAvatarUrl = task.assignee?.avatarURL || (flexibleTask.assignee?.avatarUrl)
  const isClickable = Boolean(onClick)

  const expectedFinishDate = useMemo(() => {
    if (!dueDate || !flexibleTask.estimatedTime) return null
    const finishDate = new Date(dueDate)
    finishDate.setMinutes(finishDate.getMinutes() + flexibleTask.estimatedTime)
    return finishDate
  }, [dueDate, flexibleTask.estimatedTime])

  const handlePatientClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.patient?.id) {
      router.push(`/patients?patientId=${task.patient.id}`)
    }
  }

  useEffect(() => {
    setOptimisticDone(null)
  }, [task.done, task.id])

  const handleToggleDone = (checked: boolean) => {
    if (_onToggleDone) {
      _onToggleDone(task.id, checked)
      return
    }
    pendingCheckedRef.current = checked
    setOptimisticDone(checked)
    if (checked) {
      completeTask({
        variables: { id: task.id },
        onCompleted: () => {
          pendingCheckedRef.current = null
          setOptimisticDone(null)
        },
        onError: () => {
          pendingCheckedRef.current = null
          setOptimisticDone(null)
        },
      })
    } else {
      reopenTask({
        variables: { id: task.id },
        onCompleted: () => {
          pendingCheckedRef.current = null
          setOptimisticDone(null)
        },
        onError: () => {
          pendingCheckedRef.current = null
          setOptimisticDone(null)
        },
      })
    }
  }

  const borderColorClass = overdue
    ? 'border-negative'
    : closeToDue
      ? 'border-warning'
      : 'border-border'

  const priorityBorderClass = {
    P1: 'border-l-4 border-l-priority-p1',
    P2: 'border-l-4 border-l-priority-p2',
    P3: 'border-l-4 border-l-priority-p3',
    P4: 'border-l-4 border-l-priority-p4',
  }[(task as FlexibleTask).priority as TaskPriority] ?? ''

  const assigneeImage = useMemo(
    () => ({
      avatarUrl: assigneeAvatarUrl || 'https://cdn.helpwave.de/boringavatar.svg',
      alt: task.assignee?.name ?? '',
    }),
    [assigneeAvatarUrl, task.assignee?.name]
  )

  return (
    <div
      onClick={onClick ? () => onClick(task) : undefined}
      className={clsx(
        'border-2 p-4 rounded-lg text-left transition-colors',
        'relative bg-surface-variant bg-on-surface-variant w-full',
        isClickable ? 'cursor-pointer hover:border-primary' : 'cursor-default',
        borderColorClass,
        priorityBorderClass,
        className
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isClickable || !onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(task)
        }
      }}
    >
      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 w-full min-w-0">
          <div className="flex items-start gap-4 w-full min-w-0 sm:flex-1 sm:min-w-0">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                value={displayDone}
                onValueChange={handleToggleDone}
                className={clsx('rounded-full mt-0.5 shrink-0', PriorityUtils.toCheckboxColor(task?.priority as TaskPriority | null | undefined))}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:flex-wrap min-w-0 mb-2">
                <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1 sm:w-auto">
                  {(task as FlexibleTask).priority && (
                    <div
                      className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        PriorityUtils.toBackgroundColor(task?.priority as TaskPriority | null | undefined)
                      )}
                    />
                  )}
                  <div
                    className={clsx(
                      'font-semibold text-lg min-w-0 flex-1 whitespace-normal break-words',
                      { 'line-through text-description': task.done }
                    )}
                  >
                    {taskName}
                  </div>
                </div>
                {task.assigneeTeam && (
                  <div className="flex items-center gap-1.5 text-base text-description min-w-0 w-full sm:w-auto sm:shrink-0 sm:justify-end">
                    <Users className="size-5 text-description shrink-0" />
                    <span className="min-w-0 break-words sm:truncate sm:max-w-40">{task.assigneeTeam.title}</span>
                  </div>
                )}
                {!task.assigneeTeam && task.assignee && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUserId(task.assignee!.id)
                    }}
                    className="flex items-center gap-1.5 text-base text-description min-w-0 w-full sm:w-auto sm:shrink-0 sm:justify-end hover:opacity-75 transition-opacity text-left"
                  >
                    <AvatarStatusComponent
                      size="sm"
                      isOnline={task.assignee?.isOnline ?? null}
                      image={assigneeImage}
                    />
                    <span className="min-w-0 break-words sm:truncate sm:max-w-[150px]">{task.assignee.name}</span>
                  </button>
                )}
              </div>
              {descriptionPreview && (
                <ExpandableTextBlock className="text-base text-description">
                  {descriptionPreview}
                </ExpandableTextBlock>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2 text-sm text-description pt-0.5 w-full pl-14 sm:pl-0 sm:items-end sm:w-auto sm:max-w-[min(100%,11rem)]">
            <div className="flex flex-col gap-2 items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-x-3 gap-y-2">
              {(task as FlexibleTask).sourceTaskPresetId && (
                <Tooltip tooltip={translation('taskFromPresetTooltip')} alignment="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPresetDialogId((task as FlexibleTask).sourceTaskPresetId ?? null)
                    }}
                    className="shrink-0 rounded-lg p-1.5 cursor-pointer border border-primary/45 bg-primary/15 text-primary shadow-sm hover:bg-primary/25 hover:border-primary/70 active:bg-primary/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    aria-label={translation('taskFromPresetTooltip')}
                  >
                    <Combine className="size-4" strokeWidth={2} />
                  </button>
                </Tooltip>
              )}
              {(task as FlexibleTask).estimatedTime && (
                <div className="flex items-center gap-1 min-w-0">
                  <Clock className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    {(task as FlexibleTask).estimatedTime! < 60
                      ? `${(task as FlexibleTask).estimatedTime}m`
                      : `${Math.floor((task as FlexibleTask).estimatedTime! / 60)}h ${(task as FlexibleTask).estimatedTime! % 60}m`}
                  </span>
                </div>
              )}
              {dueDate && (
                <div className={clsx('flex items-center gap-2 min-w-0', dueDateColorClass)}>
                  <Clock className="size-4 shrink-0" />
                  <DateDisplay date={dueDate} mode="absolute" showTime={true} />
                </div>
              )}
            </div>
            {expectedFinishDate && (
              <div className="flex items-center gap-2 text-xs min-w-0">
                <Flag className="size-4 shrink-0" />
                <DateDisplay date={expectedFinishDate} mode="absolute" showTime={true} />
              </div>
            )}
          </div>
        </div>
        {showPatient && task.patient && (
          <div className="min-w-0 pl-14">
            <Button
              color="neutral"
              size="sm"
              onClick={handlePatientClick}
              className="flex-row-0 justify-start w-full min-w-0"
            >
              <User className="size-4 scale-[1.2] mr-2" />
              <span className="min-w-0 whitespace-normal break-words text-left">{task.patient.name}</span>
            </Button>
            {task.patient.locations && task.patient.locations.length > 0 && (
              <div className="mt-1">
                <LocationChipsBySetting locations={task.patient.locations} small />
              </div>
            )}
          </div>
        )}
        {extraContent && (
          <div className="border-t border-border pt-3 space-y-2 text-sm px-0">
            {extraContent}
          </div>
        )}
      </div>
      <UserInfoPopup
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
      <TaskPresetSourceDialog
        isOpen={presetDialogId != null}
        presetId={presetDialogId}
        onClose={() => setPresetDialogId(null)}
      />
    </div>
  )
}
