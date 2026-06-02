import { describe, expect, it } from 'vitest';
import { buildExistingSet, normalizeForCompare, tokenize } from '@/core/tokenize';

describe('tokenize', () => {
  it('zerlegt Text in Wörter ohne Satzzeichen', () => {
    const t = tokenize('Am Wochenende war ich im Wald. Es war schön!');
    expect(t.map((x) => x.wort)).toEqual([
      'Am',
      'Wochenende',
      'war',
      'ich',
      'im',
      'Wald',
      'Es',
      'war',
      'schön',
    ]);
  });

  it('erhält die Groß-/Kleinschreibung', () => {
    const t = tokenize('Hund hund');
    expect(t.map((x) => x.wort)).toEqual(['Hund', 'hund']);
  });

  it('hält wort-interne Bindestriche zusammen', () => {
    const t = tokenize('Sport-Verein und E-Mail');
    expect(t.map((x) => x.wort)).toContain('Sport-Verein');
    expect(t.map((x) => x.wort)).toContain('E-Mail');
  });

  it('vergibt eindeutige Keys auch für wiederholte Wörter', () => {
    const t = tokenize('war war war');
    const keys = t.map((x) => x.key);
    expect(new Set(keys).size).toBe(3);
  });

  it('liefert leeres Array bei leerem Text', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('Dublettenvergleich', () => {
  it('normalisiert case-insensitiv', () => {
    expect(normalizeForCompare('  Hund ')).toBe('hund');
  });

  it('erkennt vorhandene Wörter', () => {
    const set = buildExistingSet(['Hund', 'Katze']);
    expect(set.has(normalizeForCompare('hund'))).toBe(true);
    expect(set.has(normalizeForCompare('Maus'))).toBe(false);
  });
});
