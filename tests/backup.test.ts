import { describe, expect, it } from 'vitest';
import { buildBackup, mergeById, parseBackup } from '@/services/backup';
import type { BackupDaten } from '@/services/backup';

const leereDaten: BackupDaten = {
  klassen: [],
  kinder: [],
  lernwoerter: [],
  uebungstexte: [],
};

describe('buildBackup / parseBackup (Round-Trip)', () => {
  it('serialisiert und liest Daten verlustfrei', () => {
    const daten: BackupDaten = {
      ...leereDaten,
      kinder: [
        {
          id: 'k1',
          name: 'A.',
          lernstand: 'klasse2',
          erstelltAm: 1,
          geaendertAm: 1,
        },
      ],
    };
    const backup = buildBackup(daten);
    const json = JSON.stringify(backup);
    const parsed = parseBackup(json);
    expect(parsed.version).toBe(1);
    expect(parsed.daten.kinder[0].name).toBe('A.');
  });

  it('lehnt fremde Dateien ab', () => {
    expect(() => parseBackup('{"foo": 1}')).toThrow();
    expect(() => parseBackup('kein json')).toThrow();
  });

  it('lehnt zu neue Backup-Versionen ab', () => {
    const future = JSON.stringify({ schreibzeit: true, version: 99, daten: leereDaten });
    expect(() => parseBackup(future)).toThrow(/neueren Version/);
  });

  it('füllt fehlende Listen mit leeren Arrays', () => {
    const minimal = JSON.stringify({ schreibzeit: true, version: 1, daten: {} });
    const parsed = parseBackup(minimal);
    expect(parsed.daten.lernwoerter).toEqual([]);
  });
});

describe('mergeById', () => {
  it('führt anhand der id zusammen und überschreibt Duplikate', () => {
    const a = [
      { id: '1', v: 'alt' },
      { id: '2', v: 'b' },
    ];
    const b = [
      { id: '1', v: 'neu' },
      { id: '3', v: 'c' },
    ];
    const merged = mergeById(a, b);
    expect(merged).toHaveLength(3);
    expect(merged.find((x) => x.id === '1')?.v).toBe('neu');
  });
});
