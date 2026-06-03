// Verwaltung eigener Schriftarten. Lehrkräfte können eine Schriftdatei, für die
// sie eine Lizenz besitzen (z. B. eine Grundschrift/Schulausgangsschrift),
// hinzufügen. Die Datei wird lokal in der Datenbank gespeichert und per
// FontFace-API registriert – kein externer Aufruf, voll offline.

import { db } from '@/db/db';
import { newId } from '@/core/id';
import type { FontEintrag } from '@/types';

/** Mitgelieferte/immer verfügbare Vorlage-Schriften (Wert = CSS font-family). */
export const EINGEBAUTE_SCHRIFTEN: { value: string; label: string }[] = [
  { value: 'Andika', label: 'Andika (Fibelschrift, Standard)' },
  { value: "'Source Serif 4', Georgia, serif", label: 'Serif (klassisch)' },
  { value: "'Inter', system-ui, sans-serif", label: 'Serifenlos (LRS-freundlich)' },
];

const registriert = new Set<string>();

function registriere(f: FontEintrag): void {
  // System-Schriften sind bereits installiert – kein FontFace nötig.
  if (f.system || !f.dataUrl) return;
  if (registriert.has(f.id) || typeof FontFace === 'undefined') return;
  try {
    const face = new FontFace(f.name, `url(${f.dataUrl})`);
    void face
      .load()
      .then((geladen) => {
        document.fonts.add(geladen);
      })
      .catch(() => {});
    registriert.add(f.id);
  } catch {
    /* Schrift konnte nicht registriert werden – ignorieren */
  }
}

// Mitgelieferte, freie Grundschul-Schrift „Andika" (SIL OFL). Per FontFace
// registriert, damit der Pfad unabhängig vom Hosting-Basepfad funktioniert.
let andikaRegistriert = false;
function registriereAndika(): void {
  if (andikaRegistriert || typeof FontFace === 'undefined') return;
  andikaRegistriert = true;
  const base = import.meta.env.BASE_URL;
  const faces = [
    new FontFace('Andika', `url(${base}fonts/Andika-Regular.woff2)`, { weight: '400' }),
    new FontFace('Andika', `url(${base}fonts/Andika-Bold.woff2)`, { weight: '700' }),
  ];
  for (const face of faces) {
    void face
      .load()
      .then((geladen) => document.fonts.add(geladen))
      .catch(() => {});
  }
}

/** Registriert die mitgelieferte und alle gespeicherten Schriften (beim App-Start). */
export async function registriereAlleFonts(): Promise<void> {
  registriereAndika();
  const fonts = await db.fonts.toArray();
  fonts.forEach(registriere);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const ERLAUBT = /\.(ttf|otf|woff2?)$/i;
const ERLAUBTE_MIMES = new Set([
  'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
  'application/x-font-ttf', 'application/font-woff', 'application/font-woff2',
  'application/vnd.ms-opentype', '',
]);

/** Fügt eine Schriftdatei hinzu und registriert sie sofort. */
export async function fontHinzufuegen(name: string, file: File): Promise<FontEintrag> {
  if (!ERLAUBT.test(file.name) || !ERLAUBTE_MIMES.has(file.type)) {
    throw new Error('Bitte eine Schriftdatei wählen (.ttf, .otf, .woff, .woff2).');
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error('Die Schriftdatei ist zu groß (max. 6 MB).');
  }
  const dataUrl = await fileToDataUrl(file);
  const eintrag: FontEintrag = {
    id: newId(),
    name: name.trim() || file.name.replace(/\.[^.]+$/, ''),
    mime: file.type || 'font/ttf',
    dataUrl,
  };
  await db.fonts.put(eintrag);
  registriere(eintrag);
  return eintrag;
}

export async function fontLoeschen(id: string): Promise<void> {
  await db.fonts.delete(id);
}

/**
 * Liest den internen Familiennamen aus einer Schriftdatei (TTF/OTF), damit das
 * Namensfeld beim Upload automatisch vorbelegt werden kann. Liefert null, wenn
 * die Datei nicht gelesen werden kann (z. B. komprimierte WOFF/WOFF2).
 */
export async function leseSchriftname(file: File): Promise<string | null> {
  try {
    return nameAusSfnt(await file.arrayBuffer());
  } catch {
    return null;
  }
}

function nameAusSfnt(buf: ArrayBuffer): string | null {
  const dv = new DataView(buf);
  if (buf.byteLength < 12) return null;
  const tag = dv.getUint32(0);
  // Nur unkomprimierte TTF/OTF: 0x00010000, 'true' (0x74727565), 'OTTO'.
  if (tag !== 0x00010000 && tag !== 0x74727565 && tag !== 0x4f54544f) return null;
  const numTables = dv.getUint16(4);
  let nameOff = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (dv.getUint32(rec) === 0x6e616d65) {
      // 'name'
      nameOff = dv.getUint32(rec + 8);
      break;
    }
  }
  if (nameOff < 0 || nameOff + 6 > buf.byteLength) return null;
  const count = dv.getUint16(nameOff + 2);
  const stringOff = nameOff + dv.getUint16(nameOff + 4);
  let familie: string | null = null;
  let bevorzugt: string | null = null;
  for (let i = 0; i < count; i++) {
    const rec = nameOff + 6 + i * 12;
    const platformID = dv.getUint16(rec);
    const nameID = dv.getUint16(rec + 6);
    const len = dv.getUint16(rec + 8);
    const off = dv.getUint16(rec + 10);
    if (nameID !== 1 && nameID !== 16) continue;
    const str = leseNameString(dv, stringOff + off, len, platformID);
    if (!str) continue;
    if (nameID === 16) bevorzugt = bevorzugt ?? str;
    else familie = familie ?? str;
  }
  return (bevorzugt ?? familie) || null;
}

function leseNameString(dv: DataView, start: number, len: number, platformID: number): string {
  if (start + len > dv.byteLength) return '';
  let s = '';
  if (platformID === 3 || platformID === 0) {
    // Unicode / Windows: UTF-16BE
    for (let i = 0; i + 1 < len; i += 2) s += String.fromCharCode(dv.getUint16(start + i));
  } else {
    // Macintosh: ASCII (vereinfacht)
    for (let i = 0; i < len; i++) s += String.fromCharCode(dv.getUint8(start + i));
  }
  return s.trim();
}

/** Steht die Local-Font-Access-API zur Verfügung (Chromium/Desktop)? */
export function systemSchriftenVerfuegbar(): boolean {
  return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function';
}

/**
 * Liest die auf dem System installierten Schriftfamilien aus (z. B. die in Word
 * verfügbaren Schriften). Erfordert eine einmalige Berechtigung; nur in
 * Chromium/Electron verfügbar. Liefert eindeutige, sortierte Familiennamen.
 */
export async function ladeSystemSchriften(): Promise<string[]> {
  if (!systemSchriftenVerfuegbar()) return [];
  const fonts = await window.queryLocalFonts!();
  const familien = new Set<string>();
  for (const f of fonts) familien.add(f.family);
  return [...familien].sort((a, b) => a.localeCompare(b, 'de'));
}

/**
 * Fügt eine bereits installierte System-Schrift als auswählbare Vorlage-Schrift
 * hinzu (keine Datei – es wird nur der Familienname referenziert).
 */
export async function systemSchriftHinzufuegen(name: string): Promise<FontEintrag> {
  const fam = name.trim();
  if (!fam) throw new Error('Bitte einen Schriftnamen angeben.');
  const vorhanden = await db.fonts.where('name').equals(fam).first();
  if (vorhanden) return vorhanden;
  const eintrag: FontEintrag = { id: newId(), name: fam, mime: '', system: true };
  await db.fonts.put(eintrag);
  return eintrag;
}
