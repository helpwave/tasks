import type { SupportedLocalesConfig } from '@helpwave/hightide'
import { HightideConfigUtils } from '@helpwave/hightide'
import type { TasksTranslationLocales } from '@/i18n/translations'

export const supportedLocales = {
  ...HightideConfigUtils.defaultSupportedLocales,
  'pt-BR': {
    localName: 'Português (Brasil)',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'sunday',
    defaultCalendarType: 'Gregorian',
  },
  'es-ES': {
    localName: 'Español',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'fr-FR': {
    localName: 'Français',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'nl-NL': {
    localName: 'Nederlands',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'it-IT': {
    localName: 'Italiano',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'pl-PL': {
    localName: 'Polski',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'tr-TR': {
    localName: 'Türkçe',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'ro-RO': {
    localName: 'Română',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'el-GR': {
    localName: 'Ελληνικά',
    defaultIs24HourFormat: false,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
  'ru-RU': {
    localName: 'Русский',
    defaultIs24HourFormat: true,
    defaultStartingWeekday: 'monday',
    defaultCalendarType: 'Gregorian',
  },
} as const satisfies Record<TasksTranslationLocales, SupportedLocalesConfig[string]>
