'use client'

import { getUser } from '@/api/auth/authService'
import type { AnchorHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import {
  Avatar,
  Dialog,
  ExpansionIcon,
  IconButton,
  MarkdownInterpreter,
  SolidButton,
  useLocalStorage
} from '@helpwave/hightide'
import { getConfig } from '@/utils/config'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'
import { BellIcon, CircleCheck, Grid2X2PlusIcon, SettingsIcon, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'

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

// TODO remove the user fetch here and get it from a new global context
/**
 * The basic header for most pages
 */
export const Header = ({ ...props }: HeaderProps) => {
  const [username, setUsername] = useState<string | undefined>()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser()
      setUsername(user?.profile.name)
    }

    fetchUser()
  }, [])

  return (
    <header
      {...props}
      className={clsx(
        'flex-row-8 items-center justify-between',
        props.className
      )}
    >
      <div className="flex-col-0">
        {/*
        <Input placeholder={translation('search')}/>
        */}
      </div>
      <div className="flex-row-2 justify-end">
        <div className="flex-row-0">
          <IconButton color="transparent">
            <BellIcon/>
          </IconButton>
          <IconButton color="transparent" onClick={() => router.push('/settings')}>
            <SettingsIcon/>
          </IconButton>
        </div>
        <SolidButton color="neutral" className="gap-x-1.75">
          <div className="flex-row-1.5">
            {username}
            <ExpansionIcon isExpanded={false}/>
          </div>
          <Avatar fullyRounded={true}/>
        </SolidButton>
      </div>
    </header>
  )
}

type SidebarData = {
  myTasksCount?: number,
  patientsCount?: number,
  station?: {
    name: string,
    patientCount: number,
    bedCount: number,
    rooms: {
      id: string,
      name: string,
    },
  },
}

type SidebarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string,
  route?: string,
}

const SidebarLink = ({ children, route, ...props }: SidebarLinkProps) => {

  return (
    <Link
      {...props}
      className={clsx(
        'flex-row-1.5 w-full px-2.5 py-1.5 items-center rounded-md hover:bg-black/30',
        { 'text-primary font-bold bg-black/10': route === props.href }
      )}
    >
      {children}
    </Link>
  )
}

const defaultSidebarData: SidebarData = {}

type SidebarProps = HTMLAttributes<HTMLDivElement>

// TODO remove context sidebar data fetch here and get it from a new global context
/**
 * The basic sidebar for most pages
 */
export const Sidebar = ({ ...props }: SidebarProps) => {
  const translation = useTasksTranslation()
  const [data, setData] = useState<SidebarData>(defaultSidebarData)
  const route = usePathname()

  // TODO add context logic
  useEffect(() => {
    setTimeout(() => {
      setData({
        myTasksCount: 12,
        patientsCount: 10,
      })
    }, 2000)
  }, [])

  return (
    <aside
      {...props}
      className={clsx(
        'flex-col-4 w-50 min-w-56 rounded-lg bg-surface text-on-surface overflow-hidden p-2.5 shadow-md',
        props.className
      )}
    >
      <nav className="flex-col-2 overflow-auto">
        <Link href="/" className="flex-row-1 text-primary items-center rounded-lg p-2 mb-8">
          <TasksLogo/>
          <span className="typography-title-md whitespace-nowrap">{'helpwave tasks'}</span>
        </Link>
        {/* TODO add station swticher here */}
        <SidebarLink href="/" route={route}>
          <Grid2X2PlusIcon className="-rotate-90 size-5"/>
          <span className="flex grow">{translation('dashboard')}</span>
        </SidebarLink>
        <SidebarLink href="/tasks" route={route}>
          <CircleCheck className="size-5"/>
          <span className="flex grow">{translation('myTasks')}</span>
          {data?.myTasksCount !== undefined && (<span className="text-description">{data.myTasksCount}</span>)}
        </SidebarLink>
        <SidebarLink href="/patients" route={route}>
          <User className="size-5"/>
          <span className="flex grow">{translation('patients')}</span>
          {data?.patientsCount !== undefined && (<span className="text-description">{data.patientsCount}</span>)}
        </SidebarLink>
        {/* TODO add rooms here */}
      </nav>
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
    <div className="flex-row-8 h-screen w-screen overflow-hidden">
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      <StagingDisclaimerDialog/>
      <Sidebar className="my-4 ml-4"/>
      <div className="flex-col-4 grow overflow-hidden">
        <Header className="mr-4 mt-4 bg-background text-on-background"/>
        <main className="flex-col-2 grow overflow-auto mr-4">
          {children}
          <div className="min-h-16"/>
        </main>
      </div>
    </div>
  )
}
