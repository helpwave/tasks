import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Avatar } from '@helpwave/hightide'
import { CurrentTime } from '@/components/Date/CurrentTime'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTasksContext } from '@/hooks/useTasksContext'
import Link from 'next/link'
import { useOverviewData } from '@/data'
import { TaskList } from '@/components/tables/TaskList'
import { PatientList } from '@/components/tables/PatientList'
import { overviewRecentTaskToTaskViewModel } from '@/utils/overviewRecentTaskToTaskViewModel'
import { overviewRecentPatientToPatientViewModel } from '@/utils/overviewRecentPatientToPatientViewModel'
import clsx from 'clsx'


const getGreetingKey = () => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'dashboardWelcomeMorning'
  if (hour >= 12 && hour < 14) return 'dashboardWelcomeNoon'
  if (hour >= 14 && hour < 18) return 'dashboardWelcomeAfternoon'
  if (hour >= 18 && hour < 23) return 'dashboardWelcomeEvening'
  return 'dashboardWelcomeNight'
}

interface GreetingSectionProps {
  userName?: string | null,
  userAvatarUrl?: string | null,
}

const GreetingSection = ({ userName, userAvatarUrl }: GreetingSectionProps) => {
  const translation = useTasksTranslation()

  return (
    <div className="flex-row-4 items-center">
      <Avatar
        size="lg"
        image={userAvatarUrl ? { avatarUrl: userAvatarUrl, alt: userName ?? '' } : undefined}
      />
      <div className="flex-col-1">
        <h1 className="typography-title-lg">{translation(getGreetingKey(), { name: userName ?? '' })}</h1>
        <p className="typography-body text-description">{translation('dashboardWelcomeDescription')}</p>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string,
  value: ReactNode,
  icon: ReactNode,
  iconWrapperClassName?: string,
  className?: string,
}

const StatCard = ({ label, value, icon, iconWrapperClassName, className }: StatCardProps) => {
  return (
    <div className={clsx('bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border h-full', className)}>
      <div className={clsx('p-3 rounded-full', iconWrapperClassName)}>
        {icon}
      </div>
      <div className="flex-col-0">
        <span className="typography-label-sm text-description">{label}</span>
        <span className="typography-title-lg">{value}</span>
      </div>
    </div>
  )
}

const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()
  const { user, myTasksCount, totalPatientsCount, selectedRootLocationIds } = useTasksContext()
  const overviewVariables = useMemo(() => ({
    rootLocationIds: selectedRootLocationIds ?? undefined,
    recentTasksPagination: { pageSize: 5, pageIndex: 0 },
    recentPatientsPagination: { pageSize: 5, pageIndex: 0 },
  }), [selectedRootLocationIds])
  const { data, refetch } = useOverviewData(overviewVariables)

  const taskListTasks = useMemo(
    () => (data?.recentTasks ?? []).map(overviewRecentTaskToTaskViewModel),
    [data?.recentTasks]
  )

  const patientListPatients = useMemo(
    () => (data?.recentPatients ?? []).map(overviewRecentPatientToPatientViewModel),
    [data?.recentPatients]
  )

  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <div className="flex-col-8">
        <GreetingSection userName={user?.name} userAvatarUrl={user?.avatarUrl} />

        <div className="flex flex-wrap gap-4">
          <Link href="/tasks" className="min-w-60 min-h-20 flex-1 w-full sm:w-auto rounded-lg">
            <StatCard
              label={translation('myOpenTasks')}
              value={myTasksCount}
              icon={<ListCheckIcon className="size-force-5"/>}
              iconWrapperClassName="bg-primary/10 text-primary"
            />
          </Link>

          <Link href="/patients" className="min-w-60 min-h-20 flex-1 w-full sm:w-auto rounded-lg">
            <StatCard
              label={translation('totalPatients')}
              value={totalPatientsCount}
              icon={<UsersIcon className="size-force-5"/>}
              iconWrapperClassName="bg-positive/10 text-positive"
            />
          </Link>

          <div className="min-w-60 min-h-20 flex-1 w-full sm:w-auto">
            <StatCard
              label={translation('currentTime')}
              value={<CurrentTime/>}
              icon={<ClockIcon className="size-force-5"/>}
              iconWrapperClassName="bg-secondary/10 text-secondary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="mt-2 w-full min-w-0">
            <div className="flex-col-0 mb-4">
              <span className="typography-title-lg">{translation('recentTasks')}</span>
              <span className="text-description">{translation('tasksUpdatedRecently')}</span>
            </div>
            <TaskList
              embedded
              tasks={taskListTasks}
              onRefetch={() => void refetch()}
              showAssignee={true}
              totalCount={data?.recentTasksTotal ?? undefined}
            />
          </div>

          <div className="mt-2 w-full min-w-0">
            <div className="flex-col-0 mb-4">
              <span className="typography-title-lg">{translation('recentPatients')}</span>
              <span className="text-description">{translation('patientsUpdatedRecently')}</span>
            </div>
            <PatientList
              embedded
              embeddedPatients={patientListPatients}
              embeddedOnRefetch={() => void refetch()}
            />
          </div>
        </div>

      </div>
    </Page>
  )
}

export default Dashboard
