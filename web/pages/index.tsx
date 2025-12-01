import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { withAuth } from '@/hooks/useAuth'


const Dashboard: NextPage = () => {
    const translation = useTasksTranslation()

    return (
        <Page pageTitle={titleWrapper(translation('homePage'))}>
            <ContentPanel title={translation('homePage')} description="The beginning of something">
                <p>{'Some content'}</p>
            </ContentPanel>
        </Page>
    )
}

export default withAuth(Dashboard)
