// Heuristischer Vorschlag für „Merkstellen" / schwierige Stellen eines Wortes.
//
// Ergebnis ist eine sortierte Liste eindeutiger Zeichen-Indizes (0-basiert,
// bezogen auf das Originalwort), die typische deutsche Rechtschreib-
// Stolperstellen markieren. Wie die Silbentrennung ist dies nur ein
// Vorschlag und in der Oberfläche frei editierbar.
//
// Erkannt werden u. a.:
//   - Doppelkonsonanten (mm, nn, ll, tt, ff, ...)
//   - ie, ck, tz, ß
//   - Doppelvokale (aa, ee, oo)
//   - Dehnungs-h (Zahl, Sohn, ihn, Stuhl)
//   - v, Umlaute (ä/ö/ü)
//   - Diphthonge eu/äu/ei/ai

const VOWELS_LOWER = new Set('aeiouäöü'.split(''));

function addRange(set: Set<number>, start: number, length: number): void {
  for (let i = 0; i < length; i += 1) set.add(start + i);
}

function isVowelChar(ch: string | undefined): boolean {
  return ch !== undefined && VOWELS_LOWER.has(ch);
}

/**
 * Schlägt Merkstellen für ein Wort vor.
 * @returns sortierte, eindeutige Zeichen-Indizes
 */
export function suggestMerkstellen(word: string): number[] {
  if (!word) return [];
  const lower = word.toLowerCase();
  const marks = new Set<number>();

  // Doppelkonsonanten (gleicher Mitlaut hintereinander).
  for (const m of lower.matchAll(/([bcdfgklmnprstz])\1/g)) {
    addRange(marks, m.index, 2);
  }

  // Mehrbuchstabige Stolperstellen.
  for (const pattern of ['tz', 'ck', 'ie', 'aa', 'ee', 'oo', 'eu', 'äu', 'ei', 'ai']) {
    let from = 0;
    let idx = lower.indexOf(pattern, from);
    while (idx !== -1) {
      addRange(marks, idx, pattern.length);
      from = idx + pattern.length;
      idx = lower.indexOf(pattern, from);
    }
  }

  // Einzelzeichen: ß, v, Umlaute.
  for (let i = 0; i < lower.length; i += 1) {
    const ch = lower[i];
    if (ch === 'ß' || ch === 'v' || ch === 'ä' || ch === 'ö' || ch === 'ü') {
      marks.add(i);
    }
    // Dehnungs-h: Selbstlaut + h + (Mitlaut oder Wortende).
    if (ch === 'h' && i > 0 && isVowelChar(lower[i - 1]) && !isVowelChar(lower[i + 1])) {
      marks.add(i);
    }
  }

  return [...marks].sort((a, b) => a - b);
}

/**
 * Hilfsfunktion für die Anzeige: liefert pro Zeichen, ob es markiert ist.
 */
export function markedLetters(word: string, merkstellen: number[]): boolean[] {
  const set = new Set(merkstellen);
  return word.split('').map((_, i) => set.has(i));
}
