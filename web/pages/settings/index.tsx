import type { NextPage } from 'next'
import { useState } from 'react'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import {
  Avatar,
  Button,
  LocalizationUtil,
  Select,
  SelectOption,
  ThemeUtil,
  useLocale,
  useTheme
} from '@helpwave/hightide'
import type { HightideTranslationLocales, ThemeType } from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, MonitorCog, MoonIcon, SunIcon, Trash2, ClipboardList, Shield, TableProperties, Building2, MessageSquareText } from 'lucide-react'
import { useRouter } from 'next/router'
import clsx from 'clsx'
import { removeUser } from '@/api/auth/authService'
import { useQueryClient } from '@tanstack/react-query'
import { hashString } from '@/utils/hash'
import { getConfig } from '@/utils/config'
import { useLocalStorage } from '@helpwave/hightide'
import { FeedbackDialog } from '@/components/FeedbackDialog'

type ThemeIconProps = {
  theme: ThemeType,
  className?: string,
}

const ThemeIcon = ({ theme, className }: ThemeIconProps) => {
  if (theme === 'dark') {
    return (
      <MoonIcon className={clsx('w-4 h-4', className)} />
    )
  } else if (theme === 'light') {
    return (
      <SunIcon className={clsx('w-4 h-4', className)} />
    )
  } else {
    return (
      <MonitorCog className={clsx('w-4 h-4', className)} />
    )
  }
}

const SettingsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { user } = useTasksContext()
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const config = getConfig()
  const router = useRouter()
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)

  const {
    setValue: setOnboardingSurveyCompleted
  } = useLocalStorage('onboarding-survey-completed', 0)

  const {
    setValue: setWeeklySurveyLastCompleted
  } = useLocalStorage('weekly-survey-last-completed', 0)

  const handleClearCache = async () => {
    queryClient.clear()

    await removeUser()

    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    window.location.href = '/'
  }

  const handleRetakeSurvey = async () => {
    if (!user?.id) return

    setOnboardingSurveyCompleted(0)
    setWeeklySurveyLastCompleted(0)

    const surveyUrl = config.onboardingSurveyUrl || config.weeklySurveyUrl
    if (surveyUrl) {
      const hashedUserId = await hashString(user.id)
      const url = new URL(surveyUrl)
      url.searchParams.set('userId', hashedUserId)
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Page pageTitle={titleWrapper(translation('settings'))}>
      <ContentPanel
        titleElement={translation('settings')}
        description={translation('settingsDescription')}
      >
        <div className="flex flex-col gap-y-12">
          <section className="flex-row-4 items-center p-4 bg-surface-1 rounded-lg border border-divider">
            <Avatar
              size="xl"
              fullyRounded
              image={user?.avatarUrl ? { avatarUrl: user.avatarUrl, alt: user?.name || '' } : undefined}
            />
            <div className="flex-col-1">
              <span className="typography-title-md font-bold">{user?.name}</span>
              <span className="typography-body-sm text-description">{user?.id}</span>
            </div>
          </section>

          {user?.organizations && (
            <div className="flex-col-6">
              <h2 className="typography-title-md border-b border-divider pb-2">{translation('organizations') || 'Organizations'}</h2>
              <div className="flex-row-2 items-center gap-x-2 flex-wrap">
                <Building2 className="size-4 text-description" />
                <div className="flex-row-2 items-center gap-x-2 flex-wrap">
                  {user.organizations.split(',').map((org, index) => {
                    const trimmedOrg = org.trim()
                    if (!trimmedOrg) return null
                    return (
                      <span key={index} className="typography-body-sm text-description">
                        {trimmedOrg}
                        {index < user.organizations!.split(',').length - 1 && <span className="mx-1">,</span>}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex-col-6">
            <h2 className="typography-title-md border-b border-divider pb-2">{translation('system')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                color="neutral"
                coloringStyle="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push('/properties')}
                startIcon={<TableProperties className="mr-2" />}
              >
                <div className="flex-col-1 items-start">
                  <span className="typography-label-lg">{translation('properties')}</span>
                  <span className="typography-body-sm text-description font-normal">
                    {translation('properties')}
                  </span>
                </div>
              </Button>
            </div>
          </div>

          <div className="flex-col-6">
            <h2 className="typography-title-md border-b border-divider pb-2">{translation('preferences')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-200">

              <div className="flex-col-2">
                <span className="typography-label-lg">{translation('language')}</span>
                <Select
                  value={locale}
                  onValueChanged={(language: string) => setLocale(language as HightideTranslationLocales)}
                  buttonProps={{
                    selectedDisplay: (l) => LocalizationUtil.languagesLocalNames[l as HightideTranslationLocales],
                    className: 'w-full'
                  }}
                >
                  {LocalizationUtil.locals.map((local) => (
                    <SelectOption key={local} value={local}>
                      {LocalizationUtil.languagesLocalNames[local]}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div className="flex-col-2">
                <span className="typography-label-lg">{translation('themes', { count: 1 })}</span>
                <Select
                  value={theme}
                  onValueChanged={(theme) => setTheme(theme as ThemeType)}
                  iconAppearance="right"
                  buttonProps={{
                    selectedDisplay: (value) => (
                      <div className="flex-row-2 items-center">
                        <ThemeIcon theme={theme} />
                        {translation('themeMode', { theme: value })}
                      </div>
                    ),
                    className: 'w-full',
                  }}
                >
                  {ThemeUtil.themes.map((t) => (
                    <SelectOption key={t} value={t} className="gap-x-6 justify-between">
                      <div className="flex-row-2 items-center">
                        <ThemeIcon theme={t} />
                        {translation('themeMode', { theme: t })}
                      </div>
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-col-6">
            <h2 className="typography-title-md border-b border-divider pb-2">{translation('feedback')}</h2>
            <div className="flex-row-4 flex-wrap">
              {(config.onboardingSurveyUrl || config.weeklySurveyUrl) && (
                <Button
                  color="neutral"
                  coloringStyle="outline"
                  onClick={handleRetakeSurvey}
                  startIcon={<ClipboardList className="w-4 h-4" />}
                >
                  {translation('retakeSurvey')}
                </Button>
              )}
              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={() => setIsFeedbackDialogOpen(true)}
                startIcon={<MessageSquareText className="w-4 h-4" />}
              >
                {translation('feedback')}
              </Button>
            </div>
          </div>

          <div className="flex-col-6">
            <h2 className="typography-title-md border-b border-divider pb-2">{translation('account')}</h2>
            <div className="flex-row-4 flex-wrap">
              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={() => {
                  const accountUrl = `${config.auth.issuer}/account`
                  window.open(accountUrl, '_blank', 'noopener,noreferrer')
                }}
                startIcon={<Shield className="w-4 h-4" />}
              >
                {translation('security') ?? 'Security'}
              </Button>

              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={() => logout()}
                startIcon={<LogOut className="w-4 h-4" />}
              >
                {translation('logout')}
              </Button>

              <Button
                color="negative"
                coloringStyle="outline"
                onClick={handleClearCache}
                startIcon={<Trash2 className="w-4 h-4" />}
              >
                {translation('clearCache')}
              </Button>
            </div>
          </div>
        </div>
      </ContentPanel>
      <FeedbackDialog isOpen={isFeedbackDialogOpen} onClose={() => setIsFeedbackDialogOpen(false)} hideUrl={true} />
    </Page>
  )
}

export default SettingsPage
