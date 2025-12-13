import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Avatar, CheckboxUncontrolled, IconButton, SolidButton, Table } from '@helpwave/hightide'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import {
  useGetMyTasksQuery,
  useCompleteTaskMutation,
  useReopenTaskMutation
} from '@/api/gql/generated'
import { EditIcon, PlusIcon } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'

type TaskViewModel = {
  id: string,
  name: string,
  updateDate: Date,
  dueDate?: Date,
  patient?: { name: string },
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

  const currentUserId = queryData?.me?.id

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!queryData?.me?.tasks) return []

    return queryData.me.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      done: task.done,
      patient: task.patient
        ? { name: task.patient.name }
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
    //.filter((task) => !task.done)
  }, [queryData])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => [
      {
        id: 'done',
        header: translation('status'),
        cell: ({ row }) => (
          <CheckboxUncontrolled
            checked={row.original.done}
            onChange={(checked) => {
              if (!checked) {
                completeTask({ id: row.original.id })
              } else {
                reopenTask({ id: row.original.id })
              }
            }}
            className={clsx('rounded-full')}
          />
        ),
        minSize: 75,
        size: 75,
        maxSize: 75,
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
          return <SmartDate date={row.original.dueDate} />
        },
        minSize: 150,
        size: 200,
        maxSize: 200,
      },
      {
        id: 'updateDate',
        header: 'Update Date',
        accessorKey: 'updateDate',
        cell: ({ row }) => (
          <SmartDate date={row.original.updateDate} />
        ),
        minSize: 150,
        size: 200,
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
        minSize: 250,
        size: 250,
        maxSize: 400,
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
        minSize: 250,
        size: 250,
        maxSize: 400,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <IconButton
            color="transparent"
            onClick={() => console.log(row.original)}
          >
            <EditIcon />
          </IconButton>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 77,
        minSize: 77,
        maxSize: 77,
      },
    ],
    [translation, currentUserId, completeTask, reopenTask]
  )

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={translation('nTask', { count: tasks.length })}
        actionElement={(
          <SolidButton startIcon={<PlusIcon />}>
            {translation('addTask')}
          </SolidButton>
        )}
      >
        <Table
          className="w-full h-full"
          data={tasks}
          columns={columns}
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
