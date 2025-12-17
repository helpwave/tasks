import { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Avatar, Button, CheckboxUncontrolled, FillerRowElement, SearchBar, Table } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { useCompleteTaskMutation, useReopenTaskMutation } from '@/api/gql/generated'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/patients/LocationChips'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
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

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened }, ref) => {
  const translation = useTasksTranslation()
  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: onRefetch })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: onRefetch })

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [taskDialogState, setTaskDialogState] = useState<TaskDialogState>({ isOpen: false })
  const [searchQuery, setSearchQuery] = useState('')
  const [initialOpened, setInitialOpened] = useState(false)

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      setTaskDialogState({ isOpen: true })
    },
    openTask: (taskId: string) => {
      setTaskDialogState({ isOpen: true, taskId })
    }
  }))

  useEffect(() => {
    if (initialTaskId && initialTasks.length > 0 && !initialOpened) {
      setTaskDialogState({ isOpen: true, taskId: initialTaskId })
      setInitialOpened(true)
      onInitialTaskOpened?.()
    }
  }, [initialTaskId, initialTasks, initialOpened, onInitialTaskOpened])

  const tasks = useMemo(() => {
    let data = initialTasks

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      data = data.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.patient?.name.toLowerCase().includes(lowerQuery))
    }

    return data
  }, [initialTasks, searchQuery])

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
          minSize: 200,
          size: Number.MAX_SAFE_INTEGER,
        },
        {
          id: 'dueDate',
          header: translation('dueDate'),
          accessorKey: 'dueDate',
          cell: ({ row }) => {
            if (!row.original.dueDate) return <span className="text-description">-</span>
            return <SmartDate date={row.original.dueDate} mode="relative"/>
          },
          minSize: 150,
          size: 150,
          maxSize: 200,
        },
        {
          id: 'updateDate',
          header: 'Update Date',
          accessorKey: 'updateDate',
          cell: ({ row }) => (
            <SmartDate date={row.original.updateDate} mode="relative"/>
          ),
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
                <LocationChips locations={data.patient.locations || []}/>
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

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between w-full">
        <div className="w-full max-w-md">
          <SearchBar
            placeholder={translation('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => null}
          />
        </div>
        <Button
          startIcon={<PlusIcon/>}
          onClick={() => setTaskDialogState({ isOpen: true })}
          className="min-w-[13rem]"
        >
          {translation('addTask')}
        </Button>
      </div>
      <Table
        className="w-full h-full cursor-pointer"
        data={tasks}
        columns={columns}
        fillerRow={() => (
          <FillerRowElement className="min-h-12"/>
        )}
        initialState={{
          sorting: [
            { id: 'done', desc: true },
            { id: 'updateDate', desc: true },
          ]
        }}
        enableMultiSort={true}
        onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
      />
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
