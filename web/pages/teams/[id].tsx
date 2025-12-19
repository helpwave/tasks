import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LoadingContainer, Tab, TabView } from '@helpwave/hightide'
import { PatientList } from '@/components/patients/PatientList'
import { TaskList, type TaskViewModel } from '@/components/tasks/TaskList'
import { useGetLocationNodeQuery, useGetPatientsQuery } from '@/api/gql/generated'
import { useMemo } from 'react'
import { useRouter } from 'next/router'

const TeamPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const id = Array.isArray(router.query['id']) ? router.query['id'][0] : router.query['id']

  const { data: locationData, isLoading: isLoadingLocation, isError: isLocationError } = useGetLocationNodeQuery(
    { id: id! },
    {
      enabled: !!id,
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  )

  const { data: patientsData, refetch: refetchPatients, isLoading: isLoadingPatients } = useGetPatientsQuery(
    { locationId: id },
    {
      enabled: !!id,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!patientsData?.patients) return []

    return patientsData.patients.flatMap(patient => {
      if (!patient.tasks) return []

      return patient.tasks.map(task => ({
        id: task.id,
        name: task.title,
        description: task.description || undefined,
        updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        done: task.done,
        patient: {
          id: patient.id,
          name: patient.name,
          locations: patient.assignedLocations || []
        },
        assignee: task.assignee
          ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
          : undefined,
      }))
    })
  }, [patientsData])

  const isLoading = isLoadingLocation || isLoadingPatients
  const isError = isLocationError || !id

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
              <PatientList locationId={id} />
            </Tab>
            <Tab label={translation('tasks')}>
              <TaskList
                tasks={tasks}
                onRefetch={refetchPatients}
                showAssignee={true}
              />
            </Tab>
          </TabView>
        )}
      </ContentPanel>
    </Page>
  )
}

export default TeamPage
