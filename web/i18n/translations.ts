// AUTO-GENERATED. DO NOT EDIT.
/* eslint-disable @stylistic/quote-props */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Translation } from '@helpwave/internationalization'
import { TranslationGen } from '@helpwave/internationalization'

export const tasksTranslationLocales = ['de-DE', 'el-GR', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'nl-NL', 'pl-PL', 'pt-BR', 'ro-RO', 'ru-RU', 'tr-TR'] as const

export type TasksTranslationLocales = typeof tasksTranslationLocales[number]

export type TasksTranslationEntries = {
  'account': string,
  'active': string,
  'add': string,
  'addFastAccess': string,
  'addFastAccessDescription': string,
  'additionalAssigneesCount': (values: { count: number }) => string,
  'addPatient': string,
  'addProperty': string,
  'addTask': string,
  'admitPatient': string,
  'anonymous': string,
  'anonymousSubmission': string,
  'archivedPropertyDescription': string,
  'archiveProperty': string,
  'assignedTo': string,
  'assigneeTeam': string,
  'authenticationFailed': string,
  'birthdate': string,
  'cancel': string,
  'clear': string,
  'clearCache': string,
  'clearPropertyColumnActionPatient': string,
  'clearPropertyColumnActionTask': string,
  'clearPropertyColumnConfirmButtonPatient': string,
  'clearPropertyColumnConfirmButtonTask': string,
  'clearPropertyColumnDialogDescriptionPatient': (values: { propertyName: string, count: number }) => string,
  'clearPropertyColumnDialogDescriptionTask': (values: { propertyName: string, count: number }) => string,
  'clearPropertyColumnDialogTitlePatient': string,
  'clearPropertyColumnDialogTitleTask': string,
  'clearPropertyColumnTypeNameInstruction': (values: { propertyName: string }) => string,
  'clinic': string,
  'clinics': string,
  'clinicUpdated': string,
  'close': string,
  'closedTasks': string,
  'collapseAll': string,
  'confirm': string,
  'confirmDeleteView': string,
  'confirmSelection': string,
  'confirmShiftHandover': string,
  'confirmShiftHandoverDescription': string,
  'confirmShiftHandoverDescriptionWithName': (values: { taskCount: number, name: string }) => string,
  'conflictDetected': string,
  'connectionConnected': string,
  'connectionConnecting': string,
  'connectionDisconnected': string,
  'copyShareLink': string,
  'copyShareLinkEnableSharingFirst': string,
  'copyViewToMyViews': string,
  'create': string,
  'createTask': string,
  'creationDate': string,
  'currentTime': string,
  'dashboard': string,
  'dashboardWelcomeAfternoon': (values: { name: string }) => string,
  'dashboardWelcomeDescription': string,
  'dashboardWelcomeEvening': (values: { name: string }) => string,
  'dashboardWelcomeMorning': (values: { name: string }) => string,
  'dashboardWelcomeNight': (values: { name: string }) => string,
  'dashboardWelcomeNoon': (values: { name: string }) => string,
  'delete': string,
  'deletePatient': string,
  'deletePatientConfirmation': string,
  'description': string,
  'descriptionPlaceholder': string,
  'deselectAll': string,
  'developmentAndPreviewInstance': string,
  'discard': string,
  'discardDraftMessage': string,
  'discardDraftTitle': string,
  'discardViewChanges': string,
  'dischargePatient': string,
  'dischargePatientConfirmation': string,
  'dismiss': string,
  'dismissAll': string,
  'diverse': string,
  'done': string,
  'dueDate': string,
  'dueDateInDays': (values: { days: number }) => string,
  'dueDateInHours': (values: { hours: number }) => string,
  'dueDateNow': string,
  'dueDateToday': string,
  'dueDateTomorrow': string,
  'duplicate': string,
  'edit': string,
  'editPatient': string,
  'editPresetTask': string,
  'editTask': string,
  'enterFeedback': string,
  'error': string,
  'errorOccurred': string,
  'estimatedTime': string,
  'expandAll': string,
  'export': string,
  'exportCsv': string,
  'exportExcel': string,
  'exportFailed': string,
  'feedback': string,
  'feedbackDescription': string,
  'female': string,
  'filter': string,
  'filterAll': string,
  'filterUndone': string,
  'firstName': string,
  'freeBeds': string,
  'hide': string,
  'homePage': string,
  'imprint': string,
  'inactive': string,
  'install': string,
  'installApp': string,
  'installAppDescription': string,
  'language': string,
  'lastName': string,
  'listViewCard': string,
  'listViewTable': string,
  'loading': string,
  'loadingAlmostThere': string,
  'loadingGettingReady': string,
  'loadingHangOn': string,
  'loadingMoment': string,
  'loadMore': string,
  'loadTaskPreset': string,
  'loadTaskPresetConfirm': (values: { count: number }) => string,
  'loadTaskPresetConfirmTitle': string,
  'loadTaskPresetCreateAndAssign': string,
  'loadTaskPresetSelectTasks': string,
  'loadTaskPresetTaskLabel': string,
  'loadTaskPresetTitle': string,
  'location': string,
  'locationBed': string,
  'locationClinic': string,
  'locationRoom': string,
  'locationType': (values: { type: string }) => string,
  'locationWard': string,
  'login': string,
  'logInAgain': string,
  'loginRequired': string,
  'loginRequiredDescription': string,
  'logout': string,
  'male': string,
  'markPatientDead': string,
  'markPatientDeadConfirmation': string,
  'menu': string,
  'more': string,
  'myFavorites': string,
  'myOpenTasks': string,
  'myTasks': string,
  'name': string,
  'nFilter': (values: { count: number }) => string,
  'nMinutesShort': (values: { minCount: number }) => string,
  'no': string,
  'noClosedTasks': string,
  'noLocationsFound': string,
  'none': string,
  'noNotifications': string,
  'noOpenTasks': string,
  'noPatient': string,
  'noPatientsInTaskView': string,
  'noResultsFound': string,
  'notAssigned': string,
  'notifications': string,
  'nPatient': (values: { count: number }) => string,
  'nSorting': (values: { count: number }) => string,
  'nTask': (values: { count: number }) => string,
  'nYears': (values: { years: number }) => string,
  'occupancy': string,
  'ok': string,
  'onboardingSurvey': string,
  'openSurvey': string,
  'openTasks': string,
  'openView': string,
  'option': string,
  'organizations': string,
  'overview': string,
  'pages.404.loading': string,
  'pages.404.notFound': string,
  'pages.404.notFoundDescription1': string,
  'pages.404.notFoundDescription2': string,
  'patient': string,
  'patientActions': string,
  'patientData': string,
  'patients': string,
  'patientsCountChipAdmitted': (values: { count: string }) => string,
  'patientsCountChipTotal': (values: { count: string }) => string,
  'patientsCountChipWaiting': (values: { count: string }) => string,
  'patientState': (values: { state: string }) => string,
  'patientsUpdatedRecently': string,
  'pickClinic': string,
  'pickClinicDescription': string,
  'pickPosition': string,
  'pickPositionDescription': string,
  'pickTeams': string,
  'pickTeamsDescription': string,
  'position': string,
  'positionUpdated': string,
  'preferences': string,
  'priority': string,
  'priorityLabel': string,
  'priorityNone': string,
  'privacy': string,
  'properties': string,
  'propertiesSettingsDescription': string,
  'property': string,
  'pThemes': (values: { count: number }) => string,
  'rAdd': (values: { name: string }) => string,
  'rChipTotal': (values: { value: string }) => string,
  'readOnlyView': string,
  'recentPatients': string,
  'recentTasks': string,
  'rEdit': (values: { name: string }) => string,
  'refreshing': string,
  'removeProperty': string,
  'removePropertyConfirmation': string,
  'retakeSurvey': string,
  'rShow': (values: { name: string }) => string,
  'savedViews': string,
  'saveView': string,
  'saveViewAsNew': string,
  'saveViewDescription': string,
  'saveViewDescriptionFromSystemList': string,
  'saveViewOverwriteCurrent': string,
  'scopeChangeNode': string,
  'scopeNoNodeSelected': string,
  'scopePrivate': string,
  'scopePrivateDescription': string,
  'scopePublic': string,
  'scopePublicDescription': string,
  'scopeSelectNode': string,
  'scopeShared': string,
  'scopeSharedDescription': string,
  'scopeStoredAt': string,
  'scopeVisibility': string,
  'scrollToTop': string,
  'search': string,
  'searchLocations': string,
  'searchUserOrTeam': string,
  'searchUsersOrTeams': string,
  'security': string,
  'selectAll': string,
  'selectAssignee': string,
  'selectClinic': string,
  'selectLocation': string,
  'selectLocationDescription': string,
  'selectOptions': string,
  'selectPosition': string,
  'selectRootLocation': string,
  'selectRootLocationDescription': string,
  'selectTeams': string,
  'sessionExpired': string,
  'sessionExpiredDescription': string,
  'settings': string,
  'settingsDescription': string,
  'sex': string,
  'shiftHandover': string,
  'showAllTasks': string,
  'showPatient': (values: { name: string }) => string,
  'showTeamTasks': string,
  'sorting': string,
  'sPriority': (values: { priority: string }) => string,
  'sPropertySubjectType': (values: { subject: string }) => string,
  'sPropertyType': (values: { type: string }) => string,
  'stagingModalDisclaimerMarkdown': string,
  'startRecording': string,
  'stateUpdated': string,
  'status': string,
  'stopRecording': string,
  'subjectType': string,
  'submissionDetails': string,
  'submit': string,
  'submittingAs': (values: { name: string }) => string,
  'surveyDescription': string,
  'surveyTitle': string,
  'system': string,
  'task': string,
  'taskFromPresetTooltip': string,
  'taskPresetAddRow': string,
  'taskPresetApplyToRow': string,
  'taskPresetCreate': string,
  'taskPresetDelete': string,
  'taskPresetDeleteConfirm': string,
  'taskPresetEdit': string,
  'taskPresetEditDetails': string,
  'taskPresetEmptyList': string,
  'taskPresetKey': string,
  'taskPresetKeyHint': string,
  'taskPresetName': string,
  'taskPresetNoEstimate': string,
  'taskPresetNoTasks': string,
  'taskPresetRemoveRow': string,
  'taskPresets': string,
  'taskPresetSave': string,
  'taskPresetsDescription': string,
  'taskPresetSelectPlaceholder': string,
  'taskPresetSourceNotFound': string,
  'taskPresetSourceOpenSettings': string,
  'taskPresetSourceTasksInGraph': string,
  'taskPresetSourceTitle': string,
  'tasks': string,
  'tasksCreatedFromPreset': string,
  'tasksUpdatedRecently': string,
  'taskTitlePlaceholder': string,
  'teams': string,
  'themeMode': (values: { theme: string }) => string,
  'timeEstimate': string,
  'title': string,
  'totalPatients': string,
  'type': string,
  'updated': string,
  'url': string,
  'user': string,
  'userInformation': string,
  'users': string,
  'viewAnyoneWithLinkCanView': string,
  'viewDerivedPatientsHint': string,
  'views': string,
  'viewsEntityPatient': string,
  'viewsEntityTask': string,
  'viewSettings': string,
  'viewSettingsDescription': string,
  'viewVisibility': string,
  'viewVisibilityLinkShared': string,
  'viewVisibilityPrivate': string,
  'waitingForPatient': string,
  'waitPatient': string,
  'wards': string,
  'weeklySurvey': string,
  'yes': string,
}

export const tasksTranslation: Translation<TasksTranslationLocales, Partial<TasksTranslationEntries>> = {
  'de-DE': {
    'account': `Konto`,
    'active': `Aktiv`,
    'add': `Hinzufügen`,
    'addFastAccess': `Schnellzugriff erstellen`,
    'addFastAccessDescription': `Geben Sie dem neuen Schnellzugriff einen Namen.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Patient hinzufügen`,
    'addProperty': `Eigenschaften hinzufügen`,
    'addTask': `Aufgabe hinzufügen`,
    'admitPatient': `Patient aufnehmen`,
    'anonymous': `Anonym`,
    'anonymousSubmission': `Anonyme Übermittlung`,
    'archivedPropertyDescription': `Archivierte Eigenschaften können nicht mehr neu Objekten hinzugeügt werden.`,
    'archiveProperty': `Eigenschaft Archivieren`,
    'assignedTo': `Zugewiesen an`,
    'assigneeTeam': `Zugewiesenes Team`,
    'authenticationFailed': `Authentifizierung fehlgeschlagen`,
    'birthdate': `Geburtsdatum`,
    'cancel': `Abbrechen`,
    'clear': `Löschen`,
    'clearCache': `Cache leeren`,
    'clearPropertyColumnActionPatient': `Werte dieser Eigenschaft bei gelisteten Patienten leeren`,
    'clearPropertyColumnActionTask': `Diese Eigenschaft von gelisteten Aufgaben entfernen`,
    'clearPropertyColumnConfirmButtonPatient': `Eigenschaftswerte leeren`,
    'clearPropertyColumnConfirmButtonTask': `Eigenschaft von Aufgaben entfernen`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Dadurch werden alle Werte der Eigenschaft "${propertyName}" bei ${count} aktuell in dieser Liste geladenen Patienten geleert. Die Eigenschaft bleibt an diesen Patienten bestehen. Nicht geladene Patienten in dieser Liste bleiben unverändert.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `Dadurch wird die Eigenschaft "${propertyName}" von ${count} aktuell in dieser Liste geladenen Aufgaben dauerhaft entfernt. Nicht geladene Aufgaben in dieser Liste bleiben unverändert.`
    },
    'clearPropertyColumnDialogTitlePatient': `Eigenschaftswerte bei Patienten leeren`,
    'clearPropertyColumnDialogTitleTask': `Eigenschaft von Aufgaben entfernen`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Zum Bestätigen "${propertyName}" eingeben.`
    },
    'clinic': `Klinik`,
    'clinics': `Kliniken`,
    'clinicUpdated': `Klinik aktualisiert`,
    'close': `Schließen`,
    'closedTasks': `Erledigte Aufgaben`,
    'collapseAll': `Alle einklappen`,
    'confirm': `Bestätigen`,
    'confirmDeleteView': `Diesen gespeicherten Schnellzugriff löschen? Dies kann nicht rückgängig gemacht werden.`,
    'confirmSelection': `Auswahl bestätigen`,
    'confirmShiftHandover': `Schichtübergabe bestätigen`,
    'confirmShiftHandoverDescription': `Sind Sie sicher, dass Sie alle offenen Aufgaben an den ausgewählten Benutzer übertragen möchten?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Sind Sie sicher, dass Sie `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} offene Aufgabe`,
        'other': `${taskCount} offene Aufgaben`,
      })
      _out += ` an ${name} übertragen möchten?`
      return _out
    },
    'conflictDetected': `Konflikt erkannt`,
    'connectionConnected': `Verbunden`,
    'connectionConnecting': `Verbinde…`,
    'connectionDisconnected': `Getrennt`,
    'copyShareLink': `Link kopieren`,
    'copyShareLinkEnableSharingFirst': `Aktivieren Sie die Link-Freigabe, damit andere Personen mit dem Link diesen Schnellzugriff öffnen können.`,
    'copyViewToMyViews': `In meinen Schnellzugriff kopieren`,
    'create': `Erstellen`,
    'createTask': `Aufgabe erstellen`,
    'creationDate': `Erstellungsdatum`,
    'currentTime': `Aktuelle Zeit`,
    'dashboard': `Dashboard`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Guten Nachmittag, ${name}!`
    },
    'dashboardWelcomeDescription': `Hier ist, was heute passiert.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Guten Abend, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Guten Morgen, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Gute Nacht, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Guten Mittag, ${name}!`
    },
    'delete': `Löschen`,
    'deletePatient': `Patient löschen`,
    'deletePatientConfirmation': `Sind Sie sicher, dass Sie diesen Patienten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`,
    'description': `Beschreibung`,
    'descriptionPlaceholder': `Weitere Details hinzufügen...`,
    'deselectAll': `Auswahl aufheben`,
    'developmentAndPreviewInstance': `Entwicklungs- und Vorschauinstanz`,
    'discard': `Verwerfen`,
    'discardDraftMessage': `Sie haben nicht gespeicherte Eingaben. Beim Schließen gehen alle Eingaben verloren.`,
    'discardDraftTitle': `Entwurf verwerfen?`,
    'discardViewChanges': `Änderungen verwerfen`,
    'dischargePatient': `Patient entlassen`,
    'dischargePatientConfirmation': `Sind Sie sicher, dass Sie diesen Patienten entlassen möchten? Diese Aktion ändert den Status des Patienten.`,
    'dismiss': `Schließen`,
    'dismissAll': `Alle verwerfen`,
    'diverse': `Divers`,
    'done': `Fertig`,
    'dueDate': `Fälligkeitsdatum`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} Tag`,
        'other': `${days} Tage`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} Stunde`,
        'other': `${hours} Stunden`,
      })
      return _out
    },
    'dueDateNow': `Jetzt`,
    'dueDateToday': `Heute`,
    'dueDateTomorrow': `Morgen`,
    'duplicate': `Duplizieren`,
    'edit': `Bearbeiten`,
    'editPatient': `Patient bearbeiten`,
    'editPresetTask': `Vorlagenaufgabe bearbeiten`,
    'editTask': `Aufgabe bearbeiten`,
    'enterFeedback': `Geben Sie hier Ihr Feedback ein...`,
    'error': `Fehler`,
    'errorOccurred': `Ein Fehler ist aufgetreten`,
    'estimatedTime': `Geschätzte Zeit (Minuten)`,
    'expandAll': `Alle ausklappen`,
    'export': `Exportieren`,
    'exportCsv': `Als CSV exportieren`,
    'exportExcel': `Als Excel exportieren (druckbar)`,
    'exportFailed': `Export fehlgeschlagen. Bitte erneut versuchen.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Teilen Sie Ihr Feedback, melden Sie Fehler oder schlagen Sie Verbesserungen vor.`,
    'female': `Weiblich`,
    'filter': `Filter`,
    'filterAll': `Alle`,
    'filterUndone': `Offen`,
    'firstName': `Vorname`,
    'freeBeds': `Freie Betten`,
    'hide': `Ausblenden`,
    'homePage': `Startseite`,
    'imprint': `Impressum`,
    'inactive': `Inaktiv`,
    'install': `Installieren`,
    'installApp': `App installieren`,
    'installAppDescription': `Installieren Sie helpwave tasks für eine bessere Erfahrung mit Offline-Unterstützung und schnellerem Zugriff.`,
    'language': `Sprache`,
    'lastName': `Nachname`,
    'listViewCard': `Kartenansicht`,
    'listViewTable': `Tabellenansicht`,
    'loading': `Laden...`,
    'loadingAlmostThere': `Fast fertig...`,
    'loadingGettingReady': `Einen Augenblick — wir bereiten alles vor...`,
    'loadingHangOn': `Einen Moment — wir holen die neuesten Daten...`,
    'loadingMoment': `Nur eine Sekunde, gleich geschafft...`,
    'loadMore': `Mehr laden`,
    'loadTaskPreset': `Vorlage laden`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} Aufgabe`,
        'other': `${count} Aufgaben`,
      })
      _out += ` für diesen Patienten anlegen?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Vorlagenladen bestätigen`,
    'loadTaskPresetCreateAndAssign': `Anlegen & mir zuweisen`,
    'loadTaskPresetSelectTasks': `Aufgaben aus der Vorlage`,
    'loadTaskPresetTaskLabel': `Vorlage`,
    'loadTaskPresetTitle': `Aufgaben-Vorlage laden`,
    'location': `Ort`,
    'locationBed': `Bett`,
    'locationClinic': `Klinik`,
    'locationRoom': `Zimmer`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Klinik`,
        'WARD': `Station`,
        'TEAM': `Team`,
        'ROOM': `Zimmer`,
        'BED': `Bett`,
        'other': `Sonstiges`,
      })
    },
    'locationWard': `Station`,
    'login': `Login`,
    'logInAgain': `Erneut anmelden`,
    'loginRequired': `Login benötigt`,
    'loginRequiredDescription': `Um diese Seite benutzen zu können musst du eingeloggt sein.`,
    'logout': `Abmelden`,
    'male': `Männlich`,
    'markPatientDead': `Patient als verstorben markieren`,
    'markPatientDeadConfirmation': `Sind Sie sicher, dass Sie diesen Patienten als verstorben markieren möchten?`,
    'menu': `Menü`,
    'more': `Mehr`,
    'myFavorites': `Meine Favoriten`,
    'myOpenTasks': `Meine offenen Aufgaben`,
    'myTasks': `Meine Aufgaben`,
    'name': `Name`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Filter`,
        'other': `${count} Filter`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} Min.`
    },
    'no': `Nein`,
    'noClosedTasks': `Keine erledigten Aufgaben`,
    'noLocationsFound': `Keine Standorte gefunden`,
    'none': `Keine`,
    'noNotifications': `Keine aktuellen Updates`,
    'noOpenTasks': `Keine offenen Aufgaben`,
    'noPatient': `Kein Patient`,
    'noPatientsInTaskView': `Keine Patienten für diesen Aufgaben-Schnellzugriff.`,
    'noResultsFound': `Keine Ergebnisse gefunden`,
    'notAssigned': `Nicht zugewiesen`,
    'notifications': `Benachrichtigungen`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patienten`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Sortierung`,
        'other': `${count} Sortierungen`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Aufgabe`,
        'other': `${count} Aufgaben`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 Jahre`,
        '=1': `1 Jahr`,
        'other': `${years} Jahre`,
      })
    },
    'occupancy': `Belegung`,
    'ok': `OK`,
    'onboardingSurvey': `Onboarding-Umfrage`,
    'openSurvey': `Umfrage öffnen`,
    'openTasks': `Offene Aufgaben`,
    'openView': `Öffnen`,
    'option': `Option`,
    'organizations': `Organisationen`,
    'overview': `Übersicht`,
    'pages.404.loading': `Laden...`,
    'pages.404.notFound': `404 - Seite nicht gefunden`,
    'pages.404.notFoundDescription1': `Das ist definitiv nicht die Seite nach der Sie suchen`,
    'pages.404.notFoundDescription2': `Zurück zur`,
    'patient': `Patient`,
    'patientActions': `Patientenaktionen`,
    'patientData': `Daten`,
    'patients': `Patienten`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Aufgenommen ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Gesamt ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Wartend ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Wartend`,
        'ADMITTED': `Aufgenommen`,
        'DISCHARGED': `Entlassen`,
        'DEAD': `Verstorben`,
        'other': `Unbekannt`,
      })
    },
    'patientsUpdatedRecently': `Kürzlich aktualisierte Patienten`,
    'pickClinic': `Klinik auswählen`,
    'pickClinicDescription': `Wählen Sie die Klinik für diesen Patienten aus. Es können nur Klinik-Standorte ausgewählt werden.`,
    'pickPosition': `Standort auswählen`,
    'pickPositionDescription': `Wählen Sie den Standort für diesen Patienten aus. Sie können Krankenhaus-, Praxis-, Klinik-, Station-, Bett- oder Zimmer-Standorte auswählen.`,
    'pickTeams': `Teams auswählen`,
    'pickTeamsDescription': `Wählen Sie ein oder mehrere Teams für diesen Patienten aus. Sie können Klinik-, Team-, Praxis- oder Krankenhaus-Standorte auswählen.`,
    'position': `Standort`,
    'positionUpdated': `Ort aktualisiert`,
    'preferences': `Präferenzen`,
    'priority': `Priorität`,
    'priorityLabel': `Priorität`,
    'priorityNone': `Keine`,
    'privacy': `Datenschutz`,
    'properties': `Eigenschaften`,
    'propertiesSettingsDescription': `Eigene Felder für Aufgaben und Patienten: Typen festlegen und in Filtern nutzen.`,
    'property': `Eigenschaft`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Design`,
        'other': `Designs`,
      })
    },
    'rAdd': ({ name }): string => {
      return `${name} hinzufügen`
    },
    'rChipTotal': ({ value }): string => {
      return `Gesamt ${value}`
    },
    'readOnlyView': `Nur lesen`,
    'recentPatients': `Deine kürzlichen Patienten`,
    'recentTasks': `Deine kürzlichen Aufgaben`,
    'rEdit': ({ name }): string => {
      return `${name} ändern`
    },
    'refreshing': `Aktualisiere…`,
    'removeProperty': `Eigenschaft entfernen`,
    'removePropertyConfirmation': `Sind Sie sicher, dass Sie diese Eigenschaft entfernen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`,
    'retakeSurvey': `Umfrage erneut durchführen`,
    'rShow': ({ name }): string => {
      return `${name} anzeigen`
    },
    'savedViews': `Schnellzugriff`,
    'saveView': `Schnellzugriff speichern`,
    'saveViewAsNew': `Als neuen Schnellzugriff speichern`,
    'saveViewDescription': `Benennen Sie diesen Schnellzugriff. Filter, Sortierung, Suche und Standort werden gespeichert.`,
    'saveViewDescriptionFromSystemList': `Legt einen neuen Schnellzugriff aus diesem Layout an. Diese Seite selbst wird nicht überschrieben und bleibt für alle gleich — den Schnellzugriff öffnen Sie bei Bedarf in der Seitenleiste.`,
    'saveViewOverwriteCurrent': `Aktuellen Schnellzugriff überschreiben`,
    'scopeChangeNode': `Knoten ändern`,
    'scopeNoNodeSelected': `Wählen Sie den Knoten, an dem dieser Eintrag gespeichert wird.`,
    'scopePrivate': `Privat`,
    'scopePrivateDescription': `Nur Sie können diesen Eintrag sehen und verwenden.`,
    'scopePublic': `Öffentlich`,
    'scopePublicDescription': `Alle, die Zugriff auf den gewählten Knoten oder dessen Unterbaum haben, können diesen Eintrag sehen und verwenden.`,
    'scopeSelectNode': `Knoten auswählen`,
    'scopeShared': `Per Link geteilt`,
    'scopeSharedDescription': `Nur Sie sehen diesen Eintrag in Ihren Listen. Alle, die Zugriff auf den gewählten Knoten oder dessen Unterbaum haben, können ihn über den Link öffnen.`,
    'scopeStoredAt': `Gespeichert unter`,
    'scopeVisibility': `Freigabe`,
    'scrollToTop': `Nach oben scrollen`,
    'search': `Suchen`,
    'searchLocations': `Standorte suchen...`,
    'searchUserOrTeam': `Nach Benutzer (oder Team) suchen...`,
    'searchUsersOrTeams': `Benutzer oder Teams suchen...`,
    'security': `Sicherheit`,
    'selectAll': `Alle auswählen`,
    'selectAssignee': `Zuweisen an...`,
    'selectClinic': `Klinik auswählen`,
    'selectLocation': `Standort auswählen`,
    'selectLocationDescription': `Bitte wählen Sie den zugewiesenen Standort für den Patienten aus.`,
    'selectOptions': `Auswahl Optionen`,
    'selectPosition': `Standort auswählen`,
    'selectRootLocation': `Stammstandort auswählen`,
    'selectRootLocationDescription': `Wählen Sie die Stammstandorte aus, die Ihren zugänglichen Bereich definieren. Es können nur Krankenhäuser, Praxen, Kliniken und Teams ausgewählt werden. Die Auswahl eines übergeordneten Standorts umfasst alle untergeordneten Standorte.`,
    'selectTeams': `Teams auswählen`,
    'sessionExpired': `Sitzung abgelaufen`,
    'sessionExpiredDescription': `Du wurdest aufgrund von Inaktivität abgemeldet. Bitte melde dich erneut an, um fortzufahren. Nicht gespeicherte Änderungen können verloren gehen.`,
    'settings': `Einstellungen`,
    'settingsDescription': `Hier kannst du die App Konfiguration ändern.`,
    'sex': `Geschlecht`,
    'shiftHandover': `Schichtübergabe`,
    'showAllTasks': `Alle Aufgaben anzeigen`,
    'showPatient': ({ name }): string => {
      return `Patient ${name} anzeigen`
    },
    'showTeamTasks': `Team-Aufgaben anzeigen`,
    'sorting': `Sortierung`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Mittel`,
        'P3': `Hoch`,
        'P4': `Kritisch`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Patient`,
        'task': `Aufgabe`,
        'other': `Undefinierter Subjekt Typ`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Multi-Auswahl`,
        'singleSelect': `Einzel-Auswahl`,
        'number': `Zahl`,
        'text': `Text`,
        'date': `Datum`,
        'dateTime': `Zeitpunkt`,
        'checkbox': `Checkbox`,
        'user': `Benutzer`,
        'other': `Undefinierter Typ`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Diese öffentliche Instanz von helpwave tasks ist für \\b{Entwicklungs- und Vorschauzwecke} gedacht. Bitte stellen Sie sicher, dass Sie \\b{ausschließlich nicht-vertrauliche Testdaten} eingeben. Diese Instanz kann \\negative{\\b{jederzeit gelöscht}} werden.`,
    'startRecording': `Aufnahme starten`,
    'stateUpdated': `Status aktualisiert`,
    'status': `Status`,
    'stopRecording': `Aufnahme stoppen`,
    'subjectType': `Subjekt Type`,
    'submissionDetails': `Übermittlungsdetails`,
    'submit': `Absenden`,
    'submittingAs': ({ name }): string => {
      return `Übermitteln als ${name}`
    },
    'surveyDescription': `Ihr Feedback ist wertvoll für uns. Bitte nehmen Sie sich einen Moment Zeit, um unsere Umfrage auszufüllen.`,
    'surveyTitle': `Helfen Sie uns, helpwave tasks zu verbessern`,
    'system': `System`,
    'task': `Aufgabe`,
    'taskFromPresetTooltip': `Aus einer Aufgaben-Vorlage`,
    'taskPresetAddRow': `Aufgabe hinzufügen`,
    'taskPresetApplyToRow': `In Vorlagenzeile übernehmen`,
    'taskPresetCreate': `Vorlage anlegen`,
    'taskPresetDelete': `Löschen`,
    'taskPresetDeleteConfirm': `Diese Aufgaben-Vorlage löschen?`,
    'taskPresetEdit': `Vorlage bearbeiten`,
    'taskPresetEditDetails': `Details bearbeiten`,
    'taskPresetEmptyList': `Noch keine Aufgaben-Vorlagen.`,
    'taskPresetKey': `Schlüssel`,
    'taskPresetKeyHint': `Optionaler eindeutiger Schlüssel. Leer lassen für automatische Vergabe.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `Keine Schätzung`,
    'taskPresetNoTasks': `Diese Vorlage enthält keine Aufgaben.`,
    'taskPresetRemoveRow': `Entfernen`,
    'taskPresets': `Vorlagen`,
    'taskPresetSave': `Vorlage speichern`,
    'taskPresetsDescription': `Wiederverwendbare Listen mit Abhängigkeiten.`,
    'taskPresetSelectPlaceholder': `Vorlage wählen`,
    'taskPresetSourceNotFound': `Vorlage konnte nicht geladen werden.`,
    'taskPresetSourceOpenSettings': `In den Einstellungen öffnen`,
    'taskPresetSourceTasksInGraph': `Aufgaben in der Vorlage`,
    'taskPresetSourceTitle': `Quell-Vorlage`,
    'tasks': `Aufgaben`,
    'tasksCreatedFromPreset': `Aufgaben erstellt`,
    'tasksUpdatedRecently': `Kürzlich aktualisierte Aufgaben`,
    'taskTitlePlaceholder': `Was muss erledigt werden?`,
    'teams': `Teams`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Dunkel`,
        'light': `Hell`,
        'system': `System`,
        'other': `System`,
      })
    },
    'timeEstimate': `Zeitschätzung`,
    'title': `Titel`,
    'totalPatients': `Gesamtpatienten`,
    'type': `Typ`,
    'updated': `Aktualisiert`,
    'url': `URL`,
    'user': `Benutzer`,
    'userInformation': `Benutzerinformationen`,
    'users': `Benutzer`,
    'viewAnyoneWithLinkCanView': `Jeder mit dem Link kann ansehen`,
    'viewDerivedPatientsHint': `Patienten, die in den Aufgaben dieses Schnellzugriffs vorkommen (eindeutig).`,
    'views': `Schnellzugriff`,
    'viewsEntityPatient': `Patienten`,
    'viewsEntityTask': `Aufgaben`,
    'viewSettings': `Schnellzugriff`,
    'viewSettingsDescription': `Gespeicherte Aufgaben- und Patienten-Schnellzugriffe verwalten.`,
    'viewVisibility': `Sichtbarkeit`,
    'viewVisibilityLinkShared': `Link geteilt`,
    'viewVisibilityPrivate': `Privat`,
    'waitingForPatient': `Warten auf Patient`,
    'waitPatient': `Patient auf Warteliste setzen`,
    'wards': `Stationen`,
    'weeklySurvey': `Wöchentliche Umfrage`,
    'yes': `Ja`
  },
  'el-GR': {
    'account': `Λογαριασμός`,
    'active': `Ενεργό`,
    'add': `Προσθήκη`,
    'addFastAccess': `Προσθήκη γρήγορης πρόσβασης`,
    'addFastAccessDescription': `Δώστε ένα όνομα στη νέα γρήγορη πρόσβαση.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Προσθήκη ασθενούς`,
    'addProperty': `Προσθήκη ιδιότητας`,
    'addTask': `Προσθήκη εργασίας`,
    'admitPatient': `Εισαγωγή ασθενούς`,
    'anonymous': `Ανώνυμα`,
    'anonymousSubmission': `Ανώνυμη υποβολή`,
    'archivedPropertyDescription': `Οι αρχειοθετημένες ιδιότητες δεν μπορούν πλέον να αντιστοιχιστούν σε αντικείμενα.`,
    'archiveProperty': `Αρχειοθέτηση ιδιότητας`,
    'assignedTo': `Ανατέθηκε σε`,
    'assigneeTeam': `Ομάδα ανάθεσης`,
    'authenticationFailed': `Αποτυχία ταυτοποίησης`,
    'birthdate': `Ημερομηνία γέννησης`,
    'cancel': `Ακύρωση`,
    'clear': `Εκκαθάριση`,
    'clearCache': `Εκκαθάριση προσωρινής μνήμης`,
    'clearPropertyColumnActionPatient': `Εκκαθάριση τιμών αυτής της ιδιότητας στους ασθενείς της λίστας`,
    'clearPropertyColumnActionTask': `Αφαίρεση αυτής της ιδιότητας από τις εργασίες της λίστας`,
    'clearPropertyColumnConfirmButtonPatient': `Εκκαθάριση τιμών ιδιότητας`,
    'clearPropertyColumnConfirmButtonTask': `Αφαίρεση ιδιότητας από εργασίες`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Θα εκκαθαριστούν όλες οι τιμές της ιδιότητας "${propertyName}" σε ${count} ασθενείς που είναι φορτωμένοι αυτή τη στιγμή σε αυτή τη λίστα. Η ιδιότητα παραμένει συνδεδεμένη με αυτούς τους ασθενείς. Οι ασθενείς που δεν έχουν φορτωθεί στη λίστα δεν επηρεάζονται.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `Η ιδιότητα "${propertyName}" θα αφαιρεθεί οριστικά από ${count} εργασίες που είναι φορτωμένες αυτή τη στιγμή σε αυτή τη λίστα. Οι εργασίες που δεν έχουν φορτωθεί στη λίστα δεν επηρεάζονται.`
    },
    'clearPropertyColumnDialogTitlePatient': `Εκκαθάριση τιμών ιδιότητας σε ασθενείς`,
    'clearPropertyColumnDialogTitleTask': `Αφαίρεση ιδιότητας από εργασίες`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Πληκτρολογήστε "${propertyName}" για επιβεβαίωση.`
    },
    'clinic': `Κλινική`,
    'clinics': `Κλινικές`,
    'clinicUpdated': `Η κλινική ενημερώθηκε`,
    'close': `Κλείσιμο`,
    'closedTasks': `Ολοκληρωμένες εργασίες`,
    'collapseAll': `Σύμπτυξη όλων`,
    'confirm': `Επιβεβαίωση`,
    'confirmDeleteView': `Διαγραφή αυτής της αποθηκευμένης γρήγορης πρόσβασης; Η ενέργεια δεν μπορεί να αναιρεθεί.`,
    'confirmSelection': `Επιβεβαίωση επιλογής`,
    'confirmShiftHandover': `Επιβεβαίωση παράδοσης βάρδιας`,
    'confirmShiftHandoverDescription': `Θέλετε σίγουρα να μεταφέρετε όλες τις ανοιχτές εργασίες στον επιλεγμένο χρήστη;`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Θέλετε σίγουρα να μεταφέρετε `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} ανοιχτή εργασία`,
        'other': `${taskCount} ανοιχτές εργασίες`,
      })
      _out += ` στον/στην ${name};`
      return _out
    },
    'conflictDetected': `Εντοπίστηκε διένεξη`,
    'connectionConnected': `Συνδέθηκε`,
    'connectionConnecting': `Σύνδεση…`,
    'connectionDisconnected': `Αποσυνδέθηκε`,
    'copyShareLink': `Αντιγραφή συνδέσμου`,
    'copyShareLinkEnableSharingFirst': `Ενεργοποιήστε την κοινοποίηση με σύνδεσμο, ώστε όσοι έχουν τον σύνδεσμο να μπορούν να ανοίξουν αυτή τη γρήγορη πρόσβαση.`,
    'copyViewToMyViews': `Αντιγραφή στη γρήγορη πρόσβασή μου`,
    'create': `Δημιουργία`,
    'createTask': `Δημιουργία εργασίας`,
    'creationDate': `Ημερομηνία δημιουργίας`,
    'currentTime': `Τρέχουσα ώρα`,
    'dashboard': `Πίνακας ελέγχου`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Καλό απόγευμα, ${name}!`
    },
    'dashboardWelcomeDescription': `Δείτε τι συμβαίνει σήμερα.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Καλησπέρα, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Καλημέρα, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Καληνύχτα, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Καλό μεσημέρι, ${name}!`
    },
    'delete': `Διαγραφή`,
    'deletePatient': `Διαγραφή ασθενούς`,
    'deletePatientConfirmation': `Θέλετε σίγουρα να διαγράψετε αυτόν τον ασθενή; Η ενέργεια δεν μπορεί να αναιρεθεί.`,
    'description': `Περιγραφή`,
    'descriptionPlaceholder': `Προσθέστε περισσότερες λεπτομέρειες...`,
    'deselectAll': `Αποεπιλογή όλων`,
    'developmentAndPreviewInstance': `Περιβάλλον ανάπτυξης και προεπισκόπησης`,
    'discard': `Απόρριψη`,
    'discardDraftMessage': `Υπάρχουν μη αποθηκευμένες καταχωρίσεις. Αν κλείσετε τώρα, όλα όσα εισαγάγατε θα χαθούν.`,
    'discardDraftTitle': `Απόρριψη πρόχειρου;`,
    'discardViewChanges': `Απόρριψη αλλαγών`,
    'dischargePatient': `Έξοδος ασθενούς`,
    'dischargePatientConfirmation': `Θέλετε σίγουρα να δώσετε εξιτήριο σε αυτόν τον ασθενή; Η ενέργεια θα αλλάξει την κατάσταση του ασθενούς.`,
    'dismiss': `Απόρριψη`,
    'dismissAll': `Απόρριψη όλων`,
    'diverse': `Άλλο`,
    'done': `Ολοκληρώθηκε`,
    'dueDate': `Προθεσμία`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} ημέρα`,
        'other': `${days} ημέρες`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} ώρα`,
        'other': `${hours} ώρες`,
      })
      return _out
    },
    'dueDateNow': `Τώρα`,
    'dueDateToday': `Σήμερα`,
    'dueDateTomorrow': `Αύριο`,
    'duplicate': `Αντιγραφή`,
    'edit': `Επεξεργασία`,
    'editPatient': `Επεξεργασία ασθενούς`,
    'editPresetTask': `Επεξεργασία εργασίας προτύπου`,
    'editTask': `Επεξεργασία εργασίας`,
    'enterFeedback': `Γράψτε τα σχόλιά σας εδώ...`,
    'error': `Σφάλμα`,
    'errorOccurred': `Παρουσιάστηκε σφάλμα`,
    'estimatedTime': `Εκτιμώμενος χρόνος (λεπτά)`,
    'expandAll': `Ανάπτυξη όλων`,
    'export': `Εξαγωγή`,
    'exportCsv': `Εξαγωγή ως CSV`,
    'exportExcel': `Εξαγωγή ως Excel (για εκτύπωση)`,
    'exportFailed': `Η εξαγωγή απέτυχε. Δοκιμάστε ξανά.`,
    'feedback': `Σχόλια`,
    'feedbackDescription': `Μοιραστείτε τα σχόλιά σας, αναφέρετε σφάλματα ή προτείνετε βελτιώσεις.`,
    'female': `Γυναίκα`,
    'filter': `Φίλτρο`,
    'filterAll': `Όλα`,
    'filterUndone': `Εκκρεμή`,
    'firstName': `Όνομα`,
    'freeBeds': `Ελεύθερες κλίνες`,
    'hide': `Απόκρυψη`,
    'homePage': `Αρχική σελίδα`,
    'imprint': `Στοιχεία εκδότη`,
    'inactive': `Ανενεργό`,
    'install': `Εγκατάσταση`,
    'installApp': `Εγκατάσταση εφαρμογής`,
    'installAppDescription': `Εγκαταστήστε το helpwave tasks για καλύτερη εμπειρία με υποστήριξη εκτός σύνδεσης και ταχύτερη πρόσβαση.`,
    'language': `Γλώσσα`,
    'lastName': `Επώνυμο`,
    'listViewCard': `Προβολή καρτών`,
    'listViewTable': `Προβολή πίνακα`,
    'loading': `Φόρτωση...`,
    'loadingAlmostThere': `Σχεδόν έτοιμο...`,
    'loadingGettingReady': `Μια στιγμή — γίνεται προετοιμασία...`,
    'loadingHangOn': `Μια στιγμή — φορτώνονται τα πιο πρόσφατα δεδομένα...`,
    'loadingMoment': `Ένα δευτερόλεπτο, σχεδόν έτοιμο...`,
    'loadMore': `Φόρτωση περισσότερων`,
    'loadTaskPreset': `Φόρτωση προτύπου`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Δημιουργία `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} εργασίας`,
        'other': `${count} εργασιών`,
      })
      _out += ` για αυτόν τον ασθενή;`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Επιβεβαίωση φόρτωσης προτύπου`,
    'loadTaskPresetCreateAndAssign': `Δημιουργία & ανάθεση σε εμένα`,
    'loadTaskPresetSelectTasks': `Εργασίες από το πρότυπο`,
    'loadTaskPresetTaskLabel': `Πρότυπο`,
    'loadTaskPresetTitle': `Φόρτωση προτύπου εργασιών`,
    'location': `Τοποθεσία`,
    'locationBed': `Κλίνη`,
    'locationClinic': `Κλινική`,
    'locationRoom': `Θάλαμος`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Κλινική`,
        'WARD': `Πτέρυγα`,
        'TEAM': `Ομάδα`,
        'ROOM': `Θάλαμος`,
        'BED': `Κλίνη`,
        'other': `Άλλο`,
      })
    },
    'locationWard': `Πτέρυγα`,
    'login': `Σύνδεση`,
    'logInAgain': `Σύνδεση ξανά`,
    'loginRequired': `Απαιτείται σύνδεση`,
    'loginRequiredDescription': `Για να χρησιμοποιήσετε αυτή τη σελίδα πρέπει να είστε συνδεδεμένοι.`,
    'logout': `Αποσύνδεση`,
    'male': `Άνδρας`,
    'markPatientDead': `Σήμανση ασθενούς ως αποβιώσαντος`,
    'markPatientDeadConfirmation': `Θέλετε σίγουρα να σημάνετε αυτόν τον ασθενή ως αποβιώσαντα;`,
    'menu': `Μενού`,
    'more': `Περισσότερα`,
    'myFavorites': `Τα αγαπημένα μου`,
    'myOpenTasks': `Οι ανοιχτές εργασίες μου`,
    'myTasks': `Οι εργασίες μου`,
    'name': `Όνομα`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} φίλτρο`,
        'other': `${count} φίλτρα`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} λεπ.`
    },
    'no': `Όχι`,
    'noClosedTasks': `Δεν υπάρχουν ολοκληρωμένες εργασίες`,
    'noLocationsFound': `Δεν βρέθηκαν τοποθεσίες`,
    'none': `Κανένα`,
    'noNotifications': `Δεν υπάρχουν πρόσφατες ενημερώσεις`,
    'noOpenTasks': `Δεν υπάρχουν ανοιχτές εργασίες`,
    'noPatient': `Χωρίς ασθενή`,
    'noPatientsInTaskView': `Δεν βρέθηκαν ασθενείς για αυτή τη γρήγορη πρόσβαση εργασιών.`,
    'noResultsFound': `Δεν βρέθηκαν αποτελέσματα`,
    'notAssigned': `Χωρίς ανάθεση`,
    'notifications': `Ειδοποιήσεις`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} ασθενής`,
        'other': `${count} ασθενείς`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} ταξινόμηση`,
        'other': `${count} ταξινομήσεις`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} εργασία`,
        'other': `${count} εργασίες`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 έτη`,
        '=1': `1 έτος`,
        'other': `${years} έτη`,
      })
    },
    'occupancy': `Πληρότητα`,
    'ok': `OK`,
    'onboardingSurvey': `Έρευνα εισαγωγής`,
    'openSurvey': `Άνοιγμα έρευνας`,
    'openTasks': `Ανοιχτές εργασίες`,
    'openView': `Άνοιγμα`,
    'option': `Επιλογή`,
    'organizations': `Οργανισμοί`,
    'overview': `Επισκόπηση`,
    'pages.404.loading': `Φόρτωση...`,
    'pages.404.notFound': `404 - Η σελίδα δεν βρέθηκε`,
    'pages.404.notFoundDescription1': `Αυτή σίγουρα δεν είναι η σελίδα που αναζητάτε`,
    'pages.404.notFoundDescription2': `Επιστροφή στην`,
    'patient': `Ασθενής`,
    'patientActions': `Ενέργειες ασθενούς`,
    'patientData': `Δεδομένα`,
    'patients': `Ασθενείς`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Εισηγμένοι ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Σύνολο ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Σε αναμονή ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Σε αναμονή`,
        'ADMITTED': `Εισηγμένος`,
        'DISCHARGED': `Εξιτήριο`,
        'DEAD': `Απεβίωσε`,
        'other': `Άγνωστο`,
      })
    },
    'patientsUpdatedRecently': `Πρόσφατα ενημερωμένοι ασθενείς`,
    'pickClinic': `Επιλέξτε κλινική`,
    'pickClinicDescription': `Επιλέξτε την κλινική για αυτόν τον ασθενή. Μπορούν να επιλεγούν μόνο τοποθεσίες τύπου κλινικής.`,
    'pickPosition': `Επιλέξτε τοποθεσία`,
    'pickPositionDescription': `Επιλέξτε την τοποθεσία για αυτόν τον ασθενή. Μπορείτε να επιλέξετε νοσοκομείο, ιατρείο, κλινική, πτέρυγα, κλίνη ή θάλαμο.`,
    'pickTeams': `Επιλέξτε ομάδες`,
    'pickTeamsDescription': `Επιλέξτε μία ή περισσότερες ομάδες για αυτόν τον ασθενή. Μπορείτε να επιλέξετε κλινική, ομάδα, ιατρείο ή νοσοκομείο.`,
    'position': `Τοποθεσία`,
    'positionUpdated': `Η τοποθεσία ενημερώθηκε`,
    'preferences': `Προτιμήσεις`,
    'priority': `Προτεραιότητα`,
    'priorityLabel': `Προτεραιότητα`,
    'priorityNone': `Καμία`,
    'privacy': `Απόρρητο`,
    'properties': `Ιδιότητες`,
    'propertiesSettingsDescription': `Προσαρμοσμένα πεδία για εργασίες και ασθενείς: ορίστε τύπους και χρησιμοποιήστε τα σε φίλτρα.`,
    'property': `Ιδιότητα`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Θέμα`,
        'other': `Θέματα`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Προσθήκη ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Σύνολο ${value}`
    },
    'readOnlyView': `Μόνο ανάγνωση`,
    'recentPatients': `Οι πρόσφατοι ασθενείς σας`,
    'recentTasks': `Οι πρόσφατες εργασίες σας`,
    'rEdit': ({ name }): string => {
      return `Ενημέρωση ${name}`
    },
    'refreshing': `Ανανέωση…`,
    'removeProperty': `Αφαίρεση ιδιότητας`,
    'removePropertyConfirmation': `Θέλετε σίγουρα να αφαιρέσετε αυτή την ιδιότητα; Η ενέργεια δεν μπορεί να αναιρεθεί.`,
    'retakeSurvey': `Επανάληψη έρευνας`,
    'rShow': ({ name }): string => {
      return `Εμφάνιση ${name}`
    },
    'savedViews': `Γρήγορη πρόσβαση`,
    'saveView': `Αποθήκευση γρήγορης πρόσβασης`,
    'saveViewAsNew': `Αποθήκευση ως νέα γρήγορη πρόσβαση`,
    'saveViewDescription': `Δώστε όνομα σε αυτή τη γρήγορη πρόσβαση. Αποθηκεύονται τα φίλτρα, η ταξινόμηση, η αναζήτηση και η τοποθεσία.`,
    'saveViewDescriptionFromSystemList': `Δημιουργεί μια νέα γρήγορη πρόσβαση από αυτή τη διάταξη. Η σελίδα αυτή ορίζεται από την εφαρμογή και δεν αντικαθίσταται — ανοίξτε τη γρήγορη πρόσβαση από την πλαϊνή στήλη όταν τη χρειάζεστε.`,
    'saveViewOverwriteCurrent': `Αντικατάσταση τρέχουσας γρήγορης πρόσβασης`,
    'scopeChangeNode': `Αλλαγή κόμβου`,
    'scopeNoNodeSelected': `Επιλέξτε τον κόμβο στον οποίο αποθηκεύεται αυτή η καταχώριση.`,
    'scopePrivate': `Ιδιωτικό`,
    'scopePrivateDescription': `Μόνο εσείς μπορείτε να δείτε και να χρησιμοποιήσετε αυτή την καταχώριση.`,
    'scopePublic': `Δημόσιο`,
    'scopePublicDescription': `Όποιος έχει πρόσβαση στον επιλεγμένο κόμβο ή στο υποδέντρο του μπορεί να δει και να χρησιμοποιήσει αυτή την καταχώριση.`,
    'scopeSelectNode': `Επιλογή κόμβου`,
    'scopeShared': `Κοινοποίηση με σύνδεσμο`,
    'scopeSharedDescription': `Μόνο εσείς βλέπετε αυτή την καταχώριση στις λίστες σας. Όποιος έχει πρόσβαση στον επιλεγμένο κόμβο ή στο υποδέντρο του μπορεί να την ανοίξει μέσω του συνδέσμου της.`,
    'scopeStoredAt': `Αποθηκεύεται σε`,
    'scopeVisibility': `Κοινοποίηση`,
    'scrollToTop': `Μετάβαση στην κορυφή`,
    'search': `Αναζήτηση`,
    'searchLocations': `Αναζήτηση τοποθεσιών...`,
    'searchUserOrTeam': `Αναζήτηση χρήστη (ή ομάδας)...`,
    'searchUsersOrTeams': `Αναζήτηση χρηστών ή ομάδων...`,
    'security': `Ασφάλεια`,
    'selectAll': `Επιλογή όλων`,
    'selectAssignee': `Ανάθεση σε...`,
    'selectClinic': `Επιλογή κλινικής`,
    'selectLocation': `Επιλογή τοποθεσίας`,
    'selectLocationDescription': `Επιλέξτε την τοποθεσία που έχει αντιστοιχιστεί στον ασθενή.`,
    'selectOptions': `Επιλογή επιλογών`,
    'selectPosition': `Επιλογή τοποθεσίας`,
    'selectRootLocation': `Επιλογή κύριας τοποθεσίας`,
    'selectRootLocationDescription': `Επιλέξτε τις κύριες τοποθεσίες που ορίζουν το εύρος πρόσβασής σας. Μπορούν να επιλεγούν μόνο νοσοκομεία, ιατρεία, κλινικές και ομάδες. Η επιλογή μιας γονικής τοποθεσίας περιλαμβάνει όλες τις υποκείμενες.`,
    'selectTeams': `Επιλογή ομάδων`,
    'sessionExpired': `Η συνεδρία έληξε`,
    'sessionExpiredDescription': `Αποσυνδεθήκατε λόγω αδράνειας. Συνδεθείτε ξανά για να συνεχίσετε. Τυχόν μη αποθηκευμένες αλλαγές ενδέχεται να χαθούν.`,
    'settings': `Ρυθμίσεις`,
    'settingsDescription': `Εδώ μπορείτε να αλλάξετε τις ρυθμίσεις της εφαρμογής.`,
    'sex': `Φύλο`,
    'shiftHandover': `Παράδοση βάρδιας`,
    'showAllTasks': `Εμφάνιση όλων των εργασιών`,
    'showPatient': ({ name }): string => {
      return `Εμφάνιση ασθενούς ${name}`
    },
    'showTeamTasks': `Εμφάνιση εργασιών ομάδας`,
    'sorting': `Ταξινόμηση`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Κανονική`,
        'P2': `Μέτρια`,
        'P3': `Υψηλή`,
        'P4': `Κρίσιμη`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Ασθενής`,
        'task': `Εργασία`,
        'other': `Μη ορισμένος τύπος αντικειμένου`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Πολλαπλή επιλογή`,
        'singleSelect': `Μονή επιλογή`,
        'number': `Αριθμός`,
        'text': `Κείμενο`,
        'date': `Ημερομηνία`,
        'dateTime': `Χρονικό σημείο`,
        'checkbox': `Πλαίσιο ελέγχου`,
        'user': `Χρήστης`,
        'other': `Μη ορισμένος τύπος`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Αυτό το δημόσιο περιβάλλον του helpwave tasks προορίζεται για \\b{σκοπούς ανάπτυξης και προεπισκόπησης}. Βεβαιωθείτε ότι εισάγετε \\b{μόνο} \\b{μη εμπιστευτικά δεδομένα δοκιμών}. Αυτό το περιβάλλον μπορεί να \\negative{\\b{διαγραφεί ανά πάσα στιγμή}}`,
    'startRecording': `Έναρξη εγγραφής`,
    'stateUpdated': `Η κατάσταση ενημερώθηκε`,
    'status': `Κατάσταση`,
    'stopRecording': `Διακοπή εγγραφής`,
    'subjectType': `Τύπος αντικειμένου`,
    'submissionDetails': `Στοιχεία υποβολής`,
    'submit': `Υποβολή`,
    'submittingAs': ({ name }): string => {
      return `Υποβολή ως ${name}`
    },
    'surveyDescription': `Τα σχόλιά σας είναι πολύτιμα για εμάς. Αφιερώστε λίγο χρόνο για να συμπληρώσετε την έρευνά μας.`,
    'surveyTitle': `Βοηθήστε μας να βελτιώσουμε το helpwave tasks`,
    'system': `Σύστημα`,
    'task': `Εργασία`,
    'taskFromPresetTooltip': `Δημιουργήθηκε από πρότυπο εργασιών`,
    'taskPresetAddRow': `Προσθήκη εργασίας`,
    'taskPresetApplyToRow': `Εφαρμογή στη γραμμή προτύπου`,
    'taskPresetCreate': `Δημιουργία προτύπου`,
    'taskPresetDelete': `Διαγραφή`,
    'taskPresetDeleteConfirm': `Διαγραφή αυτού του προτύπου εργασιών;`,
    'taskPresetEdit': `Επεξεργασία προτύπου`,
    'taskPresetEditDetails': `Επεξεργασία στοιχείων`,
    'taskPresetEmptyList': `Δεν υπάρχουν ακόμη πρότυπα εργασιών.`,
    'taskPresetKey': `Κλειδί`,
    'taskPresetKeyHint': `Προαιρετικό μοναδικό κλειδί για αναζήτηση. Αφήστε το κενό για αυτόματη δημιουργία.`,
    'taskPresetName': `Όνομα`,
    'taskPresetNoEstimate': `Χωρίς εκτίμηση`,
    'taskPresetNoTasks': `Αυτό το πρότυπο δεν περιέχει εργασίες.`,
    'taskPresetRemoveRow': `Αφαίρεση`,
    'taskPresets': `Πρότυπα`,
    'taskPresetSave': `Αποθήκευση προτύπου`,
    'taskPresetsDescription': `Επαναχρησιμοποιήσιμες λίστες εργασιών με προαιρετικές εξαρτήσεις.`,
    'taskPresetSelectPlaceholder': `Επιλέξτε πρότυπο`,
    'taskPresetSourceNotFound': `Δεν ήταν δυνατή η φόρτωση του προτύπου.`,
    'taskPresetSourceOpenSettings': `Άνοιγμα στις ρυθμίσεις`,
    'taskPresetSourceTasksInGraph': `Εργασίες στο πρότυπο`,
    'taskPresetSourceTitle': `Πρότυπο προέλευσης`,
    'tasks': `Εργασίες`,
    'tasksCreatedFromPreset': `Οι εργασίες δημιουργήθηκαν`,
    'tasksUpdatedRecently': `Πρόσφατα ενημερωμένες εργασίες`,
    'taskTitlePlaceholder': `Τι πρέπει να γίνει;`,
    'teams': `Ομάδες`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Σκούρο`,
        'light': `Φωτεινό`,
        'system': `Σύστημα`,
        'other': `Σύστημα`,
      })
    },
    'timeEstimate': `Εκτίμηση χρόνου`,
    'title': `Τίτλος`,
    'totalPatients': `Σύνολο ασθενών`,
    'type': `Τύπος`,
    'updated': `Ενημερώθηκε`,
    'url': `URL`,
    'user': `Χρήστης`,
    'userInformation': `Στοιχεία χρήστη`,
    'users': `Χρήστες`,
    'viewAnyoneWithLinkCanView': `Όποιος έχει τον σύνδεσμο μπορεί να δει`,
    'viewDerivedPatientsHint': `Ασθενείς που εμφανίζονται σε εργασίες αυτής της γρήγορης πρόσβασης (χωρίς διπλότυπα).`,
    'views': `Γρήγορη πρόσβαση`,
    'viewsEntityPatient': `Ασθενείς`,
    'viewsEntityTask': `Εργασίες`,
    'viewSettings': `Γρήγορη πρόσβαση`,
    'viewSettingsDescription': `Διαχείριση αποθηκευμένων γρήγορων προσβάσεων εργασιών και ασθενών.`,
    'viewVisibility': `Ορατότητα`,
    'viewVisibilityLinkShared': `Κοινοποίηση με σύνδεσμο`,
    'viewVisibilityPrivate': `Ιδιωτική`,
    'waitingForPatient': `Αναμονή ασθενούς`,
    'waitPatient': `Ορισμός ασθενούς σε αναμονή`,
    'wards': `Πτέρυγες`,
    'weeklySurvey': `Εβδομαδιαία έρευνα`,
    'yes': `Ναι`
  },
  'en-US': {
    'account': `Account`,
    'active': `Active`,
    'add': `Add`,
    'addFastAccess': `Add Fast Access`,
    'addFastAccessDescription': `Add a name for the new fast access.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Add Patient`,
    'addProperty': `Add Property`,
    'addTask': `Add Task`,
    'admitPatient': `Admit Patient`,
    'anonymous': `Anonymous`,
    'anonymousSubmission': `Anonymous Submission`,
    'archivedPropertyDescription': `Archived Properties can no longer be assigned to objects.`,
    'archiveProperty': `Archive Property`,
    'assignedTo': `Assigned to`,
    'assigneeTeam': `Assignee team`,
    'authenticationFailed': `Authentication Failed`,
    'birthdate': `Birthdate`,
    'cancel': `Cancel`,
    'clear': `Clear`,
    'clearCache': `Clear Cache`,
    'clearPropertyColumnActionPatient': `Clear values for this property on listed patients`,
    'clearPropertyColumnActionTask': `Remove this property from listed tasks`,
    'clearPropertyColumnConfirmButtonPatient': `Clear property values`,
    'clearPropertyColumnConfirmButtonTask': `Remove property from tasks`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `This will clear all values for the property "${propertyName}" on ${count} patients currently loaded in this list. The property stays attached to those patients. Patients not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `This will permanently remove the property "${propertyName}" from ${count} tasks currently loaded in this list. Tasks not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogTitlePatient': `Clear property values on patients`,
    'clearPropertyColumnDialogTitleTask': `Remove property from tasks`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Type "${propertyName}" to confirm.`
    },
    'clinic': `Clinic`,
    'clinics': `Clinics`,
    'clinicUpdated': `Clinic updated`,
    'close': `Close`,
    'closedTasks': `Closed Tasks`,
    'collapseAll': `Collapse All`,
    'confirm': `Confirm`,
    'confirmDeleteView': `Delete this saved quick access? This cannot be undone.`,
    'confirmSelection': `Confirm Selection`,
    'confirmShiftHandover': `Confirm Shift Handover`,
    'confirmShiftHandoverDescription': `Are you sure you want to transfer all open tasks to the selected user?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Are you sure you want to transfer `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} open task`,
        'other': `${taskCount} open tasks`,
      })
      _out += ` to ${name}?`
      return _out
    },
    'conflictDetected': `Conflict Detected`,
    'connectionConnected': `Connected`,
    'connectionConnecting': `Connecting…`,
    'connectionDisconnected': `Disconnected`,
    'copyShareLink': `Copy link`,
    'copyShareLinkEnableSharingFirst': `Turn on link sharing so others with the link can open this quick access.`,
    'copyViewToMyViews': `Copy to my quick access`,
    'create': `Create`,
    'createTask': `Create Task`,
    'creationDate': `Creation date`,
    'currentTime': `Current Time`,
    'dashboard': `Dashboard`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Good Afternoon, ${name}!`
    },
    'dashboardWelcomeDescription': `Here is what is happening today.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Good Evening, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Good Morning, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Good Night, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Good Afternoon, ${name}!`
    },
    'delete': `Delete`,
    'deletePatient': `Delete Patient`,
    'deletePatientConfirmation': `Are you sure you want to delete this patient? This action cannot be undone.`,
    'description': `Description`,
    'descriptionPlaceholder': `Add more details...`,
    'deselectAll': `Deselect All`,
    'developmentAndPreviewInstance': `Development and preview instance`,
    'discard': `Discard`,
    'discardDraftMessage': `You have unsaved entries. If you close now, everything you entered will be lost.`,
    'discardDraftTitle': `Discard draft?`,
    'discardViewChanges': `Discard changes`,
    'dischargePatient': `Discharge Patient`,
    'dischargePatientConfirmation': `Are you sure you want to discharge this patient? This action will change the patient state.`,
    'dismiss': `Dismiss`,
    'dismissAll': `Dismiss All`,
    'diverse': `Diverse`,
    'done': `Done`,
    'dueDate': `Due Date`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} day`,
        'other': `${days} days`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} hour`,
        'other': `${hours} hours`,
      })
      return _out
    },
    'dueDateNow': `Now`,
    'dueDateToday': `Today`,
    'dueDateTomorrow': `Tomorrow`,
    'duplicate': `Duplicate`,
    'edit': `Edit`,
    'editPatient': `Edit Patient`,
    'editPresetTask': `Edit Preset Task`,
    'editTask': `Edit Task`,
    'enterFeedback': `Enter your feedback here...`,
    'error': `Error`,
    'errorOccurred': `An error occurred`,
    'estimatedTime': `Estimated Time (minutes)`,
    'expandAll': `Expand All`,
    'export': `Export`,
    'exportCsv': `Export as CSV`,
    'exportExcel': `Export as Excel (printable)`,
    'exportFailed': `Export failed. Please try again.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Share your feedback, report bugs, or suggest improvements.`,
    'female': `Female`,
    'filter': `Filter`,
    'filterAll': `All`,
    'filterUndone': `Undone`,
    'firstName': `First Name`,
    'freeBeds': `Free Beds`,
    'hide': `Hide`,
    'homePage': `Home Page`,
    'imprint': `Imprint`,
    'inactive': `Inactive`,
    'install': `Install`,
    'installApp': `Install App`,
    'installAppDescription': `Install helpwave tasks for a better experience with offline support and faster access.`,
    'language': `Language`,
    'lastName': `Last Name`,
    'listViewCard': `Card view`,
    'listViewTable': `Table view`,
    'loading': `Loading...`,
    'loadingAlmostThere': `Almost ready...`,
    'loadingGettingReady': `One moment — getting things ready...`,
    'loadingHangOn': `Hang on — fetching the latest data...`,
    'loadingMoment': `Just a second, almost there...`,
    'loadMore': `Load more`,
    'loadTaskPreset': `Load preset`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Create `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} task`,
        'other': `${count} tasks`,
      })
      _out += ` for this patient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirm loading preset`,
    'loadTaskPresetCreateAndAssign': `Create & assign to me`,
    'loadTaskPresetSelectTasks': `Tasks from preset`,
    'loadTaskPresetTaskLabel': `Preset`,
    'loadTaskPresetTitle': `Load task preset`,
    'location': `Location`,
    'locationBed': `Bed`,
    'locationClinic': `Clinic`,
    'locationRoom': `Room`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clinic`,
        'WARD': `Ward`,
        'TEAM': `Team`,
        'ROOM': `Room`,
        'BED': `Bed`,
        'other': `Other`,
      })
    },
    'locationWard': `Ward`,
    'login': `Login`,
    'logInAgain': `Log in again`,
    'loginRequired': `Login required`,
    'loginRequiredDescription': `To use this site you need to be logged in.`,
    'logout': `Logout`,
    'male': `Male`,
    'markPatientDead': `Mark Patient Dead`,
    'markPatientDeadConfirmation': `Are you sure you want to mark this patient as dead?`,
    'menu': `Menu`,
    'more': `More`,
    'myFavorites': `My Favorites`,
    'myOpenTasks': `My Open Tasks`,
    'myTasks': `My tasks`,
    'name': `Name`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filter`,
        'other': `${count} filters`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `No`,
    'noClosedTasks': `No closed tasks`,
    'noLocationsFound': `No locations found`,
    'none': `None`,
    'noNotifications': `No recent updates`,
    'noOpenTasks': `No open tasks`,
    'noPatient': `No Patient`,
    'noPatientsInTaskView': `No patients found for this task quick access.`,
    'noResultsFound': `No results found`,
    'notAssigned': `Not assigned`,
    'notifications': `Notifications`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patients`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sort`,
        'other': `${count} sorts`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Task`,
        'other': `${count} Tasks`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 years`,
        '=1': `1 year`,
        'other': `${years} years`,
      })
    },
    'occupancy': `Occupancy`,
    'ok': `OK`,
    'onboardingSurvey': `Onboarding Survey`,
    'openSurvey': `Open Survey`,
    'openTasks': `Open Tasks`,
    'openView': `Open`,
    'option': `Option`,
    'organizations': `Organizations`,
    'overview': `Overview`,
    'pages.404.loading': `Loading...`,
    'pages.404.notFound': `404 - Page not found`,
    'pages.404.notFoundDescription1': `This is definitely not the page you're looking for`,
    'pages.404.notFoundDescription2': `Let me take you to the`,
    'patient': `Patient`,
    'patientActions': `Patient Actions`,
    'patientData': `Data`,
    'patients': `Patients`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Admitted ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Total ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Waiting ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Waiting`,
        'ADMITTED': `Admitted`,
        'DISCHARGED': `Discharged`,
        'DEAD': `Dead`,
        'other': `Unknown`,
      })
    },
    'patientsUpdatedRecently': `Patients updated recently`,
    'pickClinic': `Pick the clinic`,
    'pickClinicDescription': `Select the clinic for this patient. Only clinic locations can be selected.`,
    'pickPosition': `Pick the location`,
    'pickPositionDescription': `Select the location for this patient. You can select hospital, practice, clinic, ward, bed, or room locations.`,
    'pickTeams': `Pick teams`,
    'pickTeamsDescription': `Select one or more teams for this patient. You can select clinic, team, practice, or hospital locations.`,
    'position': `Location`,
    'positionUpdated': `Location updated`,
    'preferences': `Preferences`,
    'priority': `Priority`,
    'priorityLabel': `Priority`,
    'priorityNone': `None`,
    'privacy': `Privacy`,
    'properties': `Properties`,
    'propertiesSettingsDescription': `Custom fields for tasks and patients: define types and use them in filters.`,
    'property': `Property`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Theme`,
        'other': `Themes`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Add ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Total ${value}`
    },
    'readOnlyView': `Read-only`,
    'recentPatients': `Your Recent Patients`,
    'recentTasks': `Your Recent Tasks`,
    'rEdit': ({ name }): string => {
      return `Update ${name}`
    },
    'refreshing': `Refreshing…`,
    'removeProperty': `Remove Property`,
    'removePropertyConfirmation': `Are you sure you want to remove this property? This action cannot be undone.`,
    'retakeSurvey': `Retake Survey`,
    'rShow': ({ name }): string => {
      return `Show ${name}`
    },
    'savedViews': `Quick access`,
    'saveView': `Save quick access`,
    'saveViewAsNew': `Save as new quick access`,
    'saveViewDescription': `Name this quick access. Filters, sorting, search, and location are stored.`,
    'saveViewDescriptionFromSystemList': `Creates a new quick access entry from this layout. This page is fixed by the app and is not saved in place — open it from the sidebar when you need it.`,
    'saveViewOverwriteCurrent': `Overwrite current quick access`,
    'scopeChangeNode': `Change node`,
    'scopeNoNodeSelected': `Select the node this entry is stored at.`,
    'scopePrivate': `Private`,
    'scopePrivateDescription': `Only you can see and use this entry.`,
    'scopePublic': `Public`,
    'scopePublicDescription': `Everyone who can access the selected node or its subtree can see and use this entry.`,
    'scopeSelectNode': `Select node`,
    'scopeShared': `Shared via link`,
    'scopeSharedDescription': `Only you see this entry in your lists. Everyone who can access the selected node or its subtree can open it via its link.`,
    'scopeStoredAt': `Stored at`,
    'scopeVisibility': `Sharing`,
    'scrollToTop': `Scroll to top`,
    'search': `Search`,
    'searchLocations': `Search locations...`,
    'searchUserOrTeam': `Search for user (or team)...`,
    'searchUsersOrTeams': `Search users or teams...`,
    'security': `Security`,
    'selectAll': `Select All`,
    'selectAssignee': `Assign to...`,
    'selectClinic': `Select Clinic`,
    'selectLocation': `Select Location`,
    'selectLocationDescription': `Please select the assigned location for the patient.`,
    'selectOptions': `Select Options`,
    'selectPosition': `Select Location`,
    'selectRootLocation': `Select Root Location`,
    'selectRootLocationDescription': `Select the root locations that define your accessible scope. Only hospitals, practices, clinics, and teams can be selected. Selecting a parent location includes all its children.`,
    'selectTeams': `Select Teams`,
    'sessionExpired': `Session expired`,
    'sessionExpiredDescription': `You have been logged out due to inactivity. Please log in again to continue. Any unsaved changes may be lost.`,
    'settings': `Settings`,
    'settingsDescription': `Here you can change the app configuration.`,
    'sex': `Sex`,
    'shiftHandover': `Shift Handover`,
    'showAllTasks': `Show All Tasks`,
    'showPatient': ({ name }): string => {
      return `Show patient ${name}`
    },
    'showTeamTasks': `Show Team Tasks`,
    'sorting': `Sorting`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Medium`,
        'P3': `High`,
        'P4': `Critical`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Patient`,
        'task': `Task`,
        'other': `Undefined Subject Type`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Multi-Select`,
        'singleSelect': `Single-Select`,
        'number': `Number`,
        'text': `Text`,
        'date': `Date`,
        'dateTime': `Timepoint`,
        'checkbox': `Checkbox`,
        'user': `User`,
        'other': `Undefined Type`,
      })
    },
    'stagingModalDisclaimerMarkdown': `This public instance of helpwave tasks is for \\b{development and preview purposes}. Please make sure to \\b{only} enter \\b{non-confidential testing data}. This instance can be \\negative{\\b{deleted at any time}}`,
    'startRecording': `Start Recording`,
    'stateUpdated': `State updated`,
    'status': `Status`,
    'stopRecording': `Stop Recording`,
    'subjectType': `Subject Type`,
    'submissionDetails': `Submission Details`,
    'submit': `Submit`,
    'submittingAs': ({ name }): string => {
      return `Submitting as ${name}`
    },
    'surveyDescription': `Your feedback is valuable to us. Please take a moment to complete our survey.`,
    'surveyTitle': `Help us to improve helpwave tasks`,
    'system': `System`,
    'task': `Task`,
    'taskFromPresetTooltip': `Created from a task preset`,
    'taskPresetAddRow': `Add task`,
    'taskPresetApplyToRow': `Apply to preset row`,
    'taskPresetCreate': `Create preset`,
    'taskPresetDelete': `Delete`,
    'taskPresetDeleteConfirm': `Delete this task preset?`,
    'taskPresetEdit': `Edit Preset`,
    'taskPresetEditDetails': `Edit details`,
    'taskPresetEmptyList': `No task presets yet.`,
    'taskPresetKey': `Key`,
    'taskPresetKeyHint': `Optional unique key for lookups. Leave empty to generate automatically.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `No estimate`,
    'taskPresetNoTasks': `This preset has no tasks.`,
    'taskPresetRemoveRow': `Remove`,
    'taskPresets': `Presets`,
    'taskPresetSave': `Save preset`,
    'taskPresetsDescription': `Reusable task lists with optional dependencies.`,
    'taskPresetSelectPlaceholder': `Select a preset`,
    'taskPresetSourceNotFound': `Preset could not be loaded.`,
    'taskPresetSourceOpenSettings': `Open in settings`,
    'taskPresetSourceTasksInGraph': `Tasks in template`,
    'taskPresetSourceTitle': `Source preset`,
    'tasks': `Tasks`,
    'tasksCreatedFromPreset': `Tasks created`,
    'tasksUpdatedRecently': `Tasks updated recently`,
    'taskTitlePlaceholder': `What needs to be done?`,
    'teams': `Teams`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Dark`,
        'light': `Light`,
        'system': `System`,
        'other': `System`,
      })
    },
    'timeEstimate': `Time Estimate`,
    'title': `Title`,
    'totalPatients': `Total Patients`,
    'type': `Type`,
    'updated': `Updated`,
    'url': `URL`,
    'user': `User`,
    'userInformation': `User Information`,
    'users': `Users`,
    'viewAnyoneWithLinkCanView': `Anyone with the link can view`,
    'viewDerivedPatientsHint': `Patients that appear on tasks matching this quick access (distinct).`,
    'views': `Quick Access`,
    'viewsEntityPatient': `Patients`,
    'viewsEntityTask': `Tasks`,
    'viewSettings': `Quick access`,
    'viewSettingsDescription': `Manage saved task and patient quick access.`,
    'viewVisibility': `Visibility`,
    'viewVisibilityLinkShared': `Link shared`,
    'viewVisibilityPrivate': `Private`,
    'waitingForPatient': `Waiting for patient`,
    'waitPatient': `Set Patient to Waiting`,
    'wards': `Wards`,
    'weeklySurvey': `Weekly Survey`,
    'yes': `Yes`
  },
  'es-ES': {
    'account': `Cuenta`,
    'active': `Activo`,
    'add': `Añadir`,
    'addFastAccess': `Añadir acceso rápido`,
    'addFastAccessDescription': `Añada un nombre para el nuevo acceso rápido.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Añadir paciente`,
    'addProperty': `Añadir propiedad`,
    'addTask': `Añadir tarea`,
    'admitPatient': `Ingresar paciente`,
    'anonymous': `Anónimo`,
    'anonymousSubmission': `Envío anónimo`,
    'archivedPropertyDescription': `Las propiedades archivadas ya no pueden asignarse a objetos.`,
    'archiveProperty': `Archivar propiedad`,
    'assignedTo': `Asignado a`,
    'assigneeTeam': `Equipo asignado`,
    'authenticationFailed': `Error de autenticación`,
    'birthdate': `Fecha de nacimiento`,
    'cancel': `Cancelar`,
    'clear': `Borrar`,
    'clearCache': `Vaciar caché`,
    'clearPropertyColumnActionPatient': `Clear values for this property on listed patients`,
    'clearPropertyColumnActionTask': `Remove this property from listed tasks`,
    'clearPropertyColumnConfirmButtonPatient': `Clear property values`,
    'clearPropertyColumnConfirmButtonTask': `Remove property from tasks`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `This will clear all values for the property "${propertyName}" on ${count} patients currently loaded in this list. The property stays attached to those patients. Patients not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `This will permanently remove the property "${propertyName}" from ${count} tasks currently loaded in this list. Tasks not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogTitlePatient': `Clear property values on patients`,
    'clearPropertyColumnDialogTitleTask': `Remove property from tasks`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Type "${propertyName}" to confirm.`
    },
    'clinic': `Clínica`,
    'clinics': `Clínicas`,
    'clinicUpdated': `Clínica actualizada`,
    'close': `Cerrar`,
    'closedTasks': `Tareas cerradas`,
    'collapseAll': `Contraer todo`,
    'confirm': `Confirmar`,
    'confirmDeleteView': `¿Eliminar este acceso rápido guardado? Esta acción no se puede deshacer.`,
    'confirmSelection': `Confirmar selección`,
    'confirmShiftHandover': `Confirmar traspaso de turno`,
    'confirmShiftHandoverDescription': `¿Está seguro de que desea transferir todas las tareas abiertas al usuario seleccionado?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `¿Está seguro de que desea transferir `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} tarea abierta`,
        'other': `${taskCount} tareas abiertas`,
      })
      _out += ` a ${name}?`
      return _out
    },
    'conflictDetected': `Conflicto detectado`,
    'connectionConnected': `Conectado`,
    'connectionConnecting': `Conectando…`,
    'connectionDisconnected': `Desconectado`,
    'copyShareLink': `Copiar enlace`,
    'copyShareLinkEnableSharingFirst': `Activa el enlace compartido para que otras personas con el enlace puedan abrir este acceso rápido.`,
    'copyViewToMyViews': `Copiar a mi acceso rápido`,
    'create': `Crear`,
    'createTask': `Crear tarea`,
    'creationDate': `Fecha de creación`,
    'currentTime': `Hora actual`,
    'dashboard': `Panel`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Buenas tardes, ${name}!`
    },
    'dashboardWelcomeDescription': `Esto es lo que ocurre hoy.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Buenas noches, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Buenos días, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Buenas noches, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Buenas tardes, ${name}!`
    },
    'delete': `Eliminar`,
    'deletePatient': `Eliminar paciente`,
    'deletePatientConfirmation': `¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.`,
    'description': `Descripción`,
    'descriptionPlaceholder': `Añadir más detalles...`,
    'deselectAll': `Deseleccionar todo`,
    'developmentAndPreviewInstance': `Instancia de desarrollo y vista previa`,
    'discard': `Descartar`,
    'discardDraftMessage': `Tienes cambios sin guardar. Si cierras ahora, perderás todo lo introducido.`,
    'discardDraftTitle': `¿Descartar borrador?`,
    'discardViewChanges': `Descartar cambios`,
    'dischargePatient': `Dar de alta al paciente`,
    'dischargePatientConfirmation': `¿Está seguro de que desea dar de alta a este paciente? Esta acción cambiará el estado del paciente.`,
    'dismiss': `Cerrar`,
    'dismissAll': `Cerrar todo`,
    'diverse': `Diverso`,
    'done': `Hecho`,
    'dueDate': `Fecha de vencimiento`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} día`,
        'other': `${days} días`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} hora`,
        'other': `${hours} horas`,
      })
      return _out
    },
    'dueDateNow': `Ahora`,
    'dueDateToday': `Hoy`,
    'dueDateTomorrow': `Mañana`,
    'duplicate': `Duplicate`,
    'edit': `Editar`,
    'editPatient': `Editar paciente`,
    'editPresetTask': `Editar tarea de plantilla`,
    'editTask': `Editar tarea`,
    'enterFeedback': `Escriba aquí sus comentarios...`,
    'error': `Error`,
    'errorOccurred': `Se ha producido un error`,
    'estimatedTime': `Tiempo estimado (minutos)`,
    'expandAll': `Expandir todo`,
    'export': `Exportar`,
    'exportCsv': `Exportar como CSV`,
    'exportExcel': `Exportar como Excel (imprimible)`,
    'exportFailed': `Error en la exportación. Inténtelo de nuevo.`,
    'feedback': `Comentarios`,
    'feedbackDescription': `Comparta sus comentarios, reporte errores o sugiera mejoras.`,
    'female': `Femenino`,
    'filter': `Filtro`,
    'filterAll': `Todos`,
    'filterUndone': `Pendientes`,
    'firstName': `Nombre`,
    'freeBeds': `Camas libres`,
    'hide': `Ocultar`,
    'homePage': `Página principal`,
    'imprint': `Aviso legal`,
    'inactive': `Inactivo`,
    'install': `Instalar`,
    'installApp': `Instalar aplicación`,
    'installAppDescription': `Instale helpwave tasks para una mejor experiencia con soporte offline y acceso más rápido.`,
    'language': `Idioma`,
    'lastName': `Apellido`,
    'listViewCard': `Vista de tarjetas`,
    'listViewTable': `Vista de tabla`,
    'loading': `Cargando...`,
    'loadingAlmostThere': `Casi listo...`,
    'loadingGettingReady': `Un instante — lo estamos preparando todo...`,
    'loadingHangOn': `Un momento — estamos cargando los últimos datos...`,
    'loadingMoment': `Solo un segundo, casi listo...`,
    'loadMore': `Cargar más`,
    'loadTaskPreset': `Load preset`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Create `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} task`,
        'other': `${count} tasks`,
      })
      _out += ` for this patient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirm loading preset`,
    'loadTaskPresetCreateAndAssign': `Create & assign to me`,
    'loadTaskPresetSelectTasks': `Tasks from preset`,
    'loadTaskPresetTaskLabel': `Preset`,
    'loadTaskPresetTitle': `Load task preset`,
    'location': `Ubicación`,
    'locationBed': `Cama`,
    'locationClinic': `Clínica`,
    'locationRoom': `Habitación`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clínica`,
        'WARD': `Planta`,
        'TEAM': `Equipo`,
        'ROOM': `Habitación`,
        'BED': `Cama`,
        'other': `Otro`,
      })
    },
    'locationWard': `Planta`,
    'login': `Iniciar sesión`,
    'logInAgain': `Iniciar sesión de nuevo`,
    'loginRequired': `Inicio de sesión requerido`,
    'loginRequiredDescription': `Para usar este sitio debe iniciar sesión.`,
    'logout': `Cerrar sesión`,
    'male': `Masculino`,
    'markPatientDead': `Marcar paciente como fallecido`,
    'markPatientDeadConfirmation': `¿Está seguro de que desea marcar este paciente como fallecido?`,
    'menu': `Menú`,
    'more': `Más`,
    'myFavorites': `Mis favoritos`,
    'myOpenTasks': `Mis tareas abiertas`,
    'myTasks': `Mis tareas`,
    'name': `Nombre`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtro`,
        'other': `${count} filtros`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `No`,
    'noClosedTasks': `No hay tareas cerradas`,
    'noLocationsFound': `No se encontraron ubicaciones`,
    'none': `Ninguno`,
    'noNotifications': `Sin actualizaciones recientes`,
    'noOpenTasks': `No hay tareas abiertas`,
    'noPatient': `Sin paciente`,
    'noPatientsInTaskView': `No se encontraron pacientes para este acceso rápido de tareas.`,
    'noResultsFound': `No se encontraron resultados`,
    'notAssigned': `No asignado`,
    'notifications': `Notificaciones`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Paciente`,
        'other': `${count} Pacientes`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} ordenación`,
        'other': `${count} ordenaciones`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Tarea`,
        'other': `${count} Tareas`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 años`,
        '=1': `1 año`,
        'other': `${years} años`,
      })
    },
    'occupancy': `Ocupación`,
    'ok': `OK`,
    'onboardingSurvey': `Encuesta de incorporación`,
    'openSurvey': `Abrir encuesta`,
    'openTasks': `Tareas abiertas`,
    'openView': `Abrir`,
    'option': `Opción`,
    'organizations': `Organizaciones`,
    'overview': `Resumen`,
    'pages.404.loading': `Cargando...`,
    'pages.404.notFound': `404 - Página no encontrada`,
    'pages.404.notFoundDescription1': `Esta no es la página que busca`,
    'pages.404.notFoundDescription2': `Volver a la`,
    'patient': `Paciente`,
    'patientActions': `Acciones del paciente`,
    'patientData': `Datos`,
    'patients': `Pacientes`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Ingresado ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Total ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `En espera ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `En espera`,
        'ADMITTED': `Ingresado`,
        'DISCHARGED': `Alta`,
        'DEAD': `Fallecido`,
        'other': `Desconocido`,
      })
    },
    'patientsUpdatedRecently': `Pacientes actualizados recientemente`,
    'pickClinic': `Elegir la clínica`,
    'pickClinicDescription': `Seleccione la clínica para este paciente. Solo se pueden seleccionar ubicaciones de tipo clínica.`,
    'pickPosition': `Elegir la ubicación`,
    'pickPositionDescription': `Seleccione la ubicación para este paciente. Puede elegir hospital, consulta, clínica, planta, cama o habitación.`,
    'pickTeams': `Elegir equipos`,
    'pickTeamsDescription': `Seleccione uno o más equipos para este paciente. Puede elegir clínica, equipo, consulta u hospital.`,
    'position': `Ubicación`,
    'positionUpdated': `Ubicación actualizada`,
    'preferences': `Preferencias`,
    'priority': `Prioridad`,
    'priorityLabel': `Prioridad`,
    'priorityNone': `Ninguna`,
    'privacy': `Privacidad`,
    'properties': `Propiedades`,
    'propertiesSettingsDescription': `Campos personalizados para tareas y pacientes: define tipos y úsalos en filtros.`,
    'property': `Propiedad`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Tema`,
        'other': `Temas`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Añadir ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Total ${value}`
    },
    'readOnlyView': `Solo lectura`,
    'recentPatients': `Tus pacientes recientes`,
    'recentTasks': `Tus tareas recientes`,
    'rEdit': ({ name }): string => {
      return `Actualizar ${name}`
    },
    'refreshing': `Actualizando…`,
    'removeProperty': `Eliminar propiedad`,
    'removePropertyConfirmation': `¿Está seguro de que desea eliminar esta propiedad? Esta acción no se puede deshacer.`,
    'retakeSurvey': `Repetir encuesta`,
    'rShow': ({ name }): string => {
      return `Mostrar ${name}`
    },
    'savedViews': `Acceso rápido`,
    'saveView': `Guardar acceso rápido`,
    'saveViewAsNew': `Guardar como acceso rápido nuevo`,
    'saveViewDescription': `Pon nombre a este acceso rápido. Se guardan filtros, ordenación, búsqueda y ámbito de ubicación.`,
    'saveViewDescriptionFromSystemList': `Crea un acceso rápido nuevo a partir de este diseño. Esta página está fijada por la aplicación y no se guarda en su sitio: ábralo desde la barra lateral cuando lo necesite.`,
    'saveViewOverwriteCurrent': `Sobrescribir acceso rápido actual`,
    'scopeChangeNode': `Cambiar nodo`,
    'scopeNoNodeSelected': `Seleccione el nodo en el que se guarda esta entrada.`,
    'scopePrivate': `Privado`,
    'scopePrivateDescription': `Solo usted puede ver y usar esta entrada.`,
    'scopePublic': `Público`,
    'scopePublicDescription': `Todos los que tienen acceso al nodo seleccionado o a su subárbol pueden ver y usar esta entrada.`,
    'scopeSelectNode': `Seleccionar nodo`,
    'scopeShared': `Compartido por enlace`,
    'scopeSharedDescription': `Solo usted ve esta entrada en sus listas. Todos los que pueden acceder al nodo seleccionado o a su subárbol pueden abrirla mediante su enlace.`,
    'scopeStoredAt': `Guardado en`,
    'scopeVisibility': `Compartir`,
    'scrollToTop': `Desplazarse hacia arriba`,
    'search': `Buscar`,
    'searchLocations': `Buscar ubicaciones...`,
    'searchUserOrTeam': `Buscar usuario (o equipo)...`,
    'searchUsersOrTeams': `Buscar usuarios o equipos...`,
    'security': `Seguridad`,
    'selectAll': `Seleccionar todo`,
    'selectAssignee': `Asignar a...`,
    'selectClinic': `Seleccionar clínica`,
    'selectLocation': `Seleccionar ubicación`,
    'selectLocationDescription': `Seleccione la ubicación asignada para el paciente.`,
    'selectOptions': `Opciones`,
    'selectPosition': `Seleccionar ubicación`,
    'selectRootLocation': `Seleccionar ubicación raíz`,
    'selectRootLocationDescription': `Seleccione las ubicaciones raíz que definen su ámbito. Solo se pueden seleccionar hospitales, consultas, clínicas y equipos. Al seleccionar una ubicación padre se incluyen todas las hijas.`,
    'selectTeams': `Seleccionar equipos`,
    'sessionExpired': `Sesión expirada`,
    'sessionExpiredDescription': `Se ha cerrado su sesión por inactividad. Vuelva a iniciar sesión para continuar. Los cambios no guardados pueden perderse.`,
    'settings': `Ajustes`,
    'settingsDescription': `Aquí puede cambiar la configuración de la aplicación.`,
    'sex': `Sexo`,
    'shiftHandover': `Traspaso de turno`,
    'showAllTasks': `Mostrar todas las tareas`,
    'showPatient': ({ name }): string => {
      return `Mostrar paciente ${name}`
    },
    'showTeamTasks': `Mostrar tareas del equipo`,
    'sorting': `Ordenación`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Media`,
        'P3': `Alta`,
        'P4': `Crítica`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Paciente`,
        'task': `Tarea`,
        'other': `Tipo de sujeto no definido`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Selección múltiple`,
        'singleSelect': `Selección única`,
        'number': `Número`,
        'text': `Texto`,
        'date': `Fecha`,
        'dateTime': `Punto temporal`,
        'checkbox': `Casilla`,
        'user': `Usuario`,
        'other': `Tipo no definido`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Esta instancia pública de helpwave tasks es para \\b{desarrollo y vista previa}. Asegúrese de \\b{solo} introducir \\b{datos de prueba no confidenciales}. Esta instancia puede \\negative{\\b{eliminarse en cualquier momento}}`,
    'startRecording': `Iniciar grabación`,
    'stateUpdated': `Estado actualizado`,
    'status': `Estado`,
    'stopRecording': `Detener grabación`,
    'subjectType': `Tipo de sujeto`,
    'submissionDetails': `Detalles del envío`,
    'submit': `Enviar`,
    'submittingAs': ({ name }): string => {
      return `Enviando como ${name}`
    },
    'surveyDescription': `Su opinión es valiosa. Dedique un momento a completar nuestra encuesta.`,
    'surveyTitle': `Ayúdenos a mejorar helpwave tasks`,
    'system': `Sistema`,
    'task': `Tarea`,
    'taskFromPresetTooltip': `Created from a task preset`,
    'taskPresetAddRow': `Add task`,
    'taskPresetApplyToRow': `Apply to preset row`,
    'taskPresetCreate': `Create preset`,
    'taskPresetDelete': `Delete`,
    'taskPresetDeleteConfirm': `Delete this task preset?`,
    'taskPresetEdit': `Editar plantilla`,
    'taskPresetEditDetails': `Edit details`,
    'taskPresetEmptyList': `No task presets yet.`,
    'taskPresetKey': `Key`,
    'taskPresetKeyHint': `Optional unique key for lookups. Leave empty to generate automatically.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `No estimate`,
    'taskPresetNoTasks': `This preset has no tasks.`,
    'taskPresetRemoveRow': `Remove`,
    'taskPresets': `Presets`,
    'taskPresetSave': `Save preset`,
    'taskPresetsDescription': `Reusable task lists with optional dependencies.`,
    'taskPresetSelectPlaceholder': `Select a preset`,
    'taskPresetSourceNotFound': `Preset could not be loaded.`,
    'taskPresetSourceOpenSettings': `Open in settings`,
    'taskPresetSourceTasksInGraph': `Tasks in template`,
    'taskPresetSourceTitle': `Source preset`,
    'tasks': `Tareas`,
    'tasksCreatedFromPreset': `Tasks created`,
    'tasksUpdatedRecently': `Tareas actualizadas recientemente`,
    'taskTitlePlaceholder': `¿Qué hay que hacer?`,
    'teams': `Equipos`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Oscuro`,
        'light': `Claro`,
        'system': `Sistema`,
        'other': `Sistema`,
      })
    },
    'timeEstimate': `Tiempo estimado`,
    'title': `Título`,
    'totalPatients': `Total de pacientes`,
    'type': `Tipo`,
    'updated': `Actualizado`,
    'url': `URL`,
    'user': `Usuario`,
    'userInformation': `Información del usuario`,
    'users': `Usuarios`,
    'viewAnyoneWithLinkCanView': `Cualquiera con el enlace puede ver`,
    'viewDerivedPatientsHint': `Pacientes que aparecen en tareas que coinciden con este acceso rápido (únicos).`,
    'views': `Acceso rápido`,
    'viewsEntityPatient': `Pacientes`,
    'viewsEntityTask': `Tareas`,
    'viewSettings': `Acceso rápido`,
    'viewSettingsDescription': `Administra accesos rápidos guardados de tareas y pacientes.`,
    'viewVisibility': `Visibilidad`,
    'viewVisibilityLinkShared': `Enlace compartido`,
    'viewVisibilityPrivate': `Privado`,
    'waitingForPatient': `En espera de paciente`,
    'waitPatient': `Poner paciente en espera`,
    'wards': `Plantas`,
    'weeklySurvey': `Encuesta semanal`,
    'yes': `Sí`
  },
  'fr-FR': {
    'account': `Compte`,
    'active': `Actif`,
    'add': `Ajouter`,
    'addFastAccess': `Ajouter un accès rapide`,
    'addFastAccessDescription': `Ajoutez un nom pour le nouvel accès rapide.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Ajouter un patient`,
    'addProperty': `Ajouter une propriété`,
    'addTask': `Ajouter une tâche`,
    'admitPatient': `Admettre le patient`,
    'anonymous': `Anonyme`,
    'anonymousSubmission': `Envoi anonyme`,
    'archivedPropertyDescription': `Les propriétés archivées ne peuvent plus être assignées aux objets.`,
    'archiveProperty': `Archiver la propriété`,
    'assignedTo': `Assigné à`,
    'assigneeTeam': `Équipe assignée`,
    'authenticationFailed': `Échec de l'authentification`,
    'birthdate': `Date de naissance`,
    'cancel': `Annuler`,
    'clear': `Effacer`,
    'clearCache': `Vider le cache`,
    'clearPropertyColumnActionPatient': `Clear values for this property on listed patients`,
    'clearPropertyColumnActionTask': `Remove this property from listed tasks`,
    'clearPropertyColumnConfirmButtonPatient': `Clear property values`,
    'clearPropertyColumnConfirmButtonTask': `Remove property from tasks`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `This will clear all values for the property "${propertyName}" on ${count} patients currently loaded in this list. The property stays attached to those patients. Patients not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `This will permanently remove the property "${propertyName}" from ${count} tasks currently loaded in this list. Tasks not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogTitlePatient': `Clear property values on patients`,
    'clearPropertyColumnDialogTitleTask': `Remove property from tasks`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Type "${propertyName}" to confirm.`
    },
    'clinic': `Clinique`,
    'clinics': `Cliniques`,
    'clinicUpdated': `Clinique mise à jour`,
    'close': `Fermer`,
    'closedTasks': `Tâches terminées`,
    'collapseAll': `Tout réduire`,
    'confirm': `Confirmer`,
    'confirmDeleteView': `Supprimer cet accès rapide enregistré ? Cette action est irréversible.`,
    'confirmSelection': `Confirmer la sélection`,
    'confirmShiftHandover': `Confirmer la passation`,
    'confirmShiftHandoverDescription': `Êtes-vous sûr de vouloir transférer toutes les tâches ouvertes à l'utilisateur sélectionné ?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Êtes-vous sûr de vouloir transférer `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} tâche ouverte`,
        'other': `${taskCount} tâches ouvertes`,
      })
      _out += ` à ${name} ?`
      return _out
    },
    'conflictDetected': `Conflit détecté`,
    'connectionConnected': `Connecté`,
    'connectionConnecting': `Connexion…`,
    'connectionDisconnected': `Déconnecté`,
    'copyShareLink': `Copier le lien`,
    'copyShareLinkEnableSharingFirst': `Activez le partage par lien pour que d'autres personnes avec le lien puissent ouvrir cet accès rapide.`,
    'copyViewToMyViews': `Copier vers mon accès rapide`,
    'create': `Créer`,
    'createTask': `Créer une tâche`,
    'creationDate': `Date de création`,
    'currentTime': `Heure actuelle`,
    'dashboard': `Tableau de bord`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Bon après-midi, ${name} !`
    },
    'dashboardWelcomeDescription': `Voici ce qui se passe aujourd'hui.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Bonsoir, ${name} !`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Bonjour, ${name} !`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Bonne nuit, ${name} !`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Bon après-midi, ${name} !`
    },
    'delete': `Supprimer`,
    'deletePatient': `Supprimer le patient`,
    'deletePatientConfirmation': `Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.`,
    'description': `Description`,
    'descriptionPlaceholder': `Ajouter plus de détails...`,
    'deselectAll': `Tout désélectionner`,
    'developmentAndPreviewInstance': `Instance de développement et d'aperçu`,
    'discard': `Abandonner`,
    'discardDraftMessage': `Vous avez des saisies non enregistrées. Si vous fermez maintenant, tout sera perdu.`,
    'discardDraftTitle': `Abandonner le brouillon ?`,
    'discardViewChanges': `Ignorer les modifications`,
    'dischargePatient': `Sortir le patient`,
    'dischargePatientConfirmation': `Êtes-vous sûr de vouloir sortir ce patient ? Cette action modifiera son état.`,
    'dismiss': `Fermer`,
    'dismissAll': `Tout fermer`,
    'diverse': `Divers`,
    'done': `Terminé`,
    'dueDate': `Date d'échéance`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} jour`,
        'other': `${days} jours`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} heure`,
        'other': `${hours} heures`,
      })
      return _out
    },
    'dueDateNow': `Maintenant`,
    'dueDateToday': `Aujourd'hui`,
    'dueDateTomorrow': `Demain`,
    'duplicate': `Duplicate`,
    'edit': `Modifier`,
    'editPatient': `Modifier le patient`,
    'editPresetTask': `Modifier la tâche du préréglage`,
    'editTask': `Modifier la tâche`,
    'enterFeedback': `Entrez vos commentaires ici...`,
    'error': `Erreur`,
    'errorOccurred': `Une erreur s'est produite`,
    'estimatedTime': `Temps estimé (minutes)`,
    'expandAll': `Tout développer`,
    'export': `Exporter`,
    'exportCsv': `Exporter en CSV`,
    'exportExcel': `Exporter en Excel (imprimable)`,
    'exportFailed': `Échec de l'exportation. Veuillez réessayer.`,
    'feedback': `Commentaires`,
    'feedbackDescription': `Partagez vos commentaires, signalez des bugs ou suggérez des améliorations.`,
    'female': `Féminin`,
    'filter': `Filtre`,
    'filterAll': `Tous`,
    'filterUndone': `En attente`,
    'firstName': `Prénom`,
    'freeBeds': `Lits disponibles`,
    'hide': `Masquer`,
    'homePage': `Page d'accueil`,
    'imprint': `Mentions légales`,
    'inactive': `Inactif`,
    'install': `Installer`,
    'installApp': `Installer l'application`,
    'installAppDescription': `Installez helpwave tasks pour une meilleure expérience avec prise en charge hors ligne et accès plus rapide.`,
    'language': `Langue`,
    'lastName': `Nom de famille`,
    'listViewCard': `Vue cartes`,
    'listViewTable': `Vue tableau`,
    'loading': `Chargement...`,
    'loadingAlmostThere': `Presque prêt...`,
    'loadingGettingReady': `Un moment — nous préparons tout...`,
    'loadingHangOn': `Un instant — nous récupérons les dernières données...`,
    'loadingMoment': `Juste une seconde, presque terminé...`,
    'loadMore': `Charger plus`,
    'loadTaskPreset': `Load preset`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Create `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} task`,
        'other': `${count} tasks`,
      })
      _out += ` for this patient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirm loading preset`,
    'loadTaskPresetCreateAndAssign': `Create & assign to me`,
    'loadTaskPresetSelectTasks': `Tasks from preset`,
    'loadTaskPresetTaskLabel': `Preset`,
    'loadTaskPresetTitle': `Load task preset`,
    'location': `Emplacement`,
    'locationBed': `Lit`,
    'locationClinic': `Clinique`,
    'locationRoom': `Chambre`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clinique`,
        'WARD': `Service`,
        'TEAM': `Équipe`,
        'ROOM': `Chambre`,
        'BED': `Lit`,
        'other': `Autre`,
      })
    },
    'locationWard': `Service`,
    'login': `Connexion`,
    'logInAgain': `Se reconnecter`,
    'loginRequired': `Connexion requise`,
    'loginRequiredDescription': `Pour utiliser ce site, vous devez être connecté.`,
    'logout': `Déconnexion`,
    'male': `Masculin`,
    'markPatientDead': `Déclarer le patient décédé`,
    'markPatientDeadConfirmation': `Êtes-vous sûr de vouloir déclarer ce patient décédé ?`,
    'menu': `Menu`,
    'more': `Plus`,
    'myFavorites': `Mes favoris`,
    'myOpenTasks': `Mes tâches ouvertes`,
    'myTasks': `Mes tâches`,
    'name': `Nom`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtre`,
        'other': `${count} filtres`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `Non`,
    'noClosedTasks': `Aucune tâche terminée`,
    'noLocationsFound': `Aucun emplacement trouvé`,
    'none': `Aucun`,
    'noNotifications': `Aucune mise à jour récente`,
    'noOpenTasks': `Aucune tâche ouverte`,
    'noPatient': `Aucun patient`,
    'noPatientsInTaskView': `Aucun patient trouvé pour cet accès rapide de tâches.`,
    'noResultsFound': `Aucun résultat trouvé`,
    'notAssigned': `Non assigné`,
    'notifications': `Notifications`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patient`,
        'other': `${count} Patients`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} tri`,
        'other': `${count} tris`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Tâche`,
        'other': `${count} Tâches`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 an`,
        '=1': `1 an`,
        'other': `${years} ans`,
      })
    },
    'occupancy': `Occupation`,
    'ok': `OK`,
    'onboardingSurvey': `Enquête d'intégration`,
    'openSurvey': `Ouvrir l'enquête`,
    'openTasks': `Tâches ouvertes`,
    'openView': `Ouvrir`,
    'option': `Option`,
    'organizations': `Organisations`,
    'overview': `Aperçu`,
    'pages.404.loading': `Chargement...`,
    'pages.404.notFound': `404 - Page non trouvée`,
    'pages.404.notFoundDescription1': `Ce n'est définitivement pas la page que vous cherchez`,
    'pages.404.notFoundDescription2': `Retour à la`,
    'patient': `Patient`,
    'patientActions': `Actions patient`,
    'patientData': `Données`,
    'patients': `Patients`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Admis ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Total ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `En attente ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `En attente`,
        'ADMITTED': `Admis`,
        'DISCHARGED': `Sorti`,
        'DEAD': `Décédé`,
        'other': `Inconnu`,
      })
    },
    'patientsUpdatedRecently': `Patients mis à jour récemment`,
    'pickClinic': `Choisir la clinique`,
    'pickClinicDescription': `Sélectionnez la clinique pour ce patient. Seules les emplacements de type clinique peuvent être sélectionnés.`,
    'pickPosition': `Choisir l'emplacement`,
    'pickPositionDescription': `Sélectionnez l'emplacement pour ce patient. Vous pouvez choisir hôpital, cabinet, clinique, service, lit ou chambre.`,
    'pickTeams': `Choisir les équipes`,
    'pickTeamsDescription': `Sélectionnez une ou plusieurs équipes pour ce patient. Vous pouvez choisir clinique, équipe, cabinet ou hôpital.`,
    'position': `Emplacement`,
    'positionUpdated': `Emplacement mis à jour`,
    'preferences': `Préférences`,
    'priority': `Priorité`,
    'priorityLabel': `Priorité`,
    'priorityNone': `Aucune`,
    'privacy': `Confidentialité`,
    'properties': `Propriétés`,
    'propertiesSettingsDescription': `Champs personnalisés pour tâches et patients : définissez les types et utilisez-les dans les filtres.`,
    'property': `Propriété`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Thème`,
        'other': `Thèmes`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Ajouter ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Total ${value}`
    },
    'readOnlyView': `Lecture seule`,
    'recentPatients': `Vos patients récents`,
    'recentTasks': `Vos tâches récentes`,
    'rEdit': ({ name }): string => {
      return `Mettre à jour ${name}`
    },
    'refreshing': `Actualisation…`,
    'removeProperty': `Supprimer la propriété`,
    'removePropertyConfirmation': `Êtes-vous sûr de vouloir supprimer cette propriété ? Cette action est irréversible.`,
    'retakeSurvey': `Refaire l'enquête`,
    'rShow': ({ name }): string => {
      return `Afficher ${name}`
    },
    'savedViews': `Accès rapide`,
    'saveView': `Enregistrer l'accès rapide`,
    'saveViewAsNew': `Enregistrer comme nouvel accès rapide`,
    'saveViewDescription': `Nommez cet accès rapide. Filtres, tri, recherche et périmètre de lieu sont enregistrés.`,
    'saveViewDescriptionFromSystemList': `Crée un nouvel accès rapide à partir de cette disposition. Cette page est fixée par l'application et n'est pas enregistrée en place — ouvrez-le depuis la barre latérale si besoin.`,
    'saveViewOverwriteCurrent': `Remplacer l'accès rapide actuel`,
    'scopeChangeNode': `Changer de nœud`,
    'scopeNoNodeSelected': `Sélectionnez le nœud où cette entrée est enregistrée.`,
    'scopePrivate': `Privé`,
    'scopePrivateDescription': `Vous seul pouvez voir et utiliser cette entrée.`,
    'scopePublic': `Public`,
    'scopePublicDescription': `Toutes les personnes ayant accès au nœud sélectionné ou à son sous-arbre peuvent voir et utiliser cette entrée.`,
    'scopeSelectNode': `Sélectionner un nœud`,
    'scopeShared': `Partagé par lien`,
    'scopeSharedDescription': `Vous seul voyez cette entrée dans vos listes. Toute personne ayant accès au nœud sélectionné ou à son sous-arbre peut l'ouvrir via son lien.`,
    'scopeStoredAt': `Enregistré sous`,
    'scopeVisibility': `Partage`,
    'scrollToTop': `Revenir en haut`,
    'search': `Rechercher`,
    'searchLocations': `Rechercher des emplacements...`,
    'searchUserOrTeam': `Rechercher un utilisateur (ou une équipe)...`,
    'searchUsersOrTeams': `Rechercher des utilisateurs ou des équipes...`,
    'security': `Sécurité`,
    'selectAll': `Tout sélectionner`,
    'selectAssignee': `Assigner à...`,
    'selectClinic': `Sélectionner la clinique`,
    'selectLocation': `Sélectionner l'emplacement`,
    'selectLocationDescription': `Veuillez sélectionner l'emplacement assigné au patient.`,
    'selectOptions': `Options`,
    'selectPosition': `Sélectionner l'emplacement`,
    'selectRootLocation': `Sélectionner l'emplacement racine`,
    'selectRootLocationDescription': `Sélectionnez les emplacements racine qui définissent votre périmètre. Seuls les hôpitaux, cabinets, cliniques et équipes peuvent être sélectionnés. La sélection d'un emplacement parent inclut tous ses enfants.`,
    'selectTeams': `Sélectionner les équipes`,
    'sessionExpired': `Session expirée`,
    'sessionExpiredDescription': `Vous avez été déconnecté pour cause d'inactivité. Veuillez vous reconnecter pour continuer. Les modifications non enregistrées peuvent être perdues.`,
    'settings': `Paramètres`,
    'settingsDescription': `Ici vous pouvez modifier la configuration de l'application.`,
    'sex': `Sexe`,
    'shiftHandover': `Passation`,
    'showAllTasks': `Afficher toutes les tâches`,
    'showPatient': ({ name }): string => {
      return `Afficher le patient ${name}`
    },
    'showTeamTasks': `Afficher les tâches d'équipe`,
    'sorting': `Tri`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Moyenne`,
        'P3': `Haute`,
        'P4': `Critique`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Patient`,
        'task': `Tâche`,
        'other': `Type de sujet non défini`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Sélection multiple`,
        'singleSelect': `Sélection unique`,
        'number': `Nombre`,
        'text': `Texte`,
        'date': `Date`,
        'dateTime': `Date et heure`,
        'checkbox': `Case à cocher`,
        'user': `Utilisateur`,
        'other': `Type non défini`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Cette instance publique de helpwave tasks est destinée au \\b{développement et à laperçu}. Veuillez \\b{ne} saisir \\b{que des données de test non confidentielles}. Cette instance peut \\negative{\\b{être supprimée à tout moment}}`,
    'startRecording': `Démarrer l'enregistrement`,
    'stateUpdated': `Statut mis à jour`,
    'status': `Statut`,
    'stopRecording': `Arrêter l'enregistrement`,
    'subjectType': `Type de sujet`,
    'submissionDetails': `Détails de l'envoi`,
    'submit': `Envoyer`,
    'submittingAs': ({ name }): string => {
      return `Envoi en tant que ${name}`
    },
    'surveyDescription': `Vos commentaires sont précieux. Veuillez prendre un moment pour remplir notre enquête.`,
    'surveyTitle': `Aidez-nous à améliorer helpwave tasks`,
    'system': `Système`,
    'task': `Tâche`,
    'taskFromPresetTooltip': `Created from a task preset`,
    'taskPresetAddRow': `Add task`,
    'taskPresetApplyToRow': `Apply to preset row`,
    'taskPresetCreate': `Create preset`,
    'taskPresetDelete': `Delete`,
    'taskPresetDeleteConfirm': `Delete this task preset?`,
    'taskPresetEdit': `Modifier le préréglage`,
    'taskPresetEditDetails': `Edit details`,
    'taskPresetEmptyList': `No task presets yet.`,
    'taskPresetKey': `Key`,
    'taskPresetKeyHint': `Optional unique key for lookups. Leave empty to generate automatically.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `No estimate`,
    'taskPresetNoTasks': `This preset has no tasks.`,
    'taskPresetRemoveRow': `Remove`,
    'taskPresets': `Presets`,
    'taskPresetSave': `Save preset`,
    'taskPresetsDescription': `Reusable task lists with optional dependencies.`,
    'taskPresetSelectPlaceholder': `Select a preset`,
    'taskPresetSourceNotFound': `Preset could not be loaded.`,
    'taskPresetSourceOpenSettings': `Open in settings`,
    'taskPresetSourceTasksInGraph': `Tasks in template`,
    'taskPresetSourceTitle': `Source preset`,
    'tasks': `Tâches`,
    'tasksCreatedFromPreset': `Tasks created`,
    'tasksUpdatedRecently': `Tâches mises à jour récemment`,
    'taskTitlePlaceholder': `Que faut-il faire ?`,
    'teams': `Équipes`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Sombre`,
        'light': `Clair`,
        'system': `Système`,
        'other': `Système`,
      })
    },
    'timeEstimate': `Temps estimé`,
    'title': `Titre`,
    'totalPatients': `Total des patients`,
    'type': `Type`,
    'updated': `Mis à jour`,
    'url': `URL`,
    'user': `Utilisateur`,
    'userInformation': `Informations utilisateur`,
    'users': `Utilisateurs`,
    'viewAnyoneWithLinkCanView': `Toute personne ayant le lien peut voir`,
    'viewDerivedPatientsHint': `Patients présents sur les tâches correspondant à cet accès rapide (distincts).`,
    'views': `Accès rapide`,
    'viewsEntityPatient': `Patients`,
    'viewsEntityTask': `Tâches`,
    'viewSettings': `Accès rapide`,
    'viewSettingsDescription': `Gérer les accès rapides enregistrés pour les tâches et les patients.`,
    'viewVisibility': `Visibilité`,
    'viewVisibilityLinkShared': `Lien partagé`,
    'viewVisibilityPrivate': `Privé`,
    'waitingForPatient': `En attente du patient`,
    'waitPatient': `Mettre le patient en attente`,
    'wards': `Services`,
    'weeklySurvey': `Enquête hebdomadaire`,
    'yes': `Oui`
  },
  'it-IT': {
    'account': `Account`,
    'active': `Attivo`,
    'add': `Aggiungi`,
    'addFastAccess': `Aggiungi accesso rapido`,
    'addFastAccessDescription': `Inserisci un nome per il nuovo accesso rapido.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Aggiungi paziente`,
    'addProperty': `Aggiungi proprietà`,
    'addTask': `Aggiungi attività`,
    'admitPatient': `Ricovera paziente`,
    'anonymous': `Anonimo`,
    'anonymousSubmission': `Invio anonimo`,
    'archivedPropertyDescription': `Le proprietà archiviate non possono più essere assegnate agli oggetti.`,
    'archiveProperty': `Archivia proprietà`,
    'assignedTo': `Assegnato a`,
    'assigneeTeam': `Team assegnato`,
    'authenticationFailed': `Autenticazione non riuscita`,
    'birthdate': `Data di nascita`,
    'cancel': `Annulla`,
    'clear': `Cancella`,
    'clearCache': `Svuota cache`,
    'clearPropertyColumnActionPatient': `Cancella i valori di questa proprietà per i pazienti elencati`,
    'clearPropertyColumnActionTask': `Rimuovi questa proprietà dalle attività elencate`,
    'clearPropertyColumnConfirmButtonPatient': `Cancella valori della proprietà`,
    'clearPropertyColumnConfirmButtonTask': `Rimuovi proprietà dalle attività`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Tutti i valori della proprietà "${propertyName}" verranno cancellati per ${count} pazienti attualmente caricati in questo elenco. La proprietà resta associata a questi pazienti. I pazienti non caricati in questo elenco non vengono modificati.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `La proprietà "${propertyName}" verrà rimossa definitivamente da ${count} attività attualmente caricate in questo elenco. Le attività non caricate in questo elenco non vengono modificate.`
    },
    'clearPropertyColumnDialogTitlePatient': `Cancella i valori della proprietà per i pazienti`,
    'clearPropertyColumnDialogTitleTask': `Rimuovi proprietà dalle attività`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Digita "${propertyName}" per confermare.`
    },
    'clinic': `Clinica`,
    'clinics': `Cliniche`,
    'clinicUpdated': `Clinica aggiornata`,
    'close': `Chiudi`,
    'closedTasks': `Attività chiuse`,
    'collapseAll': `Comprimi tutto`,
    'confirm': `Conferma`,
    'confirmDeleteView': `Eliminare questo accesso rapido salvato? L'operazione non può essere annullata.`,
    'confirmSelection': `Conferma selezione`,
    'confirmShiftHandover': `Conferma passaggio di consegne`,
    'confirmShiftHandoverDescription': `Vuoi davvero trasferire tutte le attività aperte all'utente selezionato?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Vuoi davvero trasferire `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} attività aperta`,
        'other': `${taskCount} attività aperte`,
      })
      _out += ` a ${name}?`
      return _out
    },
    'conflictDetected': `Conflitto rilevato`,
    'connectionConnected': `Connesso`,
    'connectionConnecting': `Connessione in corso…`,
    'connectionDisconnected': `Disconnesso`,
    'copyShareLink': `Copia link`,
    'copyShareLinkEnableSharingFirst': `Attiva la condivisione tramite link affinché altre persone con il link possano aprire questo accesso rapido.`,
    'copyViewToMyViews': `Copia nel mio accesso rapido`,
    'create': `Crea`,
    'createTask': `Crea attività`,
    'creationDate': `Data di creazione`,
    'currentTime': `Ora attuale`,
    'dashboard': `Dashboard`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Buon pomeriggio, ${name}!`
    },
    'dashboardWelcomeDescription': `Ecco cosa succede oggi.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Buonasera, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Buongiorno, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Buonanotte, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Buon pomeriggio, ${name}!`
    },
    'delete': `Elimina`,
    'deletePatient': `Elimina paziente`,
    'deletePatientConfirmation': `Vuoi davvero eliminare questo paziente? L'operazione non può essere annullata.`,
    'description': `Descrizione`,
    'descriptionPlaceholder': `Aggiungi altri dettagli...`,
    'deselectAll': `Deseleziona tutto`,
    'developmentAndPreviewInstance': `Istanza di sviluppo e anteprima`,
    'discard': `Scarta`,
    'discardDraftMessage': `Ci sono dati non salvati. Se chiudi ora, tutto ciò che hai inserito andrà perso.`,
    'discardDraftTitle': `Scartare la bozza?`,
    'discardViewChanges': `Annulla modifiche`,
    'dischargePatient': `Dimetti paziente`,
    'dischargePatientConfirmation': `Vuoi davvero dimettere questo paziente? L'operazione modificherà lo stato del paziente.`,
    'dismiss': `Chiudi`,
    'dismissAll': `Chiudi tutto`,
    'diverse': `Altro`,
    'done': `Completata`,
    'dueDate': `Scadenza`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} giorno`,
        'other': `${days} giorni`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} ora`,
        'other': `${hours} ore`,
      })
      return _out
    },
    'dueDateNow': `Adesso`,
    'dueDateToday': `Oggi`,
    'dueDateTomorrow': `Domani`,
    'duplicate': `Duplica`,
    'edit': `Modifica`,
    'editPatient': `Modifica paziente`,
    'editPresetTask': `Modifica attività del modello`,
    'editTask': `Modifica attività`,
    'enterFeedback': `Inserisci qui il tuo feedback...`,
    'error': `Errore`,
    'errorOccurred': `Si è verificato un errore`,
    'estimatedTime': `Tempo stimato (minuti)`,
    'expandAll': `Espandi tutto`,
    'export': `Esporta`,
    'exportCsv': `Esporta come CSV`,
    'exportExcel': `Esporta come Excel (stampabile)`,
    'exportFailed': `Esportazione non riuscita. Riprova.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Condividi il tuo feedback, segnala errori o suggerisci miglioramenti.`,
    'female': `Femmina`,
    'filter': `Filtro`,
    'filterAll': `Tutte`,
    'filterUndone': `Da completare`,
    'firstName': `Nome`,
    'freeBeds': `Letti liberi`,
    'hide': `Nascondi`,
    'homePage': `Home page`,
    'imprint': `Note legali`,
    'inactive': `Inattivo`,
    'install': `Installa`,
    'installApp': `Installa app`,
    'installAppDescription': `Installa helpwave tasks per un'esperienza migliore con supporto offline e accesso più rapido.`,
    'language': `Lingua`,
    'lastName': `Cognome`,
    'listViewCard': `Vista schede`,
    'listViewTable': `Vista tabella`,
    'loading': `Caricamento...`,
    'loadingAlmostThere': `Quasi pronto...`,
    'loadingGettingReady': `Un momento — stiamo preparando tutto...`,
    'loadingHangOn': `Un attimo — recupero dei dati più recenti...`,
    'loadingMoment': `Solo un secondo, ci siamo quasi...`,
    'loadMore': `Carica altro`,
    'loadTaskPreset': `Carica modello`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Creare `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} attività`,
        'other': `${count} attività`,
      })
      _out += ` per questo paziente?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Conferma caricamento modello`,
    'loadTaskPresetCreateAndAssign': `Crea e assegna a me`,
    'loadTaskPresetSelectTasks': `Attività dal modello`,
    'loadTaskPresetTaskLabel': `Modello`,
    'loadTaskPresetTitle': `Carica modello di attività`,
    'location': `Posizione`,
    'locationBed': `Letto`,
    'locationClinic': `Clinica`,
    'locationRoom': `Stanza`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clinica`,
        'WARD': `Reparto`,
        'TEAM': `Team`,
        'ROOM': `Stanza`,
        'BED': `Letto`,
        'other': `Altro`,
      })
    },
    'locationWard': `Reparto`,
    'login': `Accedi`,
    'logInAgain': `Accedi di nuovo`,
    'loginRequired': `Accesso richiesto`,
    'loginRequiredDescription': `Per usare questo sito devi effettuare l'accesso.`,
    'logout': `Esci`,
    'male': `Maschio`,
    'markPatientDead': `Segna paziente come deceduto`,
    'markPatientDeadConfirmation': `Vuoi davvero segnare questo paziente come deceduto?`,
    'menu': `Menu`,
    'more': `Altro`,
    'myFavorites': `I miei preferiti`,
    'myOpenTasks': `Le mie attività aperte`,
    'myTasks': `Le mie attività`,
    'name': `Nome`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtro`,
        'other': `${count} filtri`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `No`,
    'noClosedTasks': `Nessuna attività chiusa`,
    'noLocationsFound': `Nessuna posizione trovata`,
    'none': `Nessuno`,
    'noNotifications': `Nessun aggiornamento recente`,
    'noOpenTasks': `Nessuna attività aperta`,
    'noPatient': `Nessun paziente`,
    'noPatientsInTaskView': `Nessun paziente trovato per questo accesso rapido alle attività.`,
    'noResultsFound': `Nessun risultato trovato`,
    'notAssigned': `Non assegnato`,
    'notifications': `Notifiche`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} paziente`,
        'other': `${count} pazienti`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} ordinamento`,
        'other': `${count} ordinamenti`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} attività`,
        'other': `${count} attività`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 anni`,
        '=1': `1 anno`,
        'other': `${years} anni`,
      })
    },
    'occupancy': `Occupazione`,
    'ok': `OK`,
    'onboardingSurvey': `Questionario iniziale`,
    'openSurvey': `Apri questionario`,
    'openTasks': `Attività aperte`,
    'openView': `Apri`,
    'option': `Opzione`,
    'organizations': `Organizzazioni`,
    'overview': `Panoramica`,
    'pages.404.loading': `Caricamento...`,
    'pages.404.notFound': `404 - Pagina non trovata`,
    'pages.404.notFoundDescription1': `Questa non è sicuramente la pagina che stai cercando`,
    'pages.404.notFoundDescription2': `Torna alla`,
    'patient': `Paziente`,
    'patientActions': `Azioni paziente`,
    'patientData': `Dati`,
    'patients': `Pazienti`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Ricoverati ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Totale ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `In attesa ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `In attesa`,
        'ADMITTED': `Ricoverato`,
        'DISCHARGED': `Dimesso`,
        'DEAD': `Deceduto`,
        'other': `Sconosciuto`,
      })
    },
    'patientsUpdatedRecently': `Pazienti aggiornati di recente`,
    'pickClinic': `Scegli la clinica`,
    'pickClinicDescription': `Seleziona la clinica per questo paziente. È possibile selezionare solo posizioni di tipo clinica.`,
    'pickPosition': `Scegli la posizione`,
    'pickPositionDescription': `Seleziona la posizione per questo paziente. Puoi selezionare ospedali, ambulatori, cliniche, reparti, letti o stanze.`,
    'pickTeams': `Scegli i team`,
    'pickTeamsDescription': `Seleziona uno o più team per questo paziente. Puoi selezionare cliniche, team, ambulatori od ospedali.`,
    'position': `Posizione`,
    'positionUpdated': `Posizione aggiornata`,
    'preferences': `Preferenze`,
    'priority': `Priorità`,
    'priorityLabel': `Priorità`,
    'priorityNone': `Nessuna`,
    'privacy': `Privacy`,
    'properties': `Proprietà`,
    'propertiesSettingsDescription': `Campi personalizzati per attività e pazienti: definisci i tipi e usali nei filtri.`,
    'property': `Proprietà`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Tema`,
        'other': `Temi`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Aggiungi ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Totale ${value}`
    },
    'readOnlyView': `Sola lettura`,
    'recentPatients': `I tuoi pazienti recenti`,
    'recentTasks': `Le tue attività recenti`,
    'rEdit': ({ name }): string => {
      return `Aggiorna ${name}`
    },
    'refreshing': `Aggiornamento…`,
    'removeProperty': `Rimuovi proprietà`,
    'removePropertyConfirmation': `Vuoi davvero rimuovere questa proprietà? L'operazione non può essere annullata.`,
    'retakeSurvey': `Ripeti questionario`,
    'rShow': ({ name }): string => {
      return `Mostra ${name}`
    },
    'savedViews': `Accesso rapido`,
    'saveView': `Salva accesso rapido`,
    'saveViewAsNew': `Salva come nuovo accesso rapido`,
    'saveViewDescription': `Assegna un nome a questo accesso rapido. Filtri, ordinamento, ricerca e posizione vengono salvati.`,
    'saveViewDescriptionFromSystemList': `Crea un nuovo accesso rapido da questo layout. Questa pagina è predefinita dall'app e non viene sovrascritta — apri l'accesso rapido dalla barra laterale quando ti serve.`,
    'saveViewOverwriteCurrent': `Sovrascrivi accesso rapido attuale`,
    'scopeChangeNode': `Cambia nodo`,
    'scopeNoNodeSelected': `Seleziona il nodo in cui salvare questa voce.`,
    'scopePrivate': `Privato`,
    'scopePrivateDescription': `Solo tu puoi vedere e usare questa voce.`,
    'scopePublic': `Pubblico`,
    'scopePublicDescription': `Chiunque abbia accesso al nodo selezionato o ai suoi sottonodi può vedere e usare questa voce.`,
    'scopeSelectNode': `Seleziona nodo`,
    'scopeShared': `Condiviso tramite link`,
    'scopeSharedDescription': `Solo tu vedi questa voce nei tuoi elenchi. Chiunque abbia accesso al nodo selezionato o ai suoi sottonodi può aprirla tramite il link.`,
    'scopeStoredAt': `Salvato in`,
    'scopeVisibility': `Condivisione`,
    'scrollToTop': `Torna su`,
    'search': `Cerca`,
    'searchLocations': `Cerca posizioni...`,
    'searchUserOrTeam': `Cerca utente (o team)...`,
    'searchUsersOrTeams': `Cerca utenti o team...`,
    'security': `Sicurezza`,
    'selectAll': `Seleziona tutto`,
    'selectAssignee': `Assegna a...`,
    'selectClinic': `Seleziona clinica`,
    'selectLocation': `Seleziona posizione`,
    'selectLocationDescription': `Seleziona la posizione assegnata al paziente.`,
    'selectOptions': `Seleziona opzioni`,
    'selectPosition': `Seleziona posizione`,
    'selectRootLocation': `Seleziona posizione principale`,
    'selectRootLocationDescription': `Seleziona le posizioni principali che definiscono il tuo ambito di accesso. È possibile selezionare solo ospedali, ambulatori, cliniche e team. Selezionando una posizione superiore vengono incluse tutte le posizioni sottostanti.`,
    'selectTeams': `Seleziona team`,
    'sessionExpired': `Sessione scaduta`,
    'sessionExpiredDescription': `Sei stato disconnesso per inattività. Accedi di nuovo per continuare. Eventuali modifiche non salvate potrebbero andare perse.`,
    'settings': `Impostazioni`,
    'settingsDescription': `Qui puoi modificare la configurazione dell'app.`,
    'sex': `Sesso`,
    'shiftHandover': `Passaggio di consegne`,
    'showAllTasks': `Mostra tutte le attività`,
    'showPatient': ({ name }): string => {
      return `Mostra paziente ${name}`
    },
    'showTeamTasks': `Mostra attività del team`,
    'sorting': `Ordinamento`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normale`,
        'P2': `Media`,
        'P3': `Alta`,
        'P4': `Critica`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Paziente`,
        'task': `Attività`,
        'other': `Tipo di oggetto non definito`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Selezione multipla`,
        'singleSelect': `Selezione singola`,
        'number': `Numero`,
        'text': `Testo`,
        'date': `Data`,
        'dateTime': `Data e ora`,
        'checkbox': `Casella di controllo`,
        'user': `Utente`,
        'other': `Tipo non definito`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Questa istanza pubblica di helpwave tasks è destinata a \\b{scopi di sviluppo e anteprima}. Assicurati di inserire \\b{solo} \\b{dati di test non riservati}. Questa istanza può essere \\negative{\\b{eliminata in qualsiasi momento}}`,
    'startRecording': `Avvia registrazione`,
    'stateUpdated': `Stato aggiornato`,
    'status': `Stato`,
    'stopRecording': `Interrompi registrazione`,
    'subjectType': `Tipo di oggetto`,
    'submissionDetails': `Dettagli dell'invio`,
    'submit': `Invia`,
    'submittingAs': ({ name }): string => {
      return `Invio come ${name}`
    },
    'surveyDescription': `Il tuo feedback è prezioso per noi. Dedica un momento alla compilazione del nostro questionario.`,
    'surveyTitle': `Aiutaci a migliorare helpwave tasks`,
    'system': `Sistema`,
    'task': `Attività`,
    'taskFromPresetTooltip': `Creata da un modello di attività`,
    'taskPresetAddRow': `Aggiungi attività`,
    'taskPresetApplyToRow': `Applica alla riga del modello`,
    'taskPresetCreate': `Crea modello`,
    'taskPresetDelete': `Elimina`,
    'taskPresetDeleteConfirm': `Eliminare questo modello di attività?`,
    'taskPresetEdit': `Modifica modello`,
    'taskPresetEditDetails': `Modifica dettagli`,
    'taskPresetEmptyList': `Ancora nessun modello di attività.`,
    'taskPresetKey': `Chiave`,
    'taskPresetKeyHint': `Chiave univoca opzionale per le ricerche. Lascia vuoto per generarla automaticamente.`,
    'taskPresetName': `Nome`,
    'taskPresetNoEstimate': `Nessuna stima`,
    'taskPresetNoTasks': `Questo modello non contiene attività.`,
    'taskPresetRemoveRow': `Rimuovi`,
    'taskPresets': `Modelli`,
    'taskPresetSave': `Salva modello`,
    'taskPresetsDescription': `Elenchi di attività riutilizzabili con dipendenze opzionali.`,
    'taskPresetSelectPlaceholder': `Seleziona un modello`,
    'taskPresetSourceNotFound': `Impossibile caricare il modello.`,
    'taskPresetSourceOpenSettings': `Apri nelle impostazioni`,
    'taskPresetSourceTasksInGraph': `Attività nel modello`,
    'taskPresetSourceTitle': `Modello di origine`,
    'tasks': `Attività`,
    'tasksCreatedFromPreset': `Attività create`,
    'tasksUpdatedRecently': `Attività aggiornate di recente`,
    'taskTitlePlaceholder': `Cosa bisogna fare?`,
    'teams': `Team`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Scuro`,
        'light': `Chiaro`,
        'system': `Sistema`,
        'other': `Sistema`,
      })
    },
    'timeEstimate': `Stima del tempo`,
    'title': `Titolo`,
    'totalPatients': `Pazienti totali`,
    'type': `Tipo`,
    'updated': `Aggiornato`,
    'url': `URL`,
    'user': `Utente`,
    'userInformation': `Informazioni utente`,
    'users': `Utenti`,
    'viewAnyoneWithLinkCanView': `Chiunque abbia il link può visualizzare`,
    'viewDerivedPatientsHint': `Pazienti presenti nelle attività di questo accesso rapido (senza duplicati).`,
    'views': `Accesso rapido`,
    'viewsEntityPatient': `Pazienti`,
    'viewsEntityTask': `Attività`,
    'viewSettings': `Accesso rapido`,
    'viewSettingsDescription': `Gestisci gli accessi rapidi salvati per attività e pazienti.`,
    'viewVisibility': `Visibilità`,
    'viewVisibilityLinkShared': `Condiviso tramite link`,
    'viewVisibilityPrivate': `Privato`,
    'waitingForPatient': `In attesa del paziente`,
    'waitPatient': `Metti paziente in attesa`,
    'wards': `Reparti`,
    'weeklySurvey': `Questionario settimanale`,
    'yes': `Sì`
  },
  'nl-NL': {
    'account': `Account`,
    'active': `Actief`,
    'add': `Toevoegen`,
    'addFastAccess': `Snelle toegang toevoegen`,
    'addFastAccessDescription': `Voer een naam in voor de nieuwe snelle toegang.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Patiënt toevoegen`,
    'addProperty': `Eigenschap toevoegen`,
    'addTask': `Taak toevoegen`,
    'admitPatient': `Patiënt opnemen`,
    'anonymous': `Anoniem`,
    'anonymousSubmission': `Anonieme inzending`,
    'archivedPropertyDescription': `Gearchiveerde eigenschappen kunnen niet meer aan objecten worden toegewezen.`,
    'archiveProperty': `Eigenschap archiveren`,
    'assignedTo': `Toegewezen aan`,
    'assigneeTeam': `Toegewezen team`,
    'authenticationFailed': `Authenticatie mislukt`,
    'birthdate': `Geboortedatum`,
    'cancel': `Annuleren`,
    'clear': `Wissen`,
    'clearCache': `Cache legen`,
    'clearPropertyColumnActionPatient': `Clear values for this property on listed patients`,
    'clearPropertyColumnActionTask': `Remove this property from listed tasks`,
    'clearPropertyColumnConfirmButtonPatient': `Clear property values`,
    'clearPropertyColumnConfirmButtonTask': `Remove property from tasks`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `This will clear all values for the property "${propertyName}" on ${count} patients currently loaded in this list. The property stays attached to those patients. Patients not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `This will permanently remove the property "${propertyName}" from ${count} tasks currently loaded in this list. Tasks not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogTitlePatient': `Clear property values on patients`,
    'clearPropertyColumnDialogTitleTask': `Remove property from tasks`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Type "${propertyName}" to confirm.`
    },
    'clinic': `Kliniek`,
    'clinics': `Klinieken`,
    'clinicUpdated': `Kliniek bijgewerkt`,
    'close': `Sluiten`,
    'closedTasks': `Afgeronde taken`,
    'collapseAll': `Alles invouwen`,
    'confirm': `Bevestigen`,
    'confirmDeleteView': `Deze opgeslagen snelle toegang verwijderen? Dit kan niet ongedaan worden gemaakt.`,
    'confirmSelection': `Selectie bevestigen`,
    'confirmShiftHandover': `Dienstwissel bevestigen`,
    'confirmShiftHandoverDescription': `Weet u zeker dat u alle open taken wilt overdragen aan de geselecteerde gebruiker?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Weet u zeker dat u `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} open taak`,
        'other': `${taskCount} open taken`,
      })
      _out += ` wilt overdragen aan ${name}?`
      return _out
    },
    'conflictDetected': `Conflict gedetecteerd`,
    'connectionConnected': `Verbonden`,
    'connectionConnecting': `Verbinden…`,
    'connectionDisconnected': `Verbinding verbroken`,
    'copyShareLink': `Link kopiëren`,
    'copyShareLinkEnableSharingFirst': `Schakel delen via link in zodat anderen met de link deze snelle toegang kunnen openen.`,
    'copyViewToMyViews': `Kopiëren naar mijn snelle toegang`,
    'create': `Aanmaken`,
    'createTask': `Taak aanmaken`,
    'creationDate': `Aanmaakdatum`,
    'currentTime': `Huidige tijd`,
    'dashboard': `Dashboard`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Goedemiddag, ${name}!`
    },
    'dashboardWelcomeDescription': `Dit is wat er vandaag gebeurt.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Goedenavond, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Goedemorgen, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Welterusten, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Goedemiddag, ${name}!`
    },
    'delete': `Verwijderen`,
    'deletePatient': `Patiënt verwijderen`,
    'deletePatientConfirmation': `Weet u zeker dat u deze patiënt wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`,
    'description': `Beschrijving`,
    'descriptionPlaceholder': `Meer details toevoegen...`,
    'deselectAll': `Alles deselecteren`,
    'developmentAndPreviewInstance': `Ontwikkel- en voorbeeldinstantie`,
    'discard': `Verwerpen`,
    'discardDraftMessage': `U heeft niet-opgeslagen invoer. Als u nu sluit, gaat alles verloren.`,
    'discardDraftTitle': `Concept verwerpen?`,
    'discardViewChanges': `Wijzigingen verwerpen`,
    'dischargePatient': `Patiënt ontslaan`,
    'dischargePatientConfirmation': `Weet u zeker dat u deze patiënt wilt ontslaan? Deze actie wijzigt de status van de patiënt.`,
    'dismiss': `Sluiten`,
    'dismissAll': `Alles sluiten`,
    'diverse': `Divers`,
    'done': `Klaar`,
    'dueDate': `Vervaldatum`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} dag`,
        'other': `${days} dagen`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} uur`,
        'other': `${hours} uur`,
      })
      return _out
    },
    'dueDateNow': `Nu`,
    'dueDateToday': `Vandaag`,
    'dueDateTomorrow': `Morgen`,
    'duplicate': `Duplicate`,
    'edit': `Bewerken`,
    'editPatient': `Patiënt bewerken`,
    'editPresetTask': `Presettaak bewerken`,
    'editTask': `Taak bewerken`,
    'enterFeedback': `Voer hier uw feedback in...`,
    'error': `Fout`,
    'errorOccurred': `Er is een fout opgetreden`,
    'estimatedTime': `Geschatte tijd (minuten)`,
    'expandAll': `Alles uitvouwen`,
    'export': `Exporteren`,
    'exportCsv': `Exporteren als CSV`,
    'exportExcel': `Exporteren als Excel (afdrukbaar)`,
    'exportFailed': `Exporteren mislukt. Probeer het opnieuw.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Deel uw feedback, meld bugs of stel verbeteringen voor.`,
    'female': `Vrouw`,
    'filter': `Filter`,
    'filterAll': `Alle`,
    'filterUndone': `Open`,
    'firstName': `Voornaam`,
    'freeBeds': `Vrije bedden`,
    'hide': `Verbergen`,
    'homePage': `Startpagina`,
    'imprint': `Impressum`,
    'inactive': `Inactief`,
    'install': `Installeren`,
    'installApp': `App installeren`,
    'installAppDescription': `Installeer helpwave tasks voor een betere ervaring met offline ondersteuning en snellere toegang.`,
    'language': `Taal`,
    'lastName': `Achternaam`,
    'listViewCard': `Kaartweergave`,
    'listViewTable': `Tabelweergave`,
    'loading': `Laden...`,
    'loadingAlmostThere': `Bijna klaar...`,
    'loadingGettingReady': `Een moment — we maken alles klaar...`,
    'loadingHangOn': `Even geduld — we halen de nieuwste gegevens op...`,
    'loadingMoment': `Nog heel even, bijna klaar...`,
    'loadMore': `Meer laden`,
    'loadTaskPreset': `Load preset`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Create `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} task`,
        'other': `${count} tasks`,
      })
      _out += ` for this patient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirm loading preset`,
    'loadTaskPresetCreateAndAssign': `Create & assign to me`,
    'loadTaskPresetSelectTasks': `Tasks from preset`,
    'loadTaskPresetTaskLabel': `Preset`,
    'loadTaskPresetTitle': `Load task preset`,
    'location': `Locatie`,
    'locationBed': `Bed`,
    'locationClinic': `Kliniek`,
    'locationRoom': `Kamer`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Kliniek`,
        'WARD': `Afdeling`,
        'TEAM': `Team`,
        'ROOM': `Kamer`,
        'BED': `Bed`,
        'other': `Overig`,
      })
    },
    'locationWard': `Afdeling`,
    'login': `Inloggen`,
    'logInAgain': `Opnieuw inloggen`,
    'loginRequired': `Inloggen vereist`,
    'loginRequiredDescription': `Om deze site te gebruiken moet u zijn ingelogd.`,
    'logout': `Uitloggen`,
    'male': `Man`,
    'markPatientDead': `Patiënt als overleden markeren`,
    'markPatientDeadConfirmation': `Weet u zeker dat u deze patiënt als overleden wilt markeren?`,
    'menu': `Menu`,
    'more': `Meer`,
    'myFavorites': `Mijn favorieten`,
    'myOpenTasks': `Mijn open taken`,
    'myTasks': `Mijn taken`,
    'name': `Naam`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filter`,
        'other': `${count} filters`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `Nee`,
    'noClosedTasks': `Geen afgeronde taken`,
    'noLocationsFound': `Geen locaties gevonden`,
    'none': `Geen`,
    'noNotifications': `Geen recente updates`,
    'noOpenTasks': `Geen open taken`,
    'noPatient': `Geen patiënt`,
    'noPatientsInTaskView': `Geen patiënten gevonden voor deze taak-snelle toegang.`,
    'noResultsFound': `Geen resultaten gevonden`,
    'notAssigned': `Niet toegewezen`,
    'notifications': `Meldingen`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Patiënt`,
        'other': `${count} Patiënten`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sortering`,
        'other': `${count} sorteringen`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Taak`,
        'other': `${count} Taken`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 jaar`,
        '=1': `1 jaar`,
        'other': `${years} jaar`,
      })
    },
    'occupancy': `Bezetting`,
    'ok': `OK`,
    'onboardingSurvey': `Onboarding-enquête`,
    'openSurvey': `Enquête openen`,
    'openTasks': `Open taken`,
    'openView': `Openen`,
    'option': `Optie`,
    'organizations': `Organisaties`,
    'overview': `Overzicht`,
    'pages.404.loading': `Laden...`,
    'pages.404.notFound': `404 - Pagina niet gevonden`,
    'pages.404.notFoundDescription1': `Dit is zeker niet de pagina die u zoekt`,
    'pages.404.notFoundDescription2': `Terug naar de`,
    'patient': `Patiënt`,
    'patientActions': `Patiëntacties`,
    'patientData': `Gegevens`,
    'patients': `Patiënten`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Opgenomen ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Totaal ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Wachtend ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Wachtend`,
        'ADMITTED': `Opgenomen`,
        'DISCHARGED': `Ontslagen`,
        'DEAD': `Overleden`,
        'other': `Onbekend`,
      })
    },
    'patientsUpdatedRecently': `Recent bijgewerkte patiënten`,
    'pickClinic': `Kies de kliniek`,
    'pickClinicDescription': `Selecteer de kliniek voor deze patiënt. Alleen klinieklocaties kunnen worden geselecteerd.`,
    'pickPosition': `Kies de locatie`,
    'pickPositionDescription': `Selecteer de locatie voor deze patiënt. U kunt ziekenhuis, praktijk, kliniek, afdeling, bed of kamer selecteren.`,
    'pickTeams': `Kies teams`,
    'pickTeamsDescription': `Selecteer een of meer teams voor deze patiënt. U kunt kliniek, team, praktijk of ziekenhuis selecteren.`,
    'position': `Locatie`,
    'positionUpdated': `Locatie bijgewerkt`,
    'preferences': `Voorkeuren`,
    'priority': `Prioriteit`,
    'priorityLabel': `Prioriteit`,
    'priorityNone': `Geen`,
    'privacy': `Privacy`,
    'properties': `Eigenschappen`,
    'propertiesSettingsDescription': `Aangepaste velden voor taken en patiënten: typen instellen en in filters gebruiken.`,
    'property': `Eigenschap`,
    'pThemes': ({ count }): string => {
      let _out: string = ''
      _out += `'`
      _out += TranslationGen.resolvePlural(count, {
        '=1': `Thema`,
        'other': `Themas`,
      })
      return _out
    },
    'rAdd': ({ name }): string => {
      return `${name} toevoegen`
    },
    'rChipTotal': ({ value }): string => {
      return `Totaal ${value}`
    },
    'readOnlyView': `Alleen-lezen`,
    'recentPatients': `Uw recente patiënten`,
    'recentTasks': `Uw recente taken`,
    'rEdit': ({ name }): string => {
      return `${name} bijwerken`
    },
    'refreshing': `Bijwerken…`,
    'removeProperty': `Eigenschap verwijderen`,
    'removePropertyConfirmation': `Weet u zeker dat u deze eigenschap wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`,
    'retakeSurvey': `Enquête opnieuw doen`,
    'rShow': ({ name }): string => {
      return `${name} tonen`
    },
    'savedViews': `Snelle toegang`,
    'saveView': `Snelle toegang opslaan`,
    'saveViewAsNew': `Opslaan als nieuwe snelle toegang`,
    'saveViewDescription': `Geef deze snelle toegang een naam. Filters, sortering, zoeken en locatie worden opgeslagen.`,
    'saveViewDescriptionFromSystemList': `Maakt een nieuwe snelle toegang op basis van deze indeling. Deze pagina is vast in de app en wordt niet ter plekke opgeslagen — open de snelle toegang vanuit de zijbalk wanneer nodig.`,
    'saveViewOverwriteCurrent': `Huidige snelle toegang overschrijven`,
    'scopeChangeNode': `Node wijzigen`,
    'scopeNoNodeSelected': `Selecteer de node waar dit item wordt opgeslagen.`,
    'scopePrivate': `Privé`,
    'scopePrivateDescription': `Alleen u kunt dit item zien en gebruiken.`,
    'scopePublic': `Openbaar`,
    'scopePublicDescription': `Iedereen met toegang tot de geselecteerde node of de onderliggende structuur kan dit item zien en gebruiken.`,
    'scopeSelectNode': `Node selecteren`,
    'scopeShared': `Gedeeld via link`,
    'scopeSharedDescription': `Alleen u ziet dit item in uw lijsten. Iedereen met toegang tot het geselecteerde knooppunt of de onderliggende structuur kan het via de link openen.`,
    'scopeStoredAt': `Opgeslagen bij`,
    'scopeVisibility': `Delen`,
    'scrollToTop': `Naar boven scrollen`,
    'search': `Zoeken`,
    'searchLocations': `Locaties zoeken...`,
    'searchUserOrTeam': `Zoek gebruiker (of team)...`,
    'searchUsersOrTeams': `Zoek gebruikers of teams...`,
    'security': `Beveiliging`,
    'selectAll': `Alles selecteren`,
    'selectAssignee': `Toewijzen aan...`,
    'selectClinic': `Kliniek selecteren`,
    'selectLocation': `Locatie selecteren`,
    'selectLocationDescription': `Selecteer de toegewezen locatie voor de patiënt.`,
    'selectOptions': `Opties`,
    'selectPosition': `Locatie selecteren`,
    'selectRootLocation': `Hooflocatie selecteren`,
    'selectRootLocationDescription': `Selecteer de hoofdlocaties die uw bereik bepalen. Alleen ziekenhuizen, praktijken, klinieken en teams kunnen worden geselecteerd. Het selecteren van een bovenliggende locatie omvat alle onderliggende.`,
    'selectTeams': `Teams selecteren`,
    'sessionExpired': `Sessie verlopen`,
    'sessionExpiredDescription': `U bent uitgelogd wegens inactiviteit. Log opnieuw in om door te gaan. Niet-opgeslagen wijzigingen kunnen verloren gaan.`,
    'settings': `Instellingen`,
    'settingsDescription': `Hier kunt u de app-configuratie wijzigen.`,
    'sex': `Geslacht`,
    'shiftHandover': `Dienstwissel`,
    'showAllTasks': `Alle taken tonen`,
    'showPatient': ({ name }): string => {
      return `Patiënt ${name} tonen`
    },
    'showTeamTasks': `Teamtaken tonen`,
    'sorting': `Sorteren`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normaal`,
        'P2': `Medium`,
        'P3': `Hoog`,
        'P4': `Kritiek`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Patiënt`,
        'task': `Taak`,
        'other': `Ongedefinieerd onderwerptype`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Meerdere selectie`,
        'singleSelect': `Enkele selectie`,
        'number': `Getal`,
        'text': `Tekst`,
        'date': `Datum`,
        'dateTime': `Tijdstip`,
        'checkbox': `Selectievakje`,
        'user': `Gebruiker`,
        'other': `Ongedefinieerd type`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Deze openbare instantie van helpwave tasks is voor \\b{ontwikkeling en voorbeeld}. Zorg ervoor dat u \\b{alleen} \\b{niet-vertrouwelijke testgegevens} invoert. Deze instantie kan \\negative{\\b{op elk moment worden verwijderd}}`,
    'startRecording': `Opname starten`,
    'stateUpdated': `Status bijgewerkt`,
    'status': `Status`,
    'stopRecording': `Opname stoppen`,
    'subjectType': `Onderwerptype`,
    'submissionDetails': `Inzendingsgegevens`,
    'submit': `Verzenden`,
    'submittingAs': ({ name }): string => {
      return `Verzenden als ${name}`
    },
    'surveyDescription': `Uw feedback is waardevol. Neem een moment om onze enquête in te vullen.`,
    'surveyTitle': `Help ons helpwave tasks te verbeteren`,
    'system': `Systeem`,
    'task': `Taak`,
    'taskFromPresetTooltip': `Created from a task preset`,
    'taskPresetAddRow': `Add task`,
    'taskPresetApplyToRow': `Apply to preset row`,
    'taskPresetCreate': `Create preset`,
    'taskPresetDelete': `Delete`,
    'taskPresetDeleteConfirm': `Delete this task preset?`,
    'taskPresetEdit': `Preset bewerken`,
    'taskPresetEditDetails': `Edit details`,
    'taskPresetEmptyList': `No task presets yet.`,
    'taskPresetKey': `Key`,
    'taskPresetKeyHint': `Optional unique key for lookups. Leave empty to generate automatically.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `No estimate`,
    'taskPresetNoTasks': `This preset has no tasks.`,
    'taskPresetRemoveRow': `Remove`,
    'taskPresets': `Presets`,
    'taskPresetSave': `Save preset`,
    'taskPresetsDescription': `Reusable task lists with optional dependencies.`,
    'taskPresetSelectPlaceholder': `Select a preset`,
    'taskPresetSourceNotFound': `Preset could not be loaded.`,
    'taskPresetSourceOpenSettings': `Open in settings`,
    'taskPresetSourceTasksInGraph': `Tasks in template`,
    'taskPresetSourceTitle': `Source preset`,
    'tasks': `Taken`,
    'tasksCreatedFromPreset': `Tasks created`,
    'tasksUpdatedRecently': `Recent bijgewerkte taken`,
    'taskTitlePlaceholder': `Wat moet er gedaan worden?`,
    'teams': `Teams`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Donker`,
        'light': `Licht`,
        'system': `Systeem`,
        'other': `Systeem`,
      })
    },
    'timeEstimate': `Geschatte tijd`,
    'title': `Titel`,
    'totalPatients': `Totaal patiënten`,
    'type': `Type`,
    'updated': `Bijgewerkt`,
    'url': `URL`,
    'user': `Gebruiker`,
    'userInformation': `Gebruikersinformatie`,
    'users': `Gebruikers`,
    'viewAnyoneWithLinkCanView': `Iedereen met de link kan bekijken`,
    'viewDerivedPatientsHint': `Patiënten die voorkomen bij taken die bij deze snelle toegang horen (uniek).`,
    'views': `Snelle toegang`,
    'viewsEntityPatient': `Patiënten`,
    'viewsEntityTask': `Taken`,
    'viewSettings': `Snelle toegang`,
    'viewSettingsDescription': `Beheer opgeslagen snelle toegang voor taken en patiënten.`,
    'viewVisibility': `Zichtbaarheid`,
    'viewVisibilityLinkShared': `Gedeelde link`,
    'viewVisibilityPrivate': `Privé`,
    'waitingForPatient': `Wachten op patiënt`,
    'waitPatient': `Patiënt in wachtrij zetten`,
    'wards': `Afdelingen`,
    'weeklySurvey': `Wekelijkse enquête`,
    'yes': `Ja`
  },
  'pl-PL': {
    'account': `Konto`,
    'active': `Aktywny`,
    'add': `Dodaj`,
    'addFastAccess': `Dodaj szybki dostęp`,
    'addFastAccessDescription': `Podaj nazwę nowego szybkiego dostępu.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Dodaj pacjenta`,
    'addProperty': `Dodaj właściwość`,
    'addTask': `Dodaj zadanie`,
    'admitPatient': `Przyjmij pacjenta`,
    'anonymous': `Anonimowo`,
    'anonymousSubmission': `Zgłoszenie anonimowe`,
    'archivedPropertyDescription': `Zarchiwizowanych właściwości nie można już przypisywać do obiektów.`,
    'archiveProperty': `Archiwizuj właściwość`,
    'assignedTo': `Przypisano do`,
    'assigneeTeam': `Przypisany zespół`,
    'authenticationFailed': `Uwierzytelnianie nie powiodło się`,
    'birthdate': `Data urodzenia`,
    'cancel': `Anuluj`,
    'clear': `Wyczyść`,
    'clearCache': `Wyczyść pamięć podręczną`,
    'clearPropertyColumnActionPatient': `Wyczyść wartości tej właściwości u wyświetlonych pacjentów`,
    'clearPropertyColumnActionTask': `Usuń tę właściwość z wyświetlonych zadań`,
    'clearPropertyColumnConfirmButtonPatient': `Wyczyść wartości właściwości`,
    'clearPropertyColumnConfirmButtonTask': `Usuń właściwość z zadań`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Spowoduje to wyczyszczenie wszystkich wartości właściwości "${propertyName}" u pacjentów aktualnie wczytanych na tej liście (liczba: ${count}). Właściwość pozostanie przypisana do tych pacjentów. Pacjenci niewczytani na tej liście nie zostaną zmienieni.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `Spowoduje to trwałe usunięcie właściwości "${propertyName}" z zadań aktualnie wczytanych na tej liście (liczba: ${count}). Zadania niewczytane na tej liście nie zostaną zmienione.`
    },
    'clearPropertyColumnDialogTitlePatient': `Wyczyść wartości właściwości u pacjentów`,
    'clearPropertyColumnDialogTitleTask': `Usuń właściwość z zadań`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Wpisz "${propertyName}", aby potwierdzić.`
    },
    'clinic': `Klinika`,
    'clinics': `Kliniki`,
    'clinicUpdated': `Zaktualizowano klinikę`,
    'close': `Zamknij`,
    'closedTasks': `Zamknięte zadania`,
    'collapseAll': `Zwiń wszystko`,
    'confirm': `Potwierdź`,
    'confirmDeleteView': `Usunąć ten zapisany szybki dostęp? Tej operacji nie można cofnąć.`,
    'confirmSelection': `Potwierdź wybór`,
    'confirmShiftHandover': `Potwierdź przekazanie dyżuru`,
    'confirmShiftHandoverDescription': `Czy na pewno chcesz przekazać wszystkie otwarte zadania wybranemu użytkownikowi?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Czy na pewno chcesz przekazać `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} otwarte zadanie`,
        'few': `${taskCount} otwarte zadania`,
        'many': `${taskCount} otwartych zadań`,
        'other': `${taskCount} otwartego zadania`,
      })
      _out += ` użytkownikowi ${name}?`
      return _out
    },
    'conflictDetected': `Wykryto konflikt`,
    'connectionConnected': `Połączono`,
    'connectionConnecting': `Łączenie…`,
    'connectionDisconnected': `Rozłączono`,
    'copyShareLink': `Kopiuj link`,
    'copyShareLinkEnableSharingFirst': `Włącz udostępnianie przez link, aby inne osoby z linkiem mogły otworzyć ten szybki dostęp.`,
    'copyViewToMyViews': `Kopiuj do mojego szybkiego dostępu`,
    'create': `Utwórz`,
    'createTask': `Utwórz zadanie`,
    'creationDate': `Data utworzenia`,
    'currentTime': `Aktualny czas`,
    'dashboard': `Pulpit`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Dzień dobry, ${name}!`
    },
    'dashboardWelcomeDescription': `Oto co dzieje się dzisiaj.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Dobry wieczór, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Dzień dobry, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Dobranoc, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Dzień dobry, ${name}!`
    },
    'delete': `Usuń`,
    'deletePatient': `Usuń pacjenta`,
    'deletePatientConfirmation': `Czy na pewno chcesz usunąć tego pacjenta? Tej operacji nie można cofnąć.`,
    'description': `Opis`,
    'descriptionPlaceholder': `Dodaj więcej szczegółów...`,
    'deselectAll': `Odznacz wszystko`,
    'developmentAndPreviewInstance': `Instancja deweloperska i podglądowa`,
    'discard': `Odrzuć`,
    'discardDraftMessage': `Masz niezapisane wpisy. Jeśli teraz zamkniesz, wszystkie wprowadzone dane zostaną utracone.`,
    'discardDraftTitle': `Odrzucić wersję roboczą?`,
    'discardViewChanges': `Odrzuć zmiany`,
    'dischargePatient': `Wypisz pacjenta`,
    'dischargePatientConfirmation': `Czy na pewno chcesz wypisać tego pacjenta? Ta operacja zmieni status pacjenta.`,
    'dismiss': `Odrzuć`,
    'dismissAll': `Odrzuć wszystkie`,
    'diverse': `Inna`,
    'done': `Gotowe`,
    'dueDate': `Termin`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} dzień`,
        'few': `${days} dni`,
        'many': `${days} dni`,
        'other': `${days} dnia`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} godzina`,
        'few': `${hours} godziny`,
        'many': `${hours} godzin`,
        'other': `${hours} godziny`,
      })
      return _out
    },
    'dueDateNow': `Teraz`,
    'dueDateToday': `Dzisiaj`,
    'dueDateTomorrow': `Jutro`,
    'duplicate': `Duplikuj`,
    'edit': `Edytuj`,
    'editPatient': `Edytuj pacjenta`,
    'editPresetTask': `Edytuj zadanie szablonu`,
    'editTask': `Edytuj zadanie`,
    'enterFeedback': `Wpisz tutaj swoją opinię...`,
    'error': `Błąd`,
    'errorOccurred': `Wystąpił błąd`,
    'estimatedTime': `Szacowany czas (minuty)`,
    'expandAll': `Rozwiń wszystko`,
    'export': `Eksportuj`,
    'exportCsv': `Eksportuj jako CSV`,
    'exportExcel': `Eksportuj jako Excel (do druku)`,
    'exportFailed': `Eksport nie powiódł się. Spróbuj ponownie.`,
    'feedback': `Opinia`,
    'feedbackDescription': `Podziel się opinią, zgłoś błędy lub zaproponuj ulepszenia.`,
    'female': `Kobieta`,
    'filter': `Filtr`,
    'filterAll': `Wszystkie`,
    'filterUndone': `Niewykonane`,
    'firstName': `Imię`,
    'freeBeds': `Wolne łóżka`,
    'hide': `Ukryj`,
    'homePage': `Strona główna`,
    'imprint': `Nota prawna`,
    'inactive': `Nieaktywny`,
    'install': `Zainstaluj`,
    'installApp': `Zainstaluj aplikację`,
    'installAppDescription': `Zainstaluj helpwave tasks, aby korzystać z trybu offline i szybszego dostępu.`,
    'language': `Język`,
    'lastName': `Nazwisko`,
    'listViewCard': `Widok kart`,
    'listViewTable': `Widok tabeli`,
    'loading': `Ładowanie...`,
    'loadingAlmostThere': `Prawie gotowe...`,
    'loadingGettingReady': `Chwileczkę — przygotowujemy wszystko...`,
    'loadingHangOn': `Chwileczkę — pobieramy najnowsze dane...`,
    'loadingMoment': `Sekunda, prawie gotowe...`,
    'loadMore': `Wczytaj więcej`,
    'loadTaskPreset': `Wczytaj szablon`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Utworzyć `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} zadanie`,
        'few': `${count} zadania`,
        'many': `${count} zadań`,
        'other': `${count} zadania`,
      })
      _out += ` dla tego pacjenta?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Potwierdź wczytanie szablonu`,
    'loadTaskPresetCreateAndAssign': `Utwórz i przypisz do mnie`,
    'loadTaskPresetSelectTasks': `Zadania z szablonu`,
    'loadTaskPresetTaskLabel': `Szablon`,
    'loadTaskPresetTitle': `Wczytaj szablon zadań`,
    'location': `Lokalizacja`,
    'locationBed': `Łóżko`,
    'locationClinic': `Klinika`,
    'locationRoom': `Sala`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Klinika`,
        'WARD': `Oddział`,
        'TEAM': `Zespół`,
        'ROOM': `Sala`,
        'BED': `Łóżko`,
        'other': `Inne`,
      })
    },
    'locationWard': `Oddział`,
    'login': `Zaloguj się`,
    'logInAgain': `Zaloguj się ponownie`,
    'loginRequired': `Wymagane logowanie`,
    'loginRequiredDescription': `Aby korzystać z tej strony, musisz się zalogować.`,
    'logout': `Wyloguj się`,
    'male': `Mężczyzna`,
    'markPatientDead': `Oznacz pacjenta jako zmarłego`,
    'markPatientDeadConfirmation': `Czy na pewno chcesz oznaczyć tego pacjenta jako zmarłego?`,
    'menu': `Menu`,
    'more': `Więcej`,
    'myFavorites': `Moje ulubione`,
    'myOpenTasks': `Moje otwarte zadania`,
    'myTasks': `Moje zadania`,
    'name': `Nazwa`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtr`,
        'few': `${count} filtry`,
        'many': `${count} filtrów`,
        'other': `${count} filtra`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `Nie`,
    'noClosedTasks': `Brak zamkniętych zadań`,
    'noLocationsFound': `Nie znaleziono lokalizacji`,
    'none': `Brak`,
    'noNotifications': `Brak nowych aktualizacji`,
    'noOpenTasks': `Brak otwartych zadań`,
    'noPatient': `Brak pacjenta`,
    'noPatientsInTaskView': `Nie znaleziono pacjentów dla tego szybkiego dostępu do zadań.`,
    'noResultsFound': `Nie znaleziono wyników`,
    'notAssigned': `Nieprzypisane`,
    'notifications': `Powiadomienia`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} pacjent`,
        'few': `${count} pacjentów`,
        'many': `${count} pacjentów`,
        'other': `${count} pacjenta`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sortowanie`,
        'few': `${count} sortowania`,
        'many': `${count} sortowań`,
        'other': `${count} sortowania`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} zadanie`,
        'few': `${count} zadania`,
        'many': `${count} zadań`,
        'other': `${count} zadania`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 lat`,
        '=1': `1 rok`,
        'few': `${years} lata`,
        'many': `${years} lat`,
        'other': `${years} roku`,
      })
    },
    'occupancy': `Obłożenie`,
    'ok': `OK`,
    'onboardingSurvey': `Ankieta wdrożeniowa`,
    'openSurvey': `Otwórz ankietę`,
    'openTasks': `Otwarte zadania`,
    'openView': `Otwórz`,
    'option': `Opcja`,
    'organizations': `Organizacje`,
    'overview': `Przegląd`,
    'pages.404.loading': `Ładowanie...`,
    'pages.404.notFound': `404 - Nie znaleziono strony`,
    'pages.404.notFoundDescription1': `To na pewno nie jest strona, której szukasz`,
    'pages.404.notFoundDescription2': `Wróć do`,
    'patient': `Pacjent`,
    'patientActions': `Działania dotyczące pacjenta`,
    'patientData': `Dane`,
    'patients': `Pacjenci`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Przyjęci ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Łącznie ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Oczekujący ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Oczekujący`,
        'ADMITTED': `Przyjęty`,
        'DISCHARGED': `Wypisany`,
        'DEAD': `Zmarły`,
        'other': `Nieznany`,
      })
    },
    'patientsUpdatedRecently': `Ostatnio zaktualizowani pacjenci`,
    'pickClinic': `Wybierz klinikę`,
    'pickClinicDescription': `Wybierz klinikę dla tego pacjenta. Można wybrać tylko lokalizacje typu klinika.`,
    'pickPosition': `Wybierz lokalizację`,
    'pickPositionDescription': `Wybierz lokalizację dla tego pacjenta. Możesz wybrać szpital, praktykę, klinikę, oddział, łóżko lub salę.`,
    'pickTeams': `Wybierz zespoły`,
    'pickTeamsDescription': `Wybierz jeden lub więcej zespołów dla tego pacjenta. Możesz wybrać klinikę, zespół, praktykę lub szpital.`,
    'position': `Lokalizacja`,
    'positionUpdated': `Zaktualizowano lokalizację`,
    'preferences': `Preferencje`,
    'priority': `Priorytet`,
    'priorityLabel': `Priorytet`,
    'priorityNone': `Brak`,
    'privacy': `Prywatność`,
    'properties': `Właściwości`,
    'propertiesSettingsDescription': `Własne pola dla zadań i pacjentów: zdefiniuj typy i używaj ich w filtrach.`,
    'property': `Właściwość`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Motyw`,
        'few': `Motywy`,
        'many': `Motywy`,
        'other': `Motywy`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Dodaj ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Łącznie ${value}`
    },
    'readOnlyView': `Tylko do odczytu`,
    'recentPatients': `Twoi ostatni pacjenci`,
    'recentTasks': `Twoje ostatnie zadania`,
    'rEdit': ({ name }): string => {
      return `Zaktualizuj ${name}`
    },
    'refreshing': `Odświeżanie…`,
    'removeProperty': `Usuń właściwość`,
    'removePropertyConfirmation': `Czy na pewno chcesz usunąć tę właściwość? Tej operacji nie można cofnąć.`,
    'retakeSurvey': `Wypełnij ankietę ponownie`,
    'rShow': ({ name }): string => {
      return `Pokaż ${name}`
    },
    'savedViews': `Szybki dostęp`,
    'saveView': `Zapisz szybki dostęp`,
    'saveViewAsNew': `Zapisz jako nowy szybki dostęp`,
    'saveViewDescription': `Nazwij ten szybki dostęp. Filtry, sortowanie, wyszukiwanie i lokalizacja zostaną zapisane.`,
    'saveViewDescriptionFromSystemList': `Tworzy nowy wpis szybkiego dostępu na podstawie tego układu. Ta strona jest stała w aplikacji i nie jest nadpisywana — otwórz szybki dostęp z paska bocznego, gdy będzie potrzebny.`,
    'saveViewOverwriteCurrent': `Nadpisz bieżący szybki dostęp`,
    'scopeChangeNode': `Zmień węzeł`,
    'scopeNoNodeSelected': `Wybierz węzeł, w którym zostanie zapisany ten wpis.`,
    'scopePrivate': `Prywatny`,
    'scopePrivateDescription': `Tylko Ty możesz widzieć i używać tego wpisu.`,
    'scopePublic': `Publiczny`,
    'scopePublicDescription': `Każdy, kto ma dostęp do wybranego węzła lub jego poddrzewa, może widzieć i używać tego wpisu.`,
    'scopeSelectNode': `Wybierz węzeł`,
    'scopeShared': `Udostępniony przez link`,
    'scopeSharedDescription': `Tylko Ty widzisz ten wpis na swoich listach. Każdy, kto ma dostęp do wybranego węzła lub jego poddrzewa, może go otworzyć przez link.`,
    'scopeStoredAt': `Zapisano w`,
    'scopeVisibility': `Udostępnianie`,
    'scrollToTop': `Przewiń na górę`,
    'search': `Szukaj`,
    'searchLocations': `Szukaj lokalizacji...`,
    'searchUserOrTeam': `Szukaj użytkownika (lub zespołu)...`,
    'searchUsersOrTeams': `Szukaj użytkowników lub zespołów...`,
    'security': `Bezpieczeństwo`,
    'selectAll': `Zaznacz wszystko`,
    'selectAssignee': `Przypisz do...`,
    'selectClinic': `Wybierz klinikę`,
    'selectLocation': `Wybierz lokalizację`,
    'selectLocationDescription': `Wybierz lokalizację przypisaną do pacjenta.`,
    'selectOptions': `Wybierz opcje`,
    'selectPosition': `Wybierz lokalizację`,
    'selectRootLocation': `Wybierz lokalizację główną`,
    'selectRootLocationDescription': `Wybierz lokalizacje główne określające Twój zakres dostępu. Można wybrać tylko szpitale, praktyki, kliniki i zespoły. Wybór lokalizacji nadrzędnej obejmuje wszystkie jej lokalizacje podrzędne.`,
    'selectTeams': `Wybierz zespoły`,
    'sessionExpired': `Sesja wygasła`,
    'sessionExpiredDescription': `Zostałeś wylogowany z powodu braku aktywności. Zaloguj się ponownie, aby kontynuować. Niezapisane zmiany mogą zostać utracone.`,
    'settings': `Ustawienia`,
    'settingsDescription': `Tutaj możesz zmienić konfigurację aplikacji.`,
    'sex': `Płeć`,
    'shiftHandover': `Przekazanie dyżuru`,
    'showAllTasks': `Pokaż wszystkie zadania`,
    'showPatient': ({ name }): string => {
      return `Pokaż pacjenta ${name}`
    },
    'showTeamTasks': `Pokaż zadania zespołu`,
    'sorting': `Sortowanie`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normalny`,
        'P2': `Średni`,
        'P3': `Wysoki`,
        'P4': `Krytyczny`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Pacjent`,
        'task': `Zadanie`,
        'other': `Nieokreślony typ obiektu`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Wielokrotny wybór`,
        'singleSelect': `Pojedynczy wybór`,
        'number': `Liczba`,
        'text': `Tekst`,
        'date': `Data`,
        'dateTime': `Data i godzina`,
        'checkbox': `Pole wyboru`,
        'user': `Użytkownik`,
        'other': `Nieokreślony typ`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Ta publiczna instancja helpwave tasks służy \\b{do celów deweloperskich i podglądowych}. Wprowadzaj \\b{wyłącznie} \\b{niepoufne dane testowe}. Ta instancja może zostać \\negative{\\b{usunięta w dowolnym momencie}}`,
    'startRecording': `Rozpocznij nagrywanie`,
    'stateUpdated': `Zaktualizowano status`,
    'status': `Status`,
    'stopRecording': `Zatrzymaj nagrywanie`,
    'subjectType': `Typ obiektu`,
    'submissionDetails': `Szczegóły zgłoszenia`,
    'submit': `Wyślij`,
    'submittingAs': ({ name }): string => {
      return `Wysyłasz jako ${name}`
    },
    'surveyDescription': `Twoja opinia jest dla nas cenna. Poświęć chwilę na wypełnienie naszej ankiety.`,
    'surveyTitle': `Pomóż nam ulepszyć helpwave tasks`,
    'system': `System`,
    'task': `Zadanie`,
    'taskFromPresetTooltip': `Utworzono z szablonu zadań`,
    'taskPresetAddRow': `Dodaj zadanie`,
    'taskPresetApplyToRow': `Zastosuj do wiersza szablonu`,
    'taskPresetCreate': `Utwórz szablon`,
    'taskPresetDelete': `Usuń`,
    'taskPresetDeleteConfirm': `Usunąć ten szablon zadań?`,
    'taskPresetEdit': `Edytuj szablon`,
    'taskPresetEditDetails': `Edytuj szczegóły`,
    'taskPresetEmptyList': `Brak szablonów zadań.`,
    'taskPresetKey': `Klucz`,
    'taskPresetKeyHint': `Opcjonalny unikalny klucz do wyszukiwania. Pozostaw puste, aby wygenerować automatycznie.`,
    'taskPresetName': `Nazwa`,
    'taskPresetNoEstimate': `Brak szacunku`,
    'taskPresetNoTasks': `Ten szablon nie zawiera zadań.`,
    'taskPresetRemoveRow': `Usuń`,
    'taskPresets': `Szablony`,
    'taskPresetSave': `Zapisz szablon`,
    'taskPresetsDescription': `Listy zadań wielokrotnego użytku z opcjonalnymi zależnościami.`,
    'taskPresetSelectPlaceholder': `Wybierz szablon`,
    'taskPresetSourceNotFound': `Nie udało się wczytać szablonu.`,
    'taskPresetSourceOpenSettings': `Otwórz w ustawieniach`,
    'taskPresetSourceTasksInGraph': `Zadania w szablonie`,
    'taskPresetSourceTitle': `Szablon źródłowy`,
    'tasks': `Zadania`,
    'tasksCreatedFromPreset': `Utworzono zadania`,
    'tasksUpdatedRecently': `Ostatnio zaktualizowane zadania`,
    'taskTitlePlaceholder': `Co trzeba zrobić?`,
    'teams': `Zespoły`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Ciemny`,
        'light': `Jasny`,
        'system': `Systemowy`,
        'other': `Systemowy`,
      })
    },
    'timeEstimate': `Szacowany czas`,
    'title': `Tytuł`,
    'totalPatients': `Łącznie pacjentów`,
    'type': `Typ`,
    'updated': `Zaktualizowano`,
    'url': `URL`,
    'user': `Użytkownik`,
    'userInformation': `Informacje o użytkowniku`,
    'users': `Użytkownicy`,
    'viewAnyoneWithLinkCanView': `Każda osoba z linkiem może wyświetlać`,
    'viewDerivedPatientsHint': `Pacjenci występujący w zadaniach pasujących do tego szybkiego dostępu (bez powtórzeń).`,
    'views': `Szybki dostęp`,
    'viewsEntityPatient': `Pacjenci`,
    'viewsEntityTask': `Zadania`,
    'viewSettings': `Szybki dostęp`,
    'viewSettingsDescription': `Zarządzaj zapisanym szybkim dostępem do zadań i pacjentów.`,
    'viewVisibility': `Widoczność`,
    'viewVisibilityLinkShared': `Udostępniony przez link`,
    'viewVisibilityPrivate': `Prywatny`,
    'waitingForPatient': `Oczekiwanie na pacjenta`,
    'waitPatient': `Ustaw pacjenta jako oczekującego`,
    'wards': `Oddziały`,
    'weeklySurvey': `Ankieta tygodniowa`,
    'yes': `Tak`
  },
  'pt-BR': {
    'account': `Conta`,
    'active': `Ativo`,
    'add': `Adicionar`,
    'addFastAccess': `Adicionar acesso rápido`,
    'addFastAccessDescription': `Adicione um nome para o novo acesso rápido.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Adicionar paciente`,
    'addProperty': `Adicionar propriedade`,
    'addTask': `Adicionar tarefa`,
    'admitPatient': `Internar paciente`,
    'anonymous': `Anônimo`,
    'anonymousSubmission': `Envio anônimo`,
    'archivedPropertyDescription': `Propriedades arquivadas não podem mais ser atribuídas a objetos.`,
    'archiveProperty': `Arquivar propriedade`,
    'assignedTo': `Atribuído a`,
    'assigneeTeam': `Equipe atribuída`,
    'authenticationFailed': `Falha na autenticação`,
    'birthdate': `Data de nascimento`,
    'cancel': `Cancelar`,
    'clear': `Limpar`,
    'clearCache': `Limpar cache`,
    'clearPropertyColumnActionPatient': `Clear values for this property on listed patients`,
    'clearPropertyColumnActionTask': `Remove this property from listed tasks`,
    'clearPropertyColumnConfirmButtonPatient': `Clear property values`,
    'clearPropertyColumnConfirmButtonTask': `Remove property from tasks`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `This will clear all values for the property "${propertyName}" on ${count} patients currently loaded in this list. The property stays attached to those patients. Patients not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `This will permanently remove the property "${propertyName}" from ${count} tasks currently loaded in this list. Tasks not loaded in this list are not affected.`
    },
    'clearPropertyColumnDialogTitlePatient': `Clear property values on patients`,
    'clearPropertyColumnDialogTitleTask': `Remove property from tasks`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Type "${propertyName}" to confirm.`
    },
    'clinic': `Clínica`,
    'clinics': `Clínicas`,
    'clinicUpdated': `Clínica atualizada`,
    'close': `Fechar`,
    'closedTasks': `Tarefas concluídas`,
    'collapseAll': `Recolher tudo`,
    'confirm': `Confirmar`,
    'confirmDeleteView': `Excluir este acesso rápido salvo? Esta ação não pode ser desfeita.`,
    'confirmSelection': `Confirmar seleção`,
    'confirmShiftHandover': `Confirmar passagem de turno`,
    'confirmShiftHandoverDescription': `Tem certeza de que deseja transferir todas as tarefas abertas para o usuário selecionado?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Tem certeza de que deseja transferir `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} tarefa aberta`,
        'other': `${taskCount} tarefas abertas`,
      })
      _out += ` para ${name}?`
      return _out
    },
    'conflictDetected': `Conflito detectado`,
    'connectionConnected': `Conectado`,
    'connectionConnecting': `Conectando…`,
    'connectionDisconnected': `Desconectado`,
    'copyShareLink': `Copiar link`,
    'copyShareLinkEnableSharingFirst': `Ative o compartilhamento por link para que outras pessoas com o link possam abrir este acesso rápido.`,
    'copyViewToMyViews': `Copiar para meu acesso rápido`,
    'create': `Criar`,
    'createTask': `Criar tarefa`,
    'creationDate': `Data de criação`,
    'currentTime': `Hora atual`,
    'dashboard': `Painel`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Boa tarde, ${name}!`
    },
    'dashboardWelcomeDescription': `Eis o que está acontecendo hoje.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Boa noite, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Bom dia, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Boa noite, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Boa tarde, ${name}!`
    },
    'delete': `Excluir`,
    'deletePatient': `Excluir paciente`,
    'deletePatientConfirmation': `Tem certeza de que deseja excluir este paciente? Esta ação não pode ser desfeita.`,
    'description': `Descrição`,
    'descriptionPlaceholder': `Adicionar mais detalhes...`,
    'deselectAll': `Desmarcar todos`,
    'developmentAndPreviewInstance': `Instância de desenvolvimento e pré-visualização`,
    'discard': `Descartar`,
    'discardDraftMessage': `Há dados não salvos. Se fechar agora, tudo será perdido.`,
    'discardDraftTitle': `Descartar rascunho?`,
    'discardViewChanges': `Descartar alterações`,
    'dischargePatient': `Dar alta ao paciente`,
    'dischargePatientConfirmation': `Tem certeza de que deseja dar alta a este paciente? Esta ação alterará o estado do paciente.`,
    'dismiss': `Fechar`,
    'dismissAll': `Descartar todas`,
    'diverse': `Diverso`,
    'done': `Concluído`,
    'dueDate': `Data de vencimento`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} dia`,
        'other': `${days} dias`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} hora`,
        'other': `${hours} horas`,
      })
      return _out
    },
    'dueDateNow': `Agora`,
    'dueDateToday': `Hoje`,
    'dueDateTomorrow': `Amanhã`,
    'duplicate': `Duplicate`,
    'edit': `Editar`,
    'editPatient': `Editar paciente`,
    'editPresetTask': `Editar tarefa do Preset`,
    'editTask': `Editar tarefa`,
    'enterFeedback': `Digite seu feedback aqui...`,
    'error': `Erro`,
    'errorOccurred': `Ocorreu um erro`,
    'estimatedTime': `Tempo estimado (minutos)`,
    'expandAll': `Expandir tudo`,
    'export': `Exportar`,
    'exportCsv': `Exportar como CSV`,
    'exportExcel': `Exportar como Excel (imprimível)`,
    'exportFailed': `Falha na exportação. Tente novamente.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Compartilhe seu feedback, reporte bugs ou sugira melhorias.`,
    'female': `Feminino`,
    'filter': `Filtro`,
    'filterAll': `Todos`,
    'filterUndone': `Pendentes`,
    'firstName': `Nome`,
    'freeBeds': `Leitos livres`,
    'hide': `Ocultar`,
    'homePage': `Página inicial`,
    'imprint': `Impresso`,
    'inactive': `Inativo`,
    'install': `Instalar`,
    'installApp': `Instalar aplicativo`,
    'installAppDescription': `Instale o helpwave tasks para uma melhor experiência com suporte offline e acesso mais rápido.`,
    'language': `Idioma`,
    'lastName': `Sobrenome`,
    'listViewCard': `Visualização em cartões`,
    'listViewTable': `Visualização em tabela`,
    'loading': `Carregando...`,
    'loadingAlmostThere': `Quase pronto...`,
    'loadingGettingReady': `Um instante — estamos preparando tudo...`,
    'loadingHangOn': `Um momento — estamos buscando os dados mais recentes...`,
    'loadingMoment': `Só um segundo, quase lá...`,
    'loadMore': `Carregar mais`,
    'loadTaskPreset': `Load preset`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Create `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} task`,
        'other': `${count} tasks`,
      })
      _out += ` for this patient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirm loading preset`,
    'loadTaskPresetCreateAndAssign': `Create & assign to me`,
    'loadTaskPresetSelectTasks': `Tasks from preset`,
    'loadTaskPresetTaskLabel': `Preset`,
    'loadTaskPresetTitle': `Load task preset`,
    'location': `Localização`,
    'locationBed': `Leito`,
    'locationClinic': `Clínica`,
    'locationRoom': `Quarto`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clínica`,
        'WARD': `Enfermaria`,
        'TEAM': `Equipe`,
        'ROOM': `Quarto`,
        'BED': `Leito`,
        'other': `Outro`,
      })
    },
    'locationWard': `Enfermaria`,
    'login': `Entrar`,
    'logInAgain': `Entrar novamente`,
    'loginRequired': `Login necessário`,
    'loginRequiredDescription': `Para usar este site você precisa estar conectado.`,
    'logout': `Sair`,
    'male': `Masculino`,
    'markPatientDead': `Marcar paciente como óbito`,
    'markPatientDeadConfirmation': `Tem certeza de que deseja marcar este paciente como óbito?`,
    'menu': `Menu`,
    'more': `Mais`,
    'myFavorites': `Meus favoritos`,
    'myOpenTasks': `Minhas tarefas abertas`,
    'myTasks': `Minhas tarefas`,
    'name': `Nome`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtro`,
        'other': `${count} filtros`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `Não`,
    'noClosedTasks': `Nenhuma tarefa concluída`,
    'noLocationsFound': `Nenhuma localização encontrada`,
    'none': `Nenhum`,
    'noNotifications': `Nenhuma atualização recente`,
    'noOpenTasks': `Nenhuma tarefa aberta`,
    'noPatient': `Sem paciente`,
    'noPatientsInTaskView': `Nenhum paciente encontrado para este acesso rápido de tarefas.`,
    'noResultsFound': `Nenhum resultado encontrado`,
    'notAssigned': `Não atribuído`,
    'notifications': `Notificações`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Paciente`,
        'other': `${count} Pacientes`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} ordenação`,
        'other': `${count} ordenações`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} Tarefa`,
        'other': `${count} Tarefas`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 anos`,
        '=1': `1 ano`,
        'other': `${years} anos`,
      })
    },
    'occupancy': `Ocupação`,
    'ok': `OK`,
    'onboardingSurvey': `Pesquisa de integração`,
    'openSurvey': `Abrir pesquisa`,
    'openTasks': `Tarefas abertas`,
    'openView': `Abrir`,
    'option': `Opção`,
    'organizations': `Organizações`,
    'overview': `Visão geral`,
    'pages.404.loading': `Carregando...`,
    'pages.404.notFound': `404 - Página não encontrada`,
    'pages.404.notFoundDescription1': `Esta não é a página que você procura`,
    'pages.404.notFoundDescription2': `Voltar para a`,
    'patient': `Paciente`,
    'patientActions': `Ações do paciente`,
    'patientData': `Dados`,
    'patients': `Pacientes`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Internado ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Total ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Aguardando ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Aguardando`,
        'ADMITTED': `Internado`,
        'DISCHARGED': `Alta`,
        'DEAD': `Óbito`,
        'other': `Desconhecido`,
      })
    },
    'patientsUpdatedRecently': `Pacientes atualizados recentemente`,
    'pickClinic': `Escolher a clínica`,
    'pickClinicDescription': `Selecione a clínica para este paciente. Apenas localizações do tipo clínica podem ser selecionadas.`,
    'pickPosition': `Escolher a localização`,
    'pickPositionDescription': `Selecione a localização para este paciente. Você pode escolher hospital, consultório, clínica, enfermaria, leito ou quarto.`,
    'pickTeams': `Escolher equipes`,
    'pickTeamsDescription': `Selecione uma ou mais equipes para este paciente. Você pode escolher clínica, equipe, consultório ou hospital.`,
    'position': `Localização`,
    'positionUpdated': `Localização atualizada`,
    'preferences': `Preferências`,
    'priority': `Prioridade`,
    'priorityLabel': `Prioridade`,
    'priorityNone': `Nenhuma`,
    'privacy': `Privacidade`,
    'properties': `Propriedades`,
    'propertiesSettingsDescription': `Campos personalizados para tarefas e pacientes: defina tipos e use-os em filtros.`,
    'property': `Propriedade`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Tema`,
        'other': `Temas`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Adicionar ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Total ${value}`
    },
    'readOnlyView': `Somente leitura`,
    'recentPatients': `Seus pacientes recentes`,
    'recentTasks': `Suas tarefas recentes`,
    'rEdit': ({ name }): string => {
      return `Atualizar ${name}`
    },
    'refreshing': `Atualizando…`,
    'removeProperty': `Remover propriedade`,
    'removePropertyConfirmation': `Tem certeza de que deseja remover esta propriedade? Esta ação não pode ser desfeita.`,
    'retakeSurvey': `Refazer pesquisa`,
    'rShow': ({ name }): string => {
      return `Mostrar ${name}`
    },
    'savedViews': `Acesso rápido`,
    'saveView': `Salvar acesso rápido`,
    'saveViewAsNew': `Salvar como novo acesso rápido`,
    'saveViewDescription': `Dê um nome para este acesso rápido. Filtros, ordenação, busca e localização são salvos.`,
    'saveViewDescriptionFromSystemList': `Cria uma nova entrada de acesso rápido a partir deste layout. Esta página é fixa no app e não é salva no lugar — abra o acesso rápido pela barra lateral quando precisar.`,
    'saveViewOverwriteCurrent': `Sobrescrever acesso rápido atual`,
    'scopeChangeNode': `Alterar nó`,
    'scopeNoNodeSelected': `Selecione o nó em que esta entrada é armazenada.`,
    'scopePrivate': `Privado`,
    'scopePrivateDescription': `Somente você pode ver e usar esta entrada.`,
    'scopePublic': `Público`,
    'scopePublicDescription': `Todos com acesso ao nó selecionado ou à sua subárvore podem ver e usar esta entrada.`,
    'scopeSelectNode': `Selecionar nó`,
    'scopeShared': `Compartilhado por link`,
    'scopeSharedDescription': `Somente você vê esta entrada em suas listas. Todos que podem acessar o nó selecionado ou sua subárvore podem abri-la pelo link.`,
    'scopeStoredAt': `Armazenado em`,
    'scopeVisibility': `Compartilhamento`,
    'scrollToTop': `Rolar para o topo`,
    'search': `Pesquisar`,
    'searchLocations': `Pesquisar localizações...`,
    'searchUserOrTeam': `Pesquisar usuário (ou equipe)...`,
    'searchUsersOrTeams': `Pesquisar usuários ou equipes...`,
    'security': `Segurança`,
    'selectAll': `Selecionar todos`,
    'selectAssignee': `Atribuir a...`,
    'selectClinic': `Selecionar clínica`,
    'selectLocation': `Selecionar localização`,
    'selectLocationDescription': `Selecione a localização atribuída ao paciente.`,
    'selectOptions': `Opções`,
    'selectPosition': `Selecionar localização`,
    'selectRootLocation': `Selecionar localização raiz`,
    'selectRootLocationDescription': `Selecione as localizações raiz que definem seu escopo. Apenas hospitais, consultórios, clínicas e equipes podem ser selecionados. Selecionar uma localização pai inclui todas as filhas.`,
    'selectTeams': `Selecionar equipes`,
    'sessionExpired': `Sessão expirada`,
    'sessionExpiredDescription': `Você foi desconectado devido à inatividade. Faça login novamente para continuar. Alterações não salvas podem ser perdidas.`,
    'settings': `Configurações`,
    'settingsDescription': `Aqui você pode alterar a configuração do aplicativo.`,
    'sex': `Sexo`,
    'shiftHandover': `Passagem de turno`,
    'showAllTasks': `Mostrar todas as tarefas`,
    'showPatient': ({ name }): string => {
      return `Mostrar paciente ${name}`
    },
    'showTeamTasks': `Mostrar tarefas da equipe`,
    'sorting': `Ordenação`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Média`,
        'P3': `Alta`,
        'P4': `Crítica`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Paciente`,
        'task': `Tarefa`,
        'other': `Tipo de sujeito indefinido`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Seleção múltipla`,
        'singleSelect': `Seleção única`,
        'number': `Número`,
        'text': `Texto`,
        'date': `Data`,
        'dateTime': `Data/hora`,
        'checkbox': `Caixa de seleção`,
        'user': `Usuário`,
        'other': `Tipo indefinido`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Esta instância pública do helpwave tasks é para \\b{desenvolvimento e pré-visualização}. Certifique-se de \\b{apenas} inserir \\b{dados de teste não confidenciais}. Esta instância pode \\negative{\\b{ser excluída a qualquer momento}}`,
    'startRecording': `Iniciar gravação`,
    'stateUpdated': `Status atualizado`,
    'status': `Status`,
    'stopRecording': `Parar gravação`,
    'subjectType': `Tipo de sujeito`,
    'submissionDetails': `Detalhes do envio`,
    'submit': `Enviar`,
    'submittingAs': ({ name }): string => {
      return `Enviando como ${name}`
    },
    'surveyDescription': `Seu feedback é valioso. Por favor, dedique um momento para responder nossa pesquisa.`,
    'surveyTitle': `Ajude-nos a melhorar o helpwave tasks`,
    'system': `Sistema`,
    'task': `Tarefa`,
    'taskFromPresetTooltip': `Created from a task preset`,
    'taskPresetAddRow': `Add task`,
    'taskPresetApplyToRow': `Apply to preset row`,
    'taskPresetCreate': `Create preset`,
    'taskPresetDelete': `Delete`,
    'taskPresetDeleteConfirm': `Delete this task preset?`,
    'taskPresetEdit': `Editar Preset`,
    'taskPresetEditDetails': `Edit details`,
    'taskPresetEmptyList': `No task presets yet.`,
    'taskPresetKey': `Key`,
    'taskPresetKeyHint': `Optional unique key for lookups. Leave empty to generate automatically.`,
    'taskPresetName': `Name`,
    'taskPresetNoEstimate': `No estimate`,
    'taskPresetNoTasks': `This preset has no tasks.`,
    'taskPresetRemoveRow': `Remove`,
    'taskPresets': `Presets`,
    'taskPresetSave': `Save preset`,
    'taskPresetsDescription': `Reusable task lists with optional dependencies.`,
    'taskPresetSelectPlaceholder': `Select a preset`,
    'taskPresetSourceNotFound': `Preset could not be loaded.`,
    'taskPresetSourceOpenSettings': `Open in settings`,
    'taskPresetSourceTasksInGraph': `Tasks in template`,
    'taskPresetSourceTitle': `Source preset`,
    'tasks': `Tarefas`,
    'tasksCreatedFromPreset': `Tasks created`,
    'tasksUpdatedRecently': `Tarefas atualizadas recentemente`,
    'taskTitlePlaceholder': `O que precisa ser feito?`,
    'teams': `Equipes`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Escuro`,
        'light': `Claro`,
        'system': `Sistema`,
        'other': `Sistema`,
      })
    },
    'timeEstimate': `Tempo estimado`,
    'title': `Título`,
    'totalPatients': `Total de pacientes`,
    'type': `Tipo`,
    'updated': `Atualizado`,
    'url': `URL`,
    'user': `Usuário`,
    'userInformation': `Informações do usuário`,
    'users': `Usuários`,
    'viewAnyoneWithLinkCanView': `Qualquer pessoa com o link pode visualizar`,
    'viewDerivedPatientsHint': `Pacientes que aparecem em tarefas correspondentes a este acesso rápido (distintos).`,
    'views': `Acesso rápido`,
    'viewsEntityPatient': `Pacientes`,
    'viewsEntityTask': `Tarefas`,
    'viewSettings': `Acesso rápido`,
    'viewSettingsDescription': `Gerencie acessos rápidos salvos de tarefas e pacientes.`,
    'viewVisibility': `Visibilidade`,
    'viewVisibilityLinkShared': `Link compartilhado`,
    'viewVisibilityPrivate': `Privado`,
    'waitingForPatient': `Aguardando paciente`,
    'waitPatient': `Colocar paciente em espera`,
    'wards': `Enfermarias`,
    'weeklySurvey': `Pesquisa semanal`,
    'yes': `Sim`
  },
  'ro-RO': {
    'account': `Cont`,
    'active': `Activ`,
    'add': `Adaugă`,
    'addFastAccess': `Adaugă acces rapid`,
    'addFastAccessDescription': `Introduceți un nume pentru noul acces rapid.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Adaugă pacient`,
    'addProperty': `Adaugă proprietate`,
    'addTask': `Adaugă sarcină`,
    'admitPatient': `Internează pacientul`,
    'anonymous': `Anonim`,
    'anonymousSubmission': `Trimitere anonimă`,
    'archivedPropertyDescription': `Proprietățile arhivate nu mai pot fi atribuite obiectelor.`,
    'archiveProperty': `Arhivează proprietatea`,
    'assignedTo': `Atribuit lui`,
    'assigneeTeam': `Echipa atribuită`,
    'authenticationFailed': `Autentificare eșuată`,
    'birthdate': `Data nașterii`,
    'cancel': `Anulează`,
    'clear': `Golește`,
    'clearCache': `Golește memoria cache`,
    'clearPropertyColumnActionPatient': `Golește valorile acestei proprietăți la pacienții listați`,
    'clearPropertyColumnActionTask': `Elimină această proprietate din sarcinile listate`,
    'clearPropertyColumnConfirmButtonPatient': `Golește valorile proprietății`,
    'clearPropertyColumnConfirmButtonTask': `Elimină proprietatea din sarcini`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Toate valorile proprietății „${propertyName}” vor fi golite la ${count} pacienți încărcați în prezent în această listă. Proprietatea rămâne atașată acestor pacienți. Pacienții care nu sunt încărcați în această listă nu sunt afectați.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `Proprietatea „${propertyName}” va fi eliminată definitiv din ${count} sarcini încărcate în prezent în această listă. Sarcinile care nu sunt încărcate în această listă nu sunt afectate.`
    },
    'clearPropertyColumnDialogTitlePatient': `Golește valorile proprietății la pacienți`,
    'clearPropertyColumnDialogTitleTask': `Elimină proprietatea din sarcini`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Tastați „${propertyName}” pentru a confirma.`
    },
    'clinic': `Clinică`,
    'clinics': `Clinici`,
    'clinicUpdated': `Clinică actualizată`,
    'close': `Închide`,
    'closedTasks': `Sarcini finalizate`,
    'collapseAll': `Restrânge tot`,
    'confirm': `Confirmă`,
    'confirmDeleteView': `Ștergeți acest acces rapid salvat? Acțiunea nu poate fi anulată.`,
    'confirmSelection': `Confirmă selecția`,
    'confirmShiftHandover': `Confirmă predarea turei`,
    'confirmShiftHandoverDescription': `Sigur doriți să transferați toate sarcinile deschise utilizatorului selectat?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Sigur doriți să transferați `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} sarcină deschisă`,
        'few': `${taskCount} sarcini deschise`,
        'other': `${taskCount} de sarcini deschise`,
      })
      _out += ` către ${name}?`
      return _out
    },
    'conflictDetected': `Conflict detectat`,
    'connectionConnected': `Conectat`,
    'connectionConnecting': `Se conectează…`,
    'connectionDisconnected': `Deconectat`,
    'copyShareLink': `Copiază linkul`,
    'copyShareLinkEnableSharingFirst': `Activați partajarea prin link pentru ca alte persoane cu linkul să poată deschide acest acces rapid.`,
    'copyViewToMyViews': `Copiază în accesul meu rapid`,
    'create': `Creează`,
    'createTask': `Creează sarcină`,
    'creationDate': `Data creării`,
    'currentTime': `Ora curentă`,
    'dashboard': `Tablou de bord`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Bună ziua, ${name}!`
    },
    'dashboardWelcomeDescription': `Iată ce se întâmplă astăzi.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Bună seara, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Bună dimineața, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Noapte bună, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Bună ziua, ${name}!`
    },
    'delete': `Șterge`,
    'deletePatient': `Șterge pacientul`,
    'deletePatientConfirmation': `Sigur doriți să ștergeți acest pacient? Acțiunea nu poate fi anulată.`,
    'description': `Descriere`,
    'descriptionPlaceholder': `Adăugați mai multe detalii...`,
    'deselectAll': `Deselectează tot`,
    'developmentAndPreviewInstance': `Instanță de dezvoltare și previzualizare`,
    'discard': `Renunță`,
    'discardDraftMessage': `Aveți date nesalvate. Dacă închideți acum, tot ce ați introdus se va pierde.`,
    'discardDraftTitle': `Renunțați la ciornă?`,
    'discardViewChanges': `Renunță la modificări`,
    'dischargePatient': `Externează pacientul`,
    'dischargePatientConfirmation': `Sigur doriți să externați acest pacient? Această acțiune va modifica starea pacientului.`,
    'dismiss': `Închide`,
    'dismissAll': `Închide toate`,
    'diverse': `Divers`,
    'done': `Finalizat`,
    'dueDate': `Termen`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} zi`,
        'few': `${days} zile`,
        'other': `${days} de zile`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} oră`,
        'few': `${hours} ore`,
        'other': `${hours} de ore`,
      })
      return _out
    },
    'dueDateNow': `Acum`,
    'dueDateToday': `Astăzi`,
    'dueDateTomorrow': `Mâine`,
    'duplicate': `Duplică`,
    'edit': `Editează`,
    'editPatient': `Editează pacientul`,
    'editPresetTask': `Editează sarcina din șablon`,
    'editTask': `Editează sarcina`,
    'enterFeedback': `Introduceți feedbackul aici...`,
    'error': `Eroare`,
    'errorOccurred': `A apărut o eroare`,
    'estimatedTime': `Timp estimat (minute)`,
    'expandAll': `Extinde tot`,
    'export': `Exportă`,
    'exportCsv': `Exportă ca CSV`,
    'exportExcel': `Exportă ca Excel (imprimabil)`,
    'exportFailed': `Exportul a eșuat. Vă rugăm să încercați din nou.`,
    'feedback': `Feedback`,
    'feedbackDescription': `Trimiteți feedback, raportați erori sau sugerați îmbunătățiri.`,
    'female': `Feminin`,
    'filter': `Filtru`,
    'filterAll': `Toate`,
    'filterUndone': `Nefinalizate`,
    'firstName': `Prenume`,
    'freeBeds': `Paturi libere`,
    'hide': `Ascunde`,
    'homePage': `Pagina principală`,
    'imprint': `Date de identificare`,
    'inactive': `Inactiv`,
    'install': `Instalează`,
    'installApp': `Instalează aplicația`,
    'installAppDescription': `Instalați helpwave tasks pentru o experiență mai bună, cu funcționare offline și acces mai rapid.`,
    'language': `Limbă`,
    'lastName': `Nume`,
    'listViewCard': `Vizualizare carduri`,
    'listViewTable': `Vizualizare tabel`,
    'loading': `Se încarcă...`,
    'loadingAlmostThere': `Aproape gata...`,
    'loadingGettingReady': `Un moment — pregătim totul...`,
    'loadingHangOn': `Un moment — se încarcă cele mai recente date...`,
    'loadingMoment': `O secundă, aproape gata...`,
    'loadMore': `Încarcă mai multe`,
    'loadTaskPreset': `Încarcă șablon`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Creați `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} sarcină`,
        'few': `${count} sarcini`,
        'other': `${count} de sarcini`,
      })
      _out += ` pentru acest pacient?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Confirmă încărcarea șablonului`,
    'loadTaskPresetCreateAndAssign': `Creează și atribuie-mi`,
    'loadTaskPresetSelectTasks': `Sarcini din șablon`,
    'loadTaskPresetTaskLabel': `Șablon`,
    'loadTaskPresetTitle': `Încarcă șablon de sarcini`,
    'location': `Locație`,
    'locationBed': `Pat`,
    'locationClinic': `Clinică`,
    'locationRoom': `Salon`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Clinică`,
        'WARD': `Secție`,
        'TEAM': `Echipă`,
        'ROOM': `Salon`,
        'BED': `Pat`,
        'other': `Altele`,
      })
    },
    'locationWard': `Secție`,
    'login': `Autentificare`,
    'logInAgain': `Autentificați-vă din nou`,
    'loginRequired': `Autentificare necesară`,
    'loginRequiredDescription': `Pentru a folosi acest site trebuie să fiți autentificat.`,
    'logout': `Deconectare`,
    'male': `Masculin`,
    'markPatientDead': `Marchează pacientul ca decedat`,
    'markPatientDeadConfirmation': `Sigur doriți să marcați acest pacient ca decedat?`,
    'menu': `Meniu`,
    'more': `Mai mult`,
    'myFavorites': `Favoritele mele`,
    'myOpenTasks': `Sarcinile mele deschise`,
    'myTasks': `Sarcinile mele`,
    'name': `Nume`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtru`,
        'few': `${count} filtre`,
        'other': `${count} de filtre`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} min`
    },
    'no': `Nu`,
    'noClosedTasks': `Nicio sarcină finalizată`,
    'noLocationsFound': `Nu s-au găsit locații`,
    'none': `Niciunul`,
    'noNotifications': `Nicio actualizare recentă`,
    'noOpenTasks': `Nicio sarcină deschisă`,
    'noPatient': `Niciun pacient`,
    'noPatientsInTaskView': `Nu s-au găsit pacienți pentru acest acces rapid la sarcini.`,
    'noResultsFound': `Nu s-au găsit rezultate`,
    'notAssigned': `Neatribuit`,
    'notifications': `Notificări`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} pacient`,
        'few': `${count} pacienți`,
        'other': `${count} de pacienți`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sortare`,
        'few': `${count} sortări`,
        'other': `${count} de sortări`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sarcină`,
        'few': `${count} sarcini`,
        'other': `${count} de sarcini`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 ani`,
        '=1': `1 an`,
        'few': `${years} ani`,
        'other': `${years} de ani`,
      })
    },
    'occupancy': `Grad de ocupare`,
    'ok': `OK`,
    'onboardingSurvey': `Chestionar inițial`,
    'openSurvey': `Deschide chestionarul`,
    'openTasks': `Sarcini deschise`,
    'openView': `Deschide`,
    'option': `Opțiune`,
    'organizations': `Organizații`,
    'overview': `Prezentare generală`,
    'pages.404.loading': `Se încarcă...`,
    'pages.404.notFound': `404 - Pagina nu a fost găsită`,
    'pages.404.notFoundDescription1': `Aceasta nu este pagina pe care o căutați`,
    'pages.404.notFoundDescription2': `Înapoi la`,
    'patient': `Pacient`,
    'patientActions': `Acțiuni pacient`,
    'patientData': `Date`,
    'patients': `Pacienți`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Internați ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Total ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `În așteptare ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `În așteptare`,
        'ADMITTED': `Internat`,
        'DISCHARGED': `Externat`,
        'DEAD': `Decedat`,
        'other': `Necunoscut`,
      })
    },
    'patientsUpdatedRecently': `Pacienți actualizați recent`,
    'pickClinic': `Alegeți clinica`,
    'pickClinicDescription': `Selectați clinica pentru acest pacient. Pot fi selectate doar locații de tip clinică.`,
    'pickPosition': `Alegeți locația`,
    'pickPositionDescription': `Selectați locația pentru acest pacient. Puteți selecta spital, cabinet, clinică, secție, pat sau salon.`,
    'pickTeams': `Alegeți echipele`,
    'pickTeamsDescription': `Selectați una sau mai multe echipe pentru acest pacient. Puteți selecta clinică, echipă, cabinet sau spital.`,
    'position': `Locație`,
    'positionUpdated': `Locație actualizată`,
    'preferences': `Preferințe`,
    'priority': `Prioritate`,
    'priorityLabel': `Prioritate`,
    'priorityNone': `Niciuna`,
    'privacy': `Confidențialitate`,
    'properties': `Proprietăți`,
    'propertiesSettingsDescription': `Câmpuri personalizate pentru sarcini și pacienți: definiți tipuri și folosiți-le în filtre.`,
    'property': `Proprietate`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Temă`,
        'few': `Teme`,
        'other': `Teme`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Adaugă ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Total ${value}`
    },
    'readOnlyView': `Doar citire`,
    'recentPatients': `Pacienții tăi recenți`,
    'recentTasks': `Sarcinile tale recente`,
    'rEdit': ({ name }): string => {
      return `Actualizează ${name}`
    },
    'refreshing': `Se actualizează…`,
    'removeProperty': `Elimină proprietatea`,
    'removePropertyConfirmation': `Sigur doriți să eliminați această proprietate? Acțiunea nu poate fi anulată.`,
    'retakeSurvey': `Completează din nou chestionarul`,
    'rShow': ({ name }): string => {
      return `Afișează ${name}`
    },
    'savedViews': `Acces rapid`,
    'saveView': `Salvează accesul rapid`,
    'saveViewAsNew': `Salvează ca acces rapid nou`,
    'saveViewDescription': `Denumiți acest acces rapid. Filtrele, sortarea, căutarea și locația sunt salvate.`,
    'saveViewDescriptionFromSystemList': `Creează un nou acces rapid pe baza acestui aspect. Această pagină este fixată de aplicație și nu este suprascrisă — deschideți accesul rapid din bara laterală când aveți nevoie.`,
    'saveViewOverwriteCurrent': `Suprascrie accesul rapid curent`,
    'scopeChangeNode': `Schimbă nodul`,
    'scopeNoNodeSelected': `Selectați nodul la care este salvată această intrare.`,
    'scopePrivate': `Privat`,
    'scopePrivateDescription': `Doar dumneavoastră puteți vedea și folosi această intrare.`,
    'scopePublic': `Public`,
    'scopePublicDescription': `Oricine are acces la nodul selectat sau la subarborele acestuia poate vedea și folosi această intrare.`,
    'scopeSelectNode': `Selectează nodul`,
    'scopeShared': `Partajat prin link`,
    'scopeSharedDescription': `Doar dumneavoastră vedeți această intrare în listele proprii. Oricine are acces la nodul selectat sau la subarborele acestuia o poate deschide prin link.`,
    'scopeStoredAt': `Salvat la`,
    'scopeVisibility': `Partajare`,
    'scrollToTop': `Derulează în sus`,
    'search': `Caută`,
    'searchLocations': `Căutați locații...`,
    'searchUserOrTeam': `Căutați utilizator (sau echipă)...`,
    'searchUsersOrTeams': `Căutați utilizatori sau echipe...`,
    'security': `Securitate`,
    'selectAll': `Selectează tot`,
    'selectAssignee': `Atribuie lui...`,
    'selectClinic': `Selectează clinica`,
    'selectLocation': `Selectează locația`,
    'selectLocationDescription': `Vă rugăm să selectați locația atribuită pacientului.`,
    'selectOptions': `Selectează opțiunile`,
    'selectPosition': `Selectează locația`,
    'selectRootLocation': `Selectează locația rădăcină`,
    'selectRootLocationDescription': `Selectați locațiile rădăcină care definesc domeniul dumneavoastră de acces. Pot fi selectate doar spitale, cabinete, clinici și echipe. Selectarea unei locații părinte include toate locațiile subordonate.`,
    'selectTeams': `Selectează echipele`,
    'sessionExpired': `Sesiune expirată`,
    'sessionExpiredDescription': `Ați fost deconectat din cauza inactivității. Vă rugăm să vă autentificați din nou pentru a continua. Modificările nesalvate se pot pierde.`,
    'settings': `Setări`,
    'settingsDescription': `Aici puteți modifica configurația aplicației.`,
    'sex': `Sex`,
    'shiftHandover': `Predarea turei`,
    'showAllTasks': `Afișează toate sarcinile`,
    'showPatient': ({ name }): string => {
      return `Afișează pacientul ${name}`
    },
    'showTeamTasks': `Afișează sarcinile echipei`,
    'sorting': `Sortare`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normală`,
        'P2': `Medie`,
        'P3': `Ridicată`,
        'P4': `Critică`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Pacient`,
        'task': `Sarcină`,
        'other': `Tip de subiect nedefinit`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Selecție multiplă`,
        'singleSelect': `Selecție unică`,
        'number': `Număr`,
        'text': `Text`,
        'date': `Dată`,
        'dateTime': `Moment`,
        'checkbox': `Casetă de selectare`,
        'user': `Utilizator`,
        'other': `Tip nedefinit`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Această instanță publică a helpwave tasks este destinată \\b{dezvoltării și previzualizării}. Vă rugăm să introduceți \\b{doar} \\b{date de test neconfidențiale}. Această instanță poate fi \\negative{\\b{ștearsă oricând}}`,
    'startRecording': `Pornește înregistrarea`,
    'stateUpdated': `Stare actualizată`,
    'status': `Status`,
    'stopRecording': `Oprește înregistrarea`,
    'subjectType': `Tip de subiect`,
    'submissionDetails': `Detaliile trimiterii`,
    'submit': `Trimite`,
    'submittingAs': ({ name }): string => {
      return `Se trimite ca ${name}`
    },
    'surveyDescription': `Feedbackul dumneavoastră este valoros pentru noi. Vă rugăm să acordați un moment completării chestionarului.`,
    'surveyTitle': `Ajutați-ne să îmbunătățim helpwave tasks`,
    'system': `Sistem`,
    'task': `Sarcină`,
    'taskFromPresetTooltip': `Creată dintr-un șablon de sarcini`,
    'taskPresetAddRow': `Adaugă sarcină`,
    'taskPresetApplyToRow': `Aplică pe rândul din șablon`,
    'taskPresetCreate': `Creează șablon`,
    'taskPresetDelete': `Șterge`,
    'taskPresetDeleteConfirm': `Ștergeți acest șablon de sarcini?`,
    'taskPresetEdit': `Editează șablonul`,
    'taskPresetEditDetails': `Editează detaliile`,
    'taskPresetEmptyList': `Încă nu există șabloane de sarcini.`,
    'taskPresetKey': `Cheie`,
    'taskPresetKeyHint': `Cheie unică opțională pentru căutări. Lăsați gol pentru generare automată.`,
    'taskPresetName': `Nume`,
    'taskPresetNoEstimate': `Fără estimare`,
    'taskPresetNoTasks': `Acest șablon nu conține sarcini.`,
    'taskPresetRemoveRow': `Elimină`,
    'taskPresets': `Șabloane`,
    'taskPresetSave': `Salvează șablonul`,
    'taskPresetsDescription': `Liste de sarcini reutilizabile, cu dependențe opționale.`,
    'taskPresetSelectPlaceholder': `Selectați un șablon`,
    'taskPresetSourceNotFound': `Șablonul nu a putut fi încărcat.`,
    'taskPresetSourceOpenSettings': `Deschide în setări`,
    'taskPresetSourceTasksInGraph': `Sarcini în șablon`,
    'taskPresetSourceTitle': `Șablon sursă`,
    'tasks': `Sarcini`,
    'tasksCreatedFromPreset': `Sarcini create`,
    'tasksUpdatedRecently': `Sarcini actualizate recent`,
    'taskTitlePlaceholder': `Ce trebuie făcut?`,
    'teams': `Echipe`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Întunecat`,
        'light': `Luminos`,
        'system': `Sistem`,
        'other': `Sistem`,
      })
    },
    'timeEstimate': `Estimare de timp`,
    'title': `Titlu`,
    'totalPatients': `Total pacienți`,
    'type': `Tip`,
    'updated': `Actualizat`,
    'url': `URL`,
    'user': `Utilizator`,
    'userInformation': `Informații despre utilizator`,
    'users': `Utilizatori`,
    'viewAnyoneWithLinkCanView': `Oricine are linkul poate vizualiza`,
    'viewDerivedPatientsHint': `Pacienții care apar în sarcinile ce corespund acestui acces rapid (fără duplicate).`,
    'views': `Acces rapid`,
    'viewsEntityPatient': `Pacienți`,
    'viewsEntityTask': `Sarcini`,
    'viewSettings': `Acces rapid`,
    'viewSettingsDescription': `Gestionați accesele rapide salvate pentru sarcini și pacienți.`,
    'viewVisibility': `Vizibilitate`,
    'viewVisibilityLinkShared': `Partajat prin link`,
    'viewVisibilityPrivate': `Privat`,
    'waitingForPatient': `Se așteaptă pacientul`,
    'waitPatient': `Trece pacientul în așteptare`,
    'wards': `Secții`,
    'weeklySurvey': `Chestionar săptămânal`,
    'yes': `Da`
  },
  'ru-RU': {
    'account': `Аккаунт`,
    'active': `Активно`,
    'add': `Добавить`,
    'addFastAccess': `Добавить быстрый доступ`,
    'addFastAccessDescription': `Введите название нового быстрого доступа.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Добавить пациента`,
    'addProperty': `Добавить свойство`,
    'addTask': `Добавить задачу`,
    'admitPatient': `Госпитализировать пациента`,
    'anonymous': `Анонимно`,
    'anonymousSubmission': `Анонимная отправка`,
    'archivedPropertyDescription': `Архивные свойства больше нельзя назначать объектам.`,
    'archiveProperty': `Архивировать свойство`,
    'assignedTo': `Назначено`,
    'assigneeTeam': `Назначенная команда`,
    'authenticationFailed': `Ошибка аутентификации`,
    'birthdate': `Дата рождения`,
    'cancel': `Отмена`,
    'clear': `Очистить`,
    'clearCache': `Очистить кэш`,
    'clearPropertyColumnActionPatient': `Очистить значения этого свойства у пациентов в списке`,
    'clearPropertyColumnActionTask': `Удалить это свойство из задач в списке`,
    'clearPropertyColumnConfirmButtonPatient': `Очистить значения свойства`,
    'clearPropertyColumnConfirmButtonTask': `Удалить свойство из задач`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `Все значения свойства «${propertyName}» будут очищены у пациентов, загруженных в этот список (количество: ${count}). Само свойство останется у этих пациентов. Пациенты, не загруженные в этот список, не затрагиваются.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `Свойство «${propertyName}» будет безвозвратно удалено из задач, загруженных в этот список (количество: ${count}). Задачи, не загруженные в этот список, не затрагиваются.`
    },
    'clearPropertyColumnDialogTitlePatient': `Очистить значения свойства у пациентов`,
    'clearPropertyColumnDialogTitleTask': `Удалить свойство из задач`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Введите «${propertyName}» для подтверждения.`
    },
    'clinic': `Клиника`,
    'clinics': `Клиники`,
    'clinicUpdated': `Клиника обновлена`,
    'close': `Закрыть`,
    'closedTasks': `Выполненные задачи`,
    'collapseAll': `Свернуть все`,
    'confirm': `Подтвердить`,
    'confirmDeleteView': `Удалить этот сохранённый быстрый доступ? Это действие нельзя отменить.`,
    'confirmSelection': `Подтвердить выбор`,
    'confirmShiftHandover': `Подтвердить передачу смены`,
    'confirmShiftHandoverDescription': `Вы уверены, что хотите передать все открытые задачи выбранному пользователю?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += `Вы уверены, что хотите передать `
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} открытую задачу`,
        'one': `${taskCount} открытую задачу`,
        'few': `${taskCount} открытые задачи`,
        'many': `${taskCount} открытых задач`,
        'other': `${taskCount} открытой задачи`,
      })
      _out += ` пользователю ${name}?`
      return _out
    },
    'conflictDetected': `Обнаружен конфликт`,
    'connectionConnected': `Подключено`,
    'connectionConnecting': `Подключение…`,
    'connectionDisconnected': `Отключено`,
    'copyShareLink': `Копировать ссылку`,
    'copyShareLinkEnableSharingFirst': `Включите доступ по ссылке, чтобы другие пользователи со ссылкой могли открыть этот быстрый доступ.`,
    'copyViewToMyViews': `Копировать в мой быстрый доступ`,
    'create': `Создать`,
    'createTask': `Создать задачу`,
    'creationDate': `Дата создания`,
    'currentTime': `Текущее время`,
    'dashboard': `Обзорная панель`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `Добрый день, ${name}!`
    },
    'dashboardWelcomeDescription': `Вот что происходит сегодня.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `Добрый вечер, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Доброе утро, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `Доброй ночи, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Добрый день, ${name}!`
    },
    'delete': `Удалить`,
    'deletePatient': `Удалить пациента`,
    'deletePatientConfirmation': `Вы уверены, что хотите удалить этого пациента? Это действие нельзя отменить.`,
    'description': `Описание`,
    'descriptionPlaceholder': `Добавьте подробности...`,
    'deselectAll': `Снять выбор`,
    'developmentAndPreviewInstance': `Экземпляр для разработки и предварительного просмотра`,
    'discard': `Отменить`,
    'discardDraftMessage': `У вас есть несохранённые данные. Если закрыть сейчас, всё введённое будет потеряно.`,
    'discardDraftTitle': `Отменить черновик?`,
    'discardViewChanges': `Отменить изменения`,
    'dischargePatient': `Выписать пациента`,
    'dischargePatientConfirmation': `Вы уверены, что хотите выписать этого пациента? Статус пациента будет изменён.`,
    'dismiss': `Закрыть`,
    'dismissAll': `Закрыть все`,
    'diverse': `Другой`,
    'done': `Готово`,
    'dueDate': `Срок выполнения`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} день`,
        'one': `${days} день`,
        'few': `${days} дня`,
        'many': `${days} дней`,
        'other': `${days} дня`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} час`,
        'one': `${hours} час`,
        'few': `${hours} часа`,
        'many': `${hours} часов`,
        'other': `${hours} часа`,
      })
      return _out
    },
    'dueDateNow': `Сейчас`,
    'dueDateToday': `Сегодня`,
    'dueDateTomorrow': `Завтра`,
    'duplicate': `Дублировать`,
    'edit': `Редактировать`,
    'editPatient': `Редактировать пациента`,
    'editPresetTask': `Редактировать задачу шаблона`,
    'editTask': `Редактировать задачу`,
    'enterFeedback': `Введите ваш отзыв...`,
    'error': `Ошибка`,
    'errorOccurred': `Произошла ошибка`,
    'estimatedTime': `Расчётное время (минуты)`,
    'expandAll': `Развернуть все`,
    'export': `Экспорт`,
    'exportCsv': `Экспорт в CSV`,
    'exportExcel': `Экспорт в Excel (для печати)`,
    'exportFailed': `Не удалось выполнить экспорт. Попробуйте ещё раз.`,
    'feedback': `Обратная связь`,
    'feedbackDescription': `Поделитесь отзывом, сообщите об ошибке или предложите улучшение.`,
    'female': `Женский`,
    'filter': `Фильтр`,
    'filterAll': `Все`,
    'filterUndone': `Невыполненные`,
    'firstName': `Имя`,
    'freeBeds': `Свободные койки`,
    'hide': `Скрыть`,
    'homePage': `Главная страница`,
    'imprint': `Выходные данные`,
    'inactive': `Неактивно`,
    'install': `Установить`,
    'installApp': `Установить приложение`,
    'installAppDescription': `Установите helpwave tasks для удобной работы, офлайн-доступа и более быстрого запуска.`,
    'language': `Язык`,
    'lastName': `Фамилия`,
    'listViewCard': `Карточки`,
    'listViewTable': `Таблица`,
    'loading': `Загрузка...`,
    'loadingAlmostThere': `Почти готово...`,
    'loadingGettingReady': `Минуту — всё подготавливаем...`,
    'loadingHangOn': `Подождите — загружаем актуальные данные...`,
    'loadingMoment': `Секунду, почти готово...`,
    'loadMore': `Загрузить ещё`,
    'loadTaskPreset': `Загрузить шаблон`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Создать `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} задачу`,
        'one': `${count} задачу`,
        'few': `${count} задачи`,
        'many': `${count} задач`,
        'other': `${count} задачи`,
      })
      _out += ` для этого пациента?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Подтвердить загрузку шаблона`,
    'loadTaskPresetCreateAndAssign': `Создать и назначить мне`,
    'loadTaskPresetSelectTasks': `Задачи из шаблона`,
    'loadTaskPresetTaskLabel': `Шаблон`,
    'loadTaskPresetTitle': `Загрузить шаблон задач`,
    'location': `Местоположение`,
    'locationBed': `Койка`,
    'locationClinic': `Клиника`,
    'locationRoom': `Палата`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Клиника`,
        'WARD': `Отделение`,
        'TEAM': `Команда`,
        'ROOM': `Палата`,
        'BED': `Койка`,
        'other': `Другое`,
      })
    },
    'locationWard': `Отделение`,
    'login': `Вход`,
    'logInAgain': `Войти снова`,
    'loginRequired': `Требуется вход`,
    'loginRequiredDescription': `Чтобы пользоваться этим сайтом, необходимо войти в систему.`,
    'logout': `Выйти`,
    'male': `Мужской`,
    'markPatientDead': `Отметить пациента как умершего`,
    'markPatientDeadConfirmation': `Вы уверены, что хотите отметить этого пациента как умершего?`,
    'menu': `Меню`,
    'more': `Ещё`,
    'myFavorites': `Избранное`,
    'myOpenTasks': `Мои открытые задачи`,
    'myTasks': `Мои задачи`,
    'name': `Название`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} фильтр`,
        'one': `${count} фильтр`,
        'few': `${count} фильтра`,
        'many': `${count} фильтров`,
        'other': `${count} фильтра`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} мин`
    },
    'no': `Нет`,
    'noClosedTasks': `Нет выполненных задач`,
    'noLocationsFound': `Местоположения не найдены`,
    'none': `Нет`,
    'noNotifications': `Нет новых обновлений`,
    'noOpenTasks': `Нет открытых задач`,
    'noPatient': `Нет пациента`,
    'noPatientsInTaskView': `Для этого быстрого доступа к задачам пациенты не найдены.`,
    'noResultsFound': `Ничего не найдено`,
    'notAssigned': `Не назначено`,
    'notifications': `Уведомления`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} пациент`,
        'one': `${count} пациент`,
        'few': `${count} пациента`,
        'many': `${count} пациентов`,
        'other': `${count} пациента`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} сортировка`,
        'one': `${count} сортировка`,
        'few': `${count} сортировки`,
        'many': `${count} сортировок`,
        'other': `${count} сортировки`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} задача`,
        'one': `${count} задача`,
        'few': `${count} задачи`,
        'many': `${count} задач`,
        'other': `${count} задачи`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 лет`,
        '=1': `1 год`,
        'one': `${years} год`,
        'few': `${years} года`,
        'many': `${years} лет`,
        'other': `${years} года`,
      })
    },
    'occupancy': `Заполненность`,
    'ok': `ОК`,
    'onboardingSurvey': `Вводный опрос`,
    'openSurvey': `Открыть опрос`,
    'openTasks': `Открытые задачи`,
    'openView': `Открыть`,
    'option': `Вариант`,
    'organizations': `Организации`,
    'overview': `Обзор`,
    'pages.404.loading': `Загрузка...`,
    'pages.404.notFound': `404 — Страница не найдена`,
    'pages.404.notFoundDescription1': `Это точно не та страница, которую вы ищете`,
    'pages.404.notFoundDescription2': `Вернуться на`,
    'patient': `Пациент`,
    'patientActions': `Действия с пациентом`,
    'patientData': `Данные`,
    'patients': `Пациенты`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Госпитализировано ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Всего ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Ожидают ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Ожидает`,
        'ADMITTED': `Госпитализирован`,
        'DISCHARGED': `Выписан`,
        'DEAD': `Умер`,
        'other': `Неизвестно`,
      })
    },
    'patientsUpdatedRecently': `Недавно обновлённые пациенты`,
    'pickClinic': `Выберите клинику`,
    'pickClinicDescription': `Выберите клинику для этого пациента. Можно выбрать только клиники.`,
    'pickPosition': `Выберите местоположение`,
    'pickPositionDescription': `Выберите местоположение для этого пациента. Можно выбрать больницу, практику, клинику, отделение, койку или палату.`,
    'pickTeams': `Выберите команды`,
    'pickTeamsDescription': `Выберите одну или несколько команд для этого пациента. Можно выбрать клинику, команду, практику или больницу.`,
    'position': `Местоположение`,
    'positionUpdated': `Местоположение обновлено`,
    'preferences': `Настройки`,
    'priority': `Приоритет`,
    'priorityLabel': `Приоритет`,
    'priorityNone': `Нет`,
    'privacy': `Конфиденциальность`,
    'properties': `Свойства`,
    'propertiesSettingsDescription': `Пользовательские поля для задач и пациентов: задавайте типы и используйте их в фильтрах.`,
    'property': `Свойство`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Тема`,
        'other': `Темы`,
      })
    },
    'rAdd': ({ name }): string => {
      return `Добавить: ${name}`
    },
    'rChipTotal': ({ value }): string => {
      return `Всего ${value}`
    },
    'readOnlyView': `Только чтение`,
    'recentPatients': `Ваши недавние пациенты`,
    'recentTasks': `Ваши недавние задачи`,
    'rEdit': ({ name }): string => {
      return `Изменить: ${name}`
    },
    'refreshing': `Обновление…`,
    'removeProperty': `Удалить свойство`,
    'removePropertyConfirmation': `Вы уверены, что хотите удалить это свойство? Это действие нельзя отменить.`,
    'retakeSurvey': `Пройти опрос снова`,
    'rShow': ({ name }): string => {
      return `Показать: ${name}`
    },
    'savedViews': `Быстрый доступ`,
    'saveView': `Сохранить быстрый доступ`,
    'saveViewAsNew': `Сохранить как новый быстрый доступ`,
    'saveViewDescription': `Назовите этот быстрый доступ. Фильтры, сортировка, поиск и местоположение будут сохранены.`,
    'saveViewDescriptionFromSystemList': `Создаёт новый быстрый доступ на основе этого макета. Эта страница задана приложением и не перезаписывается — при необходимости откройте быстрый доступ на боковой панели.`,
    'saveViewOverwriteCurrent': `Перезаписать текущий быстрый доступ`,
    'scopeChangeNode': `Изменить узел`,
    'scopeNoNodeSelected': `Выберите узел, в котором будет храниться эта запись.`,
    'scopePrivate': `Личный`,
    'scopePrivateDescription': `Только вы можете видеть и использовать эту запись.`,
    'scopePublic': `Общедоступный`,
    'scopePublicDescription': `Все, у кого есть доступ к выбранному узлу или его поддереву, могут видеть и использовать эту запись.`,
    'scopeSelectNode': `Выбрать узел`,
    'scopeShared': `Доступ по ссылке`,
    'scopeSharedDescription': `Эта запись видна в списках только вам. Все, у кого есть доступ к выбранному узлу или его поддереву, могут открыть её по ссылке.`,
    'scopeStoredAt': `Хранится в`,
    'scopeVisibility': `Общий доступ`,
    'scrollToTop': `Наверх`,
    'search': `Поиск`,
    'searchLocations': `Поиск местоположений...`,
    'searchUserOrTeam': `Найти пользователя (или команду)...`,
    'searchUsersOrTeams': `Поиск пользователей или команд...`,
    'security': `Безопасность`,
    'selectAll': `Выбрать все`,
    'selectAssignee': `Назначить...`,
    'selectClinic': `Выбрать клинику`,
    'selectLocation': `Выбрать местоположение`,
    'selectLocationDescription': `Выберите местоположение, назначенное пациенту.`,
    'selectOptions': `Выбрать варианты`,
    'selectPosition': `Выбрать местоположение`,
    'selectRootLocation': `Выбрать корневое местоположение`,
    'selectRootLocationDescription': `Выберите корневые местоположения, определяющие доступную вам область. Можно выбрать только больницы, практики, клиники и команды. Выбор родительского местоположения включает все дочерние.`,
    'selectTeams': `Выбрать команды`,
    'sessionExpired': `Сеанс истёк`,
    'sessionExpiredDescription': `Вы вышли из системы из-за бездействия. Войдите снова, чтобы продолжить. Несохранённые изменения могут быть потеряны.`,
    'settings': `Настройки`,
    'settingsDescription': `Здесь можно изменить настройки приложения.`,
    'sex': `Пол`,
    'shiftHandover': `Передача смены`,
    'showAllTasks': `Показать все задачи`,
    'showPatient': ({ name }): string => {
      return `Показать пациента ${name}`
    },
    'showTeamTasks': `Показать задачи команды`,
    'sorting': `Сортировка`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Обычный`,
        'P2': `Средний`,
        'P3': `Высокий`,
        'P4': `Критический`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Пациент`,
        'task': `Задача`,
        'other': `Неопределённый тип объекта`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Множественный выбор`,
        'singleSelect': `Одиночный выбор`,
        'number': `Число`,
        'text': `Текст`,
        'date': `Дата`,
        'dateTime': `Дата и время`,
        'checkbox': `Флажок`,
        'user': `Пользователь`,
        'other': `Неопределённый тип`,
      })
    },
    'stagingModalDisclaimerMarkdown': `Этот общедоступный экземпляр helpwave tasks предназначен \\b{для разработки и предварительного просмотра}. Пожалуйста, вводите \\b{только} \\b{неконфиденциальные тестовые данные}. Этот экземпляр может быть \\negative{\\b{удалён в любой момент}}`,
    'startRecording': `Начать запись`,
    'stateUpdated': `Статус обновлён`,
    'status': `Статус`,
    'stopRecording': `Остановить запись`,
    'subjectType': `Тип объекта`,
    'submissionDetails': `Сведения об отправке`,
    'submit': `Отправить`,
    'submittingAs': ({ name }): string => {
      return `Отправка от имени ${name}`
    },
    'surveyDescription': `Ваше мнение очень важно для нас. Пожалуйста, уделите минуту, чтобы пройти наш опрос.`,
    'surveyTitle': `Помогите нам улучшить helpwave tasks`,
    'system': `Система`,
    'task': `Задача`,
    'taskFromPresetTooltip': `Создано из шаблона задач`,
    'taskPresetAddRow': `Добавить задачу`,
    'taskPresetApplyToRow': `Применить к строке шаблона`,
    'taskPresetCreate': `Создать шаблон`,
    'taskPresetDelete': `Удалить`,
    'taskPresetDeleteConfirm': `Удалить этот шаблон задач?`,
    'taskPresetEdit': `Редактировать шаблон`,
    'taskPresetEditDetails': `Изменить детали`,
    'taskPresetEmptyList': `Шаблонов задач пока нет.`,
    'taskPresetKey': `Ключ`,
    'taskPresetKeyHint': `Необязательный уникальный ключ для поиска. Оставьте пустым для автоматической генерации.`,
    'taskPresetName': `Название`,
    'taskPresetNoEstimate': `Без оценки`,
    'taskPresetNoTasks': `В этом шаблоне нет задач.`,
    'taskPresetRemoveRow': `Удалить`,
    'taskPresets': `Шаблоны`,
    'taskPresetSave': `Сохранить шаблон`,
    'taskPresetsDescription': `Многократно используемые списки задач с необязательными зависимостями.`,
    'taskPresetSelectPlaceholder': `Выберите шаблон`,
    'taskPresetSourceNotFound': `Не удалось загрузить шаблон.`,
    'taskPresetSourceOpenSettings': `Открыть в настройках`,
    'taskPresetSourceTasksInGraph': `Задачи в шаблоне`,
    'taskPresetSourceTitle': `Исходный шаблон`,
    'tasks': `Задачи`,
    'tasksCreatedFromPreset': `Задачи созданы`,
    'tasksUpdatedRecently': `Недавно обновлённые задачи`,
    'taskTitlePlaceholder': `Что нужно сделать?`,
    'teams': `Команды`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Тёмная`,
        'light': `Светлая`,
        'system': `Системная`,
        'other': `Системная`,
      })
    },
    'timeEstimate': `Оценка времени`,
    'title': `Заголовок`,
    'totalPatients': `Всего пациентов`,
    'type': `Тип`,
    'updated': `Обновлено`,
    'url': `URL`,
    'user': `Пользователь`,
    'userInformation': `Сведения о пользователе`,
    'users': `Пользователи`,
    'viewAnyoneWithLinkCanView': `Просматривать может любой, у кого есть ссылка`,
    'viewDerivedPatientsHint': `Пациенты из задач, соответствующих этому быстрому доступу (без повторов).`,
    'views': `Быстрый доступ`,
    'viewsEntityPatient': `Пациенты`,
    'viewsEntityTask': `Задачи`,
    'viewSettings': `Быстрый доступ`,
    'viewSettingsDescription': `Управление сохранёнными быстрыми доступами к задачам и пациентам.`,
    'viewVisibility': `Видимость`,
    'viewVisibilityLinkShared': `Доступ по ссылке`,
    'viewVisibilityPrivate': `Личный`,
    'waitingForPatient': `Ожидание пациента`,
    'waitPatient': `Перевести пациента в ожидание`,
    'wards': `Отделения`,
    'weeklySurvey': `Еженедельный опрос`,
    'yes': `Да`
  },
  'tr-TR': {
    'account': `Hesap`,
    'active': `Aktif`,
    'add': `Ekle`,
    'addFastAccess': `Hızlı erişim ekle`,
    'addFastAccessDescription': `Yeni hızlı erişim için bir ad girin.`,
    'additionalAssigneesCount': ({ count }): string => {
      return `+${count}`
    },
    'addPatient': `Hasta ekle`,
    'addProperty': `Özellik ekle`,
    'addTask': `Görev ekle`,
    'admitPatient': `Hastanın yatışını yap`,
    'anonymous': `Anonim`,
    'anonymousSubmission': `Anonim gönderim`,
    'archivedPropertyDescription': `Arşivlenen özellikler artık nesnelere atanamaz.`,
    'archiveProperty': `Özelliği arşivle`,
    'assignedTo': `Atanan kişi`,
    'assigneeTeam': `Atanan ekip`,
    'authenticationFailed': `Kimlik doğrulama başarısız`,
    'birthdate': `Doğum tarihi`,
    'cancel': `İptal`,
    'clear': `Temizle`,
    'clearCache': `Önbelleği temizle`,
    'clearPropertyColumnActionPatient': `Listelenen hastalarda bu özelliğin değerlerini temizle`,
    'clearPropertyColumnActionTask': `Bu özelliği listelenen görevlerden kaldır`,
    'clearPropertyColumnConfirmButtonPatient': `Özellik değerlerini temizle`,
    'clearPropertyColumnConfirmButtonTask': `Özelliği görevlerden kaldır`,
    'clearPropertyColumnDialogDescriptionPatient': ({ propertyName, count }): string => {
      return `"${propertyName}" özelliğinin tüm değerleri, bu listede şu anda yüklü olan ${count} hastada temizlenecek. Özellik bu hastalara bağlı kalır. Bu listede yüklü olmayan hastalar etkilenmez.`
    },
    'clearPropertyColumnDialogDescriptionTask': ({ propertyName, count }): string => {
      return `"${propertyName}" özelliği, bu listede şu anda yüklü olan ${count} görevden kalıcı olarak kaldırılacak. Bu listede yüklü olmayan görevler etkilenmez.`
    },
    'clearPropertyColumnDialogTitlePatient': `Hastalardaki özellik değerlerini temizle`,
    'clearPropertyColumnDialogTitleTask': `Özelliği görevlerden kaldır`,
    'clearPropertyColumnTypeNameInstruction': ({ propertyName }): string => {
      return `Onaylamak için "${propertyName}" yazın.`
    },
    'clinic': `Klinik`,
    'clinics': `Klinikler`,
    'clinicUpdated': `Klinik güncellendi`,
    'close': `Kapat`,
    'closedTasks': `Tamamlanan görevler`,
    'collapseAll': `Tümünü daralt`,
    'confirm': `Onayla`,
    'confirmDeleteView': `Kayıtlı bu hızlı erişim silinsin mi? Bu işlem geri alınamaz.`,
    'confirmSelection': `Seçimi onayla`,
    'confirmShiftHandover': `Vardiya devrini onayla`,
    'confirmShiftHandoverDescription': `Tüm açık görevleri seçilen kullanıcıya devretmek istediğinizden emin misiniz?`,
    'confirmShiftHandoverDescriptionWithName': ({ taskCount, name }): string => {
      let _out: string = ''
      _out += TranslationGen.resolvePlural(taskCount, {
        '=1': `${taskCount} açık görevi`,
        'other': `${taskCount} açık görevi`,
      })
      _out += ` ${name} adlı kişiye devretmek istediğinizden emin misiniz?`
      return _out
    },
    'conflictDetected': `Çakışma algılandı`,
    'connectionConnected': `Bağlandı`,
    'connectionConnecting': `Bağlanıyor…`,
    'connectionDisconnected': `Bağlantı kesildi`,
    'copyShareLink': `Bağlantıyı kopyala`,
    'copyShareLinkEnableSharingFirst': `Bağlantıya sahip diğer kişilerin bu hızlı erişimi açabilmesi için bağlantı paylaşımını etkinleştirin.`,
    'copyViewToMyViews': `Hızlı erişimime kopyala`,
    'create': `Oluştur`,
    'createTask': `Görev oluştur`,
    'creationDate': `Oluşturma tarihi`,
    'currentTime': `Geçerli saat`,
    'dashboard': `Gösterge paneli`,
    'dashboardWelcomeAfternoon': ({ name }): string => {
      return `İyi günler, ${name}!`
    },
    'dashboardWelcomeDescription': `Bugün olup bitenler burada.`,
    'dashboardWelcomeEvening': ({ name }): string => {
      return `İyi akşamlar, ${name}!`
    },
    'dashboardWelcomeMorning': ({ name }): string => {
      return `Günaydın, ${name}!`
    },
    'dashboardWelcomeNight': ({ name }): string => {
      return `İyi geceler, ${name}!`
    },
    'dashboardWelcomeNoon': ({ name }): string => {
      return `Tünaydın, ${name}!`
    },
    'delete': `Sil`,
    'deletePatient': `Hastayı sil`,
    'deletePatientConfirmation': `Bu hastayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
    'description': `Açıklama`,
    'descriptionPlaceholder': `Daha fazla ayrıntı ekleyin...`,
    'deselectAll': `Tüm seçimleri kaldır`,
    'developmentAndPreviewInstance': `Geliştirme ve önizleme ortamı`,
    'discard': `At`,
    'discardDraftMessage': `Kaydedilmemiş girişleriniz var. Şimdi kapatırsanız girdiğiniz her şey kaybolur.`,
    'discardDraftTitle': `Taslak atılsın mı?`,
    'discardViewChanges': `Değişiklikleri at`,
    'dischargePatient': `Hastayı taburcu et`,
    'dischargePatientConfirmation': `Bu hastayı taburcu etmek istediğinizden emin misiniz? Bu işlem hastanın durumunu değiştirir.`,
    'dismiss': `Kapat`,
    'dismissAll': `Tümünü kapat`,
    'diverse': `Diğer`,
    'done': `Tamamlandı`,
    'dueDate': `Son tarih`,
    'dueDateInDays': ({ days }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(days, {
        '=1': `${days} gün`,
        'other': `${days} gün`,
      })
      return _out
    },
    'dueDateInHours': ({ hours }): string => {
      let _out: string = ''
      _out += `+`
      _out += TranslationGen.resolvePlural(hours, {
        '=1': `${hours} saat`,
        'other': `${hours} saat`,
      })
      return _out
    },
    'dueDateNow': `Şimdi`,
    'dueDateToday': `Bugün`,
    'dueDateTomorrow': `Yarın`,
    'duplicate': `Çoğalt`,
    'edit': `Düzenle`,
    'editPatient': `Hastayı düzenle`,
    'editPresetTask': `Şablon görevini düzenle`,
    'editTask': `Görevi düzenle`,
    'enterFeedback': `Geri bildiriminizi buraya yazın...`,
    'error': `Hata`,
    'errorOccurred': `Bir hata oluştu`,
    'estimatedTime': `Tahmini süre (dakika)`,
    'expandAll': `Tümünü genişlet`,
    'export': `Dışa aktar`,
    'exportCsv': `CSV olarak dışa aktar`,
    'exportExcel': `Excel olarak dışa aktar (yazdırılabilir)`,
    'exportFailed': `Dışa aktarma başarısız oldu. Lütfen tekrar deneyin.`,
    'feedback': `Geri bildirim`,
    'feedbackDescription': `Geri bildiriminizi paylaşın, hata bildirin veya iyileştirme önerin.`,
    'female': `Kadın`,
    'filter': `Filtre`,
    'filterAll': `Tümü`,
    'filterUndone': `Açık`,
    'firstName': `Ad`,
    'freeBeds': `Boş yataklar`,
    'hide': `Gizle`,
    'homePage': `Ana sayfa`,
    'imprint': `Künye`,
    'inactive': `Pasif`,
    'install': `Yükle`,
    'installApp': `Uygulamayı yükle`,
    'installAppDescription': `Çevrimdışı destek ve daha hızlı erişimle daha iyi bir deneyim için helpwave tasks uygulamasını yükleyin.`,
    'language': `Dil`,
    'lastName': `Soyad`,
    'listViewCard': `Kart görünümü`,
    'listViewTable': `Tablo görünümü`,
    'loading': `Yükleniyor...`,
    'loadingAlmostThere': `Neredeyse hazır...`,
    'loadingGettingReady': `Bir dakika — her şey hazırlanıyor...`,
    'loadingHangOn': `Bir saniye — en güncel veriler alınıyor...`,
    'loadingMoment': `Az kaldı, neredeyse hazır...`,
    'loadMore': `Daha fazla yükle`,
    'loadTaskPreset': `Şablon yükle`,
    'loadTaskPresetConfirm': ({ count }): string => {
      let _out: string = ''
      _out += `Bu hasta için `
      _out += TranslationGen.resolvePlural(count, {
        '=1': `${count} görev`,
        'other': `${count} görev`,
      })
      _out += ` oluşturulsun mu?`
      return _out
    },
    'loadTaskPresetConfirmTitle': `Şablon yüklemeyi onayla`,
    'loadTaskPresetCreateAndAssign': `Oluştur ve bana ata`,
    'loadTaskPresetSelectTasks': `Şablondaki görevler`,
    'loadTaskPresetTaskLabel': `Şablon`,
    'loadTaskPresetTitle': `Görev şablonu yükle`,
    'location': `Konum`,
    'locationBed': `Yatak`,
    'locationClinic': `Klinik`,
    'locationRoom': `Oda`,
    'locationType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'CLINIC': `Klinik`,
        'WARD': `Servis`,
        'TEAM': `Ekip`,
        'ROOM': `Oda`,
        'BED': `Yatak`,
        'other': `Diğer`,
      })
    },
    'locationWard': `Servis`,
    'login': `Giriş`,
    'logInAgain': `Tekrar giriş yap`,
    'loginRequired': `Giriş gerekli`,
    'loginRequiredDescription': `Bu sayfayı kullanmak için giriş yapmanız gerekir.`,
    'logout': `Çıkış yap`,
    'male': `Erkek`,
    'markPatientDead': `Hastayı vefat etmiş olarak işaretle`,
    'markPatientDeadConfirmation': `Bu hastayı vefat etmiş olarak işaretlemek istediğinizden emin misiniz?`,
    'menu': `Menü`,
    'more': `Daha fazla`,
    'myFavorites': `Favorilerim`,
    'myOpenTasks': `Açık görevlerim`,
    'myTasks': `Görevlerim`,
    'name': `Ad`,
    'nFilter': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} filtre`,
        'other': `${count} filtre`,
      })
    },
    'nMinutesShort': ({ minCount }): string => {
      return `${minCount} dk`
    },
    'no': `Hayır`,
    'noClosedTasks': `Tamamlanan görev yok`,
    'noLocationsFound': `Konum bulunamadı`,
    'none': `Yok`,
    'noNotifications': `Yeni güncelleme yok`,
    'noOpenTasks': `Açık görev yok`,
    'noPatient': `Hasta yok`,
    'noPatientsInTaskView': `Bu görev hızlı erişimi için hasta bulunamadı.`,
    'noResultsFound': `Sonuç bulunamadı`,
    'notAssigned': `Atanmamış`,
    'notifications': `Bildirimler`,
    'nPatient': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} hasta`,
        'other': `${count} hasta`,
      })
    },
    'nSorting': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} sıralama`,
        'other': `${count} sıralama`,
      })
    },
    'nTask': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `${count} görev`,
        'other': `${count} görev`,
      })
    },
    'nYears': ({ years }): string => {
      return TranslationGen.resolvePlural(years, {
        '=0': `0 yaş`,
        '=1': `1 yaş`,
        'other': `${years} yaş`,
      })
    },
    'occupancy': `Doluluk`,
    'ok': `Tamam`,
    'onboardingSurvey': `Başlangıç anketi`,
    'openSurvey': `Anketi aç`,
    'openTasks': `Açık görevler`,
    'openView': `Aç`,
    'option': `Seçenek`,
    'organizations': `Kuruluşlar`,
    'overview': `Genel bakış`,
    'pages.404.loading': `Yükleniyor...`,
    'pages.404.notFound': `404 - Sayfa bulunamadı`,
    'pages.404.notFoundDescription1': `Aradığınız sayfa kesinlikle bu değil`,
    'pages.404.notFoundDescription2': `Sizi şuraya götürelim:`,
    'patient': `Hasta`,
    'patientActions': `Hasta işlemleri`,
    'patientData': `Veriler`,
    'patients': `Hastalar`,
    'patientsCountChipAdmitted': ({ count }): string => {
      return `Yatışı yapılan ${count}`
    },
    'patientsCountChipTotal': ({ count }): string => {
      return `Toplam ${count}`
    },
    'patientsCountChipWaiting': ({ count }): string => {
      return `Bekleyen ${count}`
    },
    'patientState': ({ state }): string => {
      return TranslationGen.resolveSelect(state, {
        'WAIT': `Bekliyor`,
        'ADMITTED': `Yatışı yapıldı`,
        'DISCHARGED': `Taburcu edildi`,
        'DEAD': `Vefat etti`,
        'other': `Bilinmiyor`,
      })
    },
    'patientsUpdatedRecently': `Son güncellenen hastalar`,
    'pickClinic': `Klinik seçin`,
    'pickClinicDescription': `Bu hasta için kliniği seçin. Yalnızca klinik konumları seçilebilir.`,
    'pickPosition': `Konum seçin`,
    'pickPositionDescription': `Bu hasta için konumu seçin. Hastane, muayenehane, klinik, servis, yatak veya oda konumlarını seçebilirsiniz.`,
    'pickTeams': `Ekip seçin`,
    'pickTeamsDescription': `Bu hasta için bir veya daha fazla ekip seçin. Klinik, ekip, muayenehane veya hastane konumlarını seçebilirsiniz.`,
    'position': `Konum`,
    'positionUpdated': `Konum güncellendi`,
    'preferences': `Tercihler`,
    'priority': `Öncelik`,
    'priorityLabel': `Öncelik`,
    'priorityNone': `Yok`,
    'privacy': `Gizlilik`,
    'properties': `Özellikler`,
    'propertiesSettingsDescription': `Görevler ve hastalar için özel alanlar: türleri tanımlayın ve filtrelerde kullanın.`,
    'property': `Özellik`,
    'pThemes': ({ count }): string => {
      return TranslationGen.resolvePlural(count, {
        '=1': `Tema`,
        'other': `Temalar`,
      })
    },
    'rAdd': ({ name }): string => {
      return `${name} ekle`
    },
    'rChipTotal': ({ value }): string => {
      return `Toplam ${value}`
    },
    'readOnlyView': `Salt okunur`,
    'recentPatients': `Son hastalarınız`,
    'recentTasks': `Son görevleriniz`,
    'rEdit': ({ name }): string => {
      return `${name} güncelle`
    },
    'refreshing': `Yenileniyor…`,
    'removeProperty': `Özelliği kaldır`,
    'removePropertyConfirmation': `Bu özelliği kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
    'retakeSurvey': `Anketi yeniden yanıtla`,
    'rShow': ({ name }): string => {
      return `${name} göster`
    },
    'savedViews': `Hızlı erişim`,
    'saveView': `Hızlı erişimi kaydet`,
    'saveViewAsNew': `Yeni hızlı erişim olarak kaydet`,
    'saveViewDescription': `Bu hızlı erişime bir ad verin. Filtreler, sıralama, arama ve konum kaydedilir.`,
    'saveViewDescriptionFromSystemList': `Bu düzenden yeni bir hızlı erişim kaydı oluşturur. Bu sayfa uygulama tarafından sabitlenmiştir ve yerinde kaydedilmez — gerektiğinde kenar çubuğundan açın.`,
    'saveViewOverwriteCurrent': `Mevcut hızlı erişimin üzerine yaz`,
    'scopeChangeNode': `Düğümü değiştir`,
    'scopeNoNodeSelected': `Bu kaydın saklanacağı düğümü seçin.`,
    'scopePrivate': `Özel`,
    'scopePrivateDescription': `Bu kaydı yalnızca siz görebilir ve kullanabilirsiniz.`,
    'scopePublic': `Herkese açık`,
    'scopePublicDescription': `Seçilen düğüme veya alt ağacına erişimi olan herkes bu kaydı görebilir ve kullanabilir.`,
    'scopeSelectNode': `Düğüm seç`,
    'scopeShared': `Bağlantıyla paylaşıldı`,
    'scopeSharedDescription': `Bu kaydı listelerinizde yalnızca siz görürsünüz. Seçilen düğüme veya alt ağacına erişimi olan herkes kaydı bağlantısı üzerinden açabilir.`,
    'scopeStoredAt': `Saklandığı yer`,
    'scopeVisibility': `Paylaşım`,
    'scrollToTop': `Başa dön`,
    'search': `Ara`,
    'searchLocations': `Konum ara...`,
    'searchUserOrTeam': `Kullanıcı (veya ekip) ara...`,
    'searchUsersOrTeams': `Kullanıcı veya ekip ara...`,
    'security': `Güvenlik`,
    'selectAll': `Tümünü seç`,
    'selectAssignee': `Ata...`,
    'selectClinic': `Klinik seç`,
    'selectLocation': `Konum seç`,
    'selectLocationDescription': `Lütfen hasta için atanan konumu seçin.`,
    'selectOptions': `Seçenekleri seç`,
    'selectPosition': `Konum seç`,
    'selectRootLocation': `Kök konum seç`,
    'selectRootLocationDescription': `Erişim kapsamınızı belirleyen kök konumları seçin. Yalnızca hastaneler, muayenehaneler, klinikler ve ekipler seçilebilir. Bir üst konumun seçilmesi tüm alt konumlarını da kapsar.`,
    'selectTeams': `Ekip seç`,
    'sessionExpired': `Oturumun süresi doldu`,
    'sessionExpiredDescription': `Uzun süre işlem yapılmadığı için oturumunuz kapatıldı. Devam etmek için lütfen tekrar giriş yapın. Kaydedilmemiş değişiklikler kaybolmuş olabilir.`,
    'settings': `Ayarlar`,
    'settingsDescription': `Uygulama yapılandırmasını buradan değiştirebilirsiniz.`,
    'sex': `Cinsiyet`,
    'shiftHandover': `Vardiya devri`,
    'showAllTasks': `Tüm görevleri göster`,
    'showPatient': ({ name }): string => {
      return `${name} adlı hastayı göster`
    },
    'showTeamTasks': `Ekip görevlerini göster`,
    'sorting': `Sıralama`,
    'sPriority': ({ priority }): string => {
      return TranslationGen.resolveSelect(priority, {
        'P1': `Normal`,
        'P2': `Orta`,
        'P3': `Yüksek`,
        'P4': `Kritik`,
        'other': `-`,
      })
    },
    'sPropertySubjectType': ({ subject }): string => {
      return TranslationGen.resolveSelect(subject, {
        'patient': `Hasta`,
        'task': `Görev`,
        'other': `Tanımsız nesne türü`,
      })
    },
    'sPropertyType': ({ type }): string => {
      return TranslationGen.resolveSelect(type, {
        'multiSelect': `Çoklu seçim`,
        'singleSelect': `Tekli seçim`,
        'number': `Sayı`,
        'text': `Metin`,
        'date': `Tarih`,
        'dateTime': `Zaman noktası`,
        'checkbox': `Onay kutusu`,
        'user': `Kullanıcı`,
        'other': `Tanımsız tür`,
      })
    },
    'stagingModalDisclaimerMarkdown': `helpwave tasks uygulamasının bu herkese açık örneği \\b{geliştirme ve önizleme amaçlıdır}. Lütfen \\b{yalnızca} \\b{gizli olmayan test verileri} girdiğinizden emin olun. Bu örnek \\negative{\\b{her an silinebilir}}`,
    'startRecording': `Kaydı başlat`,
    'stateUpdated': `Durum güncellendi`,
    'status': `Durum`,
    'stopRecording': `Kaydı durdur`,
    'subjectType': `Nesne türü`,
    'submissionDetails': `Gönderim ayrıntıları`,
    'submit': `Gönder`,
    'submittingAs': ({ name }): string => {
      return `${name} olarak gönderiliyor`
    },
    'surveyDescription': `Geri bildiriminiz bizim için değerlidir. Lütfen anketimizi doldurmak için birkaç dakikanızı ayırın.`,
    'surveyTitle': `helpwave tasks uygulamasını geliştirmemize yardımcı olun`,
    'system': `Sistem`,
    'task': `Görev`,
    'taskFromPresetTooltip': `Bir görev şablonundan oluşturuldu`,
    'taskPresetAddRow': `Görev ekle`,
    'taskPresetApplyToRow': `Şablon satırına uygula`,
    'taskPresetCreate': `Şablon oluştur`,
    'taskPresetDelete': `Sil`,
    'taskPresetDeleteConfirm': `Bu görev şablonu silinsin mi?`,
    'taskPresetEdit': `Şablonu düzenle`,
    'taskPresetEditDetails': `Ayrıntıları düzenle`,
    'taskPresetEmptyList': `Henüz görev şablonu yok.`,
    'taskPresetKey': `Anahtar`,
    'taskPresetKeyHint': `Aramalar için isteğe bağlı benzersiz anahtar. Otomatik oluşturulması için boş bırakın.`,
    'taskPresetName': `Ad`,
    'taskPresetNoEstimate': `Tahmin yok`,
    'taskPresetNoTasks': `Bu şablonda görev yok.`,
    'taskPresetRemoveRow': `Kaldır`,
    'taskPresets': `Şablonlar`,
    'taskPresetSave': `Şablonu kaydet`,
    'taskPresetsDescription': `İsteğe bağlı bağımlılıklar içeren, yeniden kullanılabilir görev listeleri.`,
    'taskPresetSelectPlaceholder': `Bir şablon seçin`,
    'taskPresetSourceNotFound': `Şablon yüklenemedi.`,
    'taskPresetSourceOpenSettings': `Ayarlarda aç`,
    'taskPresetSourceTasksInGraph': `Şablondaki görevler`,
    'taskPresetSourceTitle': `Kaynak şablon`,
    'tasks': `Görevler`,
    'tasksCreatedFromPreset': `Görevler oluşturuldu`,
    'tasksUpdatedRecently': `Son güncellenen görevler`,
    'taskTitlePlaceholder': `Ne yapılması gerekiyor?`,
    'teams': `Ekipler`,
    'themeMode': ({ theme }): string => {
      return TranslationGen.resolveSelect(theme, {
        'dark': `Koyu`,
        'light': `Açık`,
        'system': `Sistem`,
        'other': `Sistem`,
      })
    },
    'timeEstimate': `Süre tahmini`,
    'title': `Başlık`,
    'totalPatients': `Toplam hasta`,
    'type': `Tür`,
    'updated': `Güncellendi`,
    'url': `URL`,
    'user': `Kullanıcı`,
    'userInformation': `Kullanıcı bilgileri`,
    'users': `Kullanıcılar`,
    'viewAnyoneWithLinkCanView': `Bağlantıya sahip herkes görüntüleyebilir`,
    'viewDerivedPatientsHint': `Bu hızlı erişimle eşleşen görevlerde yer alan hastalar (tekil).`,
    'views': `Hızlı erişim`,
    'viewsEntityPatient': `Hastalar`,
    'viewsEntityTask': `Görevler`,
    'viewSettings': `Hızlı erişim`,
    'viewSettingsDescription': `Kayıtlı görev ve hasta hızlı erişimlerini yönetin.`,
    'viewVisibility': `Görünürlük`,
    'viewVisibilityLinkShared': `Bağlantıyla paylaşıldı`,
    'viewVisibilityPrivate': `Özel`,
    'waitingForPatient': `Hasta bekleniyor`,
    'waitPatient': `Hastayı bekleme durumuna al`,
    'wards': `Servisler`,
    'weeklySurvey': `Haftalık anket`,
    'yes': `Evet`
  }
}

