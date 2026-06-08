import { describe, expect, it } from 'vitest';
import {
  baueUebenLink,
  decodeUebenPaket,
  encodeUebenPaket,
  fortschrittSchluessel,
  istUebenHash,
  leseUebenPaketAusHash,
  type UebenPaket,
} from '@/core/uebenLink';

const paket: UebenPaket = {
  v: 1,
  n: 'Mia',
  woerter: [
    { w: 'Sommer', s: ['Som', 'mer'], m: [2], a: 'der' },
    { w: 'Straße', s: ['Stra', 'ße'], m: [4] },
  ],
};

describe('uebenLink encode/decode', () => {
  it('round-trip erhält den Inhalt', () => {
    const code = encodeUebenPaket(paket);
    expect(decodeUebenPaket(code)).toEqual(paket);
  });

  it('verträgt Umlaute/Sonderzeichen URL-sicher (kein +,/,=)', () => {
    const code = encodeUebenPaket(paket);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('decode liefert null bei Müll', () => {
    expect(decodeUebenPaket('nicht-base64!!')).toBeNull();
    expect(decodeUebenPaket('')).toBeNull();
  });

  it('decode lehnt fremde/leere Pakete ab', () => {
    const fremd = btoa(JSON.stringify({ v: 2, n: 'x', woerter: [] }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeUebenPaket(fremd)).toBeNull();
  });
});

describe('uebenLink hash-Helfer', () => {
  it('baut und liest einen vollständigen Link', () => {
    const link = baueUebenLink(paket, 'https://example.org/app/');
    expect(link.startsWith('https://example.org/app/#ueben=')).toBe(true);
    const hash = '#' + link.split('#')[1];
    expect(istUebenHash(hash)).toBe(true);
    expect(leseUebenPaketAusHash(hash)).toEqual(paket);
  });

  it('erkennt fremde Hashes nicht als Übungslink', () => {
    expect(istUebenHash('#irgendwas')).toBe(false);
    expect(leseUebenPaketAusHash('#irgendwas')).toBeNull();
  });

  it('Fortschritts-Schlüssel ist stabil und linkspezifisch', () => {
    const a = fortschrittSchluessel('#ueben=AAA');
    expect(a).toBe(fortschrittSchluessel('#ueben=AAA'));
    expect(a).not.toBe(fortschrittSchluessel('#ueben=BBB'));
    expect(a.startsWith('sz-ueben-fortschritt-')).toBe(true);
  });
});
