import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Avatar, Button, CheckboxUncontrolled, FillerRowElement, Table } from '@helpwave/hightide'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import type {
  CreateTaskInput
} from '@/api/gql/generated'
import {
  useGetMyTasksQuery,
  useCompleteTaskMutation,
  useReopenTaskMutation
} from '@/api/gql/generated'
import { PlusIcon } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'

type TaskViewModel = {
  id: string,
  name: string,
  description?: string,
  updateDate: Date,
  dueDate?: Date,
  patient?: { id: string, name: string },
  assignee?: { id: string, name: string, avatarURL?: string | null },
  ward?: { name: string },
  room?: { name: string },
  done: boolean,
}

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { data: queryData, refetch } = useGetMyTasksQuery()
  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: () => refetch() })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: () => refetch() })

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskViewModel | null>(null)

  const currentUserId = queryData?.me?.id

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!queryData?.me?.tasks) return []

    return queryData.me.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      done: task.done,
      patient: task.patient
        ? { id: task.patient.id, name: task.patient.name }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
        : undefined,
      room: task.patient?.assignedLocation
        ? { name: task.patient.assignedLocation.title }
        : undefined,
      ward: task.patient?.assignedLocation?.parent
        ? { name: task.patient.assignedLocation.parent.title }
        : undefined,
    }))
  }, [queryData])

  const handleCreate = () => {
    setSelectedTask(null)
    setIsPanelOpen(true)
  }

  const handleRowClick = (task: TaskViewModel) => {
    setSelectedTask(task)
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedTask(null), 300)
  }

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => [
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
        id: 'description',
        header: translation('description'),
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
          return <SmartDate date={row.original.dueDate} mode="relative" />
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
          <SmartDate date={row.original.updateDate} mode="relative" />
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
          const hasAssignmentInfo = data.room || data.ward
          if (!data.patient) {
            return (
              <span className="text-description">
                {translation('noPatient')}
              </span>
            )
          }
          return (
            <div className="flex-col-0">
              <span>{data.patient?.name}</span>
              <span className="text-description">
                {hasAssignmentInfo
                  ? [data.ward?.name, data.room?.name].filter(Boolean).join(' - ')
                  : translation('notAssigned')}
              </span>
            </div>
          )
        },
        sortingFn: 'text',
        minSize: 200,
        size: 250,
        maxSize: 350,
      },
      {
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

          const isMe = assignee.id === currentUserId

          return (
            <div className={clsx('flex-row-2 items-center', { 'font-bold text-primary': isMe })}>
              <Avatar
                fullyRounded={true}
                image={{
                  avatarUrl: assignee.avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
                  alt: assignee.name
                }}
              />
              <span>
                {isMe ? `${translation('itsYou')} (${assignee.name})` : assignee.name}
              </span>
            </div>
          )
        },
        minSize: 200,
        size: 250,
        maxSize: 350,
      }
    ],
    [translation, currentUserId, completeTask, reopenTask]
  )

  const initialTaskData: Partial<CreateTaskInput> | undefined = selectedTask ? {
    title: selectedTask.name,
    description: selectedTask.description,
    dueDate: selectedTask.dueDate,
    patientId: selectedTask.patient?.id,
    assigneeId: selectedTask.assignee?.id,
  } : undefined

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={translation('nTask', { count: tasks.length })}
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={handleCreate}>
            {translation('addTask')}
          </Button>
        )}
      >
        <Table
          className="w-full h-full"
          data={tasks}
          columns={columns}
          fillerRow={() => (
            <FillerRowElement className="min-h-17.25" />
          )}
          initialState={{
            sorting: [
              { id: 'done', desc: true },
              { id: 'updateDate', desc: true },
            ]
          }}
          enableMultiSort={true}
          onRowClick={(row) => handleRowClick(row.original)}
        />
      </ContentPanel>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      >
        {(isPanelOpen || selectedTask) && (
          <TaskDetailView
            taskId={selectedTask?.id}
            initialData={initialTaskData}
            onClose={handleClosePanel}
            onSuccess={refetch}
          />
        )}
      </SidePanel>
    </Page>
  )
}

export default TasksPage
