import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useMyQueryQuery } from '@/api/gql/generated'


const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()

  const { data, isLoading } = useMyQueryQuery()
  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <ContentPanel titleElement={translation('homePage')} description="The beginning of something">
        {isLoading ? 'Loading' : data?.patients.toString()}
        <div className="h-3000"></div>
      </ContentPanel>
    </Page>
  )
}

export default Dashboard
