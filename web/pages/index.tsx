import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Chip, SolidButton, Table } from '@helpwave/hightide'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'

type Patient = {
  name: string,
}

type Room = {
  name: string,
}

type Task = {
  id: string,
  name: string,
  dueDate: Date,
  patient?: Patient,
  room?: Room,
  done: boolean,
}

const tasks: Task[] = [
  {
    id: 't1',
    name: 'Check vitals',
    dueDate: new Date('2025-01-10T08:00'),
    patient: { name: 'Alice Kim' },
    done: false
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

  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
    },
    {
      id: 'dueDate',
      header: 'dueDate',
      accessorKey: 'dueDate',
      cell: ({ row }) => row.original.dueDate.toLocaleString(),
      minSize: 150,
      size: 200,
      maxSize: 200,
    },
    {
      id: 'patient',
      header: 'Patient',
      accessorFn: ({ patient }) => patient?.name,
      sortingFn: 'text',
      minSize: 250,
      size: 250,
      maxSize: 400,
    },
    {
      id: 'room',
      header: 'Room',
      accessorFn: ({ room }) => room?.name,
      minSize: 250,
      size: 250,
      maxSize: 400,
    },
    {
      id: 'status',
      header: 'status',
      accessorKey: 'done',
      cell: ({ row }) => (
        <Chip color={row.original.done ? 'green' : 'yellow'}>
          {row.original.done ? 'done' : 'todo'}
        </Chip>
      ),
      minSize: 250,
      size: 250,
      maxSize: 400,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const task = row.original
        return (
          <SolidButton
            onClick={() => {
              // TODO update task here
              console.log(`clicked on finish of task ${task.id}`)
            }}
          >
            {'Finish'}
          </SolidButton>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 120,
      minSize: 100,
      maxSize: 150
    }
  ], [])


  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <ContentPanel title={translation('homePage')} description="The beginning of something">
        <Table
          className="w-full h-full"
          data={tasks}
          columns={columns}
        />
      </ContentPanel>
    </Page>
  )
}

export default Dashboard
