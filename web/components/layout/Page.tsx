'use client'

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
import { BellIcon, CircleCheck, Grid2X2PlusIcon, SettingsIcon, User, Building2, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'
import { useGlobalContext } from '@/context/GlobalContext'

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
      description={(<MarkdownInterpreter text={translation('stagingModalDisclaimerMarkdown')} />)}
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

export const Header = ({ ...props }: HeaderProps) => {
  const router = useRouter()
  const { user } = useGlobalContext()

  return (
    <header
      {...props}
      className={clsx(
        'flex-row-8 items-center justify-between',
        props.className
      )}
    >
      <div className="flex-col-0">
      </div>
      <div className="flex-row-2 justify-end">
        <div className="flex-row-0">
          <IconButton color="transparent">
            <BellIcon />
          </IconButton>
          <IconButton color="transparent" onClick={() => router.push('/settings')}>
            <SettingsIcon />
          </IconButton>
        </div>
        <SolidButton color="neutral" className="gap-x-1.75">
          <div className="flex-row-1.5">
            {user?.name}
            <ExpansionIcon isExpanded={false} />
          </div>
          <Avatar
            fullyRounded={true}
            image={user?.avatarUrl ? {
              avatarUrl: user.avatarUrl,
              alt: user.name
            } : undefined}
          />
        </SolidButton>
      </div>
    </header>
  )
}

type SidebarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string,
  route?: string,
  isActive?: boolean,
}

const SidebarLink = ({ children, route, isActive, className, ...props }: SidebarLinkProps) => {
  const active = isActive !== undefined ? isActive : (route === props.href)
  return (
    <Link
      {...props}
      className={clsx(
        'flex-row-1.5 w-full px-2.5 py-1.5 items-center rounded-md hover:bg-black/30',
        { 'text-primary font-bold bg-black/10': active },
        className
      )}
    >
      {children}
    </Link>
  )
}

type SidebarGroupProps = {
  title: string,
  icon: React.ReactNode,
  children: React.ReactNode,
  initiallyExpanded?: boolean,
}

const SidebarGroup = ({ title, icon, children, initiallyExpanded = false }: SidebarGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)

  return (
    <div className="flex-col-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex-row-1.5 w-full px-2.5 py-1.5 items-center rounded-md hover:bg-black/30 text-left transition-colors',
          { 'text-primary font-bold bg-black/10': isExpanded }
        )}
      >
        {icon}
        <span className="flex grow">{title}</span>
        <ExpansionIcon isExpanded={isExpanded} />
      </button>
      {isExpanded && (
        <div className="flex-col-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

type SidebarProps = HTMLAttributes<HTMLDivElement>

export const Sidebar = ({ ...props }: SidebarProps) => {
  const translation = useTasksTranslation()
  const route = usePathname()
  const {
    wards,
    teams,
    selectedLocation,
    setSelectedLocation,
    stats
  } = useGlobalContext()

  const isPatientsRoute = route === '/patients'

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
          <TasksLogo />
          <span className="typography-title-md whitespace-nowrap">{'helpwave tasks'}</span>
        </Link>

        <SidebarLink href="/" route={route}>
          <Grid2X2PlusIcon className="-rotate-90 size-5" />
          <span className="flex grow">{translation('dashboard')}</span>
        </SidebarLink>

        <SidebarLink href="/tasks" route={route}>
          <CircleCheck className="size-5" />
          <span className="flex grow">{translation('myTasks')}</span>
          {stats.myOpenTasksCount > 0 && (<span className="text-description">{stats.myOpenTasksCount}</span>)}
        </SidebarLink>

        <SidebarLink
          href="/patients"
          isActive={isPatientsRoute && selectedLocation === null}
          onClick={() => setSelectedLocation(null)}
        >
          <User className="size-5" />
          <span className="flex grow">{translation('patients')}</span>
          <span className="text-description">{stats.totalPatientsCount}</span>
        </SidebarLink>

        {/* Teams Group */}
        {teams.length > 0 && (
          <SidebarGroup
            title={translation('teams')}
            icon={<Users className="size-5" />}
            initiallyExpanded={isPatientsRoute && teams.some(t => t.id === selectedLocation)}
          >
            {teams.map(team => (
              <SidebarLink
                key={team.id}
                href="/patients"
                className="pl-9"
                isActive={isPatientsRoute && selectedLocation === team.id}
                onClick={() => setSelectedLocation(team.id)}
              >
                <span className="flex grow truncate">{team.title}</span>
              </SidebarLink>
            ))}
          </SidebarGroup>
        )}

        {/* Wards Group */}
        {wards.length > 0 && (
          <SidebarGroup
            title={translation('wards')}
            icon={<Building2 className="size-5" />}
            initiallyExpanded={isPatientsRoute && wards.some(w => w.id === selectedLocation)}
          >
            {wards.map(ward => (
              <SidebarLink
                key={ward.id}
                href="/patients"
                className="pl-9"
                isActive={isPatientsRoute && selectedLocation === ward.id}
                onClick={() => setSelectedLocation(ward.id)}
              >
                <span className="flex grow truncate">{ward.title}</span>
              </SidebarLink>
            ))}
          </SidebarGroup>
        )}


      </nav>
    </aside>
  )
}

type PageWithHeaderProps = PropsWithChildren<{
  pageTitle?: string,
}>

export const Page = ({
  children,
  pageTitle,
}: PageWithHeaderProps) => {
  return (
    <div className="flex-row-8 h-screen w-screen overflow-hidden">
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      <StagingDisclaimerDialog />
      <Sidebar className="my-4 ml-4" />
      <div className="flex-col-4 grow overflow-hidden">
        <Header className="mr-4 mt-4 bg-background text-on-background" />
        <main className="flex-col-2 grow overflow-auto mr-4">
          {children}
          <div className="min-h-16" />
        </main>
      </div>
    </div>
  )
}
