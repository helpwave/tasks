import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import {
  IconButton,
  LanguageDialog,
  LocalizationUtil,
  ThemeDialog,
  useLocale,
  useTheme
} from '@helpwave/hightide'
import { useState } from 'react'
import { Edit2Icon } from 'lucide-react'

const SettingsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const { theme } = useTheme()
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState<boolean>(false)
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState<boolean>(false)

  return (
    <Page pageTitle={titleWrapper(translation('patients'))}>
      <LanguageDialog
        isOpen={isLanguageDialogOpen}
        onClose={() => setIsLanguageDialogOpen(false)}
      />
      <ThemeDialog
        isOpen={isThemeDialogOpen}
        onClose={() => setIsThemeDialogOpen(false)}
      />
      <ContentPanel
        title={translation('settings')}
        description={translation('settingsDescription')}
      >
        <h2 className="typography-title-md">{translation('preferences')}</h2>
        <div className="grid grid-cols-2 gap-x-8 items-center max-w-128">
          <span className="typography-label-lg">{translation('language')}</span>
          <div className="flex-row-4 justify-end items-center">
            {LocalizationUtil.languagesLocalNames[locale]}
            <IconButton color="transparent" size="small" onClick={() => setIsLanguageDialogOpen(true)}>
              <Edit2Icon/>
            </IconButton>
          </div>

          <span className="typography-label-lg">{translation('themes', { count: 1 })}</span>
          <div className="flex-row-4 justify-end items-center">
            {translation('themeMode', { theme })}
            <IconButton color="transparent" size="small" onClick={() => setIsThemeDialogOpen(true)}>
              <Edit2Icon/>
            </IconButton>
          </div>
        </div>
      </ContentPanel>
    </Page>
  )
}

export default SettingsPage
