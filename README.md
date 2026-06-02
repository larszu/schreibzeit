# Schreibzeit

**Lernwörter-Kartei, Knickblätter & KI-Übungstexte für Grundschullehrkräfte.**

Schreibzeit hilft dabei, pro Kind eine individuelle **Lernwörter-Kartei** zu führen und daraus per Klick **druckfertige Knickblätter** („Lernwörterknicki"), **Wortkarten** und **passende Übungstexte** zu erzeugen. Die App ist **local-first**: Alle Daten bleiben auf dem Gerät, sie funktioniert **offline** und ist **ohne Adminrechte** nutzbar.

> **Datenschutz zuerst.** Es werden Kinderdaten verarbeitet. Standardmäßig bleiben **alle Daten ausschließlich lokal** (im Browser), es gibt **keine Telemetrie** und **kein Tracking**. Der **einzige** externe Aufruf ist die von der Lehrkraft ausdrücklich ausgelöste KI-Textfunktion (Google Gemini).

---

## Inhalt

- [Funktionen](#funktionen)
- [Nutzung ohne Adminrechte](#nutzung-ohne-adminrechte)
- [Das Knickblatt erklärt](#das-knickblatt-erklärt)
- [FRESCH-Strategien](#fresch-strategien)
- [KI-Übungstexte (Gemini) einrichten](#ki-übungstexte-gemini-einrichten)
- [Datenschutz / DSGVO](#datenschutz--dsgvo)
- [Backup & Datenumzug](#backup--datenumzug)
- [Entwicklung & Build](#entwicklung--build)
- [Technik](#technik)
- [Lizenz](#lizenz)

---

## Funktionen

- **Kinder- & Klassenverwaltung** – Klassen anlegen, Kinder zuordnen, Lernstand (Klasse 1–4, Förderbedarf, LRS) erfassen. Durchsuchbare Sidebar, schnelles Umschalten.
- **Lernwörter-Kartei pro Kind** – Wort, Artikel, Wortart, **Silbentrennung**, **Merkstellen** (schwierige Stellen), Status (`neu` · `wird geübt` · `sitzt`), Quelle/Textbezug, Notiz. Hinzufügen, bearbeiten, löschen, duplizieren, Massenaktionen.
- **Wörter aus Text herauspicken** – Kindertext einfügen, Wörter anklicken; **Dublettenprüfung** gegen die vorhandene Kartei; automatische Silben-/Merkstellen-Vorschläge beim Übernehmen.
- **Automatische Hilfen (immer editierbar)** – deutsche **Silbentrennung** (z. B. Som-mer, Zu-cker) und **Merkstellen-Vorschläge** (Doppelkonsonanten, ie, ck, tz, ß, Dehnungs-h, v, Umlaute, Diphthonge …). Trennstellen und Merkstellen lassen sich per Klick korrigieren.
- **Knickblatt-Generator** – DIN **A4 quer**, Zeilen = Wörter (Anzahl einstellbar, Standard 10), Spalten = Strategien (Vorlage, Silben schwingen, schwierige Stellen markieren, auswendig schreiben mit Falzlinie, Partnerdiktat sowie FRESCH-Spalten Verlängern/Ableiten/Merkwort). Echte **Grundschul-Lineatur** (Klasse 1–4 / Haus-Lineatur), Differenzierungsoptionen, Live-Vorschau, Druck/PDF.
- **Wortkarten** – Raster mehrerer Kärtchen pro A4-Seite zum Ausschneiden für den Karteikasten.
- **KI-Übungstexte** – kurze Geschichte, Lückentext oder Quatschsätze mit den Lernwörtern des Kindes; lernstandsgerecht; Lückentext mit Lösungswörter-Liste. Texte bearbeiten, speichern und drucken.
- **Backup** – Export/Import aller Daten als JSON (zusammenführen oder ersetzen), optional pro Kind.
- **Responsiv & touchfreundlich** – für Desktop, Laptop, Tablet und Smartphone.
- **PWA** – installierbar, offline nutzbar.

---

## Nutzung ohne Adminrechte

Es gibt zwei adminfreie Wege – ideal für Schul-PCs:

### 1. Web / PWA (empfohlen)

Die App ist eine reine Web-App. Rufen Sie die gehostete Version im Browser auf (z. B. die per GitHub Pages bereitgestellte Seite) und installieren Sie sie optional über **„Installieren" / „Zum Startbildschirm hinzufügen"**. Danach läuft sie **offline**. Alle Daten liegen lokal im Browser.

### 2. Windows-Portable (eine einzelne .exe)

Laden Sie aus den [Releases](../../releases) die Datei **`Schreibzeit-Portable-x.y.z.exe`** herunter und starten Sie sie per Doppelklick – **keine Installation, keine Adminrechte** nötig.

Für Verwaltungsgeräte stehen zusätzlich klassische Installer bereit: **Windows (NSIS-Setup)** und **macOS (`.dmg`)**.

> **Hinweis zur KI-Funktion bei reiner Datei-Öffnung:** Wird die App als lose Datei über `file://` geöffnet, kann der Browser den Gemini-Aufruf wegen „null origin" (CORS) blockieren. **Kartei, Knickblatt, Wortkarten und Druck funktionieren dann trotzdem vollständig offline.** Die KI-Funktion arbeitet zuverlässig in der gehosteten/PWA-Web-Version und in der Desktop-App.

---

## Das Knickblatt erklärt

Das **Knickblatt** („Lernwörterknicki") ist eine etablierte Übungsform:

1. Das **Lernwort** steht links als gedruckte **Vorlage**.
2. Das Kind übt es spaltenweise: **Silbenbögen schwingen** → **schwierige Stellen markieren**.
3. Dann **knickt** es das Blatt an der gestrichelten **Falzlinie**, sodass die Vorlage verdeckt ist, und schreibt das Wort **auswendig**.
4. Optional **diktiert ein Partnerkind** zur Kontrolle.

Im Generator sind Spalten an-/abschaltbar und sortierbar, die Lineatur ist wählbar, und für schwächere Kinder lässt sich die Vorlage **mit vorgedruckten Silbenbögen** und/oder **markierten Merkstellen** ausgeben (Differenzierung).

---

## FRESCH-Strategien

Die Übungsspalten orientieren sich an den **FRESCH-Strategien** (Freiburger Rechtschreibschule):

- **Schwingen** – das Wort in Silben sprechen/schwingen.
- **Verlängern** – z. B. *Hund → Hunde*, um den Auslaut zu hören.
- **Ableiten** – z. B. *Bäcker → backen*.
- **Merkwörter** – Wörter, die man sich einprägen muss.

---

## KI-Übungstexte (Gemini) einrichten

1. Kostenlosen API-Schlüssel holen unter **<https://aistudio.google.com/apikey>** (ohne Kreditkarte).
2. In Schreibzeit: **Einstellungen → KI-Textfunktion → API-Schlüssel** einfügen.
3. Standardmodell ist **`gemini-2.5-flash`** (Free-Tier, grob ~10 Anfragen/Min, ~250/Tag – für eine Lehrkraft ausreichend). Der Modellname ist frei änderbar (z. B. für künftige Modelle wie `gemini-3-flash-preview`).

Der Schlüssel wird **nur lokal** gespeichert. Übertragen werden ausschließlich die ausgewählten **Lernwörter** und die Aufgabenbeschreibung – **keine Kindernamen**.

> Hinweis: `gemini-2.0-flash` wurde zum 01.06.2026 abgeschaltet und wird nicht verwendet.

Fehlermeldungen sind verständlich auf Deutsch (kein Schlüssel, Limit erreicht, Netzwerkfehler, durch Sicherheitsfilter blockiert).

---

## Datenschutz / DSGVO

- **Local-first:** Alle Daten (Kinder, Wörter, Texte, Einstellungen) liegen ausschließlich in der lokalen Datenbank (IndexedDB) des Geräts.
- **Keine Telemetrie, kein Tracking, keine externen Aufrufe** – mit der **einzigen** Ausnahme des bewusst ausgelösten Gemini-Aufrufs.
- **Initialen statt Klarnamen:** In den Einstellungen aktivierbar; in der Oberfläche und auf Ausdrucken erscheinen dann nur Initialen.
- **„Alle Daten löschen"** entfernt sämtliche Daten unwiderruflich vom Gerät.

---

## Backup & Datenumzug

Da es keinen Server gibt, erfolgt die Sicherung über **Einstellungen → Datensicherung**:

- **Backup exportieren** – schreibt alle Daten in eine JSON-Datei.
- **Import (zusammenführen)** – fügt Daten hinzu/aktualisiert sie anhand der IDs.
- **Import (ersetzen)** – ersetzt alle vorhandenen Daten (mit Sicherheitsabfrage).

So lassen sich Daten sichern oder zwischen mehreren Schul-PCs umziehen.

---

## Entwicklung & Build

Voraussetzung: **Node.js 20+**.

```bash
npm install        # Abhängigkeiten installieren
npm run dev        # Entwicklungsserver (Vite)
npm test           # Tests (Vitest)
npm run lint       # ESLint
npm run build      # Web/PWA-Produktionsbuild nach dist/

# Desktop (Electron)
npm run electron:dev   # App im Electron-Fenster (Dev)
npm run build:win      # Windows: NSIS-Installer + Portable-.exe
npm run build:mac      # macOS: .dmg
npm run build:linux    # Linux: AppImage
```

Die Desktop-Builds laden dieselbe gebaute Web-App (`dist/`) – **eine gemeinsame Codebasis** für Web und Desktop.

### Releases (GitHub Actions)

Bei einem Tag `vX.Y.Z` baut der Workflow automatisch den Web-Build sowie die macOS- und Windows-Artefakte (inkl. Portable-.exe) und hängt sie an das GitHub-Release. Zusätzlich wird der Web-Build als Artefakt bereitgestellt (für GitHub Pages geeignet).

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Technik

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (responsiv, papierhafte Farbwelt)
- **Persistenz:** IndexedDB via Dexie.js (über eine austauschbare `Repository`-Abstraktion – ein späterer Cloud-Sync-Adapter ist andockbar)
- **PWA:** Service Worker + Manifest (offline, installierbar)
- **Druck/PDF:** dediziertes Print-CSS für exakt A4 quer, Lineatur in mm, Falzlinie; Ausgabe per Browser-Druck (→ PDF)
- **Desktop:** Electron + electron-builder (mac `dmg`, win `nsis` **und** `portable`)
- **KI:** Google Gemini über `fetch` (Header `x-goog-api-key`)
- **Tests:** Vitest (Silbentrennung, Merkstellen, Tokenizer, Knickblatt-Modell, Backup, Gemini-Prompt/Lückentext, Repository, UI-Smoke)

### Architektur & Erweiterbarkeit

Der Code ist modular und datengetrieben aufgebaut, damit Erweiterungen ohne Umbau der Kernlogik möglich sind:

- **Generatoren** (Knickblatt, Wortkarten, KI-Text) sind getrennt; neue Blatt-/Diktatformen (Spaltendiktat, Dosendiktat, Laufdiktat) lassen sich als weitere Generatoren ergänzen.
- **Spalten** des Knickblatts sind über `SPALTEN_DEFS` definiert – neue Spaltentypen kommen rein datengetrieben hinzu.
- **Persistenz** liegt hinter der `Repository`-Schnittstelle (Cloud-Sync später andockbar).
- **i18n** ist vorbereitet (`src/i18n/`), Auslieferung aktuell nur Deutsch.

```
src/
  core/        Reine Logik: Silbentrennung, Merkstellen, Tokenizer, Knickblatt-Modell
  db/          Dexie-Schema + Repository-Abstraktion
  services/    Backup (Export/Import), Gemini-Anbindung
  state/       UI-State (Zustand) + reaktive Dexie-Hooks
  components/  UI-Bausteine inkl. Druckkomponenten (print/)
  views/       Kartei, Knickblatt, Übungstext, Wortkarten, Einstellungen
  i18n/        Deutsche UI-Texte (i18n-fähig)
electron/      Electron-Hauptprozess & Preload
tests/         Vitest-Tests
```

---

## Lizenz

[MIT](./LICENSE)
