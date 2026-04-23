import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button, Drawer, ExpandableContent, ExpandableHeader, ExpandableRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { CheckCircle2, ChevronDown, Circle, Combine, PlusIcon } from 'lucide-react'
import { TaskCardView } from '@/components/tasks/TaskCardView'
import clsx from 'clsx'
import type { GetPatientQuery } from '@/api/gql/generated'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { useCompleteTask, useReopenTask } from '@/data'
import { LoadTaskPresetDialog } from '@/components/patients/LoadTaskPresetDialog'
import type { PatientDetailListSuccessHint } from '@/components/patients/patientDetailListHint'

interface PatientTasksViewProps {
  patientId: string,
  patientData: GetPatientQuery | undefined,
  onSuccess?: (hint?: PatientDetailListSuccessHint) => void,
}

const sortByDueDate = <T extends { dueDate?: string | Date | null }>(tasks: T[]): T[] => {
  return [...tasks].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return aTime - bTime
  })
}

export const PatientTasksView = ({
  patientId,
  patientData,
  onSuccess,
}: PatientTasksViewProps) => {
  const translation = useTasksTranslation()
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [loadPresetOpen, setLoadPresetOpen] = useState(false)
  const [optimisticTaskUpdates, setOptimisticTaskUpdates] = useState<Map<string, boolean>>(new Map())

  const [completeTask] = useCompleteTask()
  const [reopenTask] = useReopenTask()
  const initialPatientName = `${patientData?.patient?.firstname ?? ''} ${patientData?.patient?.lastname ?? ''}`.trim()

  const apiTasksWithOptimistic = useMemo(() => {
    const baseTasks = patientData?.patient?.tasks || []
    return baseTasks.map(task => {
      const optimisticDone = optimisticTaskUpdates.get(task.id)
      if (optimisticDone !== undefined) {
        return { ...task, done: optimisticDone }
      }
      return task
    })
  }, [patientData?.patient?.tasks, optimisticTaskUpdates])

  const tasks = useMemo(() => apiTasksWithOptimistic, [apiTasksWithOptimistic])

  const handleToggleDone = useCallback((taskId: string, done: boolean) => {
    setOptimisticTaskUpdates(prev => {
      const next = new Map(prev)
      next.set(taskId, done)
      return next
    })
    if (done) {
      completeTask({
        variables: { id: taskId },
        onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }),
        onError: () => {
          setOptimisticTaskUpdates(prev => {
            const next = new Map(prev)
            next.delete(taskId)
            return next
          })
        },
      })
    } else {
      reopenTask({
        variables: { id: taskId },
        onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }),
        onError: () => {
          setOptimisticTaskUpdates(prev => {
            const next = new Map(prev)
            next.delete(taskId)
            return next
          })
        },
      })
    }
  }, [completeTask, reopenTask, onSuccess])

  const openTasks = useMemo(() => sortByDueDate(tasks.filter(t => !t.done)), [tasks])
  const closedTasks = useMemo(() => sortByDueDate(tasks.filter(t => t.done)), [tasks])

  useEffect(() => {
    setOptimisticTaskUpdates(new Map())
  }, [patientData?.patient?.tasks])

  return (
    <>
      <div className="flex-col-0 pt-4 overflow-hidden h-full justify-between flex-1">
        <div className="flex-col-4 flex-1 overflow-y-auto px-2 ">
          <ExpandableRoot className="shadow-none group/expandable" isInitialExpanded={true}>
            <ExpandableHeader
              className="justify-start p-2 ext-lg font-bold"
              isUsingDefaultIcon={false}
            >
              <ChevronDown className={clsx('size-5 transition-transform -rotate-90 group-data-[expanded]/expandable:rotate-0')} />
              <Circle className="size-5 text-warning" />
              {translation('openTasks')} ({openTasks.length})
            </ExpandableHeader>
            <ExpandableContent className="!max-h-none !h-auto !overflow-visible px-1 data-[expanded]:py-2">
              {openTasks.length === 0 &&
                <div className="text-description italic">{translation('noOpenTasks')}</div>}
              {openTasks.map(task => (
                <TaskCardView
                  key={task.id}
                  task={task}
                  onClick={(t) => setTaskId(t.id)}
                  onToggleDone={handleToggleDone}
                  showPatient={false}
                  showAssignee={!!((task.assignees?.length ?? 0) > 0 || task.assigneeTeam)}
                  fullWidth={true}
                />
              ))}
            </ExpandableContent>
          </ExpandableRoot>

          <ExpandableRoot className="shadow-none opacity-75 group/expandable">
            <ExpandableHeader
              className="justify-start p-2 ext-lg font-bold"
              isUsingDefaultIcon={false}
            >
              <ChevronDown className={clsx('size-5 transition-transform -rotate-90 group-data-[expanded]/expandable:rotate-0')} />
              <CheckCircle2 className="size-5 text-positive" />
              {translation('closedTasks')} ({closedTasks.length})
            </ExpandableHeader>
            <ExpandableContent className="!max-h-none !h-auto !overflow-visible px-1 data-[expanded]:py-2">
              {closedTasks.length === 0 &&
                <div className="text-description italic">{translation('noClosedTasks')}</div>}
              {closedTasks.map(task => (
                <TaskCardView
                  key={task.id}
                  task={task}
                  onClick={(t) => setTaskId(t.id)}
                  onToggleDone={handleToggleDone}
                  showPatient={false}
                  showAssignee={!!((task.assignees?.length ?? 0) > 0 || task.assigneeTeam)}
                  fullWidth={true}
                />
              ))}
            </ExpandableContent>
          </ExpandableRoot>
        </div>
        <div className="flex-row-4 justify-end mt-2 flex-wrap gap-2">
          <Button
            onClick={() => setLoadPresetOpen(true)}
            className="w-fit"
            color="neutral"
            coloringStyle="outline"
          >
            <Combine />
            {translation('loadTaskPreset')}
          </Button>
          <Button
            onClick={() => setIsCreatingTask(true)}
            className="w-fit"
          >
            <PlusIcon />
            {translation('addTask')}
          </Button>
        </div>
      </div>
      <LoadTaskPresetDialog
        isOpen={loadPresetOpen}
        onClose={() => setLoadPresetOpen(false)}
        patientId={patientId}
        onSuccess={onSuccess}
      />
      <Drawer
        isOpen={!!taskId || isCreatingTask}
        onClose={() => {
          setTaskId(null)
          setIsCreatingTask(false)
        }}
        alignment="right"
        titleElement={taskId ? translation('editTask') : translation('createTask')}
        description={undefined}
      >
        <TaskDetailView
          taskId={taskId}
          initialPatientId={isCreatingTask ? patientId : undefined}
          initialPatientName={isCreatingTask ? initialPatientName : undefined}
          onListSync={() => {
            onSuccess?.({ needsPatientListRefetch: true })
          }}
          onClose={() => {
            setTaskId(null)
            setIsCreatingTask(false)
          }}
          onCreateSuccessClose={() => {
            setTaskId(null)
            setIsCreatingTask(false)
          }}
        />
      </Drawer>
    </>
  )
}
