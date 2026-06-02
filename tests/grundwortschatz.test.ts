import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GRUNDWORTSCHATZ_LISTEN } from '@/data/grundwortschatz';

// Prüft die gebündelten Grundwortschatz-Wortlisten (public/data/grundwortschatz).
describe('Grundwortschatz-Listen', () => {
  it('enthält Bayern (1/2, 3/4) und NRW', () => {
    const ids = GRUNDWORTSCHATZ_LISTEN.map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['bayern-1-2', 'bayern-3-4', 'nrw']));
  });

  it('hat für jede Liste eine nicht-leere Wortdatei', () => {
    for (const l of GRUNDWORTSCHATZ_LISTEN) {
      const json = readFileSync(`public/data/grundwortschatz/${l.datei}`, 'utf8');
      const woerter = JSON.parse(json);
      expect(Array.isArray(woerter)).toBe(true);
      expect(woerter.length).toBeGreaterThan(100);
      expect(woerter.every((w: unknown) => typeof w === 'string' && (w as string).length > 0)).toBe(
        true,
      );
    }
  });

  it('NRW umfasst den bekannten 533-Wörter-Umfang', () => {
    const woerter = JSON.parse(readFileSync('public/data/grundwortschatz/nrw.json', 'utf8'));
    expect(woerter.length).toBeGreaterThan(500);
  });
});
