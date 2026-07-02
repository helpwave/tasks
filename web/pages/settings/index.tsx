import type { NextPage } from 'next'
import { useState, useRef } from 'react'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import {
  AvatarWithStatus,
  Button,
  LocalizationUtil,
  NavigationCard,
  Select,
  SelectOption,
  ThemeUtil,
  useLocale,
  useTheme
} from '@helpwave/hightide'
import { useStorage } from '@/hooks/useStorage'
import type { HightideTranslationLocales, ThemeType } from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, MonitorCog, MoonIcon, SunIcon, Trash2, ClipboardList, Shield, TableProperties, Building2, MessageSquareText, Upload, X, Rabbit, Combine } from 'lucide-react'
import clsx from 'clsx'
import { removeUser } from '@/api/auth/authService'
import { useQueryClient } from '@tanstack/react-query'
import { openSurvey, surveyStorageKeys } from '@/utils/survey'
import { getConfig } from '@/utils/config'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import Link from 'next/link'

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
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    setValue: setOnboardingSurveyCompleted
  } = useStorage({ key: surveyStorageKeys.onboardingCompleted, defaultValue: 0 })

  const {
    setValue: setWeeklySurveyLastCompleted
  } = useStorage({ key: surveyStorageKeys.weeklyLastCompleted, defaultValue: 0 })

  const handleClearCache = async () => {
    queryClient.clear()

    await removeUser()

    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    window.location.href = '/'
  }

  const handleOpenOnboardingSurvey = async () => {
    if (!user?.id || !config.onboardingSurveyUrl) return
    await openSurvey(config.onboardingSurveyUrl, user.id)
    setOnboardingSurveyCompleted(new Date().getTime())
  }

  const handleOpenWeeklySurvey = async () => {
    if (!user?.id || !config.weeklySurveyUrl) return
    await openSurvey(config.weeklySurveyUrl, user.id)
    setWeeklySurveyLastCompleted(new Date().getTime())
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return

    setIsUploading(true)
    try {
      const { getUser } = await import('@/api/auth/authService')
      const authUser = await getUser()
      const token = authUser?.access_token

      if (!token) {
        throw new Error('Not authenticated')
      }

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      await response.json()

      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      queryClient.invalidateQueries({ queryKey: ['GetUser'] })
      queryClient.invalidateQueries()

      handleRemoveFile()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Page pageTitle={titleWrapper(translation('settings'))}>
      <ContentPanel
        titleElement={translation('settings')}
        description={translation('settingsDescription')}
      >
        <div className="flex flex-col gap-y-12">
          <section className="flex-row-4 items-center p-4 bg-surface rounded-lg border border-divider">
            <div className="relative">
              <AvatarWithStatus
                size="lg"
                image={previewUrl ? { avatarUrl: previewUrl, alt: user?.name || '' } : (user?.avatarUrl ? { avatarUrl: user.avatarUrl, alt: user?.name || '' } : undefined)}
                status={user?.isOnline === undefined ? 'unknown' : user.isOnline ? 'online' : 'offline'}
              />
              {previewUrl && (
                <button
                  onClick={handleRemoveFile}
                  className="absolute -top-1 -right-1 bg-negative text-white rounded-full p-1 hover:opacity-75 transition-opacity"
                  aria-label="Remove selected image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-col-1 flex-1">
              <span className="typography-title-md font-bold">{user?.name}</span>
              <span className="typography-body-sm text-description">{user?.id}</span>
              <div className="flex-row-2 items-center gap-x-2 mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <label htmlFor="profile-picture-upload" className="cursor-pointer">
                  <Button
                    color="neutral"
                    coloringStyle="outline"
                    size="sm"
                    className="pointer-events-none"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedFile ? 'Change Picture' : 'Upload Picture'}
                  </Button>
                </label>
                {selectedFile && (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Save'}
                  </Button>
                )}
              </div>
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
            <div className="flex flex-col gap-6 max-w-200">
              <NavigationCard
                className="justify-start h-auto py-4 w-full"
                href="/properties"
                leading={<TableProperties className="mr-2 shrink-0" />}
                title={translation('properties')}
                description={translation('propertiesSettingsDescription')}
                LinkComponent={Link}
              />
              <NavigationCard
                className="justify-start h-auto py-4 w-full"
                href="/settings/views"
                leading={<Rabbit className="mr-2 shrink-0 size-5" />}
                title={translation('views')}
                description={translation('viewSettingsDescription')}
                LinkComponent={Link}
              />
              <NavigationCard
                className="justify-start h-auto py-4 w-full"
                href="/settings/task-presets"
                leading={<Combine className="mr-2 shrink-0" />}
                title={translation('taskPresets')}
                description={translation('taskPresetsDescription')}
                LinkComponent={Link}
              />
            </div>
          </div>

          <div className="flex-col-6">
            <h2 className="typography-title-md border-b border-divider pb-2">{translation('preferences')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-200">

              <div className="flex-col-2">
                <span className="typography-label-lg">{translation('language')}</span>
                <Select<HightideTranslationLocales>
                  value={locale}
                  onValueChange={(language) => setLocale(language)}
                  buttonProps={{
                    selectedDisplay: (selected) => selected ? LocalizationUtil.languagesLocalNames[selected.value] : '',
                    className: 'w-full'
                  }}
                >
                  {LocalizationUtil.locals.map((local) => (
                    <SelectOption key={local} value={local} label={LocalizationUtil.languagesLocalNames[local]} />
                  ))}
                </Select>
              </div>

              <div className="flex-col-2">
                <span className="typography-label-lg">{translation('pThemes', { count: 1 })}</span>
                <Select<ThemeType>
                  value={theme}
                  onValueChange={(theme) => setTheme(theme)}
                  iconAppearance="right"
                  buttonProps={{
                    selectedDisplay: (selected) => selected && (
                      <div className="flex-row-2 items-center">
                        <ThemeIcon theme={theme} />
                        {translation('themeMode', { theme: selected.value })}
                      </div>
                    ),
                    className: 'w-full',
                  }}
                >
                  {ThemeUtil.themes.map((t) => (
                    <SelectOption key={t} value={t} className="gap-x-6 justify-between" label={translation('themeMode', { theme: t })} >
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
              {config.onboardingSurveyUrl && (
                <Button
                  color="neutral"
                  coloringStyle="outline"
                  onClick={handleOpenOnboardingSurvey}
                >
                  <ClipboardList className="w-4 h-4" />
                  {translation('onboardingSurvey')}
                </Button>
              )}
              {config.weeklySurveyUrl && (
                <Button
                  color="neutral"
                  coloringStyle="outline"
                  onClick={handleOpenWeeklySurvey}
                >
                  <ClipboardList className="w-4 h-4" />
                  {translation('weeklySurvey')}
                </Button>
              )}
              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={() => setIsFeedbackDialogOpen(true)}
              >
                <MessageSquareText className="w-4 h-4" />
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
              >
                <Shield className="w-4 h-4" />
                {translation('security') ?? 'Security'}
              </Button>

              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
                {translation('logout')}
              </Button>

              <Button
                color="negative"
                coloringStyle="outline"
                onClick={handleClearCache}
              >
                <Trash2 className="w-4 h-4" />
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
