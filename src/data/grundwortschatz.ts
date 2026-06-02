// Verfügbare Grundwortschatz-Listen (offizielle Wortschätze der Bundesländer).
// Die Wortlisten liegen als JSON unter public/data/grundwortschatz/ und werden
// bei Bedarf nachgeladen.
//
// Aktuell eingebaut: Bayern (LehrplanPLUS, Jgst. 1/2 und 3/4) und
// Nordrhein-Westfalen (Grundwortschatz, 533 Wörter). Weitere Bundesländer
// (z. B. Hessen, Baden-Württemberg) lassen sich als zusätzliche JSON-Dateien
// gleicher Struktur ergänzen.

export interface GrundwortschatzListe {
  id: string;
  label: string;
  bundesland: string;
  klasse: string;
  datei: string;
}

export const GRUNDWORTSCHATZ_LISTEN: GrundwortschatzListe[] = [
  {
    id: 'bayern-1-2',
    label: 'Bayern · Grundwortschatz 1/2',
    bundesland: 'Bayern',
    klasse: '1/2',
    datei: 'bayern-1-2.json',
  },
  {
    id: 'bayern-3-4',
    label: 'Bayern · Grundwortschatz 3/4',
    bundesland: 'Bayern',
    klasse: '3/4',
    datei: 'bayern-3-4.json',
  },
  {
    id: 'nrw',
    label: 'Nordrhein-Westfalen · Grundwortschatz',
    bundesland: 'Nordrhein-Westfalen',
    klasse: '1–4',
    datei: 'nrw.json',
  },
];

const cache = new Map<string, string[]>();

/** Lädt die Wortliste einer Grundwortschatz-Liste (mit Cache). */
export async function ladeGrundwortschatz(id: string): Promise<string[]> {
  if (cache.has(id)) return cache.get(id)!;
  const liste = GRUNDWORTSCHATZ_LISTEN.find((l) => l.id === id);
  if (!liste) return [];
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/grundwortschatz/${liste.datei}`);
    const woerter: string[] = res.ok ? await res.json() : [];
    cache.set(id, woerter);
    return woerter;
  } catch {
    return [];
  }
}
