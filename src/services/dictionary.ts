// Wörterbuch-gestützte Vorschläge beim Anlegen eines Lernworts:
//   - Silbentrennung aus der deutschen Trennmuster-Bibliothek (hyphen) –
//     funktioniert offline für *beliebige* Wörter und ist deutlich genauer als
//     eine reine Heuristik.
//   - Artikel (Genus) aus einer kuratierten Grundwortschatz-Liste.
//   - Merkstellen weiterhin aus der bestehenden Heuristik.
//
// Wird ausschließlich in der Oberfläche genutzt (nicht in der getesteten
// Kernlogik), damit die Kernlogik abhängigkeitsfrei und offline-fest bleibt.

import { hyphenateSync } from 'hyphen/de';
import { splitSyllables } from '@/core/syllables';
import { suggestMerkstellen } from '@/core/merkstellen';
import { GERMAN_NOUNS } from '@/data/germanNouns';

export interface WortInfo {
  silben: string[];
  artikel?: 'der' | 'die' | 'das' | '';
  merkstellen: number[];
  /** Wurde ein Artikel im Wörterbuch gefunden? (für UI-Hinweis) */
  artikelGefunden: boolean;
}

const TRENN = ''; // unsichtbares Trennzeichen für die Zerlegung

/** Silbentrennung über die Wörterbuch-Bibliothek, mit Heuristik-Fallback. */
export function woerterbuchSilben(wort: string): string[] {
  const trimmed = wort.trim();
  if (trimmed.length < 2) return [trimmed];
  try {
    const getrennt = hyphenateSync(trimmed, { hyphenChar: TRENN });
    const teile = getrennt.split(TRENN).filter(Boolean);
    return teile.length > 0 ? teile : splitSyllables(trimmed);
  } catch {
    return splitSyllables(trimmed);
  }
}

/** Schlägt Silben, Artikel und Merkstellen für ein Wort vor. */
export function lookupWort(wort: string): WortInfo {
  const trimmed = wort.trim();
  const artikel = GERMAN_NOUNS[trimmed.toLowerCase()];
  return {
    silben: woerterbuchSilben(trimmed),
    artikel: artikel ?? '',
    merkstellen: suggestMerkstellen(trimmed),
    artikelGefunden: artikel != null,
  };
}
