// Vitest-Setup: stellt bereit, was die Testumgebung nicht von sich aus hat.
import 'fake-indexeddb/auto';

// IndexedDB fehlt in Node — dafuer steht die Zeile darueber seit jeher. Seit
// Vitest 4 fehlt aus demselben Grund `localStorage`: die jsdom-Umgebung legt
// es nicht mehr auf `globalThis`, und Node bietet es nur mit
// `--localstorage-file`. `App.tsx` liest es beim ersten Render (Zustand der
// Seitenleiste), also scheiterte der Smoke-Test mit „Cannot read properties
// of undefined (reading 'getItem')" — auf `main` genauso wie hier.
//
// Ein Speicher im Arbeitsspeicher und kein Attrappen-Objekt: Tests, die
// etwas schreiben und wieder lesen, sollen das auch koennen.
if (typeof globalThis.localStorage === 'undefined') {
  const werte = new Map<string, string>();
  globalThis.localStorage = {
    get length() { return werte.size; },
    key: (i: number) => [...werte.keys()][i] ?? null,
    getItem: (k: string) => werte.get(k) ?? null,
    setItem: (k: string, v: string) => { werte.set(k, String(v)); },
    removeItem: (k: string) => { werte.delete(k); },
    clear: () => { werte.clear(); },
  } as Storage;
}
