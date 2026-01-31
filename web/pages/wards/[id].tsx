import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LoadingContainer, TabSwitcher, TabPanel } from '@helpwave/hightide'
import { PatientList } from '@/components/tables/PatientList'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useGetLocationNodeQuery, GetPatientsDocument, type GetPatientsQuery } from '@/api/gql/generated'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { usePaginatedGraphQLQuery } from '@/hooks/usePaginatedQuery'

const WardPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const id = Array.isArray(router.query['id']) ? router.query['id'][0] : router.query['id']

  const { data: locationData, isLoading: isLoadingLocation, isError: isLocationError } = useGetLocationNodeQuery(
    { id: id! },
    {
      enabled: !!id,
      refetchOnWindowFocus: true,
    }
  )

  const { data: patientsData, refetch: refetchPatients, isLoading: isLoadingPatients } = usePaginatedGraphQLQuery<GetPatientsQuery, GetPatientsQuery['patients'][0], { locationId?: string }>({
    queryKey: ['GetPatients', 'ward', id],
    document: GetPatientsDocument,
    baseVariables: { locationId: id },
    pageSize: 50,
    extractItems: (result) => result.patients,
    mode: 'infinite',
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!patientsData || patientsData.length === 0) return []

    return patientsData.flatMap(patient => {
      if (!patient.tasks) return []

      return patient.tasks.map(task => ({
        id: task.id,
        name: task.title,
        description: task.description || undefined,
        updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority || null,
        estimatedTime: task.estimatedTime ?? null,
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
    <Page pageTitle={titleWrapper(translation('wards'))}>
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
          <TabSwitcher>
            <TabPanel label={translation('patients')}>
              <PatientList locationId={id ?? undefined} />
            </TabPanel>
            <TabPanel label={translation('tasks')}>
              <TaskList
                tasks={tasks}
                onRefetch={refetchPatients}
                showAssignee={true}
              />
            </TabPanel>
          </TabSwitcher>
        )}
      </ContentPanel>
    </Page>
  )
}

export default WardPage
