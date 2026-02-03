import { Button, Checkbox } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { Clock, User, Users, Flag } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { useRouter } from 'next/router'
import type { TaskPriority } from '@/api/gql/generated'
import { useCompleteTask, useReopenTask } from '@/data'
import { useState, useEffect, useRef, useMemo } from 'react'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { PriorityUtils } from '@/utils/priority'

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
}

type TaskCardViewProps = {
  task: FlexibleTask | TaskViewModel,
  onToggleDone?: (taskId: string, done: boolean) => void,
  onClick: (task: FlexibleTask | TaskViewModel) => void,
  showAssignee?: boolean,
  showPatient?: boolean,
  onRefetch?: () => void,
  className?: string,
  fullWidth?: boolean,
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

export const TaskCardView = ({ task, onToggleDone: _onToggleDone, onClick, showAssignee: _showAssignee = false, showPatient = true, onRefetch, className, fullWidth: _fullWidth = false }: TaskCardViewProps) => {
  const router = useRouter()
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
          onRefetch?.()
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
          onRefetch?.()
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

  return (
    <div
      onClick={() => onClick(task)}
      className={clsx(
        'border-2 p-4 rounded-lg text-left transition-colors hover:border-primary ',
        'relative bg-surface-variant bg-on-surface-variant overflow-hidden cursor-pointer w-full min-h-35',
        borderColorClass,
        priorityBorderClass,
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(task)
        }
      }}
    >
      <div className="flex items-start gap-4 w-full min-w-0">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            value={displayDone}
            onValueChange={handleToggleDone}
            className={clsx('rounded-full mt-0.5 shrink-0', PriorityUtils.toCheckboxColor(task?.priority as TaskPriority | null | undefined))}
          />
        </div>
        <div className={clsx('flex-1 min-w-0 overflow-hidden', { 'pb-16': showPatient, 'pb-12': !showPatient })}>
          <div className={clsx('flex items-center justify-between gap-2 flex-wrap min-w-0', { 'mb-2': showPatient, 'mb-4': !showPatient })}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
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
                  'font-semibold text-lg min-w-0 flex-1 truncate',
                  { 'line-through text-description': task.done }
                )}
              >
                {taskName}
              </div>
            </div>
            {task.assigneeTeam && (
              <div className="flex items-center gap-1.5 text-base text-description shrink-0 min-w-0">
                <Users className="size-5 text-description" />
                <span className="truncate max-w-40">{task.assigneeTeam.title}</span>
              </div>
            )}
            {!task.assigneeTeam && task.assignee && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedUserId(task.assignee!.id)
                }}
                className="flex items-center gap-1.5 text-base text-description shrink-0 min-w-0 hover:opacity-75 transition-opacity"
              >
                <AvatarStatusComponent
                  size="sm"
                  isOnline={task.assignee?.isOnline ?? null}
                  image={{
                    avatarUrl: assigneeAvatarUrl || 'https://cdn.helpwave.de/boringavatar.svg',
                    alt: task.assignee.name
                  }}
                />
                <span className="truncate max-w-[150px]">{task.assignee.name}</span>
              </button>
            )}
          </div>
          {descriptionPreview && (
            <div className={clsx('text-base text-description line-clamp-2', { 'mb-2': showPatient, 'mb-4': !showPatient })}>{descriptionPreview}</div>
          )}
        </div>
      </div>
      {showPatient && task.patient && (
        <div className="absolute bottom-5" style={{ left: 'calc(1.25rem + 1.5rem + 1rem)' }}>
          <Button
            color="neutral"
            size="sm"
            onClick={handlePatientClick}
            className="flex-row-0 justify-start w-fit"
          >
            <User className="size-4 scale-[1.2] mr-2" />
            {task.patient.name}
          </Button>
          {task.patient.locations && task.patient.locations.length > 0 && (
            <div className="mt-1">
              <LocationChipsBySetting locations={task.patient.locations} small />
            </div>
          )}
        </div>
      )}
      <div className={clsx('absolute right-5 flex flex-col items-end gap-2 text-sm text-description', { 'bottom-5': showPatient, 'bottom-6': !showPatient })}>
        <div className="flex items-center gap-3">
          {(task as FlexibleTask).estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              <span>
                {(task as FlexibleTask).estimatedTime! < 60
                  ? `${(task as FlexibleTask).estimatedTime}m`
                  : `${Math.floor((task as FlexibleTask).estimatedTime! / 60)}h ${(task as FlexibleTask).estimatedTime! % 60}m`}
              </span>
            </div>
          )}
          {dueDate && (
            <div className={clsx('flex items-center gap-2', dueDateColorClass)}>
              <Clock className="size-4" />
              <SmartDate date={dueDate} mode="relative" showTime={true} />
            </div>
          )}
        </div>
        {expectedFinishDate && (
          <div className="flex items-center gap-2 text-xs">
            <Flag className="size-4" />
            <SmartDate date={expectedFinishDate} mode="relative" showTime={true} />
          </div>
        )}
      </div>
      <UserInfoPopup
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  )
}
