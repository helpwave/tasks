'use client'

import type { HTMLAttributes, PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import Head from 'next/head'
import titleWrapper from '@/utils/titleWrapper'
import Link from 'next/link'
import {
  AppPage,
  Button,
  IconButton,
  Tooltip,
  type AppPageNavigationItem
} from '@helpwave/hightide'
import { AvatarWithStatus } from '@helpwave/hightide'
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
  MessageSquare,
  Rabbit
} from 'lucide-react'
import { TasksLogo } from '@/components/TasksLogo'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useMySavedViews } from '@/data'
import type { MySavedViewsQuery } from '@/api/gql/generated'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import { StagingDisclaimerDialog } from '@/components/layout/StagingDisclaimerDialog'
import { RootLocationSelector } from '@/components/layout/RootLocationSelector'

type HeaderProps = HTMLAttributes<HTMLDivElement>

export const Header = ({ ...props }: HeaderProps) => {
  const router = useRouter()
  const { user } = useTasksContext()
  const translation = useTasksTranslation()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)

  return (
    <>
      <div
        {...props}
        className={clsx(
          'flex-row-2 w-full items-center justify-end',
          props.className
        )}
      >
        <RootLocationSelector className="hidden sm:flex" ownsDialog />
        <IconButton
          tooltip={translation('feedback')}
          coloringStyle="text" color="neutral"
          onClick={() => setIsFeedbackOpen(true)}
        >
          <MessageSquare />
        </IconButton>
        <IconButton
          tooltip={translation('settings')}
          coloringStyle="text" color="neutral"
          onClick={() => router.push('/settings')}
        >
          <SettingsIcon />
        </IconButton>
        <Tooltip tooltip={user?.isOnline ? 'Online' : 'Offline'}>
          <Button
            onClick={() => setIsUserInfoOpen(!!user?.id)}
            coloringStyle="text"
            color="neutral"
            className="min-w-auto"
          >
            <span className="hidden sm:inline typography-title-sm">{user?.name}</span>
            <AvatarWithStatus
              size="sm"
              status={user?.isOnline === undefined ? 'unknown' : user.isOnline ? 'online' : 'offline'}
              image={user?.avatarUrl ? {
                avatarUrl: user.avatarUrl,
                alt: user.name
              } : undefined}
            />
          </Button>
        </Tooltip>
      </div>
      <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <UserInfoPopup
        userId={user?.id ?? null}
        isOpen={isUserInfoOpen}
        onClose={() => setIsUserInfoOpen(false)}
      />
    </>
  )
}

type PageWithHeaderProps = PropsWithChildren<{
  pageTitle?: string,
  noScrolling?: boolean,
}>

export const Page = ({
  children,
  pageTitle,
  noScrolling
}: PageWithHeaderProps) => {
  const translation = useTasksTranslation()
  const locationRoute = '/location'
  const context = useTasksContext()
  const { data: savedViewsData, loading: savedViewsLoading } = useMySavedViews()

  const sidebarItems = useMemo((): AppPageNavigationItem[] => {
    const savedViews = (savedViewsData?.mySavedViews ?? []) as MySavedViewsQuery['mySavedViews']
    const items: AppPageNavigationItem[] = [
      {
        id: 'dashboard',
        label: translation('dashboard'),
        url: '/',
        icon: <Grid2X2PlusIcon className="-rotate-90 size-5" />,
      },
      {
        id: 'myTasks',
        label: (
          <span className="flex grow flex-row-1 w-full justify-between items-center gap-x-2">
            {translation('myTasks')}
            {context?.myTasksCount !== undefined && (
              <span className="text-description">{context.myTasksCount}</span>
            )}
          </span>
        ),
        url: '/tasks',
        icon: <CircleCheck className="size-5" />,
      },
      {
        id: 'patients',
        label: (
          <span className="flex grow flex-row-1 w-full justify-between items-center gap-x-2">
            {translation('patients')}
            {context?.scopedPatientsTotal !== undefined && (
              <span className="text-description">{context.scopedPatientsTotal}</span>
            )}
          </span>
        ),
        url: '/patients',
        icon: <User className="size-5" />,
      },
      {
        id: 'savedViews',
        label: translation('savedViews'),
        icon: <Rabbit className="size-5" />,
        items: savedViews.length > 0
          ? savedViews.map((view: MySavedViewsQuery['mySavedViews'][number]) => ({
            id: `saved-view-${view.id}`,
            label: view.name,
            url: `/view/${view.id}`,
          }))
          : savedViewsLoading
            ? [{ id: 'saved-views-loading', label: translation('loading') }]
            : [{
              id: 'saved-views-settings',
              label: translation('viewSettings'),
              url: '/settings/views',
            }],
      },
    ]

    if ((context?.teams?.length ?? 0) > 0) {
      items.push({
        id: 'teams',
        label: translation('teams'),
        icon: <Users className="size-5" />,
        items: (context?.teams ?? []).map(team => ({
          id: `team-${team.id}`,
          label: team.title,
          url: `${locationRoute}/${team.id}`,
        })),
      })
    }

    if ((context?.wards?.length ?? 0) > 0) {
      items.push({
        id: 'wards',
        label: translation('wards'),
        icon: <Building2 className="size-5" />,
        items: (context?.wards ?? []).map(ward => ({
          id: `ward-${ward.id}`,
          label: ward.title,
          url: `${locationRoute}/${ward.id}`,
        })),
      })
    }

    if ((context?.clinics?.length ?? 0) > 0) {
      items.push({
        id: 'clinics',
        label: translation('clinics'),
        icon: <Hospital className="size-5" />,
        items: (context?.clinics ?? []).map(clinic => ({
          id: `clinic-${clinic.id}`,
          label: clinic.title,
          url: `${locationRoute}/${clinic.id}`,
        })),
      })
    }

    return items
  }, [
    translation,
    context?.myTasksCount,
    context?.scopedPatientsTotal,
    context?.teams,
    context?.wards,
    context?.clinics,
    savedViewsData?.mySavedViews,
    savedViewsLoading,
    locationRoute,
  ])

  return (
    <AppPage
      sidebarProps={{
        header: (
          <Link href="/" className="flex-row-1 text-primary items-center rounded-lg p-2">
            <TasksLogo />
            <span className="typography-title-md whitespace-nowrap">{'helpwave tasks'}</span>
          </Link>
        ),
        items: sidebarItems,
        footer: (
          <div className="sm:hidden">
            <RootLocationSelector />
          </div>
        ),
        activeUrl: context?.route
      }}
      headerActions={[
        (<Header key="header" />)
      ]}
      noScrolling={noScrolling}
    >
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      <StagingDisclaimerDialog />
      {children}
    </AppPage>
  )
}
