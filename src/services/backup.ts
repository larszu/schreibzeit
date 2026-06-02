// Datensicherung & -portabilität: Export/Import als JSON. Da es keinen Server
// gibt, ist das der Weg, Daten zu sichern oder zwischen Schul-PCs umzuziehen.

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
  const d = b.daten;
  return {
    schreibzeit: true,
    version: b.version,
    exportiertAm: b.exportiertAm ?? Date.now(),
    daten: {
      klassen: Array.isArray(d.klassen) ? d.klassen : [],
      kinder: Array.isArray(d.kinder) ? d.kinder : [],
      lernwoerter: Array.isArray(d.lernwoerter) ? d.lernwoerter : [],
      uebungstexte: Array.isArray(d.uebungstexte) ? d.uebungstexte : [],
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
    einstellungen: einstellungen ?? undefined,
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
    db.klassen,
    db.kinder,
    db.lernwoerter,
    db.uebungstexte,
    db.einstellungen,
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
      // bulkPut überschreibt bestehende IDs → entspricht „zusammenführen".
      await db.klassen.bulkPut(d.klassen);
      await db.kinder.bulkPut(d.kinder);
      await db.lernwoerter.bulkPut(d.lernwoerter);
      await db.uebungstexte.bulkPut(d.uebungstexte);
      if (d.einstellungen) {
        await db.einstellungen.put({ ...d.einstellungen, id: 'app' });
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
