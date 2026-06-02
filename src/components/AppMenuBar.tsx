// App-eigene, gestaltete Menüleiste (Datei / Hilfe) – konsistent im UI-Design,
// in Web und Desktop. In der Desktop-App ist das native Menü ausgeblendet, diese
// Leiste übernimmt die Funktionen.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from './ui';
import { IconBook } from './icons';
import { oeffnen, speichern, speichernUnter } from '@/services/fileSystem';

const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

function Dropdown({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [offen]);
  return (
    <div ref={ref} className="relative">
      <button
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
          offen ? 'bg-paper-200 text-ink' : 'text-ink-soft hover:bg-paper-200 hover:text-ink'
        }`}
        onClick={() => setOffen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={offen}
      >
        {label}
      </button>
      {offen && (
        <div
          className="absolute left-0 z-50 mt-1 min-w-52 rounded-lg border border-paper-200 bg-white py-1 shadow-card"
          role="menu"
        >
          {children(() => setOffen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  children,
  kbd,
}: {
  onClick: () => void;
  children: ReactNode;
  kbd?: string;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm text-ink hover:bg-brand-50"
    >
      <span>{children}</span>
      {kbd && <span className="text-xs text-ink-faint">{kbd}</span>}
    </button>
  );
}

export function AppMenuBar() {
  const [aboutOffen, setAboutOffen] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const istMac = typeof window !== 'undefined' && window.schreibzeit?.plattform === 'darwin';
  const mod = istMac ? '⌘' : 'Strg';

  function zeige(text: string) {
    setMeldung(text);
    window.setTimeout(() => setMeldung(null), 3500);
  }

  async function tueSpeichern() {
    try {
      const name = await speichern();
      if (name) zeige(`Gespeichert: ${name}`);
    } catch (e) {
      zeige(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    }
  }
  async function tueSpeichernUnter() {
    try {
      const name = await speichernUnter();
      if (name) zeige(`Gespeichert: ${name}`);
    } catch (e) {
      zeige(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    }
  }
  async function tueOeffnen() {
    const ersetzen = window.confirm(
      'Backup öffnen.\n\nOK = vorhandene Daten ERSETZEN\nAbbrechen = Daten ZUSAMMENFÜHREN',
    );
    try {
      const res = await oeffnen(ersetzen ? 'ersetzen' : 'zusammenfuehren');
      if (res) zeige(`Geöffnet: ${res.name} (${res.kinder} Kinder, ${res.woerter} Wörter)`);
    } catch (e) {
      zeige(e instanceof Error ? e.message : 'Öffnen fehlgeschlagen.');
    }
  }

  // Tastenkürzel: Strg/⌘+S speichern, Strg/⌘+O öffnen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) void tueSpeichernUnter();
        else void tueSpeichern();
      } else if (e.key === 'o') {
        e.preventDefault();
        void tueOeffnen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-9 items-center gap-1 border-b border-paper-200 bg-paper-50 px-2">
      <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        className="ml-1 mr-1 h-5 w-5 rounded"
      />
      <span className="mr-2 hidden font-serif text-sm font-semibold text-ink sm:inline">
        Schreibzeit
      </span>
      <Dropdown label="Datei">
        {(close) => (
          <>
            <MenuItem onClick={() => { close(); void tueOeffnen(); }} kbd={`${mod}+O`}>
              Öffnen …
            </MenuItem>
            <MenuItem onClick={() => { close(); void tueSpeichern(); }} kbd={`${mod}+S`}>
              Speichern
            </MenuItem>
            <MenuItem onClick={() => { close(); void tueSpeichernUnter(); }} kbd={`${mod}+⇧+S`}>
              Speichern unter …
            </MenuItem>
          </>
        )}
      </Dropdown>
      <Dropdown label="Hilfe">
        {(close) => (
          <>
            <MenuItem onClick={() => { close(); setAboutOffen(true); }}>Über Schreibzeit</MenuItem>
            <MenuItem
              onClick={() => {
                close();
                window.open('https://github.com/larszu/schreibzeit', '_blank', 'noreferrer');
              }}
            >
              Projektseite (GitHub)
            </MenuItem>
          </>
        )}
      </Dropdown>

      {meldung && (
        <span className="ml-3 truncate text-xs text-brand-700" role="status">
          {meldung}
        </span>
      )}

      <Modal offen={aboutOffen} titel="Über Schreibzeit" onClose={() => setAboutOffen(false)}>
        <div className="flex flex-col items-center text-center">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="Schreibzeit-Logo"
            className="h-20 w-20 rounded-2xl shadow-soft"
          />
          <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">Schreibzeit</h3>
          <p className="text-sm text-ink-soft">Version {VERSION}</p>
          <p className="mt-3 max-w-prose text-sm text-ink-soft">
            Lernwörter-Kartei, Knickblätter und KI-Übungstexte für Grundschullehrkräfte. Alle Daten
            bleiben lokal auf diesem Gerät – ohne Telemetrie, ohne Tracking.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <IconBook width={16} height={16} className="text-brand-500" />
            <a
              className="text-brand-600 underline"
              href="https://github.com/larszu/schreibzeit"
              target="_blank"
              rel="noreferrer"
            >
              github.com/larszu/schreibzeit
            </a>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            MIT-Lizenz · Wörterbuchdaten aus dem deutschen Wiktionary (CC BY-SA)
          </p>
        </div>
      </Modal>
    </div>
  );
}
