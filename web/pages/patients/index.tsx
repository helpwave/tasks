import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Chip, IconButton, Table } from '@helpwave/hightide'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { useMyQueryQuery } from '@/api/gql/generated'
import type { User } from 'oidc-client-ts'
import { getUser } from '@/api/auth/authService'
import { EditIcon } from 'lucide-react'

type Room = {
  name: string,
}

type Ward = {
  name: string,
}

type Task = {
  id: string,
  assigneeId: string,
  dueDate?: Date,
  done: boolean,
}

type Patient = {
  id: string,
  name: string,
  tasks: Task[],
  room?: Room,
  ward?: Ward,
  lastUpdate?: Date,
}

const patients: Patient[] = [
  {
    id: 'p1',
    name: 'Ana Lopez',
    room: { name: '301B' },
    ward: { name: 'Station 1' },
    tasks: [
      {
        id: 't1',
        assigneeId: 'nurse-14',
        done: false,
        dueDate: new Date(2025)
      },
      {
        id: 't2',
        assigneeId: 'physician-03',
        done: true,
        dueDate: new Date(2026)
      },
    ],
  },

  {
    id: 'p2',
    name: 'Michael Chen',
    room: { name: '207A' },
    ward: { name: 'Station 2' },
    tasks: [
      {
        id: 't3',
        assigneeId: 'nurse-08',
        done: false,
        dueDate: new Date(2025)
      },
    ],
  },

  {
    id: 'p3',
    name: 'Evelyn Hart',
    ward: { name: 'Station 2' },
    tasks: [
      {
        id: 't4',
        assigneeId: 'nurse-18',
        done: true,
      },
      {
        id: 't5',
        assigneeId: 'physician-03',
        done: false,
        dueDate: new Date(2026)
      },
    ],
  },
]


const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const [user, setUser] = useState<User>()

  useEffect(() => {
    getUser().then(
      value => value && setUser(value)
    )
  }, [])

  const columns = useMemo<ColumnDef<Patient>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
    },
    {
      id: 'place',
      header: translation('place'),
      accessorFn: ({ ward, room }) => [ward, room].filter(Boolean).join(' - '),
      cell: ({ row }) => {
        const data = row.original
        const unassigned = !data.room && !data.ward
        if(unassigned) {
          return (
            <span className="text-description">
              {translation('notAssigned')}
            </span>
          )
        }
        return (
          <div className="flex-col-0">
            <span className="typography-label-sm font-bold">
              {data.ward?.name ?? translation('notAssigned')}
            </span>
            <span className="text-description">
                {data.room?.name ?? translation('notAssigned')}
            </span>
          </div>
        )
      },
      minSize: 100,
      size: 100,
      maxSize: 200,
    },
    {
      id: 'myTasks',
      header: translation('myTasks'),
      // TODO use correct id
      accessorFn: ({ tasks }) => tasks.filter(value => value.assigneeId === user?.profile.sid).length,
      cell: ({ row }) => {
        const data = row.original.tasks // .filter(value => value.assigneeId === user?.profile.sid)
        const done = data.filter(value => value.done)
        const upcoming = data.filter(value => !value.done && !(value.dueDate && value.dueDate > new Date()))
        const overdue = data.filter(value => !value.done && (value.dueDate && value.dueDate > new Date()))

        if(done.length === 0 && upcoming.length === 0 && overdue.length === 0) {
          return (
            <span className="text-description">{translation('none')}</span>
          )
        }

        return (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {done.length > 0 && (
              <Chip color="green">{`${translation('taskStatus', { status: 'done' })} ${done.length}`}</Chip>
            )}
            {upcoming.length > 0 && (
              <Chip color="yellow">{`${translation('taskStatus', { status: 'upcoming' })} ${upcoming.length}`}</Chip>
            )}
            {overdue.length > 0 && (
              <Chip color="red">{`${translation('taskStatus', { status: 'overdue' })} ${overdue.length}`}</Chip>
            )}
          </div>
        )
      },
      minSize: 100,
      size: 100,
      maxSize: 200,
    },
    {
      id: 'lastChange',
      header: translation('lastUpdate'),
      accessorKey: 'lastUpdate',
      cell: ({ row }) => {
        if(!row.original.lastUpdate) {
          return (<span className="text-description">-</span>)
        }
        return (
          <span className="typography-label-sm font-bold">
            {row.original.lastUpdate?.toLocaleString()}
          </span>
        )
      },
      minSize: 100,
      size: 150,
      maxSize: 200,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const data = row.original
        return (
          <IconButton
            color="transparent"
            onClick={() => {
              console.log(`clicked on settings of ${data.name}`)
            }}
          >
            <EditIcon/>
          </IconButton>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 77,
      minSize: 77,
      maxSize: 77
    }
  ], [user])

  const { data, isLoading } = useMyQueryQuery()
  return (
    <Page pageTitle={titleWrapper(translation('patients'))}>
      <ContentPanel
        titleElement={translation('patients')}
        description={translation('nPatient', { count: patients.length })}
      >
        <Table
          className="w-full h-full"
          data={patients}
          columns={columns}
        />

        {isLoading ? 'Loading' : data?.patients.toString()}
      </ContentPanel>
    </Page>
  )
}

export default PatientsPage
