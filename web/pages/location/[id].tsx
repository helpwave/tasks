import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LoadingContainer, Tab, TabView, Chip } from '@helpwave/hightide'
import { PatientList } from '@/components/patients/PatientList'
import { TaskList, type TaskViewModel } from '@/components/tasks/TaskList'
import { useGetLocationNodeQuery, useGetPatientsQuery, type LocationType } from '@/api/gql/generated'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { LocationChips } from '@/components/patients/LocationChips'
import { LOCATION_PATH_SEPARATOR } from '@/utils/location'

const getKindStyles = (kind: string) => {
  const k = kind.toUpperCase()
  if (k.includes('CLINIC')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (k.includes('WARD')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (k.includes('TEAM')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (k.includes('ROOM')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  if (k.includes('BED')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return 'bg-surface-subdued text-text-tertiary'
}

const LocationPage: NextPage = () => {
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

      const mergedLocations = [
        ...(patient.clinic ? [patient.clinic] : []),
        ...(patient.position ? [patient.position] : []),
        ...(patient.teams || [])
      ]

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
          locations: mergedLocations
        },
        assignee: task.assignee
          ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
          : undefined,
      }))
    })
  }, [patientsData])

  const isLoading = isLoadingLocation || isLoadingPatients
  const isError = isLocationError || !id

  const locationKind = locationData?.locationNode?.kind
  const locationTitle = locationData?.locationNode?.title

  const parentChain = useMemo(() => {
    if (!locationData?.locationNode?.parent) return []
    const chain: Array<{ id: string, title: string, kind?: LocationType }> = []
    let current: typeof locationData.locationNode.parent | null = locationData.locationNode.parent

    while (current) {
      chain.push({
        id: current.id,
        title: current.title,
        kind: current.kind,
      })
      current = current.parent || null
    }

    return chain.reverse() // Reverse to get root-to-parent order
  }, [locationData])

  return (
    <Page pageTitle={titleWrapper(locationTitle || translation('location'))}>
      <ContentPanel
        titleElement={
          isLoading ? (
            <LoadingContainer className="w-16 h-7" />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="typography-title-lg font-bold">{locationTitle}</span>
                {locationKind && (
                  <Chip
                    size="small"
                    color="none"
                    className={`text-[8px] font-bold px-0.5 py-0.5 rounded uppercase tracking-wider ${getKindStyles(locationKind)}`}
                  >
                    {translation('locationType', { type: locationKind })}
                  </Chip>
                )}
              </div>
              {parentChain.length > 0 && (
                <div className="flex flex-wrap items-center -space-x-1 scale-75 origin-top-left">
                  {parentChain.map((parent, index) => (
                    <div key={parent.id} className="flex items-center">
                      {index > 0 && <span className="text-description mx-3">{LOCATION_PATH_SEPARATOR}</span>}
                      <LocationChips locations={[parent]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
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

export default LocationPage

