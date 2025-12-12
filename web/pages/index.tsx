import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { useGlobalContext } from '@/context/GlobalContext'
import { Avatar, Table } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'

const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()
  const { user, stats } = useGlobalContext()
  const { data } = useGetOverviewDataQuery()

  const recentPatients = useMemo(() => data?.recentPatients ?? [], [data])
  const recentTasks = useMemo(() => data?.recentTasks ?? [], [data])

  // Added minSize to all columns to prevent Table component crash
  const taskColumns = useMemo<ColumnDef<typeof recentTasks[0]>[]>(() => [
    {
      id: 'title',
      header: 'Task',
      accessorKey: 'title',
      minSize: 200, // Required by Table component
    },
    {
      id: 'patient',
      header: 'Patient',
      accessorFn: (row) => row.patient?.name ?? '-',
      minSize: 150, // Required by Table component
    },
    {
      id: 'date',
      header: 'Updated',
      cell: ({ row }) => <SmartDate date={row.original.updateDate ? new Date(row.original.updateDate) : new Date()} />,
      minSize: 100, // Required by Table component
    }
  ], [])

  const patientColumns = useMemo<ColumnDef<typeof recentPatients[0]>[]>(() => [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      minSize: 150, // Required by Table component
    },
    {
      id: 'location',
      header: 'Location',
      accessorFn: (row) => row.assignedLocation?.parent?.title ?? '-',
      minSize: 150, // Required by Table component
    }
  ], [])

  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <div className="flex-col-8 p-4">

        {/* Welcome Section */}
        <div className="flex-row-4 items-center">
          <Avatar
            size="lg"
            fullyRounded
            image={user?.avatarUrl ? { avatarUrl: user.avatarUrl, alt: user.name } : undefined}
          />
          <div className="flex-col-1">
            <h1 className="typography-title-lg">Good Morning, {user?.name}</h1>
            <p className="typography-body text-description">Here is what is happening today.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ListCheckIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">My Open Tasks</span>
              <span className="typography-title-lg">{stats.myOpenTasksCount}</span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-green-500/10 rounded-full text-green-600">
              <UsersIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">Total Patients</span>
              <span className="typography-title-lg">{stats.totalPatientsCount}</span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
              <ClockIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">Current Time</span>
              <span className="typography-title-lg">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
          <ContentPanel title="Recent Tasks" description="Tasks updated recently">
            <Table data={recentTasks} columns={taskColumns} />
          </ContentPanel>

          <ContentPanel title="Recent Patients" description="Newest admissions">
            <Table data={recentPatients} columns={patientColumns} />
          </ContentPanel>
        </div>

      </div>
    </Page>
  )
}

export default Dashboard
