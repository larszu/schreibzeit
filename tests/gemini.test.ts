import { describe, expect, it } from 'vitest';
import { buildPrompt, makeLueckentext } from '@/services/gemini';

describe('buildPrompt', () => {
  it('enthält alle Lernwörter und die Lernstufe', () => {
    const p = buildPrompt({
      woerter: ['Hund', 'Katze'],
      textart: 'geschichte',
      lernstand: 'klasse2',
      laengeSaetze: 5,
    });
    expect(p).toContain('Hund');
    expect(p).toContain('Katze');
    expect(p).toContain('Klasse 2');
    expect(p).toContain('5 Sätze');
  });

  it('berücksichtigt das Thema, wenn angegeben', () => {
    const p = buildPrompt({
      woerter: ['Hund'],
      textart: 'geschichte',
      lernstand: 'klasse1',
      laengeSaetze: 3,
      thema: 'Bauernhof',
    });
    expect(p).toContain('Bauernhof');
  });
});

describe('makeLueckentext', () => {
  it('ersetzt ganze Lernwörter durch Lücken', () => {
    const { text, loesungswoerter } = makeLueckentext(
      'Der Hund läuft. Die Katze schläft.',
      ['Hund', 'Katze'],
    );
    expect(text).not.toContain('Hund');
    expect(text).not.toContain('Katze');
    expect(text).toContain('_____');
    expect(loesungswoerter).toContain('Hund');
    expect(loesungswoerter).toContain('Katze');
  });

  it('ist case-insensitiv und ersetzt nur ganze Wörter', () => {
    const { text } = makeLueckentext('hund Hundehütte', ['Hund']);
    // „hund" wird ersetzt, „Hundehütte" (Teilwort) bleibt erhalten.
    expect(text).toContain('Hundehütte');
    expect(text).toContain('_____');
  });

  it('zählt jede Lücke in die Lösungswörter', () => {
    const { loesungswoerter } = makeLueckentext('Hund Hund', ['Hund']);
    expect(loesungswoerter).toHaveLength(2);
  });
});
