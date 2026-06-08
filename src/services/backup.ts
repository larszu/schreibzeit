import { db } from '@/db/db';
import { newId } from '@/core/id';
import type {
  Einstellungen,
  Kind,
  Klasse,
  Lernstand,
  Lernwort,
  TextArt,
  Uebungstext,
  WortStatus,
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

/** Anzahl der beim Einlesen verworfenen Datensätze je Tabelle. */
export interface ImportBericht {
  verworfen: { klassen: number; kinder: number; lernwoerter: number; uebungstexte: number };
}

/** Ergebnis von {@link parseBackup}: bereinigte Daten plus Verlust-Bericht. */
export interface ParseErgebnis {
  backup: Backup;
  bericht: ImportBericht;
}

/** Baut ein Backup-Objekt aus den übergebenen Daten (rein, testbar). */
export function buildBackup(daten: BackupDaten): Backup {
  return {
    schreibzeit: true,
    version: BACKUP_VERSION,
    exportiertAm: Date.now(),
    daten,
  };
}

// ── Normalisierung einzelner Records ───────────────────────────────────
//
// Statt Datensätze bei kleinen Mängeln komplett zu verwerfen, werden
// unkritische Felder auf sinnvolle Standardwerte gesetzt (z. B. unbekannter
// Lernstand → 'klasse2'). Nur wenn Identitätsfelder (id, Eltern-id, Name)
// fehlen, ist ein Record unbrauchbar und wird verworfen (→ null). So gehen
// beim Wiederherstellen so wenig Daten wie möglich verloren.

const LERNSTAND_WERTE = new Set<Lernstand>(['klasse1', 'klasse2', 'klasse3', 'klasse4', 'foerder', 'lrs']);
const WORT_STATUS_WERTE = new Set<WortStatus>(['neu', 'wird_geuebt', 'sitzt']);
const TEXTART_WERTE = new Set<TextArt>(['geschichte', 'lueckentext', 'quatschsaetze']);
const ARTIKEL_WERTE = new Set(['der', 'die', 'das', '']);

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function alsZeit(v: unknown): number {
  return isNumber(v) ? v : Date.now();
}
function optString(v: unknown): string | undefined {
  return isString(v) ? v : undefined;
}

function normKlasse(r: unknown): Klasse | null {
  if (!r || typeof r !== 'object') return null;
  const k = r as Record<string, unknown>;
  if (!isString(k.id) || !isString(k.name)) return null;
  return {
    id: k.id,
    name: k.name,
    farbe: optString(k.farbe),
    notiz: optString(k.notiz),
    erstelltAm: alsZeit(k.erstelltAm),
    geaendertAm: alsZeit(k.geaendertAm),
  };
}

function normKind(r: unknown): Kind | null {
  if (!r || typeof r !== 'object') return null;
  const k = r as Record<string, unknown>;
  if (!isString(k.id) || !isString(k.name)) return null;
  return {
    id: k.id,
    name: k.name,
    klasseId: optString(k.klasseId),
    lernstand: LERNSTAND_WERTE.has(k.lernstand as Lernstand) ? (k.lernstand as Lernstand) : 'klasse2',
    notiz: optString(k.notiz),
    erstelltAm: alsZeit(k.erstelltAm),
    geaendertAm: alsZeit(k.geaendertAm),
  };
}

function normLernwort(r: unknown): Lernwort | null {
  if (!r || typeof r !== 'object') return null;
  const k = r as Record<string, unknown>;
  if (!isString(k.id) || !isString(k.kindId) || !isString(k.wort)) return null;
  return {
    id: k.id,
    kindId: k.kindId,
    wort: k.wort,
    artikel: ARTIKEL_WERTE.has(k.artikel as string) ? (k.artikel as Lernwort['artikel']) : '',
    wortart: optString(k.wortart),
    silben: Array.isArray(k.silben) ? k.silben.filter(isString) : [],
    merkstellen: Array.isArray(k.merkstellen) ? k.merkstellen.filter(isNumber) : [],
    status: WORT_STATUS_WERTE.has(k.status as WortStatus) ? (k.status as WortStatus) : 'neu',
    fach: isNumber(k.fach) ? k.fach : undefined,
    faelligAm: isNumber(k.faelligAm) ? k.faelligAm : undefined,
    quelle: optString(k.quelle),
    notiz: optString(k.notiz),
    erstelltAm: alsZeit(k.erstelltAm),
    geaendertAm: alsZeit(k.geaendertAm),
  };
}

function normUebungstext(r: unknown): Uebungstext | null {
  if (!r || typeof r !== 'object') return null;
  const k = r as Record<string, unknown>;
  if (!isString(k.id) || !isString(k.kindId) || !isString(k.titel)) return null;
  return {
    id: k.id,
    kindId: k.kindId,
    titel: k.titel,
    textart: TEXTART_WERTE.has(k.textart as TextArt) ? (k.textart as TextArt) : 'geschichte',
    text: isString(k.text) ? k.text : '',
    loesungswoerter: Array.isArray(k.loesungswoerter) ? k.loesungswoerter.filter(isString) : undefined,
    verwendeteWoerter: Array.isArray(k.verwendeteWoerter) ? k.verwendeteWoerter.filter(isString) : [],
    erstelltAm: alsZeit(k.erstelltAm),
    geaendertAm: alsZeit(k.geaendertAm),
  };
}

/** Normalisiert eine Liste und zählt die verworfenen (unbrauchbaren) Records. */
function normListe<T>(arr: unknown, norm: (r: unknown) => T | null): { ok: T[]; verworfen: number } {
  const eingang = Array.isArray(arr) ? arr : [];
  const ok: T[] = [];
  for (const r of eingang) {
    const n = norm(r);
    if (n) ok.push(n);
  }
  return { ok, verworfen: eingang.length - ok.length };
}

/** Validiert und parst einen Backup-String. Wirft bei ungültigem Inhalt. */
export function parseBackup(json: string): ParseErgebnis {
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

  const kl = normListe(d.klassen, normKlasse);
  const ki = normListe(d.kinder, normKind);
  const lw = normListe(d.lernwoerter, normLernwort);
  const ut = normListe(d.uebungstexte, normUebungstext);

  // Referentielle Integrität: Kind ohne vorhandene Klasse behält das Kind,
  // verliert aber die (verwaiste) Klassenzuordnung – kein Datenverlust.
  const klassenIds = new Set(kl.ok.map((k) => k.id));
  const kinderIds = new Set(ki.ok.map((k) => k.id));
  const kinder = ki.ok.map((k) =>
    k.klasseId && !klassenIds.has(k.klasseId) ? { ...k, klasseId: undefined } : k,
  );
  // Lernwörter/Texte ohne zugehöriges Kind sind nicht zuordenbar → verwerfen.
  const lernwoerter = lw.ok.filter((l) => kinderIds.has(l.kindId));
  const uebungstexte = ut.ok.filter((u) => kinderIds.has(u.kindId));

  const bericht: ImportBericht = {
    verworfen: {
      klassen: kl.verworfen,
      kinder: ki.verworfen,
      lernwoerter: lw.verworfen + (lw.ok.length - lernwoerter.length),
      uebungstexte: ut.verworfen + (ut.ok.length - uebungstexte.length),
    },
  };

  return {
    backup: {
      schreibzeit: true,
      version: b.version,
      exportiertAm: b.exportiertAm ?? Date.now(),
      daten: { klassen: kl.ok, kinder, lernwoerter, uebungstexte, einstellungen: d.einstellungen },
    },
    bericht,
  };
}

/** Gesamtzahl verworfener Datensätze eines Berichts. */
export function verworfenGesamt(bericht: ImportBericht): number {
  const v = bericht.verworfen;
  return v.klassen + v.kinder + v.lernwoerter + v.uebungstexte;
}

/** Entfernt API-Schlüssel aus einer Einstellungen-Kopie. */
function ohneSecrets(e: Einstellungen): Einstellungen {
  return { ...e, geminiApiKey: '', claudeApiKey: '' };
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

/**
 * Vergibt für IDs, die in `vorhanden` bereits existieren, neue IDs und liefert
 * eine Abbildung alt→neu. So führt „Zusammenführen" rein additiv zusammen,
 * ohne vorhandene Datensätze zu überschreiben.
 */
function remapKollisionen<T extends { id: string }>(
  records: T[],
  vorhanden: Set<string>,
): { records: T[]; map: Map<string, string> } {
  const map = new Map<string, string>();
  const out = records.map((r) => {
    if (!vorhanden.has(r.id)) return r;
    const neu = newId();
    map.set(r.id, neu);
    return { ...r, id: neu };
  });
  return { records: out, map };
}

function ersetzeId<T>(map: Map<string, string>, id: T): T {
  return (typeof id === 'string' && map.has(id) ? (map.get(id) as T) : id);
}

/** Spielt ein Backup in die Datenbank ein. */
export async function importBackup(backup: Backup, modus: ImportModus): Promise<void> {
  await db.transaction(
    'rw',
    [db.klassen, db.kinder, db.lernwoerter, db.uebungstexte, db.einstellungen],
    async () => {
      const d = backup.daten;
      let { klassen, kinder, lernwoerter, uebungstexte } = d;

      if (modus === 'ersetzen') {
        await Promise.all([
          db.klassen.clear(),
          db.kinder.clear(),
          db.lernwoerter.clear(),
          db.uebungstexte.clear(),
        ]);
      } else {
        // Zusammenführen: kollidierende IDs neu vergeben statt überschreiben –
        // damit vorhandene Daten erhalten bleiben (nichts geht verloren).
        const [klIds, kiIds, lwIds, utIds] = await Promise.all([
          db.klassen.toCollection().primaryKeys(),
          db.kinder.toCollection().primaryKeys(),
          db.lernwoerter.toCollection().primaryKeys(),
          db.uebungstexte.toCollection().primaryKeys(),
        ]);
        const kl = remapKollisionen(klassen, new Set(klIds as string[]));
        klassen = kl.records;
        // Klassenzuordnung der Kinder auf neue Klassen-IDs umbiegen.
        const kinderMitKlasse = kinder.map((k) => ({
          ...k,
          klasseId: k.klasseId ? ersetzeId(kl.map, k.klasseId) : k.klasseId,
        }));
        const ki = remapKollisionen(kinderMitKlasse, new Set(kiIds as string[]));
        kinder = ki.records;
        // Kind-Bezug der Lernwörter/Texte auf neue Kind-IDs umbiegen.
        const lwMitKind = lernwoerter.map((l) => ({ ...l, kindId: ersetzeId(ki.map, l.kindId) }));
        lernwoerter = remapKollisionen(lwMitKind, new Set(lwIds as string[])).records;
        const utMitKind = uebungstexte.map((u) => ({ ...u, kindId: ersetzeId(ki.map, u.kindId) }));
        uebungstexte = remapKollisionen(utMitKind, new Set(utIds as string[])).records;
      }

      await db.klassen.bulkPut(klassen);
      await db.kinder.bulkPut(kinder);
      await db.lernwoerter.bulkPut(lernwoerter);
      await db.uebungstexte.bulkPut(uebungstexte);

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
