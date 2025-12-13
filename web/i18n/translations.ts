// AUTO-GENERATED. DO NOT EDIT.
/* eslint-disable @stylistic/quote-props */


import type { Translation } from '@helpwave/internationalization'
import { TranslationGen } from '@helpwave/internationalization'

export const tasksTranslationLocales = ['de-DE', 'en-US'] as const

export type TasksTranslationLocales = typeof tasksTranslationLocales[number]

export type TasksTranslationEntries = {
  'addPatient': string,
  'addTask': string,
  'age': string,
  'assignedTo': string,
  'assignee': string,
  'authenticationFailed': string,
  'birthdate': string,
  'cancel': string,
  'closedTasks': string,
  'confirm': string,
  'create': string,
  'createdAt': string,
  'currentTime': string,
  'dashboard': string,
  'dashboardWelcome': (values: { name: string }) => string,
  'dashboardWelcomeDescription': string,
  'description': string,
  'developmentAndPreviewInstance': string,
  'dismiss': string,
  'diverse': string,
  'dueDate': string,
  'editPatient': string,
  'female': string,
  'firstName': string,
  'homePage': string,
  'imprint': string,
  'itsYou': string,
  'lastName': string,
  'lastUpdate': string,
  'location': string,
  'login': string,
  'loginRequired': string,
  'loginRequiredDescription': string,
  'logout': string,
  'male': string,
  'myOpenTasks': string,
  'myTasks': string,
  'name': string,
  'nBed': (values: { count: number }) => string,
  'nCurrentlyPatients': (values: { count: number }) => string,
  'newestAdmissions': string,
  'noClosedTasks': string,
  'noOpenTasks': string,
  'noPatient': string,
  'nOrganization': (values: { count: number }) => string,
  'notAssigned': string,
  'notes': string,
  'nPatient': (values: { count: number }) => string,
  'nRoom': (values: { count: number }) => string,
  'nTask': (values: { count: number }) => string,
  'nTeam': (values: { count: number }) => string,
  'nWard': (values: { count: number }) => string,
  'nYear': (values: { count: number }) => string,
  'openTasks': string,
  'overview': string,
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
  'recentPatients': string,
  'recentTasks': string,
  'returnHome': string,
  'rooms': string,
  'save': string,
  'settings': string,
  'settingsDescription': string,
  'sex': string,
  'stagingModalDisclaimerMarkdown': string,
  'status': string,
  'task': string,
  'tasks': string,
  'taskStatus': (values: { status: string }) => string,
  'tasksUpdatedRecently': string,
  'teams': string,
  'time.today': string,
  'totalPatients': string,
  'updated': string,
  'visibility': string,
  'wards': string,
}

export const tasksTranslation: Translation<TasksTranslationLocales, Partial<TasksTranslationEntries>> = {
  'de-DE': {
    'addPatient': `Patient hinzufügen`,
    'addTask': `Aufgabe hinzufügen`,
    'age': `Alter`,
    'assignedTo': `Zugewiesen an`,
    'assignee': `Verantwortlich`,
    'authenticationFailed': `Authentifizierung fehlgeschlagen`,
    'birthdate': `Geburtsdatum`,
    'cancel': `Abbrechen`,
    'closedTasks': `Erledigte Aufgaben`,
    'confirm': `Bestätigen`,
    'create': `Erstellen`,
    'createdAt': `Erstellt am`,
    'currentTime': `Aktuelle Zeit`,
    'dashboard': `Dashboard`,
    'dashboardWelcome': ({ name }): string => {
      return `Guten Morgen, ${name}`
    },
    'dashboardWelcomeDescription': `Hier ist, was heute passiert.`,
    'description': `Beschreibung`,
    'developmentAndPreviewInstance': `Entwicklungs- und Vorschauinstanz`,
    'dismiss': `Schließen`,
    'diverse': `Divers`,
    'dueDate': `Fälligkeitsdatum`,
    'editPatient': `Patient bearbeiten`,
    'female': `Weiblich`,
    'firstName': `Vorname`,
    'homePage': `Startseite`,
    'imprint': `Impressum`,
    'itsYou': `Du`,
    'lastName': `Nachname`,
    'lastUpdate': `Letzte Änderung`,
    'location': `Ort`,
    'login': `Login`,
    'loginRequired': `Login benötigt`,
    'loginRequiredDescription': `Um diese Seite benutzen zu können musst du eingeloggt sein.`,
    'logout': `Abmelden`,
    'male': `Männlich`,
    'myOpenTasks': `Meine offenen Aufgaben`,
    'myTasks': `Meine Aufgaben`,
    'name': `Name`,
    'nBed': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Bett`,
        'other': `${count} Betten`,
      })
    },
    'nCurrentlyPatients': ({ count }): string => {
      let _out: string = ''
      _out += `Aktuell `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patienten`,
      })
      return _out
    },
    'newestAdmissions': `Neueste Aufnahmen`,
    'noClosedTasks': `Keine erledigten Aufgaben`,
    'noOpenTasks': `Keine offenen Aufgaben`,
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
    'nTeam': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Team`,
        'other': `${count} Teams`,
      })
    },
    'nWard': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Station`,
        'other': `${count} Stationen`,
      })
    },
    'nYear': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Jahr alt`,
        'other': `${count} Jahre alt`,
      })
    },
    'openTasks': `Offene Aufgaben`,
    'overview': `Übersicht`,
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
    'recentPatients': `Kürzliche Patienten`,
    'recentTasks': `Kürzliche Aufgaben`,
    'returnHome': `Zur Homepage`,
    'rooms': `Zimmer`,
    'save': `Speichern`,
    'settings': `Einstellungen`,
    'settingsDescription': `Hier kannst du die App Konfiguration ändern.`,
    'sex': `Geschlecht`,
    'stagingModalDisclaimerMarkdown': `Diese öffentliche Instanz von helpwave tasks ist für \\b{Entwicklungs- und Vorschauzwecke} gedacht. Bitte stellen Sie sicher, dass Sie \\b{ausschließlich nicht-vertrauliche Testdaten} eingeben. Diese Instanz kann \\negative{\\b{jederzeit gelöscht}} werden.`,
    'status': `Status`,
    'task': `Aufgabe`,
    'tasks': `Aufgaben`,
    'taskStatus': ({ status }): string => {
      return TranslationGen.resolveSelect(status, {
        'overdue': `Überfällig`,
        'upcoming': `Anstehend`,
        'done': `Fertig`,
        'other': `-`,
      })
    },
    'tasksUpdatedRecently': `Kürzlich aktualisierte Aufgaben`,
    'teams': `Teams`,
    'time.today': `Heute`,
    'totalPatients': `Gesamtpatienten`,
    'updated': `Aktualisiert`,
    'visibility': `Sichtbarkeit`,
    'wards': `Stationen`
  },
  'en-US': {
    'addPatient': `Add Patient`,
    'addTask': `Add Task`,
    'age': `Age`,
    'assignedTo': `Assigned to`,
    'assignee': `Assignee`,
    'authenticationFailed': `Authentication Failed`,
    'birthdate': `Birthdate`,
    'cancel': `Cancel`,
    'closedTasks': `Closed Tasks`,
    'confirm': `Confirm`,
    'create': `Create`,
    'createdAt': `Created at`,
    'currentTime': `Current Time`,
    'dashboard': `Dashboard`,
    'dashboardWelcome': ({ name }): string => {
      return `Good Morning, ${name}`
    },
    'dashboardWelcomeDescription': `Here is what is happening today.`,
    'description': `Description`,
    'developmentAndPreviewInstance': `Development and preview instance`,
    'dismiss': `Dismiss`,
    'diverse': `Diverse`,
    'dueDate': `Due Date`,
    'editPatient': `Edit Patient`,
    'female': `Female`,
    'firstName': `First Name`,
    'homePage': `Home Page`,
    'imprint': `Imprint`,
    'itsYou': `You`,
    'lastName': `Last Name`,
    'lastUpdate': `Last Update`,
    'location': `Location`,
    'login': `Login`,
    'loginRequired': `Login required`,
    'loginRequiredDescription': `To use this site you need to be logged in.`,
    'logout': `Logout`,
    'male': `Male`,
    'myOpenTasks': `My Open Tasks`,
    'myTasks': `My tasks`,
    'name': `Name`,
    'nBed': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Bed`,
        'other': `${count} Beds`,
      })
    },
    'nCurrentlyPatients': ({ count }): string => {
      let _out: string = ''
      _out += `Currently `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patients`,
      })
      return _out
    },
    'newestAdmissions': `Newest admissions`,
    'noClosedTasks': `No closed tasks`,
    'noOpenTasks': `No open tasks`,
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
    'nTeam': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Team`,
        'other': `${count} Teams`,
      })
    },
    'nWard': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Ward`,
        'other': `${count} Wards`,
      })
    },
    'nYear': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} year old`,
        'other': `${count} years old`,
      })
    },
    'openTasks': `Open Tasks`,
    'overview': `Overview`,
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
    'recentPatients': `Recent Patients`,
    'recentTasks': `Recent Tasks`,
    'returnHome': `Return Home`,
    'rooms': `Rooms`,
    'save': `Save`,
    'settings': `Settings`,
    'settingsDescription': `Here you can change the app configuration.`,
    'sex': `Sex`,
    'stagingModalDisclaimerMarkdown': `This public instance of helpwave tasks is for \\b{development and preview purposes}. Please make sure to \\b{only} enter \\b{non-confidential testing data}. This instance can be \\negative{\\b{deleted at any time}}`,
    'status': `Status`,
    'task': `Task`,
    'tasks': `Tasks`,
    'taskStatus': ({ status }): string => {
      return TranslationGen.resolveSelect(status, {
        'overdue': `Overdue`,
        'upcoming': `Upcoming`,
        'done': `Done`,
        'other': `-`,
      })
    },
    'tasksUpdatedRecently': `Tasks updated recently`,
    'teams': `Teams`,
    'time.today': `Today`,
    'totalPatients': `Total Patients`,
    'updated': `Updated`,
    'visibility': `Visibility`,
    'wards': `Wards`
  }
}

