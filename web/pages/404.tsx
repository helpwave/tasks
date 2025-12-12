import type { NextPage } from 'next'
import Link from 'next/link'
import { HelpwaveLogo } from '@helpwave/hightide'
import titleWrapper from '@/utils/titleWrapper'
import { Page } from '@/components/layout/Page'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'

const NotFound: NextPage = () => {
  const translation = useTasksTranslation()
  return (
    <Page pageTitle={titleWrapper(translation('pages.404.notFound'))}>
      <ContentPanel titleElement={translation('pages.404.notFound')}>
        <div className="flex-col-2 items-center justify-center h-full">
          <HelpwaveLogo className="w-64 h-64" animate="bounce"/>
          <p className="text-lg font-inter">{translation('pages.404.notFoundDescription1')}...</p>
          <p className="text-lg font-inter">{translation('pages.404.notFoundDescription2')} <Link
            className="underline text-primary hover:brightness-90" href="/">{translation('homePage')}</Link>.
          </p>
        </div>
      </ContentPanel>
    </Page>
  )
}

export default NotFound
