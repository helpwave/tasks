import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Avatar, Checkbox, Chip, IconButton, Table } from '@helpwave/hightide'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import {
  useGetMyTasksQuery,
  useCompleteTaskMutation,
  useReopenTaskMutation
} from '@/api/gql/generated'
import { EditIcon } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'

type TaskViewModel = {
  id: string,
  name: string,
  dueDate: Date,
  patient?: { name: string },
  assignee?: { id: string, name: string, avatarURL?: string | null },
  ward?: { name: string },
  room?: { name: string },
  done: boolean,
}

const Dashboard: NextPage = () => {
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
      dueDate: new Date(task.creationDate),
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
  }, [queryData])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => [
      {
        id: 'done',
        header: '',
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.done}
            onChange={(checked) => {
              if (checked) {
                completeTask({ id: row.original.id })
              } else {
                reopenTask({ id: row.original.id })
              }
            }}
          />
        ),
        minSize: 60,
        size: 60,
        enableResizing: false,
      },
      {
        id: 'description',
        header: translation('description'),
        accessorKey: 'name',
        minSize: 200,
        size: 250,
        maxSize: 300,
      },
      {
        id: 'dueDate',
        header: translation('dueDate'),
        accessorKey: 'dueDate',
        cell: ({ row }) => {
          const dueDate = row.original.dueDate
          return (
            <SmartDate
              date={dueDate}
              className={clsx({ 'text-warning': dueDate < new Date() && !row.original.done })}
            />
          )
        },
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
        id: 'status',
        header: translation('status'),
        accessorFn: ({ done, dueDate }) =>
          done ? 'done' : dueDate < new Date() ? 'overdue' : 'upcoming',
        cell: ({ getValue }) => {
          const status = getValue() as 'done' | 'overdue' | 'upcoming'
          return (
            <Chip
              color={
                status === 'done'
                  ? 'green'
                  : status === 'overdue'
                    ? 'red'
                    : 'yellow'
              }
            >
              {translation('taskStatus', { status })}
            </Chip>
          )
        },
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
        cell: ({ row }) => {
          const task = row.original
          return (
            <IconButton
              color="transparent"
              onClick={() => {
                console.log(task)
              }}
            >
              <EditIcon />
            </IconButton>
          )
        },
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
        title={translation('myTasks')}
        description={translation('nTask', { count: tasks.length })}
      >
        <Table className="w-full h-full" data={tasks} columns={columns} />
      </ContentPanel>
    </Page>
  )
}

export default Dashboard
