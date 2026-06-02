// Zentrale Datentypen der Anwendung. Diese Typen bilden die Grundlage für die
// Persistenzschicht (Dexie) und werden vom Backup-Export/Import versioniert.

export type Id = string;

/** Lernstand eines Kindes – steuert u. a. die KI-Textschwierigkeit. */
export type Lernstand =
  | 'klasse1'
  | 'klasse2'
  | 'klasse3'
  | 'klasse4'
  | 'foerder'
  | 'lrs';

/** Lernstatus eines einzelnen Lernworts. */
export type WortStatus = 'neu' | 'wird_geuebt' | 'sitzt';

export interface Klasse {
  id: Id;
  name: string;
  notiz?: string;
  erstelltAm: number;
  geaendertAm: number;
}

export interface Kind {
  id: Id;
  /** Anzeigename – kann laut Einstellung auch nur Initialen/Spitzname sein. */
  name: string;
  klasseId?: Id;
  lernstand: Lernstand;
  notiz?: string;
  erstelltAm: number;
  geaendertAm: number;
}

/**
 * Ein Lernwort einer Kind-Kartei.
 *
 * `silben` ist die getrennte Darstellung als Array von Silben
 * (z. B. ["Som", "mer"]). `merkstellen` ist eine Liste von Zeichen-Indizes
 * (0-basiert, bezogen auf `wort`), die als schwierige Stellen markiert sind.
 */
export interface Lernwort {
  id: Id;
  kindId: Id;
  wort: string;
  artikel?: 'der' | 'die' | 'das' | '';
  wortart?: string;
  silben: string[];
  merkstellen: number[];
  status: WortStatus;
  quelle?: string;
  notiz?: string;
  erstelltAm: number;
  geaendertAm: number;
}

/** Eine an einem Kind gespeicherte KI-/Übungstext-Erzeugung. */
export interface Uebungstext {
  id: Id;
  kindId: Id;
  titel: string;
  textart: TextArt;
  /** Vollständiger Text (bei Lückentext: mit eingesetzten Lernwörtern). */
  text: string;
  /** Bei Lückentext: die ausgeblendeten Lösungswörter in Reihenfolge. */
  loesungswoerter?: string[];
  verwendeteWoerter: string[];
  erstelltAm: number;
  geaendertAm: number;
}

export type TextArt = 'geschichte' | 'lueckentext' | 'quatschsaetze';

/** Lineatur-Vorgaben für Grundschul-Schreiblinien. */
export type Lineatur = 'klasse1' | 'klasse2' | 'klasse3' | 'klasse4' | 'haus';

/** Strategie-/Spaltentyp eines Knickblatts. */
export type SpaltenTyp =
  | 'vorlage'
  | 'schwingen'
  | 'merkstellen'
  | 'auswendig'
  | 'partner'
  | 'verlaengern'
  | 'ableiten'
  | 'merkwort';

export interface Knickspalte {
  typ: SpaltenTyp;
  /** Gestrichelte Falzlinie unmittelbar vor dieser Spalte einzeichnen. */
  falzDavor?: boolean;
  aktiv: boolean;
}

/** Konfiguration eines Knickblatts (datengetrieben, erweiterbar). */
export interface KnickblattConfig {
  spalten: Knickspalte[];
  woerterProBlatt: number;
  lineatur: Lineatur;
  /** Vorlage-Spalte mit vorgedruckten Silbenbögen (Differenzierung). */
  vorlageMitSilben: boolean;
  /** Vorlage-Spalte mit markierten Merkstellen (Differenzierung). */
  vorlageMitMerkstellen: boolean;
  thema?: string;
}

export interface Einstellungen {
  id: 'app';
  geminiApiKey: string;
  geminiModell: string;
  lehrkraftName: string;
  schulName: string;
  standardLineatur: Lineatur;
  standardWoerterProBlatt: number;
  /** Nur Initialen/Spitznamen statt Klarnamen anzeigen (DSGVO-Hilfe). */
  nurInitialen: boolean;
  datenschutzBestaetigt: boolean;
  standardSpalten: SpaltenTyp[];
}
