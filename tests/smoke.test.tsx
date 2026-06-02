// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '@/App';
import { KnickblattDocument } from '@/components/print/KnickblattDocument';
import { WortkartenDocument } from '@/components/print/WortkartenDocument';
import { TextDocument } from '@/components/print/TextDocument';
import { createDefaultKnickblattConfig } from '@/core/knickblatt';
import { WortAnzeige } from '@/components/print/WortAnzeige';
import type { Lernwort } from '@/types';

const wort: Lernwort = {
  id: 'w1',
  kindId: 'k1',
  wort: 'Sommer',
  artikel: 'der',
  silben: ['Som', 'mer'],
  merkstellen: [2, 3],
  status: 'neu',
  erstelltAm: 0,
  geaendertAm: 0,
};

describe('Runtime-Smoke-Test', () => {
  it('mountet die App ohne Laufzeitfehler', () => {
    render(<App />);
    expect(screen.getByText('Willkommen bei Schreibzeit')).toBeDefined();
    cleanup();
  });

  it('rendert das Knickblatt-Dokument', () => {
    const { container } = render(
      <KnickblattDocument
        woerter={[wort]}
        config={createDefaultKnickblattConfig()}
        kopf={{ kindName: 'A.', datum: '01.01.2026' }}
      />,
    );
    expect(container.querySelector('.print-page')).not.toBeNull();
    expect(container.textContent).toContain('Lernwort');
    expect(container.textContent).toContain('hier knicken');
    cleanup();
  });

  it('rendert Wortkarten und Textdokument', () => {
    const { container: c1 } = render(<WortkartenDocument woerter={[wort]} />);
    expect(c1.querySelector('.print-page')).not.toBeNull();

    const { container: c2 } = render(
      <TextDocument
        titel="Geschichte"
        text="Der Sommer ist schön."
        loesungswoerter={['Sommer']}
        kopf={{ kindName: 'A.' }}
      />,
    );
    expect(c2.textContent).toContain('Lösungswörter');
    cleanup();
  });

  it('zeigt Silbenbögen und Merkstellen in der Wortanzeige', () => {
    const { container } = render(
      <WortAnzeige
        wort="Sommer"
        silben={['Som', 'mer']}
        merkstellen={[2, 3]}
        mitSilben
        mitMerkstellen
      />,
    );
    expect(container.textContent).toContain('Som');
    cleanup();
  });
});
