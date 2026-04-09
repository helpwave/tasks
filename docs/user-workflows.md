# helpwave tasks – Benutzer-Workflows

Kurzanleitung für typische Abläufe in der Web-Anwendung. Technische Details (URLs, Berechtigungen) können je nach Installation variieren.

---

## 1. Anmeldung (Login)

1. Öffnen Sie die URL Ihrer helpwave-tasks-Instanz im Browser.
2. Sie werden bei geschützten Seiten zur Anmeldung weitergeleitet (Identity Provider, z. B. Keycloak).
3. Melden Sie sich mit den von Ihrer Organisation vorgegebenen Zugangsdaten an.
4. Nach erfolgreicher Anmeldung gelangen Sie zurück in die App; eine Sitzung kann automatisch verlängert werden.

---

## 2. Standort(e) wählen (Root-Location)

Viele Listen und Zähler beziehen sich auf die **gewählten Root-Standorte** (Klinik, Krankenhaus oder vergleichbare oberste Ebene in Ihrer Struktur).

1. Nach dem Login erscheint – sobald Standorte für Sie hinterlegt sind – ggf. automatisch der **Standort-Dialog**, falls noch kein Standort gewählt ist.
2. Über die **Schaltfläche in der Kopfzeile** (ab größeren Bildschirmen) oder im **Seitenmenü** (mobil unten) können Sie einen oder **mehrere** Root-Standorte auswählen oder ändern.
3. Erst mit gewähltem Standort sind z. B. Dashboard-Zahlen, „Meine Aufgaben“ und Patientenlisten im erwarteten Umfang sinnvoll gefüllt.

---

## 3. Patient anlegen

1. Gehen Sie zu **Patienten** (Seitenmenü oder Dashboard-Kachel).
2. Klicken Sie auf **Patient hinzufügen** (Plus-Symbol in der Werkzeugleiste der Patientenliste).
3. Im rechten Panel öffnet sich die Patientenmaske. Standardmäßig ist der Reiter **Stammdaten** aktiv.
4. Pflichtangaben u. a.: Vor- und Nachname, Geburtsdatum, Geschlecht, **Klinik** (und je nach Prozess Station/Team/Position). Status (z. B. Wartend) ist wählbar.
    1. Klinik entspricht der "zahlenden Fachabteilung" (z.B. Kardiologie, Intensivmedizin, etc.)
    2. Station entspricht dem physischen Standort des Patienten
    3. Team entspricht den beteiligten Behandlungsteams (z.B. Intensivmedizin, Herzchirurgie, etc.)
5. Speichern Sie den Datensatz. Der Patient erscheint in der Patientenliste, sofern er zu Ihrem gewählten Standortkontext passt.

---

## 4. Eigenschaften (Properties) – zwei Ebenen

### 4.1 Felddefinitionen anlegen (für Patient *und* Aufgabe)

**Wo:** **Einstellungen** (Zahnrad) → unter **System** → **Eigenschaften** (Seite `/properties`).

Hier legen Administratoren **Felder** fest: Name, Typ (Text, Zahl, Datum, Auswahl, Benutzer, …) und ob sie für **Patienten** oder **Aufgaben** gelten. Ohne aktive Definition erscheinen die Felder nicht in den Masken.

### 4.2 Werte am Patienten pflegen

**Wo:** Patientenliste → Patient öffnen → Reiter **Eigenschaften**.

Dort werden die definierten Felder als **Werte** befüllt oder geändert. Änderungen werden mit dem Patienten gespeichert (über „Patient aktualisieren“ im Hintergrund).

**Kurz:** Definitionen unter **Einstellungen → Eigenschaften**; Ausfüllen unter **Patient → Reiter Eigenschaften**.

---

## 5. Wo finden Sie Patienten?

| Ort | Inhalt |
|-----|--------|
| **Patienten** (`/patients`) | Zentrale Patientenliste für Ihren **Root-Standort-Kontext**. |
| **Dashboard** (`/`) | Kurzliste **Zuletzt bearbeitete Patienten**. |
| **Standort-Seite** (`/location/…`) | Reiter **Patienten**: Patienten, die diesem Knoten (Station, Team, …) zugeordnet sind bzw. der Filterung entsprechen. |
| **Gespeicherte Ansicht** (`/view/…`) | Wenn die Ansicht auf **Patienten** basiert: gefilterte Patientenliste nach den gespeicherten Kriterien. |

Die sichtbaren Datensätze hängen von **Berechtigungen** und **gewähltem Standort** ab.

---

## 6. Patientenliste filtern und sortieren

Auf der Seite **Patienten** (und in eingebetteten Listen mit voller Werkzeugleiste):

1. **Suche:** Suchfeld über der Tabelle (Volltext, ggf. inkl. Eigenschaften je nach Backend-Konfiguration).
2. **Filter:** Schaltfläche **Filter** öffnet die Filterleiste; Sie können mehrere Kriterien kombinieren (z. B. Status, Standort, Eigenschaftsfelder – je nach Angebot).
3. **Sortierung:** Schaltfläche **Sortierung** – mehrere Sortierkriterien sind möglich.
4. **Spalten:** Über den **Spalten-Schalter** blenden Sie Spalten ein oder aus (inkl. dynamischer Eigenschaftsspalten).

**Karten- vs. Tabellenansicht:** Für die **Druckausgabe** wird bei Druck automatisch die **Tabellenansicht** verwendet (siehe Abschnitt Drucken).

---

## 7. Schnellzugriff: gespeicherte Ansichten erstellen und teilen

### Ansicht speichern (Schnellzugriff in der Seitenleiste)

1. **Patienten** oder **Meine Aufgaben:** Stellen Sie Filter, Sortierung, Suche und sichtbare Spalten wie gewünscht ein.
2. Sobald sich die Ansicht von der Standardansicht unterscheidet, erscheint ein Menü zum **Speichern** der Ansicht (z. B. „Als neue Ansicht speichern“).
3. Nach dem Speichern erscheint die Ansicht unter **Gespeicherte Ansichten** im **Seitenmenü**; von dort springen Sie direkt auf `/view/<id>`.

**Verwaltung:** **Einstellungen** → **Ansichten** (`/settings/views`): Umbenennen, Duplizieren, Löschen, Link öffnen.

### Link teilen

1. Öffnen Sie die gewünschte gespeicherte Ansicht (aus der Seitenleiste oder Einstellungen).
2. Klicken Sie auf das **Teilen-Symbol** in der Kopfzeile der Ansicht – der Link (`…/view/<id>`) wird in die Zwischenablage kopiert.
3. Senden Sie den Link an Kolleginnen und Kollegen. **Hinweis:** Empfänger müssen angemeldet sein und dürfen die zugrunde liegenden Daten sehen. Ist die Ansicht fremd, kann sie ggf. nur **lesend** sein; mit **In meine Ansichten kopieren** lässt sich eine eigene Kopie anlegen.

---

## 8. Aufgaben erstellen

**Voraussetzung:** In Ihrem aktuellen Standort-Kontext muss mindestens **ein Patient** vorhanden sein; andernfalls kann die Schaltfläche „Aufgabe hinzufügen“ in der Liste ausgegraut sein.

**Möglichkeiten:**

- **Aufgabenliste** (z. B. unter einem Standort oder „Meine Aufgaben“): **Plus-Symbol** „Aufgabe hinzufügen“ → rechtes Panel **Aufgabe erstellen**.
- **Patient öffnen** → Reiter **Aufgaben** → dort neue Aufgabe anlegen (Patient ist bereits vorausgewählt).

Im Formular: Titel, Beschreibung, Fälligkeit, Priorität, Patient (falls nicht fix), Zuweisung (siehe unten).

---

## 9. Aufgaben zuweisen

Im **Aufgaben-Detail** (Erstellen oder Bearbeiten im rechten Panel):

- Zuweisung an eine **Person** (Benutzer) und/oder ein **Team** – je nach Konfiguration und Maske.
- Über Avatare oder Benutzernamen lassen sich zugewiesene Personen einsehen; in der Tabellenansicht gibt es ggf. eine Spalte für **Zuweisung** / Patient.

Team-bezogene Listen (z. B. Team-Standort) zeigen Aufgaben entsprechend der Teamzuweisung; Schalter wie „Alle Aufgaben“ können die Sicht erweitern.

---

## 10. Aufgabenliste filtern und sortieren

Auf **Meine Aufgaben** und in Listen mit voller Aufgaben-Werkzeugleiste:

1. **Suche** über dem Tabellenbereich.
2. **Filter** und **Sortierung** analog zur Patientenliste (mehrere Filter und Sortierkriterien möglich).
3. **Spalten** über den Spalten-Schalter; **Eigenschaften von Aufgaben** erscheinen als Spalten, wenn sie in den **Einstellungen → Eigenschaften** für Aufgaben definiert sind.

**Gespeicherte Ansicht:** Wenn Sie Filter/Sortierung speichern, können Sie dieselbe Konfiguration später über **Gespeicherte Ansichten** oder den **geteilten Link** wieder aufrufen.

---

## 11. Drucken (inkl. Microsoft Edge und Seitenverhältnis)

Die Anwendung bringt **Druck-Styles** für **Patienten- und Aufgaben-Tabellen** mit:

@00100200345 bitte prüfen ob das so korrekt ist.

### Empfohlene Schritte (allgemein)

1. Wechseln Sie bei Bedarf in die **Tabellenansicht** (bei Druck wird die Tabelle sowieso genutzt; Kartenansicht ist am Bildschirm für den Druck nicht maßgeblich).
2. **Browser-Druckdialog** öffnen: Windows/Linux z. B. **Strg+P**, macOS **⌘+P**.
3. Wählen Sie **Querformat / Landscape**.
4. Papierformat **A4** (oder das Format, das zu Ihrem Drucker passt; bei Abweichung „An Seite anpassen“ prüfen).

### Microsoft Edge – Größe und Verhältnis

1. **Drucken** öffnen (Strg+P).
2. Ziel: **Drucker** oder **Als PDF speichern**.
3. Unter **Weitere Einstellungen** bzw. **Layout**:
   - **Querformat** aktivieren (entspricht der App-Vorgabe A4 landscape).
   - **Skalierung:** Zuerst **100 %**; wenn Spalten abgeschnitten werden, **Anpassen an druckbare Fläche** / **Ganze Seite** (Bezeichnung je nach Edge-Version) wählen und prüfen, ob die Tabelle vollständig sichtbar ist.
4. **Ränder:** Falls der Rand zu schmal wirkt oder der Drucker nicht randlos kann, auf **Standardränder** wechseln.
5. **Vorschau** prüfen, bevor Sie drucken oder als PDF speichern.

Hinweis: Die genaue Benennung von Optionen („Skalierung“, „Seitenanpassung“) kann sich zwischen Edge-Versionen leicht unterscheiden; entscheidend ist **Querformat** und eine Skalierung, bei der die **gesamte Tabelle** in der Vorschau lesbar ist.

---

## Kurzüberblick Navigation

| Bereich | Menü / URL |
|---------|------------|
| Dashboard | Start / `/` |
| Meine Aufgaben | `/tasks` |
| Patienten | `/patients` |
| Standort / Team | Seitenleiste → Kliniken, Stationen, Teams → `/location/<id>` |
| Eigenschaften (Definitionen) | Einstellungen → Eigenschaften → `/properties` |
| Ansichten verwalten | Einstellungen → Ansichten → `/settings/views` |
| Gespeicherte Ansicht öffnen | Seitenleiste **Gespeicherte Ansichten** → `/view/<id>` |
