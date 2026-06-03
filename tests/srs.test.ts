import { describe, expect, it } from 'vitest';
import { faelligeWoerter, istFaellig, naechsterStand, SRS_INTERVALLE_TAGE } from '@/core/srs';
import type { Lernwort } from '@/types';

const TAG = 86_400_000;

function wort(p: Partial<Lernwort> = {}): Lernwort {
  return {
    id: p.id ?? 'w',
    kindId: 'k',
    wort: p.wort ?? 'Sommer',
    silben: ['Som', 'mer'],
    merkstellen: [],
    status: p.status ?? 'neu',
    fach: p.fach,
    faelligAm: p.faelligAm,
    erstelltAm: 0,
    geaendertAm: 0,
  };
}

describe('istFaellig / faelligeWoerter', () => {
  const now = 1_000_000_000_000;
  it('ohne Fälligkeitsdatum ist fällig', () => {
    expect(istFaellig(wort(), now)).toBe(true);
  });
  it('Zukunft ist nicht fällig, Vergangenheit schon', () => {
    expect(istFaellig(wort({ faelligAm: now + TAG }), now)).toBe(false);
    expect(istFaellig(wort({ faelligAm: now - TAG }), now)).toBe(true);
  });
  it('sortiert fällige Wörter nach ältester Fälligkeit', () => {
    const a = wort({ id: 'a', faelligAm: now - 2 * TAG });
    const b = wort({ id: 'b', faelligAm: now - 5 * TAG });
    const c = wort({ id: 'c', faelligAm: now + TAG });
    expect(faelligeWoerter([a, b, c], now).map((w) => w.id)).toEqual(['b', 'a']);
  });
});

describe('naechsterStand', () => {
  const now = 1_000_000_000_000;
  it('richtig → ein Fach höher, spätere Fälligkeit', () => {
    const s = naechsterStand(wort({ fach: 1 }), true, now);
    expect(s.fach).toBe(2);
    expect(s.faelligAm).toBe(now + SRS_INTERVALLE_TAGE[1] * TAG);
    expect(s.status).toBe('wird_geuebt');
  });
  it('falsch → zurück in Fach 1', () => {
    const s = naechsterStand(wort({ fach: 4 }), false, now);
    expect(s.fach).toBe(1);
    expect(s.faelligAm).toBe(now);
    expect(s.status).toBe('wird_geuebt');
  });
  it('Fach 5 erreicht → „sitzt"', () => {
    const s = naechsterStand(wort({ fach: 4 }), true, now);
    expect(s.fach).toBe(5);
    expect(s.status).toBe('sitzt');
  });
  it('Fach ist auf 5 gedeckelt', () => {
    expect(naechsterStand(wort({ fach: 5 }), true, now).fach).toBe(5);
  });
});
