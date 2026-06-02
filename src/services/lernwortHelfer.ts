// Gemeinsame Hilfsfunktion: ein Wort mit Wörterbuch-Vorschlägen (Silben,
// Artikel, Merkstellen) als Lernwort übernehmen. Wird von mehreren Stellen
// genutzt (Text-Extraktion, Grundwortschatz), um Doppelung zu vermeiden.
import { repository } from '@/db/repository';
import { lookupWort } from './dictionary';

export async function uebernehmeWort(
  kindId: string,
  wort: string,
  quelle: string,
): Promise<void> {
  const info = lookupWort(wort);
  await repository.addLernwort(kindId, wort, {
    quelle,
    silben: info.silben,
    merkstellen: info.merkstellen,
    artikel: info.artikel || '',
  });
}

/** Übernimmt mehrere Wörter nacheinander. */
export async function uebernehmeWoerter(
  kindId: string,
  woerter: string[],
  quelle: string,
): Promise<void> {
  for (const w of woerter) await uebernehmeWort(kindId, w, quelle);
}
