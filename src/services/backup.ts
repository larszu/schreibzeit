import { db } from '@/db/db';
import type {
  Einstellungen,
  Kind,
  Klasse,
  Lernwort,
  Uebungstext,
} from '@/types';

export const BACKUP_VERSION = 1;

export interface BackupDaten {
  klassen: Klasse[];
  kinder: Kind[];
  lernwoerter: Lernwort[];
  uebungstexte: Uebungstext[];
  einstellungen?: Einstellungen;
}

export interface Backup {
  schreibzeit: true;
  version: number;
  exportiertAm: number;
  daten: BackupDaten;
}

export type ImportModus = 'zusammenfuehren' | 'ersetzen';

/** Baut ein Backup-Objekt aus den übergebenen Daten (rein, testbar). */
export function buildBackup(daten: BackupDaten): Backup {
  return {
    schreibzeit: true,
    version: BACKUP_VERSION,
    exportiertAm: Date.now(),
    daten,
  };
}

// ── Validierung einzelner Records ──────────────────────────────────────

const LERNSTAND_WERTE = new Set(['klasse1', 'klasse2', 'klasse3', 'klasse4', 'foerder', 'lrs']);
const WORT_STATUS_WERTE = new Set(['neu', 'wird_geuebt', 'sitzt']);
const TEXTART_WERTE = new Set(['geschichte', 'lueckentext', 'quatschsaetze']);

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validiereKlasse(r: unknown): r is Klasse {
  if (!r || typeof r !== 'object') return false;
  const k = r as Record<string, unknown>;
  return isString(k.id) && isString(k.name) && isNumber(k.erstelltAm) && isNumber(k.geaendertAm);
}

function validiereKind(r: unknown): r is Kind {
  if (!r || typeof r !== 'object') return false;
  const k = r as Record<string, unknown>;
  return (
    isString(k.id) &&
    isString(k.name) &&
    LERNSTAND_WERTE.has(k.lernstand as string) &&
    isNumber(k.erstelltAm) &&
    isNumber(k.geaendertAm)
  );
}

function validiereLernwort(r: unknown): r is Lernwort {
  if (!r || typeof r !== 'object') return false;
  const k = r as Record<string, unknown>;
  return (
    isString(k.id) &&
    isString(k.kindId) &&
    isString(k.wort) &&
    WORT_STATUS_WERTE.has(k.status as string) &&
    Array.isArray(k.silben) &&
    Array.isArray(k.merkstellen) &&
    isNumber(k.erstelltAm) &&
    isNumber(k.geaendertAm)
  );
}

function validiereUebungstext(r: unknown): r is Uebungstext {
  if (!r || typeof r !== 'object') return false;
  const k = r as Record<string, unknown>;
  return (
    isString(k.id) &&
    isString(k.kindId) &&
    isString(k.titel) &&
    TEXTART_WERTE.has(k.textart as string) &&
    isString(k.text) &&
    isNumber(k.erstelltAm) &&
    isNumber(k.geaendertAm)
  );
}

/** Entfernt API-Schlüssel aus einer Einstellungen-Kopie. */
function ohneSecrets(e: Einstellungen): Einstellungen {
  return { ...e, geminiApiKey: '', claudeApiKey: '' };
}

/**
 * Migrationen für ältere Backup-Formate. Schlüssel = Quellversion; jede
 * Funktion hebt die Daten um genau eine Version an. Aktuell gibt es nur
 * Version 1, daher ist die Tabelle leer – der Mechanismus ist aber vorhanden,
 * damit künftige Schema-Änderungen alte Backups verlustfrei einlesen können.
 */
const MIGRATIONEN: Record<number, (d: BackupDaten) => BackupDaten> = {};

function migriere(daten: BackupDaten, vonVersion: number): BackupDaten {
  let d = daten;
  for (let v = vonVersion; v < BACKUP_VERSION; v++) {
    const schritt = MIGRATIONEN[v];
    if (schritt) d = schritt(d);
  }
  return d;
}

/** Validiert und parst einen Backup-String. Wirft bei ungültigem Inhalt. */
export function parseBackup(json: string): Backup {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }
  if (!obj || typeof obj !== 'object') {
    throw new Error('Die Datei enthält kein gültiges Backup.');
  }
  const b = obj as Partial<Backup>;
  if (b.schreibzeit !== true || typeof b.version !== 'number' || !b.daten) {
    throw new Error('Diese Datei ist kein Schreibzeit-Backup.');
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error(
      `Das Backup wurde mit einer neueren Version erstellt (Version ${b.version}). Bitte App aktualisieren.`,
    );
  }
  // Ältere Backups vor der Validierung auf das aktuelle Format anheben.
  const d = migriere(b.daten, b.version);

  const klassen = (Array.isArray(d.klassen) ? d.klassen : []).filter(validiereKlasse);
  const kinder = (Array.isArray(d.kinder) ? d.kinder : []).filter(validiereKind);
  const lernwoerter = (Array.isArray(d.lernwoerter) ? d.lernwoerter : []).filter(validiereLernwort);
  const uebungstexte = (Array.isArray(d.uebungstexte) ? d.uebungstexte : []).filter(validiereUebungstext);

  // Referentielle Integrität: nur Records mit gültigem Eltern-Bezug behalten.
  const klassenIds = new Set(klassen.map((k) => k.id));
  const kinderIds = new Set(kinder.map((k) => k.id));
  const kinderClean = kinder.map((k) =>
    k.klasseId && !klassenIds.has(k.klasseId) ? { ...k, klasseId: undefined } : k,
  );
  const lernwoerterClean = lernwoerter.filter((l) => kinderIds.has(l.kindId));
  const uebungstexteClean = uebungstexte.filter((u) => kinderIds.has(u.kindId));

  return {
    schreibzeit: true,
    version: b.version,
    exportiertAm: b.exportiertAm ?? Date.now(),
    daten: {
      klassen,
      kinder: kinderClean,
      lernwoerter: lernwoerterClean,
      uebungstexte: uebungstexteClean,
      einstellungen: d.einstellungen,
    },
  };
}

/**
 * Führt zwei Listen anhand der `id` zusammen. Einträge aus `incoming`
 * überschreiben gleiche IDs aus `existing`. Rein und testbar.
 */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const e of existing) map.set(e.id, e);
  for (const i of incoming) map.set(i.id, i);
  return [...map.values()];
}

/** Sammelt alle Daten aus der Datenbank für ein vollständiges Backup. */
export async function exportAll(): Promise<Backup> {
  const [klassen, kinder, lernwoerter, uebungstexte, einstellungen] = await Promise.all([
    db.klassen.toArray(),
    db.kinder.toArray(),
    db.lernwoerter.toArray(),
    db.uebungstexte.toArray(),
    db.einstellungen.get('app'),
  ]);
  return buildBackup({
    klassen,
    kinder,
    lernwoerter,
    uebungstexte,
    einstellungen: einstellungen ? ohneSecrets(einstellungen) : undefined,
  });
}

/** Exportiert nur die Daten eines einzelnen Kindes (ohne Einstellungen). */
export async function exportKind(kindId: string): Promise<Backup> {
  const [kind, lernwoerter, uebungstexte] = await Promise.all([
    db.kinder.get(kindId),
    db.lernwoerter.where('kindId').equals(kindId).toArray(),
    db.uebungstexte.where('kindId').equals(kindId).toArray(),
  ]);
  const kinder = kind ? [kind] : [];
  const klassen = kind?.klasseId ? await db.klassen.where('id').equals(kind.klasseId).toArray() : [];
  return buildBackup({ klassen, kinder, lernwoerter, uebungstexte });
}

/** Spielt ein Backup in die Datenbank ein. */
export async function importBackup(backup: Backup, modus: ImportModus): Promise<void> {
  await db.transaction(
    'rw',
    [db.klassen, db.kinder, db.lernwoerter, db.uebungstexte, db.einstellungen],
    async () => {
      if (modus === 'ersetzen') {
        await Promise.all([
          db.klassen.clear(),
          db.kinder.clear(),
          db.lernwoerter.clear(),
          db.uebungstexte.clear(),
        ]);
      }
      const d = backup.daten;
      await db.klassen.bulkPut(d.klassen);
      await db.kinder.bulkPut(d.kinder);
      await db.lernwoerter.bulkPut(d.lernwoerter);
      await db.uebungstexte.bulkPut(d.uebungstexte);
      // Einstellungen aus Backup importieren, aber nie API-Keys übernehmen.
      if (d.einstellungen) {
        const current = await db.einstellungen.get('app');
        await db.einstellungen.put({
          ...d.einstellungen,
          id: 'app',
          geminiApiKey: current?.geminiApiKey ?? '',
          claudeApiKey: current?.claudeApiKey ?? '',
        });
      }
    },
  );
}

/** Schlägt einen Dateinamen für den Export vor. */
export function backupDateiname(prefix = 'schreibzeit-backup'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/** Löst im Browser den Download eines Backups als Datei aus. */
export function downloadBackup(backup: Backup, dateiname = backupDateiname()): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
