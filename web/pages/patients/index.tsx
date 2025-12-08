import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { IconButton, Table } from '@helpwave/hightide'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { withAuth } from '@/hooks/useAuth'
import { useMyQueryQuery } from '@/api/gql/generated'
import type { User } from 'oidc-client-ts'
import { getUser } from '@/api/auth/authService'
import { SettingsIcon } from 'lucide-react'

type Room = {
  name: string,
}

type Bed = {
  name: string,
}

type Task = {
  id: string,
  assigneeId: string,
  done: boolean,
}

type Patient = {
  id: string,
  name: string,
  tasks: Task[],
  room?: Room,
  bed?: Bed,
  lastUpdate?: Date,
}

const patients: Patient[] = [
  {
    id: 'p1',
    name: 'Ana Lopez',
    room: { name: '301B' },
    bed: { name: 'Fenster' },
    tasks: [
      {
        id: 't1',
        assigneeId: 'nurse-14',
        done: false,
      },
      {
        id: 't2',
        assigneeId: 'physician-03',
        done: true,
      },
    ],
  },

  {
    id: 'p2',
    name: 'Michael Chen',
    room: { name: '207A' },
    bed: { name: 'Tür' },
    tasks: [
      {
        id: 't3',
        assigneeId: 'nurse-08',
        done: false,
      },
    ],
  },

  {
    id: 'p3',
    name: 'Evelyn Hart',
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
      },
    ],
  },
]


const Dashboard: NextPage = () => {
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
      header: 'Name',
      cell: ({ row }) => {
        const data = row.original
        const unassigned = !data.room && !data.bed
        return (
          <div className="flex-col-0">
            {data.name}
            <span className="text-description">
              {unassigned ?
                translation('notAssigned') :
                [data.room?.name, data.bed?.name].filter(Boolean).join(' ')
              }
            </span>
          </div>
        )
      },
      minSize: 200,
      size: 250,
      maxSize: 300,
    },
    {
      id: 'openTasks',
      header: 'Open Tasks',
      accessorFn: ({ tasks }) => tasks.filter(value => !value.done).length,
      minSize: 100,
      size: 100,
      maxSize: 200,
    },
    {
      id: 'myTasks',
      header: 'My Tasks',
      // TODO use correct id
      accessorFn: ({ tasks }) => tasks.filter(value => value.assigneeId === user?.profile.sid).length,
      minSize: 100,
      size: 100,
      maxSize: 200,
    },
    {
      id: 'lastChange',
      header: 'Last Change',
      accessorKey: 'lastUpdate',
      cell: ({ row }) => {
        return (
          row.original.lastUpdate?.toLocaleString()
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
            color="neutral"
            onClick={() => {
              console.log(`clicked on settings of ${data.name}`)
            }}
          >
            <SettingsIcon/>
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
        title={translation('patients')}
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

export default withAuth(Dashboard)
