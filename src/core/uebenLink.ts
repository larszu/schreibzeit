// Teilbarer Übungslink pro Kind.
//
// Schreibzeit ist server-/kontenlos (alle Daten liegen lokal). Damit ein Kind
// auf einem beliebigen Gerät offline üben kann, werden seine Lernwörter direkt
// in den Link codiert (im Anker `#ueben=…`). Der Link enthält nur die Wörter
// (+ Anzeigename) – es wird nichts hochgeladen.
//
// Reine Funktionen, keine DOM-/DB-Abhängigkeit (Basis-URL wird übergeben).

/** Ein einzelnes Wort im Übungspaket – Schlüssel bewusst kurz (Linklänge). */
export interface UebenWort {
  /** Wort. */
  w: string;
  /** Silben (getrennte Darstellung). */
  s?: string[];
  /** Merkstellen (0-basierte Zeichen-Indizes). */
  m?: number[];
  /** Artikel (der/die/das). */
  a?: string;
}

/** Codiertes Übungspaket eines Kindes. */
export interface UebenPaket {
  /** Schema-Version (für spätere Migrationen). */
  v: 1;
  /** Anzeigename des Kindes (kann nur Initialen sein – DSGVO). */
  n: string;
  /** Lernwörter. */
  woerter: UebenWort[];
}

const HASH_PRAEFIX = '#ueben=';

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Übungspaket → kompakter, URL-sicherer String. */
export function encodeUebenPaket(paket: UebenPaket): string {
  const json = JSON.stringify(paket);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

/** String → Übungspaket (oder `null`, wenn ungültig). */
export function decodeUebenPaket(code: string): UebenPaket | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(code.trim()));
    const obj = JSON.parse(json) as unknown;
    if (
      !obj ||
      typeof obj !== 'object' ||
      (obj as UebenPaket).v !== 1 ||
      !Array.isArray((obj as UebenPaket).woerter)
    ) {
      return null;
    }
    const p = obj as UebenPaket;
    // Auf gültige Wörter eingrenzen.
    const woerter = p.woerter.filter((w) => w && typeof w.w === 'string' && w.w.length > 0);
    if (woerter.length === 0) return null;
    return { v: 1, n: typeof p.n === 'string' ? p.n : '', woerter };
  } catch {
    return null;
  }
}

/** Vollständiger Link (Basis-URL + codiertes Paket im Anker). */
export function baueUebenLink(
  paket: UebenPaket,
  basis: string = `${location.origin}${location.pathname}`,
): string {
  return `${basis}${HASH_PRAEFIX}${encodeUebenPaket(paket)}`;
}

/** True, wenn die aktuelle URL ein Schüler-Übungslink ist. */
export function istUebenHash(hash: string = location.hash): boolean {
  return hash.startsWith(HASH_PRAEFIX);
}

/** Übungspaket aus dem URL-Anker lesen (oder `null`). */
export function leseUebenPaketAusHash(hash: string = location.hash): UebenPaket | null {
  if (!istUebenHash(hash)) return null;
  return decodeUebenPaket(hash.slice(HASH_PRAEFIX.length));
}

/**
 * Stabiler localStorage-Schlüssel für den Übungsfortschritt eines Links.
 * Aus dem codierten Paket abgeleitet (FNV-1a), damit gleicher Link =
 * gleicher Fortschritt, unterschiedliche Kinder/Wortlisten getrennt bleiben.
 */
export function fortschrittSchluessel(code: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `sz-ueben-fortschritt-${(h >>> 0).toString(36)}`;
}
