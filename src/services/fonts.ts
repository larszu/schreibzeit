// Verwaltung eigener Schriftarten. Lehrkräfte können eine Schriftdatei, für die
// sie eine Lizenz besitzen (z. B. eine Grundschrift/Schulausgangsschrift),
// hinzufügen. Die Datei wird lokal in der Datenbank gespeichert und per
// FontFace-API registriert – kein externer Aufruf, voll offline.

import { db } from '@/db/db';
import { newId } from '@/core/id';
import type { FontEintrag } from '@/types';

const registriert = new Set<string>();

function registriere(f: FontEintrag): void {
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

/** Registriert alle gespeicherten Schriften (beim App-Start). */
export async function registriereAlleFonts(): Promise<void> {
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

/**
 * Prüft, ob Dateiname und MIME-Typ einer erlaubten Schriftart entsprechen.
 * Rein und testbar.
 */
export function istErlaubteFontDatei(name: string, mime: string): boolean {
  return ERLAUBT.test(name) && ERLAUBTE_MIMES.has(mime);
}

/** Fügt eine Schriftdatei hinzu und registriert sie sofort. */
export async function fontHinzufuegen(name: string, file: File): Promise<FontEintrag> {
  if (!istErlaubteFontDatei(file.name, file.type)) {
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
