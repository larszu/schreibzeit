# Datenschutz / DSGVO – ehrliche Einschätzung

> Kurzfassung: **Die App selbst ist sehr datensparsam und standardmäßig vollständig
> lokal.** Sobald Sie jedoch eine **KI-Funktion** (Übungstext oder Foto-Texterkennung)
> bewusst auslösen, verlassen die dabei gewählten Inhalte das Gerät und gehen an einen
> externen Anbieter (Google bzw. Anthropic). Das ist eine **Verarbeitung durch einen
> Dritten**, für die im Schulkontext zusätzliche Voraussetzungen gelten. Dieser Text
> ist keine Rechtsberatung.

## 1. Was die App technisch tut

- **Local-first:** Klassen, Kinder, Lernwörter, Texte und Einstellungen liegen
  ausschließlich in der lokalen Browser-Datenbank (IndexedDB) bzw. im lokalen
  Speicher der Desktop-App. **Kein Server, kein Konto, keine Anmeldung.**
- **Keine Telemetrie, kein Tracking, keine Analyse, keine Cookies** zu Marketingzwecken.
- **Keine externen Ressourcen zur Laufzeit** (Schriften, Skripte, Icons sind gebündelt).
- **Einzige ausgehende Verbindungen** sind die von der Lehrkraft aktiv ausgelösten
  KI-Aufrufe (siehe §3). Ohne KI-Nutzung gibt es **keinerlei** Datenabfluss.
- **Betroffenenrechte technisch unterstützt:** Export (Auskunft/Portabilität) und
  „Alle Daten löschen" (Löschung) sind eingebaut; Korrektur jederzeit möglich.
- **Datenminimierung:** Option „nur Initialen/Spitznamen statt Klarnamen".
- **Pseudonym-Workflow (empfohlen):** Kinder nur mit Nummern/Decknamen anlegen, sodass in der App
  **gar kein Klarname** gespeichert wird. Den Schlüssel „Kürzel → Klarname" über
  **„Namensschlüssel drucken"** ausgeben, von Hand ausfüllen und **offline/abschließbar** aufbewahren.
  Damit existiert die Zuordnung nur auf Papier, die digitalen Daten bleiben ohne Personenbezug.

➡️ **Für den reinen Offline-Betrieb (Kartei, Knickblatt, Wortkarten, Druck) ist die
App aus Datenschutzsicht unkritisch** – vergleichbar mit einer lokalen Datei auf dem
Dienstgerät.

## 2. Welche personenbezogenen Daten verarbeitet werden

- **Kinderdaten:** Name (oder Initialen), Klasse, Lernstand, Notizen, Lernwörter, Texte.
- Diese Daten bleiben lokal. Sie werden **nicht** an die KI gesendet – siehe §3.

## 3. Die KI-Funktionen (der einzige heikle Punkt)

| Funktion | Anbieter | Was übertragen wird |
|---|---|---|
| Übungstext erzeugen | Google **Gemini** | nur die ausgewählten **Lernwörter** + Aufgabenbeschreibung – **keine Namen** |
| Foto-Texterkennung (Standard) | Google **Gemini** | das **hochgeladene Foto** + Anweisung |
| Foto-Texterkennung (optional) | Anthropic **Claude** | das **hochgeladene Foto** + Anweisung |

Wichtige Konsequenzen:

- **Lernwörter sind in der Regel nicht personenbezogen** (z. B. „Sommer", „Fahrrad").
  Der Übungstext-Aufruf ist damit i. d. R. unkritisch.
- **Ein Foto eines Kindertexts kann personenbezogen sein** – z. B. wenn der Name des
  Kindes auf dem Blatt steht oder die Handschrift zuordenbar ist. Die Foto-Funktion ist
  deshalb der sensibelste Teil. **Empfehlung:** nur Ausschnitte ohne Namen fotografieren
  bzw. Namen abdecken. Die App zeigt hierzu einen Hinweis.
- Die Anbieter sitzen in den **USA**. Übermittlungen in Drittländer setzen eine
  Rechtsgrundlage voraus (Standardvertragsklauseln/Angemessenheitsbeschluss bzw. die
  Teilnahme am EU-US Data Privacy Framework). Das ist anbieter- und vertragsabhängig.
- API-Schlüssel werden **nur lokal** gespeichert und nicht protokolliert.

## 4. Was die Schule/Lehrkraft noch erledigen muss (Checkliste)

Die App liefert die *technischen* Voraussetzungen; die *organisatorischen* liegen beim
Verantwortlichen (Schule/Schulträger):

- [ ] **Dienstliche Freigabe** klären: Dürfen Schülerdaten auf diesem Gerät verarbeitet
      werden? (Einige Bundesländer regeln das streng – z. B. Verbot auf Privatgeräten.)
- [ ] **KI nur bewusst und sparsam** nutzen; **keine Klarnamen** an die KI geben.
- [ ] Für KI-Nutzung mit (potenziell) personenbezogenen Inhalten: **Auftragsverarbeitung
      (AVV)** mit dem KI-Anbieter und Prüfung der **Drittlandübermittlung** – oder KI im
      Zweifel **ausgeschaltet lassen** (die App funktioniert vollständig ohne KI).
- [ ] **Verzeichnis von Verarbeitungstätigkeiten** ergänzen, ggf. **DSFA** prüfen.
- [ ] **Eltern informieren** (Transparenzpflicht), falls KI mit Bezug zu ihren Kindern
      genutzt wird.
- [ ] **Backups** (exportierte JSON-Dateien) wie andere Schülerdaten **sicher
      aufbewahren** (verschlüsselter Speicher, kein offenes Cloud-Laufwerk).
- [ ] Gerät absichern (Bildschirmsperre, Nutzerkonto), da Daten lokal liegen.

## 5. Fazit

- **Ohne KI:** datenschutzfreundlich und unkritisch (lokal, kein Abfluss).
- **Mit KI:** datenschutzkonform **möglich**, aber **nicht automatisch gegeben** – es
  hängt an organisatorischen Maßnahmen (AVV, Drittland, Eltern-Info) und daran, **keine
  Klarnamen** und **keine identifizierenden Fotos** zu übertragen.
- Die App ist so gebaut, dass der **datenschutzfreundliche Weg der Standard** ist und der
  externe Aufruf **immer eine bewusste Einzelaktion** der Lehrkraft bleibt.

*Stand: Projektdokumentation, keine Rechtsberatung. Maßgeblich sind die Vorgaben Ihrer
Schulaufsicht/Ihres Datenschutzbeauftragten.*
