import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { Avatar } from '@helpwave/hightide'
import { CurrentTime } from '@/utils/date'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTasksContext } from '@/hooks/useTasksContext'
import Link from 'next/link'
import { Drawer } from '@helpwave/hightide'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { CompleteTaskDocument, ReopenTaskDocument, type CompleteTaskMutation, type ReopenTaskMutation, type CompleteTaskMutationVariables, type ReopenTaskMutationVariables, type GetOverviewDataQuery, type GetGlobalDataQuery } from '@/api/gql/generated'
import { useSafeMutation } from '@/hooks/useSafeMutation'
import { fetcher } from '@/api/gql/fetcher'
import { useQueryClient } from '@tanstack/react-query'
import { RecentTasksTable } from '@/components/tables/RecentTasksTable'
import { RecentPatientsTable } from '@/components/tables/RecentPatientsTable'
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
  const { data } = useGetOverviewDataQuery(undefined, {})
  const queryClient = useQueryClient()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { mutate: completeTask } = useSafeMutation<CompleteTaskMutation, CompleteTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<CompleteTaskMutation, CompleteTaskMutationVariables>(CompleteTaskDocument, variables)()
    },
    optimisticUpdate: (variables) => {
      const updates: Array<{ queryKey: unknown[], updateFn: (oldData: unknown) => unknown }> = [
        {
          queryKey: ['GetOverviewData'],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetOverviewDataQuery | undefined
            if (!data?.recentTasks) return oldData
            return {
              ...data,
              recentTasks: data.recentTasks.map(t =>
                t.id === variables.id ? { ...t, done: true } : t)
            }
          }
        }
      ]
      const globalData = queryClient.getQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }])
      if (globalData?.me?.tasks) {
        updates.push({
          queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetGlobalDataQuery | undefined
            if (!data?.me?.tasks) return oldData
            return {
              ...data,
              me: data.me ? {
                ...data.me,
                tasks: data.me.tasks.map(task => task.id === variables.id ? { ...task, done: true } : task)
              } : null
            }
          }
        })
      }
      return updates
    },
    affectedQueryKeys: [['GetOverviewData'], ['GetTasks'], ['GetPatients'], ['GetGlobalData']],
  })

  const { mutate: reopenTask } = useSafeMutation<ReopenTaskMutation, ReopenTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<ReopenTaskMutation, ReopenTaskMutationVariables>(ReopenTaskDocument, variables)()
    },
    optimisticUpdate: (variables) => {
      const updates: Array<{ queryKey: unknown[], updateFn: (oldData: unknown) => unknown }> = [
        {
          queryKey: ['GetOverviewData'],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetOverviewDataQuery | undefined
            if (!data?.recentTasks) return oldData
            return {
              ...data,
              recentTasks: data.recentTasks.map(t =>
                t.id === variables.id ? { ...t, done: false } : t)
            }
          }
        }
      ]
      const globalData = queryClient.getQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }])
      if (globalData?.me?.tasks) {
        updates.push({
          queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetGlobalDataQuery | undefined
            if (!data?.me?.tasks) return oldData
            return {
              ...data,
              me: data.me ? {
                ...data.me,
                tasks: data.me.tasks.map(task => task.id === variables.id ? { ...task, done: false } : task)
              } : null
            }
          }
        })
      }
      return updates
    },
    affectedQueryKeys: [['GetOverviewData'], ['GetTasks'], ['GetPatients'], ['GetGlobalData']],
  })

  const recentPatients = useMemo(() => data?.recentPatients ?? [], [data])
  const recentTasks = useMemo(() => data?.recentTasks ?? [], [data])


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

        <div className="flex flex-wrap gap-4 2xl:flex-row 2xl:flex-nowrap print-content">
          <RecentTasksTable
            tasks={recentTasks}
            completeTask={useCallback((id) => completeTask({ id }), [completeTask])}
            reopenTask={useCallback((id) => reopenTask({ id }), [reopenTask])}
            onSelectPatient={setSelectedPatientId}
            onSelectTask={setSelectedTaskId}
            className="w-full 2xl:min-w-150 flex-1"
          />

          <RecentPatientsTable
            patients={recentPatients}
            onSelectPatient={setSelectedPatientId}
            className="w-full 2xl: min-w-100 2xl:w-2/5"
          />
        </div>

        <Drawer
          alignment="right"
          titleElement={translation('editPatient')}
          description={undefined}
          isOpen={!!selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        >
          {selectedPatientId && (
            <PatientDetailView
              patientId={selectedPatientId}
              onClose={() => setSelectedPatientId(null)}
              onSuccess={() => {}}
            />
          )}
        </Drawer>

        <Drawer
          alignment="right"
          titleElement={translation('editTask')}
          description={undefined}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        >
          {selectedTaskId && (
            <TaskDetailView
              taskId={selectedTaskId}
              onClose={() => setSelectedTaskId(null)}
              onSuccess={() => {}}
            />
          )}
        </Drawer>

      </div>
    </Page>
  )
}

export default Dashboard
