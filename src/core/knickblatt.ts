// Datengetriebenes Modell für den Knickblatt-Generator.
//
// Die eigentliche Darstellung (Print-CSS/React) liest nur dieses Modell. So
// lassen sich neue Spalten-/Blatttypen ergänzen, ohne die Render-Logik
// umzubauen (siehe SPALTEN_DEFS).

import type {
  CustomLineatur,
  KnickblattConfig,
  Knickspalte,
  Lernwort,
  Lineatur,
  LineaturMasse,
  SpaltenTyp,
} from '@/types';

export interface SpaltenDef {
  typ: SpaltenTyp;
  titel: string;
  /** Kurzes Symbol (Emoji/Glyphe) für die Spaltenüberschrift. */
  symbol: string;
  /** Erklärung für Tooltip/Legende. */
  beschreibung: string;
  /** Enthält Schreiblinien (Lineatur) zum Üben? */
  mitLineatur: boolean;
  /** Zeigt diese Spalte das Lernwort als Vorlage? */
  istVorlage: boolean;
}

// Reihenfolge hier ist die Standard-Reihenfolge im Spaltenkatalog.
export const SPALTEN_DEFS: Record<SpaltenTyp, SpaltenDef> = {
  vorlage: {
    typ: 'vorlage',
    titel: 'Lernwort',
    symbol: '✏️',
    beschreibung: 'Das Lernwort als gedruckte Vorlage.',
    mitLineatur: false,
    istVorlage: true,
  },
  schwingen: {
    typ: 'schwingen',
    titel: 'Silben schwingen',
    symbol: '〰️',
    beschreibung: 'Wort schreiben und die Silbenbögen darunter malen.',
    mitLineatur: true,
    istVorlage: false,
  },
  merkstellen: {
    typ: 'merkstellen',
    titel: 'Stellen markieren',
    symbol: '🔎',
    beschreibung: 'Wort schreiben und die schwierigen Stellen markieren.',
    mitLineatur: true,
    istVorlage: false,
  },
  auswendig: {
    typ: 'auswendig',
    titel: 'Auswendig schreiben',
    symbol: '🧠',
    beschreibung: 'Blatt knicken, sodass die Vorlage verdeckt ist, dann auswendig schreiben.',
    mitLineatur: true,
    istVorlage: false,
  },
  partner: {
    typ: 'partner',
    titel: 'Partner diktiert',
    symbol: '👂',
    beschreibung: 'Ein Partnerkind diktiert das Wort zur Kontrolle.',
    mitLineatur: true,
    istVorlage: false,
  },
  verlaengern: {
    typ: 'verlaengern',
    titel: 'Verlängern',
    symbol: '➡️',
    beschreibung: 'Wort verlängern (z. B. Hund → Hunde), um den Mitlaut zu hören.',
    mitLineatur: true,
    istVorlage: false,
  },
  ableiten: {
    typ: 'ableiten',
    titel: 'Ableiten',
    symbol: '🔗',
    beschreibung: 'Verwandtes Wort finden (z. B. Bäcker → backen).',
    mitLineatur: true,
    istVorlage: false,
  },
  merkwort: {
    typ: 'merkwort',
    titel: 'Merkwort',
    symbol: '⭐',
    beschreibung: 'Merkwort einprägen – hier hilft nur Auswendiglernen.',
    mitLineatur: true,
    istVorlage: false,
  },
  benutzerdefiniert: {
    typ: 'benutzerdefiniert',
    titel: 'Eigene Spalte',
    symbol: '✳️',
    beschreibung: 'Selbst definierte Übungsspalte mit Schreiblinien.',
    mitLineatur: true,
    istVorlage: false,
  },
};

export const DEFAULT_SPALTEN: SpaltenTyp[] = [
  'vorlage',
  'schwingen',
  'merkstellen',
  'auswendig',
];

export function defaultKnickspalten(typen: SpaltenTyp[] = DEFAULT_SPALTEN): Knickspalte[] {
  return typen.map((typ) => ({
    id: typ,
    typ,
    aktiv: true,
    // Vor der „Auswendig schreiben"-Spalte wird geknickt.
    falzDavor: typ === 'auswendig',
  }));
}

export function createDefaultKnickblattConfig(
  partial: Partial<KnickblattConfig> = {},
): KnickblattConfig {
  return {
    spalten: defaultKnickspalten(),
    woerterProBlatt: 10,
    lineatur: 'klasse2',
    vorlageFont: 'Andika',
    vorlageMitSilben: false,
    vorlageMitMerkstellen: false,
    ...partial,
  };
}

export interface KnickblattSeite {
  seitenNr: number;
  woerter: Lernwort[];
}

/**
 * Teilt die ausgewählten Wörter datengetrieben in Seiten auf, sodass keine
 * Zeile über einen Seitenumbruch zerrissen wird.
 */
export function paginate(woerter: Lernwort[], woerterProBlatt: number): KnickblattSeite[] {
  const proBlatt = Math.max(1, Math.floor(woerterProBlatt));
  const seiten: KnickblattSeite[] = [];
  for (let i = 0; i < woerter.length; i += proBlatt) {
    seiten.push({
      seitenNr: seiten.length + 1,
      woerter: woerter.slice(i, i + proBlatt),
    });
  }
  return seiten.length > 0 ? seiten : [{ seitenNr: 1, woerter: [] }];
}

/** Liefert die aktiven Spaltendefinitionen in konfigurierter Reihenfolge. */
export function activeSpalten(config: KnickblattConfig): Array<Knickspalte & SpaltenDef> {
  return config.spalten
    .filter((s) => s.aktiv)
    .map((s) => {
      const def = SPALTEN_DEFS[s.typ];
      // Eigener Titel/Symbol überschreibt die Standardwerte (falls gesetzt).
      return {
        ...def,
        ...s,
        titel: s.titel?.trim() || def.titel,
        symbol: s.symbol?.trim() || def.symbol,
      };
    });
}

// Lineatur-Maße in Millimetern – an die in Deutschland genormten Schulheft-
// Lineaturen (DIN 16552-1) angelehnt. `bandHoehe` = Höhe des Mittelbands
// (x-Höhe), `oberHoehe`/`unterHoehe` = Ober-/Unterlänge. `linienModus` regelt,
// wie viele Linien gezeichnet werden:
//   Lin. 1 (Kl. 1): 4 Linien, farbiges Kontrast-/Mittelband, 5 mm
//   Lin. 2 (Kl. 2): 4 Linien, 4 mm
//   Lin. 3 (Kl. 3): nur Mittel- und Grundlinie (2 Linien), 3,5 mm
//   Lin. 4 (Kl. 4): nur Grundlinie (1 Linie), 10 mm Zeile
export const LINEATUR_MASSE: Record<Lineatur, LineaturMasse> = {
  klasse1: { oberHoehe: 5, bandHoehe: 5, unterHoehe: 5, mittelbandFarbig: true, linienModus: 'vier' },
  klasse2: { oberHoehe: 4, bandHoehe: 4, unterHoehe: 4, mittelbandFarbig: false, linienModus: 'vier' },
  klasse3: { oberHoehe: 3.5, bandHoehe: 3.5, unterHoehe: 3.5, mittelbandFarbig: false, linienModus: 'zwei' },
  klasse4: { oberHoehe: 6.5, bandHoehe: 0, unterHoehe: 3.5, mittelbandFarbig: false, linienModus: 'eins' },
  haus: { oberHoehe: 4, bandHoehe: 8, unterHoehe: 4, mittelbandFarbig: true, linienModus: 'vier' },
};

export const LINEATUR_LABEL: Record<Lineatur, string> = {
  klasse1: 'Klasse 1 · Lin. 1 (Kontrast)',
  klasse2: 'Klasse 2 · Lin. 2',
  klasse3: 'Klasse 3 · Lin. 3 (2 Linien)',
  klasse4: 'Klasse 4 · Lin. 4 (1 Linie)',
  haus: 'Haus-Lineatur (Mittelband)',
};

/** Render-Beschreibung einer Lineatur: gezeichnete Linien oder ein Bildstreifen. */
export type LineaturRender =
  | { typ: 'parametrisch'; masse: LineaturMasse }
  | { typ: 'bild'; url: string; hoeheMm: number };

/** Ermittelt, wie eine Lineatur gezeichnet wird (eingebaut = Linien, eigene = Bild). */
export function resolveLineaturRender(id: string, custom: CustomLineatur[] = []): LineaturRender {
  if (id in LINEATUR_MASSE) return { typ: 'parametrisch', masse: LINEATUR_MASSE[id as Lineatur] };
  const eigen = custom.find((c) => c.id === id);
  if (eigen) return { typ: 'bild', url: eigen.bildUrl, hoeheMm: eigen.hoeheMm };
  return { typ: 'parametrisch', masse: LINEATUR_MASSE.klasse2 };
}

export function lineaturGesamtHoehe(l: LineaturMasse): number {
  return l.oberHoehe + l.bandHoehe + l.unterHoehe;
}
