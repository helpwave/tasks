'use client'

import type { AnchorHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import {
  Avatar,
  Dialog,
  Expandable,
  ExpansionIcon,
  IconButton,
  LoadingContainer,
  MarkdownInterpreter, Menu, MenuItem,
  SolidButton,
  useLocalStorage
} from '@helpwave/hightide'
import { getConfig } from '@/utils/config'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'
import { BellIcon, Building2, CircleCheck, Grid2X2PlusIcon, SettingsIcon, User, Users } from 'lucide-react'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useAuth } from '@/hooks/useAuth'

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
  const translation = useTasksTranslation()
  const { user } = useTasksContext()
  const router = useRouter()
  const { logout } = useAuth()

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
        <Menu<HTMLButtonElement>
          trigger={(bag, ref) => (
            <SolidButton
              ref={ref}
              color="neutral"
              className="gap-x-1.75"
              onClick={bag.toggleOpen}
            >
              <div className="flex-row-1.5">
                {user?.name}
                <ExpansionIcon isExpanded={bag.isOpen} />
              </div>
              <Avatar
                fullyRounded={true}
                image={user?.avatarUrl ? {
                  avatarUrl: user.avatarUrl,
                  alt: user.name
                } : undefined}
              />
            </SolidButton>
          )}
        >
          <MenuItem onClick={() => logout()}>
            {translation('logout') ?? 'Logout'}
          </MenuItem>
        </Menu>
      </div>
    </header>
  )
}

type SidebarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string,
}

const SidebarLink = ({ children, ...props }: SidebarLinkProps) => {
  const { route } = useTasksContext()

  return (
    <Link
      {...props}
      className={clsx(
        'flex-row-1.5 w-full px-2.5 py-1.5 items-center rounded-md hover:bg-black/30',
        { 'text-primary font-bold': route === props.href },
        props.className
      )}
    >
      {children}
    </Link>
  )
}


type SidebarProps = HTMLAttributes<HTMLDivElement>

/**
 * The basic sidebar for most pages
 */
export const Sidebar = ({ ...props }: SidebarProps) => {
  const translation = useTasksTranslation()
  const wardsRoute = '/wards'
  const teamsRoute = '/teams'
  const context = useTasksContext()

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
        <SidebarLink href="/">
          <Grid2X2PlusIcon className="-rotate-90 size-5" />
          <span className="flex grow">{translation('dashboard')}</span>
        </SidebarLink>
        <SidebarLink href="/tasks">
          <CircleCheck className="size-5" />
          <span className="flex grow">{translation('myTasks')}</span>
          {context?.myTasksCount !== undefined && (<span className="text-description">{context.myTasksCount}</span>)}
        </SidebarLink>
        <SidebarLink href="/patients">
          <User className="size-5" />
          <span className="flex grow">{translation('patients')}</span>
        </SidebarLink>

        <Expandable
          label={(
            <div className="flex-row-2">
              <Users className="size-5" />
              {translation('teams')}
            </div>
          )}
          headerClassName="!px-2.5 !py-1.5 hover:bg-black/30"
          contentClassName="!px-0"
          className="!shadow-none"
          isExpanded={context.sidebar.isShowingTeams}
          onChange={isExpanded => context.update(prevState => ({
            ...prevState,
            sidebar: {
              ...prevState.sidebar,
              isShowingTeams: isExpanded,
            }
          }))}
        >
          <SidebarLink href={teamsRoute} className="pl-9.5">
            {translation('overview')}
          </SidebarLink>
          {!context?.teams ? (
            <LoadingContainer className="w-full h-10" />
          ) : context.teams.map(ward => (
            <SidebarLink key={ward.id} href={`${teamsRoute}/${ward.id}`} className="pl-9.5">
              {ward.title}
            </SidebarLink>
          ))}
        </Expandable>

        <Expandable
          label={(
            <div className="flex-row-2">
              <Building2 className="size-5" />
              {translation('wards')}
            </div>
          )}
          headerClassName="!px-2.5 !py-1.5 hover:bg-black/30"
          contentClassName="!px-0"
          className="!shadow-none"
          isExpanded={context.sidebar.isShowingWards}
          onChange={isExpanded => context.update(prevState => ({
            ...prevState,
            sidebar: {
              ...prevState.sidebar,
              isShowingWards: isExpanded,
            }
          }))}
        >
          <SidebarLink href={wardsRoute} className="pl-9.5">
            {translation('overview')}
          </SidebarLink>
          {!context?.wards ? (
            <LoadingContainer className="w-full h-10" />
          ) : context.wards.map(ward => (
            <SidebarLink key={ward.id} href={`${wardsRoute}/${ward.id}`} className="pl-9.5">
              {ward.title}
            </SidebarLink>
          ))}
        </Expandable>
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
      <div className="flex-col-4 grow overflow-y-scroll">
        <Header className="sticky top-0 right-0 py-4 pr-4 bg-background text-on-background" />
        <main className="flex-col-2 grow pr-4">
          {children}
          <div className="min-h-16" />
        </main>
      </div>
    </div>
  )
}
