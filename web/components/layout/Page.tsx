import type { HTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import { Dialog, HelpwaveLogo, MarkdownInterpreter, SolidButton, useLocalStorage } from '@helpwave/hightide'
import { getConfig } from '@/utils/config'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

export const StagingDisclaimerDialog = () => {
  const config = getConfig()
  const translation = useTasksTranslation()

  const [isStagingDisclaimerOpen, setStagingDisclaimerOpen] = useState(false)
  const {
    value: lastTimeStagingDisclaimerDismissed,
    setValue: setLastTimeStagingDisclaimerDismissed
  } = useLocalStorage('staging-disclaimer-dismissed-time', 0)

  const dismissStagingDisclaimer = () => {
    setLastTimeStagingDisclaimerDismissed(new Date().getTime())
    setStagingDisclaimerOpen(false)
  }

  useEffect(() => {
    const ONE_DAY = 1000 * 60 * 60 * 24
    if (config.showStagingDisclaimerModal && new Date().getTime() - lastTimeStagingDisclaimerDismissed > ONE_DAY) {
      setStagingDisclaimerOpen(true)
    }
  }, [lastTimeStagingDisclaimerDismissed])

  return (
    <Dialog
      isModal={false}
      isOpen={isStagingDisclaimerOpen}
      titleElement={translation('developmentAndPreviewInstance')}
      description={(<MarkdownInterpreter text={translation('stagingModalDisclaimerMarkdown')}/>)}
      className={clsx('z-20 w-200')}
      backgroundClassName="z-10"
    >
      <div className="flex-row-8">
        <Link className="text-primary hover:brightness-75 font-bold" href={config.imprintUrl}>
          {translation('imprint')}
        </Link>
        <Link className="text-primary hover:brightness-75 font-bold" href={config.privacyUrl}>
          {translation('privacy')}
        </Link>
      </div>
      <div className="flex-row-0 justify-end">
        <SolidButton color="positive" onClick={dismissStagingDisclaimer}>
          {translation('confirm')}
        </SolidButton>
      </div>
    </Dialog>
  )
}


type HeaderProps = HTMLAttributes<HTMLHeadElement>

/**
 * The basic header for most pages
 */
export const Header = ({ ...props }: HeaderProps) => {
  return (
    <header
      {...props}
      className={clsx(
        'flex-row-8 items-center justify-between grow h-18 px-8 py-4 bg-header-background text-header-text shadow-md rounded-lg',
        props.className
      )}
    >
      <Link href="/" className="bg-surface text-on-surface rounded-lg px-6 py-4">
        <HelpwaveLogo className="min-h-12 min-w-12"/>
      </Link>
    </header>
  )
}

type NavigationItem = {
  url: string,
  name: string,
}

type SidebarProps = HTMLAttributes<HTMLHeadElement> & {
  items?: NavigationItem[],
}

/**
 * The basic sidebar for most pages
 */
export const Sidebar = ({ items, ...props }: SidebarProps) => {
  return (
    <aside
      {...props}
      className={clsx(
        'flex-col-2 w-40 min-w-40 rounded-lg bg-surface text-on-surface overflow-auto mb-4',
        props.className
      )}
    >
    </aside>
  )
}


type PageWithHeaderProps = PropsWithChildren<{
  pageTitle?: string,
}>

/**
 * The base of every page. It creates the configurable header
 *
 * The page content will be passed as the children
 */
export const Page = ({
                       children,
                       pageTitle,
                     }: PageWithHeaderProps) => {
  return (
    <div className="flex-col-4 h-screen w-screen overflow-hidden pt-4 pl-4">
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      <StagingDisclaimerDialog/>
      <Header className="mr-4"/>
      <div className="flex-row-4 grow overflow-hidden">
        <Sidebar/>
        <main className="flex-col-2 grow overflow-auto">
          {children}
          <div className="min-h-16"/>
        </main>
      </div>
    </div>
  )
}
