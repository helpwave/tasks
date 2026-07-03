import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Avatar, Card, NavigationCard } from '@helpwave/hightide'
import { CurrentTime } from '@/components/Date/CurrentTime'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTasksContext } from '@/hooks/useTasksContext'
import Link from 'next/link'
import { useOverviewData } from '@/data'
import { TaskList } from '@/components/tables/TaskList'
import { PatientList } from '@/components/tables/PatientList'
import { overviewRecentTaskToTaskViewModel } from '@/utils/overviewRecentTaskToTaskViewModel'
import { overviewRecentPatientToPatientViewModel } from '@/utils/overviewRecentPatientToPatientViewModel'
import { DateUtils, useLocale } from '@helpwave/hightide'


const getGreetingKey = (timeZone: string) => {
  const hour = DateUtils.zonedParts(new Date(), timeZone).hour
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
  const { timeZone } = useLocale()
  const greetingKey = getGreetingKey(timeZone ?? 'Europe/Berlin')

  return (
    <div className="flex-row-4 items-center">
      <Avatar
        size="lg"
        image={userAvatarUrl ? { avatarUrl: userAvatarUrl, alt: userName ?? '' } : undefined}
      />
      <div className="flex-col-1">
        <h1 className="typography-title-lg">{translation(greetingKey, { name: userName ?? '' })}</h1>
        <p className="typography-body text-description">{translation('dashboardWelcomeDescription')}</p>
      </div>
    </div>
  )
}

const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()
  const { user, myTasksCount, scopedPatientsTotal, selectedRootLocationIds } = useTasksContext()
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

        <div className="flex flex-wrap w-full gap-4 min-h-0">
          <NavigationCard
            className="flex-1 min-w-64 py-4"
            href="/tasks"
            leading={(
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <ListCheckIcon className="size-force-5"/>
              </div>
            )}
            title={translation('myOpenTasks')}
            description={myTasksCount?.toString()}
            LinkComponent={Link}
          />

          <NavigationCard
            className="flex-1 min-w-64 py-4"
            href="/patients"
            leading={(
              <div className="p-3 rounded-full bg-positive/10 text-positive">
                <UsersIcon className="size-force-5"/>
              </div>
            )}
            title={translation('totalPatients')}
            description={scopedPatientsTotal?.toString()}
            LinkComponent={Link}
          />

          <Card
            className="flex-1 min-w-64 py-4"
            leading={(
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <ClockIcon className="size-force-5"/>
              </div>
            )}
            title={translation('currentTime')}
            description={<CurrentTime/>}
          />
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
