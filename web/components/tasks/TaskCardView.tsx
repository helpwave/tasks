import { Avatar, Button, CheckboxUncontrolled } from '@helpwave/hightide'
import { Clock, User } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import type { TaskViewModel } from './TaskList'
import { useRouter } from 'next/router'
import { useCompleteTaskMutation, useReopenTaskMutation } from '@/api/gql/generated'

type FlexibleTask = {
  id: string,
  name?: string,
  title?: string,
  description?: string | null,
  done: boolean,
  dueDate?: Date | string | null,
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
  } | null,
}

type TaskCardViewProps = {
  task: FlexibleTask | TaskViewModel,
  onToggleDone?: (taskId: string, done: boolean) => void,
  onClick: (task: FlexibleTask | TaskViewModel) => void,
  showAssignee?: boolean,
  showPatient?: boolean,
  onRefetch?: () => void,
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

export const TaskCardView = ({ task, onToggleDone: _onToggleDone, onClick, showAssignee: _showAssignee = false, showPatient = true, onRefetch }: TaskCardViewProps) => {
  const router = useRouter()
  const flexibleTask = task as FlexibleTask
  const taskName = task.name || flexibleTask.title || ''
  const descriptionPreview = task.description

  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: onRefetch })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: onRefetch })

  const dueDate = toDate(task.dueDate)
  const overdue = dueDate ? isOverdue(dueDate, task.done) : false
  const closeToDue = dueDate ? isCloseToDueDate(dueDate, task.done) : false
  const dueDateColorClass = overdue ? '!text-red-500' : closeToDue ? '!text-orange-500' : ''
  const assigneeAvatarUrl = task.assignee?.avatarURL || (flexibleTask.assignee?.avatarUrl)

  const borderColorClass = overdue
    ? 'border-red-500'
    : closeToDue
    ? 'border-orange-500'
    : 'border-neutral-300 dark:border-neutral-600'

  const handlePatientClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.patient?.id) {
      router.push(`/patients?patientId=${task.patient.id}`)
    }
  }

  const handleToggleDone = (checked: boolean) => {
    if (!checked) {
      completeTask({ id: task.id })
    } else {
      reopenTask({ id: task.id })
    }
  }

  return (
    <button
      onClick={() => onClick(task)}
      className={clsx('border-2 p-5 rounded-lg text-left w-full transition-colors hover:border-primary relative bg-[rgba(255,255,255,1)] dark:bg-[rgba(55,65,81,1)] overflow-hidden', borderColorClass)}
    >
      <div className="flex items-start gap-4 w-full min-w-0">
        <div onClick={(e) => e.stopPropagation()}>
          <CheckboxUncontrolled
            checked={task.done}
            onCheckedChange={handleToggleDone}
            className="rounded-full mt-0.5 shrink-0"
          />
        </div>
        <div className={clsx('flex-1 min-w-0 overflow-hidden', { 'pb-16': showPatient })}>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap min-w-0">
            <div
              className={clsx(
                'font-semibold text-lg min-w-0 flex-1 truncate',
                { 'line-through text-description': task.done }
              )}
            >
              {taskName}
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-base text-description shrink-0 min-w-0">
                <Avatar
                  fullyRounded={true}
                  size="sm"
                  image={{
                    avatarUrl: assigneeAvatarUrl || 'https://cdn.helpwave.de/boringavatar.svg',
                    alt: task.assignee.name
                  }}
                />
                <span className="truncate max-w-[150px]">{task.assignee.name}</span>
              </div>
            )}
          </div>
          {descriptionPreview && (
            <div className="text-base text-description mb-2 line-clamp-2">{descriptionPreview}</div>
          )}
        </div>
      </div>
      {showPatient && task.patient && (
        <div className="absolute bottom-5" style={{ left: 'calc(1.25rem + 1.5rem + 1rem)' }}>
          <Button
            color="neutral"
            size="small"
            onClick={handlePatientClick}
            className="flex-row-0 justify-start w-fit"
          >
            <User className="size-4 scale-[1.2] mr-2" />
            {task.patient.name}
          </Button>
          {task.patient.locations && task.patient.locations.length > 0 && (
            <div className="mt-1">
              <LocationChips locations={task.patient.locations} small />
            </div>
          )}
        </div>
      )}
      {dueDate && (
        <div className={clsx('absolute bottom-5 right-5 flex items-center gap-2 text-sm text-description', dueDateColorClass)}>
          <Clock className="size-4" />
          <SmartDate date={dueDate} mode="relative" showTime={true} />
        </div>
      )}
    </button>
  )
}




