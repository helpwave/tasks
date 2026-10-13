// AUTO-GENERATED. DO NOT EDIT.
/* eslint-disable @stylistic/quote-props */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Translation } from '@helpwave/internationalization'
import { TranslationGen } from '@helpwave/internationalization'

export const hightideLocaleTranslationLocales = ['fr-FR', 'it-IT', 'nl-NL'] as const

export type HightideLocaleTranslationLocales = typeof hightideLocaleTranslationLocales[number]

export type HightideLocaleTranslationEntries = {
  'changeColumnDisplay': string,
  'changePinning': string,
  'entryDate': string,
  'errorOccurred': string,
  'isUndefined': string,
  'time.today': string,
  'invalidEmail': string,
  'selectOption': string,
  'pThemes': (values: { count: number }) => string,
}

export const hightideLocaleTranslation: Translation<HightideLocaleTranslationLocales, Partial<HightideLocaleTranslationEntries>> = {
  'fr-FR': {
    'changeColumnDisplay': `Modifier l'affichage des colonnes`,
    'changePinning': `Modifier l'épinglage`,
    'entryDate': `Date d'entrée`,
    'errorOccurred': `Une erreur s'est produite`,
    'isUndefined': `N'est pas défini`,
    'time.today': `Aujourd'hui`
  },
  'it-IT': {
    'invalidEmail': `L'indirizzo email non è valido.`,
    'selectOption': `Seleziona un'opzione`
  },
  'nl-NL': {
    'pThemes': ({ count }): string => {
      let _out: string = ''
      _out += `'`
      _out += TranslationGen.resolvePlural(count, {
        '=1': `Thema`,
        'other': `Themas`,
      })
      return _out
    }
  }
}

