import { describe, expect, it } from 'vitest';
import {
  activeSpalten,
  createDefaultKnickblattConfig,
  defaultKnickspalten,
  LINEATUR_MASSE,
  lineaturGesamtHoehe,
  paginate,
  resolveLineaturRender,
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
    const masse = LINEATUR_MASSE.klasse2; // Lin. 2: 4 + 4 + 4 mm
    expect(lineaturGesamtHoehe(masse)).toBe(12);
  });

  it('verkleinert die Lineatur mit steigender Klassenstufe', () => {
    expect(lineaturGesamtHoehe(LINEATUR_MASSE.klasse1)).toBeGreaterThan(
      lineaturGesamtHoehe(LINEATUR_MASSE.klasse4),
    );
  });
});

describe('resolveLineaturRender', () => {
  it('liefert eingebaute Lineaturen als gezeichnete Linien', () => {
    expect(resolveLineaturRender('klasse1')).toEqual({
      typ: 'parametrisch',
      masse: LINEATUR_MASSE.klasse1,
    });
  });

  it('fällt für unbekannte IDs auf klasse2 zurück', () => {
    expect(resolveLineaturRender('gibtsnicht')).toEqual({
      typ: 'parametrisch',
      masse: LINEATUR_MASSE.klasse2,
    });
  });

  it('löst eigene (Bild-)Lineaturen auf', () => {
    const custom = [{ id: 'c1', name: 'Meine', bildUrl: 'data:image/png;base64,xx', hoeheMm: 9 }];
    expect(resolveLineaturRender('c1', custom)).toEqual({
      typ: 'bild',
      url: 'data:image/png;base64,xx',
      hoeheMm: 9,
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
