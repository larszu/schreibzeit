import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, verworfenGesamt } from '@/services/backup';
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
    const { backup: parsed } = parseBackup(json);
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
    const { backup: parsed } = parseBackup(minimal);
    expect(parsed.daten.lernwoerter).toEqual([]);
  });
});

describe('parseBackup – tolerante Normalisierung & Verlust-Bericht', () => {
  function wrap(daten: Record<string, unknown>): string {
    return JSON.stringify({ schreibzeit: true, version: 1, daten });
  }

  it('repariert unbekannten Lernstand statt das Kind (und seine Wörter) zu verwerfen', () => {
    const { backup, bericht } = parseBackup(
      wrap({
        kinder: [{ id: 'k1', name: 'Mia', lernstand: 'klasse9' }],
        lernwoerter: [{ id: 'w1', kindId: 'k1', wort: 'Sommer' }],
      }),
    );
    expect(backup.daten.kinder).toHaveLength(1);
    expect(backup.daten.kinder[0].lernstand).toBe('klasse2'); // Default
    expect(backup.daten.lernwoerter).toHaveLength(1); // Wort bleibt erhalten
    expect(verworfenGesamt(bericht)).toBe(0);
  });

  it('ergänzt fehlende Pflichtfelder mit Standardwerten', () => {
    const { backup } = parseBackup(
      wrap({ lernwoerter: [], kinder: [{ id: 'k1', name: 'Mia' }] }),
    );
    const w = parseBackup(
      wrap({
        kinder: [{ id: 'k1', name: 'Mia' }],
        lernwoerter: [{ id: 'w1', kindId: 'k1', wort: 'Apfel' }],
      }),
    ).backup.daten.lernwoerter[0];
    expect(backup.daten.kinder[0].lernstand).toBe('klasse2');
    expect(w.status).toBe('neu');
    expect(w.silben).toEqual([]);
    expect(w.merkstellen).toEqual([]);
    expect(typeof w.erstelltAm).toBe('number');
  });

  it('verwirft Records ohne Identitätsfelder und zählt sie', () => {
    const { backup, bericht } = parseBackup(
      wrap({
        kinder: [{ id: 'k1', name: 'Mia' }, { name: 'ohne id' }],
        lernwoerter: [
          { id: 'w1', kindId: 'k1', wort: 'Sommer' },
          { id: 'w2', wort: 'kein kindId' },
        ],
      }),
    );
    expect(backup.daten.kinder).toHaveLength(1);
    expect(bericht.verworfen.kinder).toBe(1);
    expect(backup.daten.lernwoerter).toHaveLength(1);
    expect(bericht.verworfen.lernwoerter).toBe(1);
  });

  it('verwirft Lernwörter ohne zugehöriges Kind (referentielle Integrität)', () => {
    const { backup, bericht } = parseBackup(
      wrap({
        kinder: [{ id: 'k1', name: 'Mia' }],
        lernwoerter: [{ id: 'w1', kindId: 'fehlt', wort: 'Wort' }],
      }),
    );
    expect(backup.daten.lernwoerter).toHaveLength(0);
    expect(bericht.verworfen.lernwoerter).toBe(1);
  });

  it('behält ein Kind, löst aber eine verwaiste Klassenzuordnung (kein Verlust)', () => {
    const { backup, bericht } = parseBackup(
      wrap({ kinder: [{ id: 'k1', name: 'Mia', klasseId: 'fehlt' }] }),
    );
    expect(backup.daten.kinder).toHaveLength(1);
    expect(backup.daten.kinder[0].klasseId).toBeUndefined();
    expect(verworfenGesamt(bericht)).toBe(0);
  });
});
