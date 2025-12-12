import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'

const TeamsOverviewPage: NextPage = () => {
  const translation = useTasksTranslation()

  return (
    <Page pageTitle={titleWrapper(translation('teams'))}>
      <ContentPanel
        title={translation('teams')}
      >
      </ContentPanel>
    </Page>
  )
}

export default TeamsOverviewPage
