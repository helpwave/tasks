import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useQuery } from '@tanstack/react-query'
import { LoadingContainer, Tab, TabView } from '@helpwave/hightide'
import { PatientList } from '@/components/patients/PatientList'
import { TaskList } from '@/components/tasks/TaskList'

type Ward = {
  id: string,
  name: string,
}

const ward: Ward = {
  id: '1',
  name: 'Test Station',
}

const WardPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 1000))
      return ward
    }
  })

  return (
    <Page pageTitle={titleWrapper(translation('wards'))}>
      <ContentPanel
        titleElement={data?.name ?? (<LoadingContainer className="w-16 h-7" />)}
      >
        {isLoading && (
          <LoadingContainer className="flex-col-0 grow" />
        )}
        {!isLoading && isError && (
          <div className="bg-negative/20 flex-col-0 justify-center items-center">
            {translation('errorOccurred')}
          </div>
        )}
        {!isLoading && !isError && (
          <TabView>
            <Tab label={translation('tasks')}>
              <TaskList />
            </Tab>
            <Tab label={translation('patients')}>
              <PatientList locationId={data?.id} />
            </Tab>
          </TabView>
        )}
      </ContentPanel>
    </Page>
  )
}

export default WardPage
