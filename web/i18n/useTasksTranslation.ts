import { useHightideTranslation, useLocale } from '@helpwave/hightide'
import { tasksTranslation } from '@/i18n/translations'

export const useTasksTranslation = () => {
  return useHightideTranslation(tasksTranslation)
}

export { useLocale }
