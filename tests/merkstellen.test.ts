import { describe, expect, it } from 'vitest';
import { markedLetters, suggestMerkstellen } from '@/core/merkstellen';

describe('suggestMerkstellen', () => {
  it('erkennt Doppelkonsonanten', () => {
    expect(suggestMerkstellen('Sommer')).toEqual([2, 3]);
    expect(suggestMerkstellen('rennen')).toEqual([2, 3]);
  });

  it('erkennt ie', () => {
    expect(suggestMerkstellen('Spiegel')).toEqual([2, 3]);
  });

  it('erkennt tz und ck', () => {
    expect(suggestMerkstellen('Katze')).toEqual([2, 3]);
    expect(suggestMerkstellen('Zucker')).toEqual([2, 3]);
  });

  it('erkennt ß', () => {
    expect(suggestMerkstellen('Straße')).toContain(4);
  });

  it('erkennt v und Umlaute', () => {
    expect(suggestMerkstellen('Vogel')).toEqual([0]);
    expect(suggestMerkstellen('Mädchen')).toEqual([1]);
  });

  it('erkennt das Dehnungs-h', () => {
    expect(suggestMerkstellen('Stuhl')).toEqual([3]);
    expect(suggestMerkstellen('Zahl')).toEqual([2]);
  });

  it('markiert kein gesprochenes h zwischen Vokalen', () => {
    // „gehen": h steht zwischen Vokalen → kein Dehnungs-h.
    expect(suggestMerkstellen('gehen')).toEqual([]);
  });

  it('erkennt Diphthonge', () => {
    expect(suggestMerkstellen('Eimer')).toEqual([0, 1]);
  });

  it('liefert sortierte, eindeutige Indizes', () => {
    const r = suggestMerkstellen('Fußball');
    expect(r).toEqual([...r].sort((a, b) => a - b));
    expect(new Set(r).size).toBe(r.length);
  });
});

describe('markedLetters', () => {
  it('liefert pro Buchstabe die Markierung', () => {
    expect(markedLetters('Som', [2])).toEqual([false, false, true]);
  });
});
