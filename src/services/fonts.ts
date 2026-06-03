// Verwaltung eigener Schriftarten. Lehrkräfte können eine Schriftdatei, für die
// sie eine Lizenz besitzen (z. B. eine Grundschrift/Schulausgangsschrift),
// hinzufügen. Die Datei wird lokal in der Datenbank gespeichert und per
// FontFace-API registriert – kein externer Aufruf, voll offline.

import { db } from '@/db/db';
import { newId } from '@/core/id';
import type { FontEintrag } from '@/types';

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
