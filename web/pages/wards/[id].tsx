import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useQuery } from '@tanstack/react-query'
import { LoadingContainer, Tab, TabView } from '@helpwave/hightide'

type Patients = {
  id: string,
  name: string,
}

type Ward = {
  id: string,
  name: string,
  patients: Patients[],
}

const ward: Ward = {
  id: '1',
  name: 'Test Station',
  patients: [
    {
      id: 'p1',
      name: 'Alice Weber',
    },
    {
      id: 'p2',
      name: 'Jonas Schmidt',
    },
    {
      id: 'p3',
      name: 'Mira Hansen',
    },
  ],
}


const WardPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients'],
    queryFn:  async () => {
      await new Promise(r => setTimeout(r, 1000))
      return ward
    }
  })

  return (
    <Page pageTitle={titleWrapper(translation('wards'))}>
      <ContentPanel
        titleElement={data?.name ?? (<LoadingContainer className="w-16 h-7"/>)}
        description={!data?.patients ?
          (<LoadingContainer className="w-32 h-4 mt-0.25"/>)
          : translation('nCurrentlyPatients', { count: data.patients?.length })}
      >
        {isLoading && (
          <LoadingContainer className="flex-col-0 grow"/>
        )}
        {!isLoading && isError && (
          <div className="bg-negative/20 flex-col-0 justify-center items-center">
            {translation('errorOccurred')}
          </div>
        )}
        {!isLoading && !isError && (
          <TabView>
            <Tab label={translation('tasks')}>
            </Tab>
            <Tab label={translation('patients')}/>
          </TabView>
        )}
      </ContentPanel>
    </Page>
  )
}

export default WardPage
