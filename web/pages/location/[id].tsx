import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LoadingContainer, TabSwitcher, Chip, Button, TabPanel } from '@helpwave/hightide'
import { PatientList } from '@/components/tables/PatientList'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useGetLocationNodeQuery, useGetPatientsQuery, useGetTasksQuery, type LocationType } from '@/api/gql/generated'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { LocationChips } from '@/components/patients/LocationChips'
import { LOCATION_PATH_SEPARATOR } from '@/utils/location'

const getKindStyles = (kind: string) => {
  const k = kind.toUpperCase()
  if (k === 'HOSPITAL') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (k === 'PRACTICE') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
  if (k === 'CLINIC') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (k === 'TEAM') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (k === 'WARD') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (k === 'ROOM') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  if (k === 'BED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return 'bg-surface-subdued text-text-tertiary'
}

const LocationPage: NextPage = () => {
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

  const isTeamLocation = locationData?.locationNode?.kind === 'TEAM'

  const { data: patientsData, refetch: refetchPatients, isLoading: isLoadingPatients } = useGetPatientsQuery(
    { rootLocationIds: id ? [id] : undefined },
    {
      enabled: !!id && !isTeamLocation,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const { data: tasksData, refetch: refetchTasks, isLoading: isLoadingTasks } = useGetTasksQuery(
    {
      assigneeTeamId: isTeamLocation && !showAllTasks ? id : undefined,
      rootLocationIds: undefined,
    },
    {
      enabled: !!id && isTeamLocation,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const tasks: TaskViewModel[] = useMemo(() => {
    if (isTeamLocation && tasksData?.tasks) {
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
          ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
          : undefined,
        assigneeTeam: task.assigneeTeam
          ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
          : undefined,
      }))
    }

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
        priority: task.priority || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done,
        patient: {
          id: patient.id,
          name: patient.name,
          locations: mergedLocations
        },
        assignee: task.assignee
          ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
          : undefined,
        assigneeTeam: task.assigneeTeam
          ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
          : undefined,
      }))
    })
  }, [patientsData, tasksData, isTeamLocation])

  const isLoading = isLoadingLocation || (isTeamLocation ? isLoadingTasks : isLoadingPatients)
  const isError = isLocationError || !id

  const handleRefetch = () => {
    if (isTeamLocation) {
      refetchTasks()
    } else {
      refetchPatients()
    }
  }

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
                    size="sm"
                    color={undefined}
                    className={`text-[0.625rem] font-bold px-1 py-0.5 rounded-md uppercase tracking-wider ${getKindStyles(locationKind)}`}
                  >
                    {translation('locationType', { type: locationKind })}
                  </Chip>
                )}
                <div className="flex flex-wrap items-center -space-x-1 scale-75 origin-top-left">
                  {parentChain.map((parent, index) => (
                    <div key={parent.id} className="flex items-center">
                      {index > 0 && <span className="text-description mx-3">{LOCATION_PATH_SEPARATOR}</span>}
                      <LocationChips locations={[parent]} />
                    </div>
                  ))}
                </div>
              </div>
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
          <TabSwitcher>
            <TabPanel label={translation('patients')}>
              <PatientList locationId={id || undefined} />
            </TabPanel>
            <TabPanel label={translation('tasks')}>
              <TaskList
                tasks={tasks}
                onRefetch={handleRefetch}
                showAssignee={true}
                headerActions={
                  isTeamLocation ? (
                    <Button
                      onClick={() => setShowAllTasks(!showAllTasks)}
                      color="neutral"
                      coloringStyle="outline"
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      {showAllTasks ? translation('showTeamTasks') ?? 'Show Team Tasks' : translation('showAllTasks') ?? 'Show All Tasks'}
                    </Button>
                  ) : undefined
                }
              />
            </TabPanel>
          </TabSwitcher>
        )}
      </ContentPanel>
    </Page>
  )
}

export default LocationPage

