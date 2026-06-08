// Spaced Repetition (Leitner-„5-Fächer"-System) für Lernwörter.
//
// Jedes Wort hat ein Fach (1–5) und ein Fälligkeitsdatum. Richtig → ein Fach
// höher (längeres Intervall bis zur Wiedervorlage); falsch → zurück in Fach 1.
// Rein und testbar – keine Abhängigkeit zu DB/UI.

import type { WortStatus } from '@/types';

const TAG_MS = 86_400_000;

/** Tage bis zur Wiedervorlage je Fach (Index 0 = Fach 1). */
export const SRS_INTERVALLE_TAGE = [0, 1, 3, 7, 16];

// Strukturelle Mindesttypen – so lässt sich die SRS-Logik sowohl auf
// vollständige `Lernwort`-Objekte (Lehrer-Kartei) als auch auf die
// schlankeren Übungs-Items des Schüler-Clients anwenden.
type MitFach = { fach?: number };
type MitFaelligkeit = { faelligAm?: number };

export function fachVon(w: MitFach): number {
  const f = w.fach ?? 1;
  return Math.min(5, Math.max(1, f));
}

/** Ist das Wort heute (oder überfällig) zur Wiederholung dran? */
export function istFaellig(w: MitFaelligkeit, now = Date.now()): boolean {
  return (w.faelligAm ?? 0) <= now;
}

/** Alle aktuell fälligen Wörter (älteste Fälligkeit zuerst). */
export function faelligeWoerter<T extends MitFaelligkeit>(woerter: T[], now = Date.now()): T[] {
  return woerter
    .filter((w) => istFaellig(w, now))
    .sort((a, b) => (a.faelligAm ?? 0) - (b.faelligAm ?? 0));
}

export interface SrsStand {
  fach: number;
  faelligAm: number;
  status: WortStatus;
}

/** Neuer Lernstand nach einer Bewertung (richtig/falsch). */
export function naechsterStand(w: MitFach, korrekt: boolean, now = Date.now()): SrsStand {
  const aktuell = fachVon(w);
  const fach = korrekt ? Math.min(5, aktuell + 1) : 1;
  const tage = SRS_INTERVALLE_TAGE[fach - 1] ?? 0;
  const faelligAm = now + tage * TAG_MS;
  // Sobald geübt wurde, ist der Status mindestens „wird geübt"; Fach 5 = „sitzt".
  const status: WortStatus = fach >= 5 ? 'sitzt' : 'wird_geuebt';
  return { fach, faelligAm, status };
}
