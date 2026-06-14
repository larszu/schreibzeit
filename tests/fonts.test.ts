import { describe, expect, it } from 'vitest';
import { istErlaubteFontDatei } from '@/services/fonts';

describe('istErlaubteFontDatei', () => {
  it('akzeptiert gängige Schriftformate', () => {
    expect(istErlaubteFontDatei('Grundschrift.ttf', 'font/ttf')).toBe(true);
    expect(istErlaubteFontDatei('Andika.otf', 'font/otf')).toBe(true);
    expect(istErlaubteFontDatei('Schule.woff', 'font/woff')).toBe(true);
    expect(istErlaubteFontDatei('Schule.woff2', 'font/woff2')).toBe(true);
  });

  it('akzeptiert leeren MIME-Typ (manche Browser liefern keinen)', () => {
    expect(istErlaubteFontDatei('Schrift.ttf', '')).toBe(true);
  });

  it('lehnt verkleidete oder fremde Dateien ab (frühere Regex-Lücke)', () => {
    expect(istErlaubteFontDatei('boese.svg', 'image/svg+xml')).toBe(false);
    expect(istErlaubteFontDatei('boese.html', 'text/html')).toBe(false);
    expect(istErlaubteFontDatei('keine-endung', '')).toBe(false);
    expect(istErlaubteFontDatei('schrift.ttf.exe', 'application/x-msdownload')).toBe(false);
  });

  it('lehnt erlaubte Endung mit unpassendem MIME ab', () => {
    expect(istErlaubteFontDatei('trojaner.ttf', 'text/html')).toBe(false);
  });
});
