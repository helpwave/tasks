import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { Avatar, Table } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { useTasksContext } from '@/hooks/useTasksContext'

const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()
  const { user, myTasksCount, totalPatientsCount } = useTasksContext()
  const { data } = useGetOverviewDataQuery()

  const recentPatients = useMemo(() => data?.recentPatients ?? [], [data])
  const recentTasks = useMemo(() => data?.recentTasks ?? [], [data])

  const taskColumns = useMemo<ColumnDef<typeof recentTasks[0]>[]>(() => [
    {
      id: 'title',
      header: translation('task'),
      accessorKey: 'title',
      minSize: 200,
    },
    {
      id: 'patient',
      header: translation('patient'),
      accessorFn: (row) => row.patient?.name ?? '-',
      minSize: 150,
    },
    {
      id: 'date',
      header: translation('updated'),
      cell: ({ row }) => <SmartDate date={row.original.updateDate ? new Date(row.original.updateDate) : new Date()} />,
      minSize: 100,
    }
  ], [translation])

  const patientColumns = useMemo<ColumnDef<typeof recentPatients[0]>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 150,
    },
    {
      id: 'location',
      header: translation('location'),
      accessorFn: (row) => row.assignedLocation?.parent?.title ?? '-',
      minSize: 150,
    }
  ], [translation])

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
            <h1 className="typography-title-lg">{translation('dashboardWelcome', { name: user?.name ?? '' })}</h1>
            <p className="typography-body text-description">{translation('dashboardWelcomeDescription')}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ListCheckIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">{translation('myOpenTasks')}</span>
              <span className="typography-title-lg">{myTasksCount}</span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-green-500/10 rounded-full text-green-600">
              <UsersIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">{translation('totalPatients')}</span>
              <span className="typography-title-lg">{totalPatientsCount}</span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
              <ClockIcon size={24} />
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">{translation('currentTime')}</span>
              <span className="typography-title-lg">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
          <ContentPanel title={translation('recentTasks')} description={translation('tasksUpdatedRecently')}>
            <Table data={recentTasks} columns={taskColumns} />
          </ContentPanel>

          <ContentPanel title={translation('recentPatients')} description={translation('newestAdmissions')}>
            <Table data={recentPatients} columns={patientColumns} />
          </ContentPanel>
        </div>

      </div>
    </Page>
  )
}

export default Dashboard
