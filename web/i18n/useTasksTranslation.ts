import { useTranslation } from '@helpwave/hightide'
import type { HightideTranslationEntries } from '@helpwave/hightide'
import type { TasksTranslationEntries, TasksTranslationLocales } from '@/i18n/translations'

export const useTasksTranslation = () => {
  return useTranslation<TasksTranslationLocales, TasksTranslationEntries & HightideTranslationEntries>()
}
