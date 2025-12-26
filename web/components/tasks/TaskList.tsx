import { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Avatar, Button, Checkbox, CheckboxUncontrolled, FillerRowElement, SearchBar, Table, Tooltip } from '@helpwave/hightide'
import { PlusIcon, Table as TableIcon, LayoutGrid } from 'lucide-react'
import { useCompleteTaskMutation, useReopenTaskMutation } from '@/api/gql/generated'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/patients/LocationChips'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useTaskViewToggle } from '@/hooks/useViewToggle'
import { TaskCardView } from '@/components/tasks/TaskCardView'
import type { ColumnDef } from '@tanstack/table-core'

export type TaskViewModel = {
  id: string,
  name: string,
  description?: string,
  updateDate: Date,
  dueDate?: Date,
  patient?: {
    id: string,
    name: string,
    locations: Array<{
      id: string,
      title: string,
      parent?: { id: string, title: string, parent?: { id: string, title: string } | null } | null,
    }>,
  },
  assignee?: { id: string, name: string, avatarURL?: string | null },
  done: boolean,
}

export type TaskListRef = {
  openCreate: () => void,
  openTask: (taskId: string) => void,
}

type TaskDialogState = {
  isOpen: boolean,
  taskId?: string,
}

type TaskListProps = {
  tasks: TaskViewModel[],
  onRefetch?: () => void,
  showAssignee?: boolean,
  initialTaskId?: string,
  onInitialTaskOpened?: () => void,
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

const STORAGE_KEY_SHOW_DONE = 'task-show-done'

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened }, ref) => {
  const translation = useTasksTranslation()
  const { totalPatientsCount } = useTasksContext()
  const { viewType, toggleView } = useTaskViewToggle()
  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: onRefetch })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: onRefetch })

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [taskDialogState, setTaskDialogState] = useState<TaskDialogState>({ isOpen: false })
  const [searchQuery, setSearchQuery] = useState('')
  const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SHOW_DONE)
      if (stored === 'true') {
        return true
      }
      if (stored === 'false') {
        return false
      }
    }
    return false
  })

  const handleShowDoneChange = (checked: boolean) => {
    setShowDone(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SHOW_DONE, String(checked))
      }
      return checked
    })
  }

  const hasPatients = (totalPatientsCount ?? 0) > 0

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      if (hasPatients) {
        setTaskDialogState({ isOpen: true })
      }
    },
    openTask: (taskId: string) => {
      setTaskDialogState({ isOpen: true, taskId })
    }
  }))

  useEffect(() => {
    if (initialTaskId && initialTasks.length > 0 && openedTaskId !== initialTaskId) {
      setTaskDialogState({ isOpen: true, taskId: initialTaskId })
      setOpenedTaskId(initialTaskId)
      onInitialTaskOpened?.()
    } else if (!initialTaskId) {
      setOpenedTaskId(null)
    }
  }, [initialTaskId, initialTasks, openedTaskId, onInitialTaskOpened])

  const tasks = useMemo(() => {
    let data = initialTasks

    if (!showDone) {
      data = data.filter(t => !t.done)
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      data = data.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.patient?.name.toLowerCase().includes(lowerQuery))
    }

    return [...data].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1
      }

      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      return a.dueDate.getTime() - b.dueDate.getTime()
    })
  }, [initialTasks, searchQuery, showDone])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => {
      const cols: ColumnDef<TaskViewModel>[] = [
        {
          id: 'done',
          header: translation('status'),
          accessorKey: 'done',
          cell: ({ row }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <CheckboxUncontrolled
                checked={row.original.done}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    completeTask({ id: row.original.id })
                  } else {
                    reopenTask({ id: row.original.id })
                  }
                }}
                className={clsx('rounded-full')}
              />
            </div>
          ),
          minSize: 110,
          size: 110,
          maxSize: 110,
          enableResizing: false,
        },
        {
          id: 'title',
          header: translation('title'),
          accessorKey: 'name',
          cell: ({ row }) => {
            return row.original.name
          },
          minSize: 200,
          size: Number.MAX_SAFE_INTEGER,
        },
        {
          id: 'dueDate',
          header: translation('dueDate'),
          accessorKey: 'dueDate',
          cell: ({ row }) => {
            if (!row.original.dueDate) return <span className="text-description">-</span>
            const overdue = isOverdue(row.original.dueDate, row.original.done)
            const closeToDue = isCloseToDueDate(row.original.dueDate, row.original.done)
            let colorClass = ''
            if (overdue) {
              colorClass = '!text-red-500'
            } else if (closeToDue) {
              colorClass = '!text-orange-500'
            }
            return (
              <SmartDate
                date={row.original.dueDate}
                mode="relative"
                className={clsx(colorClass)}
              />
            )
          },
          minSize: 150,
          size: 150,
          maxSize: 200,
        },
        {
          id: 'patient',
          header: translation('patient'),
          accessorFn: ({ patient }) => patient?.name,
          cell: ({ row }) => {
            const data = row.original
            if (!data.patient) {
              return (
                <span className="text-description">
                  {translation('noPatient')}
                </span>
              )
            }
            return (
              <div className="flex flex-col gap-1">
                <Button
                  color="neutral"
                  size="small"
                  onClick={event => {
                    event.stopPropagation()
                    setSelectedPatientId(data.patient?.id ?? null)
                  }}
                  className="flex-row-0 justify-start w-fit"
                >
                  {data.patient?.name}
                </Button>
                <LocationChips locations={data.patient.locations || []} small />
              </div>
            )
          },
          sortingFn: 'text',
          minSize: 200,
          size: 250,
          maxSize: 350,
        },
      ]

      if (showAssignee) {
        cols.push({
          id: 'assignee',
          header: translation('assignedTo'),
          accessorFn: ({ assignee }) => assignee?.name,
          cell: ({ row }) => {
            const assignee = row.original.assignee
            if (!assignee) {
              return (
                <span className="text-description">
                  {translation('notAssigned')}
                </span>
              )
            }

            return (
              <div className="flex-row-2 items-center">
                <Avatar
                  fullyRounded={true}
                  image={{
                    avatarUrl: assignee.avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
                    alt: assignee.name
                  }}
                />
                <span>{assignee.name}</span>
              </div>
            )
          },
          minSize: 200,
          size: 250,
          maxSize: 350,
        })
      }

      return cols
    },
    [translation, completeTask, reopenTask, showAssignee]
  )

  const handleToggleDone = (taskId: string, done: boolean) => {
    if (!done) {
      completeTask({ id: taskId })
    } else {
      reopenTask({ id: taskId })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row justify-between w-full gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
        <div className="w-full sm:max-w-md">
          <SearchBar
            placeholder={translation('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => null}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={showDone}
              onCheckedChange={handleShowDoneChange}
            />
            <span className="text-sm text-description">{translation('showDone') || 'Show done'}</span>
          </div>
          <Tooltip tooltip="Table View" position="top">
            <Button
              layout="icon"
              color={viewType === 'table' ? 'primary' : 'neutral'}
              coloringStyle={viewType === 'table' ? undefined : 'text'}
              onClick={() => toggleView('table')}
            >
              <TableIcon className="size-5" />
            </Button>
          </Tooltip>
          <Tooltip tooltip="Card View" position="top">
            <Button
              layout="icon"
              color={viewType === 'card' ? 'primary' : 'neutral'}
              coloringStyle={viewType === 'card' ? undefined : 'text'}
              onClick={() => toggleView('card')}
            >
              <LayoutGrid className="size-5" />
            </Button>
          </Tooltip>
          <Button
            startIcon={<PlusIcon/>}
            onClick={() => setTaskDialogState({ isOpen: true })}
            className="w-full sm:w-auto min-w-[13rem]"
            disabled={!hasPatients}
          >
            {translation('addTask')}
          </Button>
        </div>
      </div>
      {viewType === 'table' ? (
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
          <Table
            className="w-full h-full cursor-pointer min-w-[800px]"
            data={tasks}
            columns={columns}
            fillerRow={() => (
              <FillerRowElement className="min-h-12"/>
            )}
            initialState={{
              sorting: [
                { id: 'done', desc: false },
                { id: 'dueDate', desc: false },
              ]
            }}
            enableMultiSort={true}
            onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center text-description py-8">
              {translation('noOpenTasks')}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCardView
                key={task.id}
                task={task}
                onToggleDone={handleToggleDone}
                onClick={(t) => setTaskDialogState({ isOpen: true, taskId: t.id })}
                showAssignee={showAssignee}
              />
            ))
          )}
        </div>
      )}
      <SidePanel
        title={taskDialogState.taskId ? translation('editTask') : translation('createTask')}
        isOpen={taskDialogState.isOpen}
        onClose={() => setTaskDialogState({ isOpen: false })}
      >
        <TaskDetailView
          taskId={taskDialogState.taskId ?? null}
          onClose={() => setTaskDialogState({ isOpen: false })}
          onSuccess={onRefetch || (() => {
          })}
        />
      </SidePanel>
      <SidePanel
        title={translation('editPatient')}
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      >
        {!!selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
            onSuccess={onRefetch || (() => {
            })}
          />
        )}
      </SidePanel>
    </div>
  )
})

TaskList.displayName = 'TaskList'
