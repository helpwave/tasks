import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'

const WardsOverviewPage: NextPage = () => {
  const translation = useTasksTranslation()

  return (
    <Page pageTitle={titleWrapper(translation('wards'))}>
      <ContentPanel
        title={translation('wards')}
      >
      </ContentPanel>
    </Page>
  )
}

export default WardsOverviewPage
