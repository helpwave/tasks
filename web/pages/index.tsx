import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'


const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()

  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <ContentPanel title={translation('homePage')} description="Welcome to helpwave tasks">
        <div className="h-3000"></div>
      </ContentPanel>
    </Page>
  )
}

export default Dashboard
