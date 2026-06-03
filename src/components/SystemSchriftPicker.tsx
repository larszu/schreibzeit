// Word-ähnlicher Auswahldialog für bereits auf dem System installierte
// Schriften: aufklappbar, mit Suchfeld und Live-Vorschau jeder Schrift.
// Über die Local-Font-Access-API (Chromium/Desktop). Fällt auf manuelle
// Namenseingabe zurück, wenn die API nicht verfügbar ist.
import { useMemo, useState } from 'react';
import { IconCheck, IconSearch } from '@/components/icons';
import {
  ladeSystemSchriften,
  systemSchriftenVerfuegbar,
  systemSchriftHinzufuegen,
} from '@/services/fonts';

const PROBE = 'Am Montag · Som-mer';

export function SystemSchriftPicker({ onAdded }: { onAdded: (name: string) => void }) {
  const verfuegbar = systemSchriftenVerfuegbar();
  const [offen, setOffen] = useState(false);
  const [fonts, setFonts] = useState<string[]>([]);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
  const [manuell, setManuell] = useState('');

  async function laden() {
    setLadend(true);
    setFehler(null);
    try {
      const liste = await ladeSystemSchriften();
      setFonts(liste);
      if (liste.length === 0) setFehler('Keine Schriften gefunden oder Zugriff abgelehnt.');
    } catch {
      setFehler('Zugriff auf installierte Schriften wurde nicht erlaubt.');
    } finally {
      setLadend(false);
    }
  }

  function toggle() {
    const next = !offen;
    setOffen(next);
    if (next && verfuegbar && fonts.length === 0 && !ladend) void laden();
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const basis = q ? fonts.filter((f) => f.toLowerCase().includes(q)) : fonts;
    return basis.slice(0, 400);
  }, [fonts, suche]);

  async function uebernehmen(name: string) {
    if (!name.trim()) return;
    try {
      const e = await systemSchriftHinzufuegen(name);
      onAdded(e.name);
    } catch {
      /* ignorieren – Liste bleibt offen */
    }
  }

  return (
    <div className="rounded-lg border border-paper-200">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={offen}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-paper-50"
      >
        <span className="text-sm font-medium text-ink">Installierte Schriften durchsuchen</span>
        <span
          className={`text-ink-faint transition-transform ${offen ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ›
        </span>
      </button>

      {offen && (
        <div className="space-y-2 border-t border-paper-200 p-3">
          {verfuegbar ? (
            <>
              <div className="relative">
                <IconSearch
                  width={16}
                  height={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  className="input pl-9"
                  placeholder="Schrift suchen (z. B. Comic, Arial)…"
                  value={suche}
                  onChange={(e) => setSuche(e.target.value)}
                  autoFocus
                />
              </div>

              {ladend && <p className="py-2 text-sm text-ink-faint">Lade installierte Schriften…</p>}

              {fehler && !ladend && (
                <p className="py-1 text-sm text-ink-soft">
                  {fehler}{' '}
                  <button className="text-brand-600 underline" onClick={() => void laden()}>
                    Erneut versuchen
                  </button>
                </p>
              )}

              {!ladend && fonts.length > 0 && (
                <>
                  <ul className="max-h-64 divide-y divide-paper-100 overflow-y-auto rounded-md border border-paper-200">
                    {gefiltert.map((f) => (
                      <li key={f}>
                        <button
                          type="button"
                          onClick={() => void uebernehmen(f)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-paper-50"
                          title={`„${f}" als Vorlage-Schrift übernehmen`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs text-ink-faint">{f}</span>
                            <span
                              className="block truncate text-lg leading-tight text-ink"
                              style={{ fontFamily: `"${f}"` }}
                            >
                              {PROBE}
                            </span>
                          </span>
                          <span className="shrink-0 text-brand-600" aria-hidden>
                            <IconCheck width={16} height={16} />
                          </span>
                        </button>
                      </li>
                    ))}
                    {gefiltert.length === 0 && (
                      <li className="px-3 py-3 text-sm text-ink-faint">Keine passende Schrift.</li>
                    )}
                  </ul>
                  <p className="text-xs text-ink-faint">
                    {fonts.length} Schriften installiert · zum Übernehmen anklicken.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">
                Das automatische Auflisten installierter Schriften ist nur in der Desktop-App bzw.
                in Chrome möglich. Gib hier den exakten Schriftnamen ein:
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input"
                  placeholder="Schriftname (z. B. Arial)"
                  value={manuell}
                  onChange={(e) => setManuell(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manuell.trim()) {
                      void uebernehmen(manuell);
                      setManuell('');
                    }
                  }}
                />
                <button
                  className="btn-secondary shrink-0"
                  disabled={!manuell.trim()}
                  onClick={() => {
                    void uebernehmen(manuell);
                    setManuell('');
                  }}
                >
                  <IconCheck width={18} height={18} /> Hinzufügen
                </button>
              </div>
              {manuell.trim() && (
                <p className="text-lg text-ink" style={{ fontFamily: `"${manuell}"` }}>
                  Vorschau: {PROBE}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
