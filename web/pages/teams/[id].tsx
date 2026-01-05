import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, LoadingContainer, Tab, TabView } from '@helpwave/hightide'
import { PatientList } from '@/components/patients/PatientList'
import { TaskList, type TaskViewModel } from '@/components/tasks/TaskList'
import { useGetLocationNodeQuery, useGetPatientsQuery, useGetTasksQuery } from '@/api/gql/generated'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'

const TeamPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const id = Array.isArray(router.query['id']) ? router.query['id'][0] : router.query['id']
  const [showAllTasks, setShowAllTasks] = useState(false)

  const { data: locationData, isLoading: isLoadingLocation, isError: isLocationError } = useGetLocationNodeQuery(
    { id: id! },
    {
      enabled: !!id,
      refetchOnWindowFocus: true,
    }
  )

  const { refetch: refetchPatients, isLoading: isLoadingPatients } = useGetPatientsQuery(
    { locationId: id },
    {
      enabled: !!id,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const { data: tasksData, refetch: refetchTasks, isLoading: isLoadingTasks } = useGetTasksQuery(
    {
      assigneeTeamId: showAllTasks ? undefined : id,
      rootLocationIds: undefined,
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!tasksData?.tasks) return []

    return tasksData.tasks.map(task => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority || null,
      estimatedTime: task.estimatedTime ?? null,
      done: task.done,
      patient: task.patient
        ? {
          id: task.patient.id,
          name: task.patient.name,
          locations: task.patient.assignedLocations || []
        }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
        : undefined,
      assigneeTeam: task.assigneeTeam
        ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
        : undefined,
    }))
  }, [tasksData])

  const isLoading = isLoadingLocation || isLoadingPatients || (showAllTasks && isLoadingTasks)
  const isError = isLocationError || !id

  const handleRefetch = () => {
    refetchPatients()
    if (showAllTasks) {
      refetchTasks()
    }
  }

  return (
    <Page pageTitle={titleWrapper(translation('teams'))}>
      <ContentPanel
        titleElement={locationData?.locationNode?.title ?? (<LoadingContainer className="w-16 h-7" />)}
      >
        {isLoading && (
          <LoadingContainer className="flex-col-0 grow" />
        )}
        {!isLoading && isError && (
          <div className="bg-negative/20 flex-col-0 justify-center items-center p-4 rounded-md">
            {translation('errorOccurred')}
          </div>
        )}
        {!isLoading && !isError && (
          <TabView>
            <Tab label={translation('patients')}>
              <PatientList />
            </Tab>
            <Tab label={translation('tasks')}>
              <TaskList
                tasks={tasks}
                onRefetch={handleRefetch}
                showAssignee={true}
                headerActions={(
                  <Button
                    onClick={() => setShowAllTasks(!showAllTasks)}
                    color="neutral"
                    coloringStyle="outline"
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    {showAllTasks ? translation('showTeamTasks') ?? 'Show Team Tasks' : translation('showAllTasks') ?? 'Show All Tasks'}
                  </Button>
                )}
              />
            </Tab>
          </TabView>
        )}
      </ContentPanel>
    </Page>
  )
}

export default TeamPage
