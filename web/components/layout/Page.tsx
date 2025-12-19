'use client'

import type { AnchorHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import {
  Avatar, Button,
  Dialog,
  Expandable,
  ExpansionIcon,
  LoadingContainer,
  MarkdownInterpreter, Menu, MenuItem,
  useLocalStorage
} from '@helpwave/hightide'
import { getConfig } from '@/utils/config'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'
import {
  Building2,
  CircleCheck,
  Grid2X2PlusIcon,
  Hospital,
  SettingsIcon,
  User,
  Users,
  Clock,
  Menu as MenuIcon,
  X
} from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useAuth } from '@/hooks/useAuth'
import { hashString } from '@/utils/hash'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

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
  }, [lastTimeStagingDisclaimerDismissed, config.showStagingDisclaimerModal])

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
        <Button color="positive" onClick={dismissStagingDisclaimer}>
          {translation('confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

export const SurveyModal = () => {
  const config = getConfig()
  const translation = useTasksTranslation()
  const { user } = useTasksContext()

  const [isSurveyOpen, setSurveyOpen] = useState(false)
  const [surveyType, setSurveyType] = useState<'onboarding' | 'weekly' | null>(null)
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null)

  const {
    value: onboardingSurveyCompleted,
    setValue: setOnboardingSurveyCompleted
  } = useLocalStorage('onboarding-survey-completed', 0)

  const {
    value: weeklySurveyLastCompleted,
    setValue: setWeeklySurveyLastCompleted
  } = useLocalStorage('weekly-survey-last-completed', 0)

  const {
    value: surveyLastDismissed,
    setValue: setSurveyLastDismissed
  } = useLocalStorage('survey-last-dismissed', 0)

  useEffect(() => {
    if (!config.onboardingSurveyUrl && !config.weeklySurveyUrl) {
      return
    }

    if (!user?.id) {
      return
    }

    if (isSurveyOpen) {
      return
    }

    const setupSurvey = async () => {
      const now = new Date().getTime()
      const ONE_WEEK = 1000 * 60 * 60 * 24 * 7
      const TEN_MINUTES = 1000 * 60 * 10

      if (surveyLastDismissed > 0 && now - surveyLastDismissed < TEN_MINUTES) {
        return
      }

      const hashedUserId = await hashString(user.id)

      if (config.onboardingSurveyUrl && onboardingSurveyCompleted === 0) {
        const url = new URL(config.onboardingSurveyUrl)
        url.searchParams.set('userId', hashedUserId)
        setSurveyType('onboarding')
        setSurveyUrl(url.toString())
        setSurveyOpen(true)
        return
      }

      if (config.weeklySurveyUrl && onboardingSurveyCompleted > 0 && (weeklySurveyLastCompleted === 0 || now - weeklySurveyLastCompleted >= ONE_WEEK)) {
        const url = new URL(config.weeklySurveyUrl)
        url.searchParams.set('userId', hashedUserId)
        setSurveyType('weekly')
        setSurveyUrl(url.toString())
        setSurveyOpen(true)
        return
      }
    }

    setupSurvey().catch(console.error)
  }, [config.onboardingSurveyUrl, config.weeklySurveyUrl, user?.id, onboardingSurveyCompleted, weeklySurveyLastCompleted, surveyLastDismissed, isSurveyOpen])

  const handleDismiss = () => {
    setSurveyLastDismissed(new Date().getTime())
    setSurveyOpen(false)
  }

  const handleOpenSurvey = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank', 'noopener,noreferrer')
      if (surveyType === 'onboarding') {
        setOnboardingSurveyCompleted(new Date().getTime())
      } else if (surveyType === 'weekly') {
        setWeeklySurveyLastCompleted(new Date().getTime())
      }
      setSurveyOpen(false)
    }
  }

  if (!surveyUrl || !surveyType) {
    return null
  }

  return (
    <Dialog
      isModal={false}
      isOpen={isSurveyOpen}
      titleElement={translation('surveyTitle')}
      description={translation('surveyDescription')}
      className={clsx('z-20 w-200')}
      backgroundClassName="z-10"
    >
      <div className="flex-row-0 justify-end gap-2">
        <Button color="neutral" coloringStyle="outline" onClick={handleDismiss}>
          {translation('dismiss')}
        </Button>
        <Button color="positive" onClick={handleOpenSurvey}>
          {translation('openSurvey')}
        </Button>
      </div>
    </Dialog>
  )
}


type HeaderProps = HTMLAttributes<HTMLHeadElement> & {
  onMenuClick?: () => void,
  isMenuOpen?: boolean,
}

export const Header = ({ onMenuClick, isMenuOpen, ...props }: HeaderProps) => {
  const translation = useTasksTranslation()
  const { user } = useTasksContext()
  const router = useRouter()
  const { logout } = useAuth()
  const config = getConfig()

  return (
    <header
      {...props}
      className={clsx(
        'flex-row-8 items-center justify-between z-10',
        props.className
      )}
    >
      <div className="flex-col-0 pl-4 lg:pl-0">
        <Button
          layout="icon"
          color="neutral"
          coloringStyle="text"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          {isMenuOpen ? <X className="size-6" /> : <MenuIcon className="size-6" />}
        </Button>
      </div>
      <div className="flex-row-2 justify-end">
        <div className="flex-row-0">
          <NotificationBell />
        </div>
        <div className="flex-row-0">
          <Button coloringStyle="text" layout="icon" color="neutral" onClick={() => router.push('/settings')}>
            <SettingsIcon />
          </Button>
        </div>
        <Menu<HTMLButtonElement>
          trigger={(bag, ref) => (
            <Button
              ref={ref}
              color="neutral"
              className="gap-x-1.75"
              onClick={bag.toggleOpen}
            >
              <div className="flex-row-1.5">
                <span className="hidden sm:inline">{user?.name}</span>
                <ExpansionIcon isExpanded={bag.isOpen} />
              </div>
              <Avatar
                fullyRounded={true}
                image={user?.avatarUrl ? {
                  avatarUrl: user.avatarUrl,
                  alt: user.name
                } : undefined}
              />
            </Button>
          )}
        >
          <MenuItem onClick={() => {
            const accountUrl = `${config.auth.issuer}/account`
            window.open(accountUrl, '_blank', 'noopener,noreferrer')
          }}>
            {translation('security') ?? 'Security'}
          </MenuItem>
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


type SidebarProps = HTMLAttributes<HTMLDivElement> & {
  isOpen?: boolean,
  onClose?: () => void,
}

export const Sidebar = ({ isOpen, onClose, ...props }: SidebarProps) => {
  const translation = useTasksTranslation()
  const locationRoute = '/location'
  const context = useTasksContext()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay-shadow z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        {...props}
        className={clsx(
          'flex-col-4 w-50 min-w-56 rounded-lg bg-surface text-on-surface overflow-hidden p-2.5 shadow-md',
          'fixed lg:relative inset-y-0 z-50 lg:z-auto',
          'w-screen max-w-sm lg:w-50 lg:min-w-56',
          'transform transition-transform duration-300 ease-out',
          isOpen
            ? 'left-0 translate-x-0 lg:translate-x-0'
            : '-left-full lg:left-0 translate-x-0 lg:translate-x-0',
          !isOpen && 'pointer-events-none lg:pointer-events-auto',
          props.className
        )}
      >
        <nav className="flex-col-2 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex-row-1 text-primary items-center rounded-lg p-2" onClick={onClose}>
              <TasksLogo />
              <span className="typography-title-md whitespace-nowrap">{'helpwave tasks'}</span>
            </Link>
            <Button
              layout="icon"
              color="neutral"
              coloringStyle="text"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="size-6" />
            </Button>
          </div>
        <SidebarLink href="/" onClick={onClose}>
          <Grid2X2PlusIcon className="-rotate-90 size-5" />
          <span className="flex grow">{translation('dashboard')}</span>
        </SidebarLink>
        <SidebarLink href="/tasks" onClick={onClose}>
          <CircleCheck className="size-5" />
          <span className="flex grow">{translation('myTasks')}</span>
          {context?.myTasksCount !== undefined && (<span className="text-description">{context.myTasksCount}</span>)}
        </SidebarLink>
        {context?.waitingPatientsCount !== undefined && context.waitingPatientsCount > 0 && (
          <SidebarLink href="/waitingroom" onClick={onClose}>
            <Clock className="size-5" />
            <span className="flex grow">{translation('waitingroom')}</span>
            <span className="text-description">{context.waitingPatientsCount}</span>
          </SidebarLink>
        )}
        <SidebarLink href="/patients" onClick={onClose}>
          <User className="size-5" />
          <span className="flex grow">{translation('patients')}</span>
          {context?.totalPatientsCount !== undefined && (<span className="text-description">{context.totalPatientsCount}</span>)}
        </SidebarLink>

        <Expandable
          label={(
            <div className="flex-row-2">
              <Users className="size-5" />
              {translation('teams')}
            </div>
          )}
          headerClassName="!px-2.5 !py-1.5 hover:bg-black/30"
          contentClassName="!px-0 !pb-0 gap-y-0"
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
          {!context?.teams ? (
            <LoadingContainer className="w-full h-10" />
          ) : context.teams.map(team => (
            <SidebarLink key={team.id} href={`${locationRoute}/${team.id}`} className="pl-9.5" onClick={onClose}>
              {team.title}
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
          contentClassName="!px-0 !pb-0 gap-y-0"
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
          {!context?.wards ? (
            <LoadingContainer className="w-full h-10" />
          ) : context.wards.map(ward => (
            <SidebarLink key={ward.id} href={`${locationRoute}/${ward.id}`} className="pl-9.5" onClick={onClose}>
              {ward.title}
            </SidebarLink>
          ))}
        </Expandable>

        <Expandable
          label={(
            <div className="flex-row-2">
              <Hospital className="size-5" />
              {translation('clinics')}
            </div>
          )}
          headerClassName="!px-2.5 !py-1.5 hover:bg-black/30"
          contentClassName="!px-0 !pb-0 gap-y-0"
          className="!shadow-none"
          isExpanded={context.sidebar.isShowingClinics}
          onChange={isExpanded => context.update(prevState => ({
            ...prevState,
            sidebar: {
              ...prevState.sidebar,
              isShowingClinics: isExpanded,
            }
          }))}
        >
          {!context?.clinics ? (
            <LoadingContainer className="w-full h-10" />
          ) : context.clinics.map(clinic => (
            <SidebarLink key={clinic.id} href={`${locationRoute}/${clinic.id}`} className="pl-9.5" onClick={onClose}>
              {clinic.title}
            </SidebarLink>
          ))}
        </Expandable>
      </nav>
    </aside>
    </>
  )
}

type PageWithHeaderProps = PropsWithChildren<{
  pageTitle?: string,
}>

export const Page = ({
  children,
  pageTitle,
}: PageWithHeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const mainContentRef = useSwipeGesture({
    onSwipeRight: () => setIsSidebarOpen(true),
    onSwipeLeft: () => setIsSidebarOpen(false),
    threshold: 50,
  })

  return (
    <div className="flex-row-8 h-screen w-screen overflow-hidden overflow-x-hidden">
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      <StagingDisclaimerDialog />
      <SurveyModal />
      <Sidebar
        className="my-4 ml-4"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div
        ref={mainContentRef as React.RefObject<HTMLDivElement>}
        className="flex-col-4 grow overflow-y-scroll"
      >
        <Header
          className="sticky top-0 right-0 py-4 pr-4 bg-background text-on-background"
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isMenuOpen={isSidebarOpen}
        />
        <main className="flex-col-2 grow pr-4 px-4 lg:px-0">
          {children}
          <div className="min-h-16" />
        </main>
      </div>
    </div>
  )
}
