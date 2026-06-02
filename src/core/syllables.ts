// Heuristische deutsche Silbentrennung (Sprechsilben).
//
// Die Trennung ist bewusst als *Vorschlag* gedacht und in der Oberfläche
// vollständig manuell korrigierbar. Die Heuristik folgt den gängigen
// Grundschul-Regeln:
//   - Zwischen zwei Selbstlauten wandert ein einzelner Mitlaut zur nächsten
//     Silbe (V-CV):           ma-len, le-sen
//   - Bei mehreren Mitlauten bleibt der letzte bei der nächsten Silbe
//     (VC-CV / VCC-CV):       Som-mer, Win-ter, Herbst-tag
//   - Digraphe bleiben zusammen und zählen als ein Mitlaut:
//     ch, sch, ck, pf, ph, th, qu  → Zu-cker, wa-schen, ko-chen

const VOWELS = new Set('aeiouäöüyAEIOUÄÖÜY'.split(''));

/** Mehrbuchstabige Mitlaut-Einheiten, die nicht getrennt werden. */
const DIGRAPHS_3 = ['sch'];
const DIGRAPHS_2 = ['ch', 'ck', 'pf', 'ph', 'th', 'qu'];

interface Nucleus {
  start: number;
  end: number; // exklusiv
}

function isVowel(ch: string): boolean {
  return VOWELS.has(ch);
}

/** Findet die maximalen Selbstlaut-Gruppen (Silbenkerne) eines Wortes. */
function findNuclei(word: string): Nucleus[] {
  const nuclei: Nucleus[] = [];
  let i = 0;
  while (i < word.length) {
    if (isVowel(word[i])) {
      const start = i;
      while (i < word.length && isVowel(word[i])) i += 1;
      nuclei.push({ start, end: i });
    } else {
      i += 1;
    }
  }
  return nuclei;
}

/**
 * Zerlegt einen Mitlaut-Bereich (z. B. "schm") in unteilbare Einheiten und
 * gibt deren Längen zurück (z. B. "schm" → [3, 1]).
 */
function consonantUnitLengths(lowerCluster: string): number[] {
  const lengths: number[] = [];
  let pos = 0;
  while (pos < lowerCluster.length) {
    const three = lowerCluster.slice(pos, pos + 3);
    const two = lowerCluster.slice(pos, pos + 2);
    if (DIGRAPHS_3.includes(three)) {
      lengths.push(3);
      pos += 3;
    } else if (DIGRAPHS_2.includes(two)) {
      lengths.push(2);
      pos += 2;
    } else {
      lengths.push(1);
      pos += 1;
    }
  }
  return lengths;
}

/**
 * Trennt ein Wort heuristisch in Sprechsilben.
 * Gibt mindestens ein Element zurück (das Wort selbst, falls untrennbar).
 */
export function splitSyllables(word: string): string[] {
  if (!word || word.length < 2) return [word];

  const lower = word.toLowerCase();
  const nuclei = findNuclei(lower);
  if (nuclei.length <= 1) return [word];

  const splitIndices: number[] = [];
  for (let n = 0; n < nuclei.length - 1; n += 1) {
    const regionStart = nuclei[n].end;
    const regionEnd = nuclei[n + 1].start;
    const cluster = lower.slice(regionStart, regionEnd);

    if (cluster.length === 0) {
      // Hiatus (zwei direkt benachbarte Kerne) – kommt durch maximale
      // Gruppenbildung praktisch nicht vor, sicherheitshalber trennen.
      splitIndices.push(regionStart);
      continue;
    }

    const units = consonantUnitLengths(cluster);
    if (units.length === 1) {
      // Einzelner Mitlaut(-block) wandert komplett zur nächsten Silbe.
      splitIndices.push(regionStart);
    } else {
      // Letzte Einheit zur nächsten Silbe, Rest bleibt als Endrand.
      const keepBefore = units.slice(0, -1).reduce((a, b) => a + b, 0);
      splitIndices.push(regionStart + keepBefore);
    }
  }

  // Wort anhand der Trennstellen (über Originalschreibweise) zerschneiden.
  const parts: string[] = [];
  let prev = 0;
  for (const idx of splitIndices) {
    parts.push(word.slice(prev, idx));
    prev = idx;
  }
  parts.push(word.slice(prev));
  return parts.filter((p) => p.length > 0);
}

/** Anzahl der Sprechsilben (Anzahl der Selbstlaut-Gruppen). */
export function countSyllables(word: string): number {
  return Math.max(1, findNuclei(word.toLowerCase()).length);
}

/** Formatiert die Silben als String mit Trennzeichen, z. B. "Som-mer". */
export function formatSyllables(silben: string[], sep = '-'): string {
  return silben.join(sep);
}

/**
 * Wandelt eine Liste von Trennstellen-Indizes (0-basiert, Position *vor* der
 * der Index steht) in ein Silben-Array um. Wird vom manuellen Editor genutzt.
 */
export function syllablesFromBreakpoints(word: string, breakpoints: number[]): string[] {
  const sorted = [...new Set(breakpoints)]
    .filter((b) => b > 0 && b < word.length)
    .sort((a, b) => a - b);
  const parts: string[] = [];
  let prev = 0;
  for (const idx of sorted) {
    parts.push(word.slice(prev, idx));
    prev = idx;
  }
  parts.push(word.slice(prev));
  return parts.filter((p) => p.length > 0);
}

/** Ermittelt die Trennstellen-Indizes aus einem Silben-Array. */
export function breakpointsFromSyllables(silben: string[]): number[] {
  const points: number[] = [];
  let pos = 0;
  for (let i = 0; i < silben.length - 1; i += 1) {
    pos += silben[i].length;
    points.push(pos);
  }
  return points;
}
