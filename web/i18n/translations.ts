// AUTO-GENERATED. DO NOT EDIT.
/* eslint-disable @stylistic/quote-props */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Translation } from '@helpwave/internationalization'
import { TranslationGen } from '@helpwave/internationalization'

export const tasksTranslationLocales = ['de-DE', 'en-US'] as const

export type TasksTranslationLocales = typeof tasksTranslationLocales[number]

export type TasksTranslationEntries = {
  'assignedTo': string,
  'assignee': string,
  'confirm': string,
  'createdAt': string,
  'dashboard': string,
  'description': string,
  'developmentAndPreviewInstance': string,
  'dismiss': string,
  'dueDate': string,
  'homePage': string,
  'imprint': string,
  'itsYou': string,
  'login': string,
  'loginRequired': string,
  'loginRequiredDescription': string,
  'myTasks': string,
  'nBed': (values: { count: number }) => string,
  'noPatient': string,
  'nOrganization': (values: { count: number }) => string,
  'notAssigned': string,
  'notes': string,
  'nPatient': (values: { count: number }) => string,
  'nRoom': (values: { count: number }) => string,
  'nTask': (values: { count: number }) => string,
  'nWard': (values: { count: number }) => string,
  'pages.404.notFound': string,
  'pages.404.notFoundDescription1': string,
  'pages.404.notFoundDescription2': string,
  'patient': string,
  'patients': string,
  'place': string,
  'preferences': string,
  'privacy': string,
  'private': string,
  'public': string,
  'publish': string,
  'rooms': string,
  'settings': string,
  'settingsDescription': string,
  'stagingModalDisclaimerMarkdown': string,
  'status': string,
  'taskStatus': (values: { status: string }) => string,
  'visibility': string,
}

export const tasksTranslation: Translation<TasksTranslationLocales, Partial<TasksTranslationEntries>> = {
  'de-DE': {
    'assignedTo': `Zugewiesen an`,
    'assignee': `Verantwortlich`,
    'confirm': `Bestätigen`,
    'createdAt': `Erstellt am`,
    'dashboard': `Dashboard`,
    'description': `Beschreibung`,
    'developmentAndPreviewInstance': `Entwicklungs- und Vorschauinstanz`,
    'dismiss': `Schließen`,
    'dueDate': `Fälligkeitsdatum`,
    'homePage': `Startseite`,
    'imprint': `Impressum`,
    'itsYou': `Du`,
    'login': `Login`,
    'loginRequired': `Login benötigt`,
    'loginRequiredDescription': `Um diese Seite benutzen zu können musst du eingeloggt sein.`,
    'myTasks': `Meine Aufgaben`,
    'nBed': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Bett`,
        'other': `${count} Betten`,
      })
    },
    'noPatient': `Kein Patient`,
    'nOrganization': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Organisation`,
        'other': `${count} Organisationen`,
      })
    },
    'notAssigned': `Nicht zugewiesen`,
    'notes': `Notizen`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patienten`,
      })
    },
    'nRoom': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Zimmer`,
        'other': `${count} Zimmer`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Aufgabe`,
        'other': `${count} Aufgaben`,
      })
    },
    'nWard': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Station`,
        'other': `${count} Stationen`,
      })
    },
    'pages.404.notFound': `404 - Seite nicht gefunden`,
    'pages.404.notFoundDescription1': `Das ist definitiv nicht die Seite nach der Sie suchen`,
    'pages.404.notFoundDescription2': `Zurück zur`,
    'patient': `Patient`,
    'patients': `Patienten`,
    'place': `Ort`,
    'preferences': `Präferenzen`,
    'privacy': `Datenschutz`,
    'private': `Privat`,
    'public': `Öffentlich`,
    'publish': `Veröffentlichen`,
    'rooms': `Zimmer`,
    'settings': `Einstellungen`,
    'settingsDescription': `Hier kannst du die App Konfiguration ändern.`,
    'stagingModalDisclaimerMarkdown': `Diese öffentliche Instanz von helpwave tasks ist für \\b{Entwicklungs- und Vorschauzwecke} gedacht. Bitte stellen Sie sicher, dass Sie \\b{ausschließlich nicht-vertrauliche Testdaten} eingeben. Diese Instanz kann \\negative{\\b{jederzeit gelöscht}} werden.`,
    'status': `Status`,
    'taskStatus': ({ status }): string => {
      return TranslationGen.resolveSelect(status, {
        'overdue': `Überfällig`,
        'upcoming': `Anstehend`,
        'done': `Fertig`,
        'other': `-`,
      })
    },
    'visibility': `Sichtbarkeit`
  },
  'en-US': {
    'assignedTo': `Assigned to`,
    'assignee': `Assignee`,
    'confirm': `Confirm`,
    'createdAt': `Created at`,
    'dashboard': `Dashboard`,
    'developmentAndPreviewInstance': `Development and preview instance`,
    'dismiss': `Dismiss`,
    'dueDate': `Due Date`,
    'homePage': `Home Page`,
    'imprint': `Imprint`,
    'itsYou': `You`,
    'login': `Login`,
    'loginRequired': `Login required`,
    'loginRequiredDescription': `To use this site you need to be logged in.`,
    'myTasks': `My tasks`,
    'nBed': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Bed`,
        'other': `${count} Beds`,
      })
    },
    'noPatient': `No Patient`,
    'nOrganization': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Organization`,
        'other': `${count} Organizations`,
      })
    },
    'notAssigned': `Not assigned`,
    'notes': `notes`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patients`,
      })
    },
    'nRoom': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Room`,
        'other': `${count} Rooms`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Task`,
        'other': `${count} Tasks`,
      })
    },
    'nWard': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Ward`,
        'other': `${count} Wards`,
      })
    },
    'pages.404.notFound': `404 - Page not found`,
    'pages.404.notFoundDescription1': `This is definitely not the page you're looking for`,
    'pages.404.notFoundDescription2': `Let me take you to the`,
    'patient': `Patient`,
    'patients': `Patients`,
    'place': `Place`,
    'preferences': `Preferences`,
    'privacy': `Privacy`,
    'private': `private`,
    'public': `public`,
    'publish': `publish`,
    'rooms': `Rooms`,
    'settings': `Settings`,
    'settingsDescription': `Here you can change the app configuration.`,
    'stagingModalDisclaimerMarkdown': `This public instance of helpwave tasks is for \\b{development and preview purposes}. Please make sure to \\b{only} enter \\b{non-confidential testing data}. This instance can be \\negative{\\b{deleted at any time}}`,
    'status': `Status`,
    'taskStatus': ({ status }): string => {
      return TranslationGen.resolveSelect(status, {
        'overdue': `Overdue`,
        'upcoming': `Upcoming`,
        'done': `Done`,
        'other': `-`,
      })
    },
    'visibility': `Visibility`
  }
}

