import { describe, expect, it } from 'vitest';
import {
  activeSpalten,
  createDefaultKnickblattConfig,
  defaultKnickspalten,
  LINEATUR_MASSE,
  lineaturGesamtHoehe,
  paginate,
  resolveLineatur,
} from '@/core/knickblatt';
import type { Lernwort } from '@/types';

function wort(id: string): Lernwort {
  return {
    id,
    kindId: 'k1',
    wort: id,
    silben: [id],
    merkstellen: [],
    status: 'neu',
    erstelltAm: 0,
    geaendertAm: 0,
  };
}

describe('Knickblatt-Konfiguration', () => {
  it('hat sinnvolle Standardwerte', () => {
    const c = createDefaultKnickblattConfig();
    expect(c.woerterProBlatt).toBe(10);
    expect(c.lineatur).toBe('klasse2');
    expect(c.spalten.map((s) => s.typ)).toEqual([
      'vorlage',
      'schwingen',
      'merkstellen',
      'auswendig',
    ]);
  });

  it('zeichnet vor der Auswendig-Spalte eine Falzlinie', () => {
    const spalten = defaultKnickspalten();
    const auswendig = spalten.find((s) => s.typ === 'auswendig');
    expect(auswendig?.falzDavor).toBe(true);
  });

  it('liefert nur aktive Spalten samt Definition in Reihenfolge', () => {
    const c = createDefaultKnickblattConfig();
    c.spalten[1].aktiv = false; // schwingen deaktivieren
    const aktiv = activeSpalten(c);
    expect(aktiv.map((s) => s.typ)).toEqual(['vorlage', 'merkstellen', 'auswendig']);
    expect(aktiv[0].titel).toBe('Lernwort');
  });
});

describe('paginate', () => {
  it('teilt Wörter in Seiten zu je N Stück', () => {
    const woerter = Array.from({ length: 23 }, (_, i) => wort(`w${i}`));
    const seiten = paginate(woerter, 10);
    expect(seiten).toHaveLength(3);
    expect(seiten[0].woerter).toHaveLength(10);
    expect(seiten[2].woerter).toHaveLength(3);
    expect(seiten[2].seitenNr).toBe(3);
  });

  it('liefert immer mindestens eine (leere) Seite', () => {
    expect(paginate([], 10)).toHaveLength(1);
    expect(paginate([], 10)[0].woerter).toHaveLength(0);
  });
});

describe('Lineatur', () => {
  it('summiert Ober-, Mittel- und Unterband', () => {
    const masse = LINEATUR_MASSE.klasse2;
    expect(lineaturGesamtHoehe(masse)).toBe(16);
  });

  it('verkleinert die Lineatur mit steigender Klassenstufe', () => {
    expect(lineaturGesamtHoehe(LINEATUR_MASSE.klasse1)).toBeGreaterThan(
      lineaturGesamtHoehe(LINEATUR_MASSE.klasse4),
    );
  });
});

describe('resolveLineatur', () => {
  it('liefert eingebaute Lineaturen', () => {
    expect(resolveLineatur('klasse1')).toEqual(LINEATUR_MASSE.klasse1);
  });

  it('fällt für unbekannte IDs auf klasse2 zurück', () => {
    expect(resolveLineatur('gibtsnicht')).toEqual(LINEATUR_MASSE.klasse2);
  });

  it('löst eigene Lineaturen auf', () => {
    const custom = [
      { id: 'c1', name: 'Meine', oberHoehe: 3, bandHoehe: 9, unterHoehe: 3, mittelbandFarbig: true },
    ];
    expect(resolveLineatur('c1', custom)).toEqual({
      oberHoehe: 3,
      bandHoehe: 9,
      unterHoehe: 3,
      mittelbandFarbig: true,
    });
  });
});

describe('activeSpalten – Titel/Symbol-Überschreibung', () => {
  it('verwendet eigene Titel und Symbole, sonst Standard', () => {
    const c = createDefaultKnickblattConfig();
    c.spalten[1] = { ...c.spalten[1], titel: 'Eigen', symbol: '★' };
    const aktiv = activeSpalten(c);
    expect(aktiv[1].titel).toBe('Eigen');
    expect(aktiv[1].symbol).toBe('★');
    // Vorlage unverändert (Standardsymbol)
    expect(aktiv[0].titel).toBe('Lernwort');
  });
});
