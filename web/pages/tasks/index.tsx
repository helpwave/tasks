import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Avatar, Checkbox, Chip, IconButton, Table } from '@helpwave/hightide'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { useMyQueryQuery } from '@/api/gql/generated'
import { EditIcon } from 'lucide-react'
import clsx from 'clsx'

type Patient = {
  name: string,
}

type Assignee = {
  name: string,
  avatarURL?: string,
}

type Room = {
  name: string,
}

type Ward = {
  name: string,
}

type Task = {
  id: string,
  name: string,
  dueDate: Date,
  patient?: Patient,
  assignee?: Assignee,
  ward?: Ward,
  room?: Room,
  done: boolean,
}

const tasks: Task[] = [
  {
    id: 't1',
    name: 'Check vitals',
    dueDate: new Date('2025-01-10T08:00'),
    patient: { name: 'Alice Kim' },
    done: false,
    assignee: { name: 'Max Mustermann' },
  },
  {
    id: 't2',
    name: 'Administer medication',
    dueDate: new Date('2025-01-10T09:30'),
    patient: { name: 'John Park' },
    done: false
  },
  {
    id: 't3',
    name: 'Prepare room for surgery',
    dueDate: new Date('2025-01-10T10:00'),
    room: { name: 'OR-2' },
    done: false
  },
  {
    id: 't4',
    name: 'Daily wound inspection',
    dueDate: new Date('2025-01-10T11:00'),
    patient: { name: 'Sarah Lee' },
    done: false
  },
  {
    id: 't5',
    name: 'Clean recovery room',
    dueDate: new Date('2025-01-10T12:00'),
    room: { name: 'Recovery-5' },
    done: false
  },
  {
    id: 't6',
    name: 'Update patient chart',
    dueDate: new Date('2025-01-10T13:00'),
    patient: { name: 'Daniel Cho' },
    done: false
  },
  {
    id: 't7',
    name: 'Disinfect equipment',
    dueDate: new Date('2025-01-10T14:00'),
    room: { name: 'Utility-3' },
    done: true
  },
  {
    id: 't8',
    name: 'Prepare IV line',
    dueDate: new Date('2025-01-10T14:30'),
    patient: { name: 'Emma Yoon' },
    done: false
  },
  {
    id: 't9',
    name: 'Room ventilation check',
    dueDate: new Date('2025-01-10T15:00'),
    room: { name: 'ICU-1' },
    done: false
  },
  {
    id: 't10',
    name: 'Transport patient for imaging',
    dueDate: new Date('2025-01-10T15:30'),
    patient: { name: 'Michael Han' },
    done: true
  },
  {
    id: 't11',
    name: 'Replace linens',
    dueDate: new Date('2025-01-10T16:00'),
    room: { name: 'Room-204' },
    done: false
  },
  {
    id: 't12',
    name: 'Monitor infusion pump',
    dueDate: new Date('2025-01-10T16:30'),
    patient: { name: 'Grace Jung' },
    done: false
  },
  {
    id: 't13',
    name: 'Calibrate sensors',
    dueDate: new Date('2025-01-10T17:00'),
    room: { name: 'Lab-1' },
    done: true
  },
  {
    id: 't14',
    name: 'Check oxygen supply',
    dueDate: new Date('2025-01-10T17:30'),
    room: { name: 'ICU-3' },
    done: false
  },
  {
    id: 't15',
    name: 'Assist with mobility',
    dueDate: new Date('2025-01-10T18:00'),
    patient: { name: 'Henry Park' },
    done: false
  },
  {
    id: 't16',
    name: 'Inventory medications',
    dueDate: new Date('2025-01-10T18:30'),
    room: { name: 'Pharmacy' },
    done: true
  },
  {
    id: 't17',
    name: 'Measure blood glucose',
    dueDate: new Date('2025-01-10T19:00'),
    patient: { name: 'Lina Seo' },
    done: false
  },
  {
    id: 't18',
    name: 'Sanitize surfaces',
    dueDate: new Date('2025-01-10T19:30'),
    room: { name: 'ER-2' },
    done: false
  },
  {
    id: 't19',
    name: 'Check respiratory status',
    dueDate: new Date('2025-01-10T20:00'),
    patient: { name: 'Robert Shin' },
    done: false
  },
  {
    id: 't20',
    name: 'Test emergency lighting',
    dueDate: new Date('2025-01-10T20:30'),
    room: { name: 'Hallway-A' },
    done: true
  }
]


const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()

  // TODO do translations of headers
  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      id: 'done',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.done}
          onChange={(checked) => {
            console.debug(checked)
            // TODO change checked state
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
          <span className={clsx({ 'text-warning': dueDate < new Date() })}>{dueDate.toLocaleString()}</span>
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
              {hasAssignmentInfo ?
                [data.ward?.name, data.room?.name].filter(Boolean).join(' - ')
                : translation('notAssigned')
              }
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
      accessorFn: ({ done, dueDate }) => done ? 'done' : dueDate < new Date() ? 'overdue' : 'upcoming',
      cell: ({ getValue }) => {
        const status = getValue() as 'done' | 'overdue' | 'upcoming'
        return (
          <Chip color={status === 'done' ? 'green' : status === 'overdue' ? 'red' : 'yellow'}>
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
        if(!assignee) {
          return (
            <span className="text-description">
              {translation('notAssigned')}
            </span>
          )
        }
        return (
          <div className="flex-row-2">
            <Avatar fullyRounded={true}/>
            {assignee.name}
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
              console.log(`clicked on finish of task ${task.id}`)
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
  ], [])

  const { data, isLoading } = useMyQueryQuery()
  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel titleElement={translation('myTasks')} description={translation('nTask', { count: tasks.length })}>
        <Table
          className="w-full h-full"
          data={tasks}
          columns={columns}
        />

        {isLoading ? 'Loading' : data?.patients.toString()}
      </ContentPanel>
    </Page>
  )
}

export default Dashboard
