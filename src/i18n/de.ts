// Zentrale UI-Texte (Deutsch). Struktur ist i18n-fähig: weitere Sprachen
// können später als zusätzliche Objekte mit gleichem Schlüssel-Layout folgen.

export const de = {
  app: {
    name: 'Schreibzeit',
    tagline: 'Lernwörter, Knickblätter & Übungstexte',
  },
  nav: {
    kartei: 'Kartei',
    knickblatt: 'Knickblatt',
    uebungstext: 'Übungstext',
    wortkarten: 'Wortkarten',
    einstellungen: 'Einstellungen',
  },
  lernstand: {
    klasse1: 'Klasse 1',
    klasse2: 'Klasse 2',
    klasse3: 'Klasse 3',
    klasse4: 'Klasse 4',
    foerder: 'Förderbedarf',
    lrs: 'LRS',
  },
  status: {
    neu: 'neu',
    wird_geuebt: 'wird geübt',
    sitzt: 'sitzt',
  },
  textart: {
    geschichte: 'Kurze Geschichte',
    lueckentext: 'Lückentext',
    quatschsaetze: 'Quatschsätze',
  },
  lineatur: {
    klasse1: 'Lineatur Klasse 1',
    klasse2: 'Lineatur Klasse 2',
    klasse3: 'Lineatur Klasse 3',
    klasse4: 'Lineatur Klasse 4',
    haus: 'Haus-Lineatur (Mittelband)',
  },
  common: {
    speichern: 'Speichern',
    abbrechen: 'Abbrechen',
    loeschen: 'Löschen',
    bearbeiten: 'Bearbeiten',
    hinzufuegen: 'Hinzufügen',
    drucken: 'Drucken / als PDF',
    schliessen: 'Schließen',
    name: 'Name',
    datum: 'Datum',
    notiz: 'Notiz',
    keineDaten: 'Noch keine Daten vorhanden.',
    bestaetigen: 'Wirklich löschen?',
  },
  datenschutz: {
    titel: 'Datenschutz',
    text: 'Alle Daten bleiben ausschließlich lokal auf diesem Gerät (im Browser). Es gibt keine Telemetrie und kein Tracking. Der einzige externe Aufruf ist die von Ihnen ausgelöste KI-Textfunktion (Google Gemini).',
    verstanden: 'Verstanden',
    hinweisInitialen: 'Tipp: In den Einstellungen können Sie „nur Initialen statt Klarnamen" aktivieren.',
  },
} as const;

export type I18n = typeof de;
export const t = de;
