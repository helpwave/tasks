'use client'

import type { AnchorHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import {
  Button,
  Dialog,
  ExpandableContent,
  ExpandableHeader,
  ExpandableRoot,
  MarkdownInterpreter,
  Tooltip,
  useLocalStorage
} from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { getConfig } from '@/utils/config'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import clsx from 'clsx'
import {
  Building2,
  CircleCheck,
  Grid2X2PlusIcon,
  Hospital,
  SettingsIcon,
  User,
  Users,
  Menu as MenuIcon,
  X,
  MessageSquare
} from 'lucide-react'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useLocations } from '@/data'
import { hashString } from '@/utils/hash'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import { FeedbackDialog } from '@/components/FeedbackDialog'

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
      onClose={dismissStagingDisclaimer}
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
        url.searchParams.set('a', hashedUserId)
        setSurveyType('onboarding')
        setSurveyUrl(url.toString())
        setSurveyOpen(true)
        return
      }

      if (config.weeklySurveyUrl && onboardingSurveyCompleted > 0 && (weeklySurveyLastCompleted === 0 || now - weeklySurveyLastCompleted >= ONE_WEEK)) {
        const url = new URL(config.weeklySurveyUrl)
        url.searchParams.set('a', hashedUserId)
        setSurveyType('weekly')
        setSurveyUrl(url.toString())
        setSurveyOpen(true)
        return
      }
    }

    setupSurvey().catch(() => { })
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
      onClose={handleDismiss}
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

type RootLocationSelectorProps = {
  className?: string,
  onSelect?: () => void,
}

const RootLocationSelector = ({ className, onSelect }: RootLocationSelectorProps) => {
  const { rootLocations, selectedRootLocationIds, update } = useTasksContext()
  const translation = useTasksTranslation()
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [selectedLocationsCache, setSelectedLocationsCache] = useState<Array<{ id: string, title: string, kind?: string }>>([])

  const { data: locationsData } = useLocations(
    {},
    {
      skip: !selectedRootLocationIds || selectedRootLocationIds.length === 0,
    }
  )

  useEffect(() => {
    if (selectedRootLocationIds && selectedRootLocationIds.length > 0) {
      const foundInRoot = rootLocations?.filter(loc => selectedRootLocationIds.includes(loc.id)) || []

      if (foundInRoot.length === selectedRootLocationIds.length) {
        setSelectedLocationsCache(foundInRoot.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })))
      } else if (locationsData?.locationNodes) {
        const allLocations = locationsData.locationNodes
        const foundLocations: Array<{ id: string, title: string, kind?: string }> = []
        for (const id of selectedRootLocationIds) {
          const inRoot = rootLocations?.find(loc => loc.id === id)
          if (inRoot) {
            foundLocations.push({ id: inRoot.id, title: inRoot.title, kind: inRoot.kind })
          } else {
            const inAll = allLocations.find(loc => loc.id === id)
            if (inAll) {
              foundLocations.push({ id: inAll.id, title: inAll.title, kind: inAll.kind })
            }
          }
        }

        if (foundLocations.length > 0) {
          setSelectedLocationsCache(foundLocations)
        }
      } else if (foundInRoot.length > 0) {
        setSelectedLocationsCache(foundInRoot.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })))
      }
    } else {
      setSelectedLocationsCache([])
    }
  }, [rootLocations, selectedRootLocationIds, locationsData])

  useEffect(() => {
    if (rootLocations && rootLocations.length > 0 && (!selectedRootLocationIds || selectedRootLocationIds.length === 0)) {
      setIsLocationPickerOpen(true)
    }
  }, [rootLocations, selectedRootLocationIds])

  const selectedRootLocations = selectedLocationsCache.length > 0
    ? selectedLocationsCache
    : (rootLocations?.filter(loc => selectedRootLocationIds?.includes(loc.id)) || [])
  const firstSelectedRootLocation = selectedRootLocations[0]
  const hasNoLocationSelected = !selectedRootLocationIds || selectedRootLocationIds.length === 0

  const handleRootLocationSelect = (locations: Array<{ id: string, title: string, kind?: string }>) => {
    if (locations.length === 0) return
    const locationIds = locations.map(loc => loc.id)
    setSelectedLocationsCache(locations)
    update(prevState => {
      return {
        ...prevState,
        selectedRootLocationIds: locationIds,
      }
    })
    setIsLocationPickerOpen(false)
    onSelect?.()
  }

  if (!rootLocations || rootLocations.length === 0) {
    return null
  }

  return (
    <div className={clsx('flex-row-1 items-center gap-x-1', className)}>
      <Button
        onClick={() => setIsLocationPickerOpen(true)}
        color={hasNoLocationSelected ? 'negative' : 'neutral'}
        coloringStyle="outline"
        className="min-w-40 w-full"
      >
        {selectedRootLocations.length > 0
          ? selectedRootLocations.length === 1
            ? firstSelectedRootLocation?.title
            : selectedRootLocations.length === 2
              ? `${selectedRootLocations[0]?.title ?? ''}, ${selectedRootLocations[1]?.title ?? ''}`
              : `${selectedRootLocations[0]?.title ?? ''} +${selectedRootLocations.length - 1}`
          : translation('selectLocation') || 'Select Location'}
      </Button>
      <LocationSelectionDialog
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelect={handleRootLocationSelect}
        initialSelectedIds={selectedRootLocationIds || []}
        multiSelect={true}
        useCase="root"
      />
    </div>
  )
}

type HeaderProps = HTMLAttributes<HTMLHeadElement> & {
  onMenuClick?: () => void,
  isMenuOpen?: boolean,
}

export const Header = ({ onMenuClick, isMenuOpen, ...props }: HeaderProps) => {
  const router = useRouter()
  const { user } = useTasksContext()
  const translation = useTasksTranslation()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)

  return (
    <>
      <header
        {...props}
        className={clsx(
          'flex-row-8 items-center justify-between z-10',
          props.className
        )}
      >
        <div className="flex-col-0 lg:pl-0">
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
        <div className="flex-row-2 justify-end items-center gap-x-2">
          <RootLocationSelector className="hidden sm:flex" />
          <Tooltip tooltip={translation('feedback')}>
            <Button coloringStyle="text" layout="icon" color="neutral" onClick={() => setIsFeedbackOpen(true)}>
              <MessageSquare />
            </Button>
          </Tooltip>
          <Tooltip tooltip={translation('settings')}>
            <Button coloringStyle="text" layout="icon" color="neutral" onClick={() => router.push('/settings')}>
              <SettingsIcon />
            </Button>
          </Tooltip>
          <Tooltip tooltip={user?.isOnline ? 'Online' : 'Offline'}>
            <Button
              onClick={() => setIsUserInfoOpen(!!user?.id)}
              coloringStyle="text"
              color="neutral"
            >
              <span className="hidden sm:inline typography-title-sm">{user?.name}</span>
              <AvatarStatusComponent
                size="sm"
                isOnline={user?.isOnline ?? null}
                image={user?.avatarUrl ? {
                  avatarUrl: user.avatarUrl,
                  alt: user.name
                } : undefined}
              />
            </Button>
          </Tooltip>
        </div>
      </header>
      <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <UserInfoPopup
        userId={user?.id ?? null}
        isOpen={isUserInfoOpen}
        onClose={() => setIsUserInfoOpen(false)}
      />
    </>
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
        'flex-row-1.5 w-full px-2.5 py-1.5 items-center rounded-md hover:bg-surface-hover',
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
          'flex-col-4 w-50 min-w-56 rounded-lg bg-surface text-on-surface overflow-hidden shadow-md',
          'fixed lg:relative inset-y-0 z-50 lg:z-auto',
          'w-screen max-w-sm lg:w-50 lg:min-w-56',
          'transform transition-transform duration-300 ease-out',
          isOpen
            ? 'left-0 translate-x-0 lg:translate-x-0'
            : '-left-full lg:left-0 translate-x-0 lg:translate-x-0',
          !isOpen && 'pointer-events-none lg:pointer-events-auto',
          'flex flex-col',
          props.className
        )}
      >
        <nav className="flex-col-2 overflow-auto flex-1 p-2.5">
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
          <SidebarLink href="/patients" onClick={onClose}>
            <User className="size-5" />
            <span className="flex grow">{translation('patients')}</span>
            {context?.totalPatientsCount !== undefined && (<span className="text-description">{context.totalPatientsCount}</span>)}
          </SidebarLink>
          <ExpandableRoot
            className="shadow-none"
            isExpanded={context?.sidebar?.isShowingTeams ?? false}
            onExpandedChange={isExpanded => context?.update(prevState => ({
              ...prevState,
              sidebar: {
                ...prevState.sidebar,
                isShowingTeams: isExpanded,
              }
            }))}
          >
            <ExpandableHeader className="px-2.5 py-1.5">
              <div className="flex-row-2">
                <Users className="size-5" />
                {translation('teams')}
              </div>
            </ExpandableHeader>
            <ExpandableContent className="!max-h-none !h-auto !overflow-visible gap-y-0 pl-4 p-0">
              {(context?.teams ?? []).map(team => (
                <SidebarLink key={team.id} href={`${locationRoute}/${team.id}`} onClick={onClose}>
                  {team.title}
                </SidebarLink>
              ))}
            </ExpandableContent>
          </ExpandableRoot>

          <ExpandableRoot
            className="shadow-none"
            isExpanded={context?.sidebar?.isShowingWards ?? false}
            onExpandedChange={isExpanded => context?.update(prevState => ({
              ...prevState,
              sidebar: {
                ...prevState.sidebar,
                isShowingWards: isExpanded,
              }
            }))}
          >
            <ExpandableHeader className="px-2.5 py-1.5">
              <div className="flex-row-2">
                <Building2 className="size-5" />
                {translation('wards')}
              </div>
            </ExpandableHeader>
            <ExpandableContent className="!max-h-none !h-auto !overflow-visible gap-y-0 pl-4 p-0">
              {(context?.wards ?? []).map(ward => (
                <SidebarLink key={ward.id} href={`${locationRoute}/${ward.id}`} onClick={onClose}>
                  {ward.title}
                </SidebarLink>
              ))}
            </ExpandableContent>
          </ExpandableRoot>

          <ExpandableRoot
            className="shadow-none"
            isExpanded={context?.sidebar?.isShowingClinics ?? false}
            onExpandedChange={isExpanded => context?.update(prevState => ({
              ...prevState,
              sidebar: {
                ...prevState.sidebar,
                isShowingClinics: isExpanded,
              }
            }))}
          >
            <ExpandableHeader className="px-2.5 py-1.5">
              <div className="flex-row-2">
                <Hospital className="size-5" />
                {translation('clinics')}
              </div>
            </ExpandableHeader>
            <ExpandableContent className="!max-h-none !h-auto !overflow-visible gap-y-0 pl-4 p-0">
              {(context?.clinics ?? []).map(clinic => (
                <SidebarLink key={clinic.id} href={`${locationRoute}/${clinic.id}`} onClick={onClose}>
                  {clinic.title}
                </SidebarLink>
              ))}
            </ExpandableContent>
          </ExpandableRoot>
        </nav>
        <div className="mt-auto pt-4 border-t border-on-surface/20 sm:hidden">
          <RootLocationSelector onSelect={onClose} />
        </div>
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
    <div className="flex-row-0 h-screen w-screen overflow-hidden overflow-x-hidden">
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
        className="flex-col-4 pl-8 grow overflow-y-scroll"
      >
        <Header
          className="sticky top-0 right-0 p-4 bg-background text-on-background"
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isMenuOpen={isSidebarOpen}
        />
        <main className="flex-col-2 grow pr-4 px-4">
          {children}
          <div className="min-h-16" />
        </main>
      </div>
    </div>
  )
}
