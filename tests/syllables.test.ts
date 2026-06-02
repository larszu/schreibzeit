import { describe, expect, it } from 'vitest';
import {
  breakpointsFromSyllables,
  countSyllables,
  formatSyllables,
  splitSyllables,
  syllablesFromBreakpoints,
} from '@/core/syllables';

describe('splitSyllables', () => {
  it('trennt Doppelkonsonanten zwischen den Silben', () => {
    expect(splitSyllables('Sommer')).toEqual(['Som', 'mer']);
    expect(splitSyllables('Winter')).toEqual(['Win', 'ter']);
    expect(splitSyllables('rennen')).toEqual(['ren', 'nen']);
  });

  it('lässt einen einzelnen Konsonanten zur nächsten Silbe wandern', () => {
    expect(splitSyllables('malen')).toEqual(['ma', 'len']);
    expect(splitSyllables('lesen')).toEqual(['le', 'sen']);
    expect(splitSyllables('Banane')).toEqual(['Ba', 'na', 'ne']);
  });

  it('hält Digraphe wie ch, sch und ck zusammen', () => {
    expect(splitSyllables('kochen')).toEqual(['ko', 'chen']);
    expect(splitSyllables('waschen')).toEqual(['wa', 'schen']);
    expect(splitSyllables('Zucker')).toEqual(['Zu', 'cker']);
  });

  it('behandelt einsilbige und sehr kurze Wörter unverändert', () => {
    expect(splitSyllables('Baum')).toEqual(['Baum']);
    expect(splitSyllables('und')).toEqual(['und']);
    expect(splitSyllables('a')).toEqual(['a']);
    expect(splitSyllables('')).toEqual(['']);
  });

  it('behandelt Doppelvokale und Diphthonge als einen Silbenkern', () => {
    expect(splitSyllables('Boot')).toEqual(['Boot']);
    expect(splitSyllables('Auto')).toEqual(['Au', 'to']);
  });

  it('erhält die Groß-/Kleinschreibung', () => {
    const parts = splitSyllables('Apfelbaum');
    expect(parts.join('')).toBe('Apfelbaum');
  });

  it('liefert beim Zusammenfügen wieder das Originalwort', () => {
    for (const w of ['Mama', 'Schule', 'Fahrrad', 'Tausendfüßler', 'Mittwoch']) {
      expect(splitSyllables(w).join('')).toBe(w);
    }
  });
});

describe('countSyllables', () => {
  it('zählt die Sprechsilben', () => {
    expect(countSyllables('Sommer')).toBe(2);
    expect(countSyllables('Banane')).toBe(3);
    expect(countSyllables('Baum')).toBe(1);
  });
});

describe('Trennstellen-Konvertierung', () => {
  it('wandelt Silben in Trennstellen und zurück', () => {
    const silben = ['Som', 'mer'];
    const bp = breakpointsFromSyllables(silben);
    expect(bp).toEqual([3]);
    expect(syllablesFromBreakpoints('Sommer', bp)).toEqual(silben);
  });

  it('ignoriert ungültige Trennstellen', () => {
    expect(syllablesFromBreakpoints('Baum', [0, 99])).toEqual(['Baum']);
  });

  it('formatiert Silben mit Trennzeichen', () => {
    expect(formatSyllables(['Som', 'mer'])).toBe('Som-mer');
  });
});
