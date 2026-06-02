// Zerlegt einen eingefügten Kindertext in einzelne Wörter, damit die Lehrkraft
// die Lernwörter herauspicken kann. Satzzeichen werden entfernt, die
// Groß-/Kleinschreibung bleibt erhalten.

export interface Token {
  /** Das bereinigte Wort (ohne umschließende Satzzeichen). */
  wort: string;
  /** Eindeutiger Schlüssel inkl. Position, da Wörter mehrfach vorkommen. */
  key: string;
}

// Wortzeichen: Buchstaben inkl. deutscher Umlaute/ß sowie Wort-interne
// Bindestriche und Apostrophe.
const WORD_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ]+)*/g;

/** Tokenisiert einen Text in eindeutige, anklickbare Wort-Tokens. */
export function tokenize(text: string): Token[] {
  if (!text) return [];
  const tokens: Token[] = [];
  let i = 0;
  for (const m of text.matchAll(WORD_REGEX)) {
    const wort = m[0];
    tokens.push({ wort, key: `${i}:${m.index}:${wort}` });
    i += 1;
  }
  return tokens;
}

/** Normalisiert ein Wort für den Dublettenvergleich (case-insensitiv). */
export function normalizeForCompare(wort: string): string {
  return wort.trim().toLowerCase();
}

/**
 * Liefert die Menge der bereits in der Kartei vorhandenen Wörter
 * (normalisiert) zur schnellen Dublettenmarkierung.
 */
export function buildExistingSet(woerter: string[]): Set<string> {
  return new Set(woerter.map(normalizeForCompare));
}
