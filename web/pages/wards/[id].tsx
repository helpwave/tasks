import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LoadingContainer, TabSwitcher, TabPanel } from '@helpwave/hightide'
import { PatientList } from '@/components/patients/PatientList'
import { TaskList } from '@/components/tasks/TaskList'
import { useGetLocationNodeQuery } from '@/api/queries/locations'
import { useRouter } from 'next/router'

const WardPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const id = Array.isArray(router.query['id']) ? router.query['id'][0] : router.query['id']

  const { data: locationData, loading: isLoadingLocation, error: locationError } = useGetLocationNodeQuery(
    { id: id! },
    {
      skip: !id,
      fetchPolicy: 'cache-and-network',
    }
  )
  const isLocationError = !!locationError

  const isLoading = isLoadingLocation
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
              <PatientList />
            </TabPanel>
            <TabPanel label={translation('tasks')}>
              <TaskList
                baseVariables={{
                  rootLocationIds: id ? [id] : undefined,
                }}
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
