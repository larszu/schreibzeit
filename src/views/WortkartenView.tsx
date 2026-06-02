import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui';
import { IconPrint } from '@/components/icons';
import { PrintPortal } from '@/components/print/PrintPortal';
import { useFitScale } from '@/components/print/useFitScale';
import { WortkartenDocument } from '@/components/print/WortkartenDocument';
import { useLernwoerter } from '@/state/hooks';
import { t } from '@/i18n/de';
import { drucke } from '@/services/print';
import type { Einstellungen, Kind, Klasse } from '@/types';

const PAGE_WIDTH_PX = 281 * 3.7795;

export function WortkartenView({
  kind,
}: {
  kind: Kind;
  einstellungen: Einstellungen;
  klassen: Klasse[];
}) {
  const woerter = useLernwoerter(kind.id);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [spalten, setSpalten] = useState(3);
  const [mitMerkstellen, setMitMerkstellen] = useState(true);
  const [mitArtikel, setMitArtikel] = useState(true);
  const [previewRef, scale] = useFitScale(PAGE_WIDTH_PX);

  const initialisiertFuer = useRef<string | null>(null);
  useEffect(() => {
    if (initialisiertFuer.current !== kind.id && woerter.length > 0) {
      setAuswahl(new Set(woerter.map((w) => w.id)));
      initialisiertFuer.current = kind.id;
    }
  }, [kind.id, woerter]);

  const gewaehlt = useMemo(() => woerter.filter((w) => auswahl.has(w.id)), [woerter, auswahl]);

  if (woerter.length === 0) {
    return (
      <EmptyState
        titel="Noch keine Lernwörter"
        text="Legen Sie zuerst Lernwörter an, um Wortkarten zu drucken."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-3 font-serif font-semibold text-ink">Karten-Einstellungen</h3>
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="wk-spalten">
                Karten pro Reihe: {spalten}
              </label>
              <input
                id="wk-spalten"
                type="range"
                min={2}
                max={5}
                value={spalten}
                className="w-full accent-brand-500"
                onChange={(e) => setSpalten(Number(e.target.value))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-500"
                checked={mitArtikel}
                onChange={(e) => setMitArtikel(e.target.checked)}
              />
              Artikel anzeigen
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-500"
                checked={mitMerkstellen}
                onChange={(e) => setMitMerkstellen(e.target.checked)}
              />
              Merkstellen markieren
            </label>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-serif font-semibold text-ink">Wörter ({auswahl.size})</h3>
            <div className="flex gap-1">
              <button
                className="btn-ghost py-1 text-xs"
                onClick={() => setAuswahl(new Set(woerter.map((w) => w.id)))}
              >
                Alle
              </button>
              <button className="btn-ghost py-1 text-xs" onClick={() => setAuswahl(new Set())}>
                Keine
              </button>
            </div>
          </div>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {woerter.map((w) => (
              <li key={w.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-paper-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={auswahl.has(w.id)}
                    onChange={() =>
                      setAuswahl((alt) => {
                        const neu = new Set(alt);
                        if (neu.has(w.id)) neu.delete(w.id);
                        else neu.add(w.id);
                        return neu;
                      })
                    }
                  />
                  <span className="font-serif">{w.wort}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-soft">Vorschau · A4 quer · zum Ausschneiden</p>
          <button
            className="btn-primary"
            onClick={() => drucke()}
            disabled={gewaehlt.length === 0}
          >
            <IconPrint width={18} height={18} /> {t.common.drucken}
          </button>
        </div>
        <div ref={previewRef} className="overflow-hidden rounded-xl2 bg-paper-200 p-4">
          <div className="print-preview" style={{ zoom: scale } as React.CSSProperties}>
            <WortkartenDocument
              woerter={gewaehlt}
              spalten={spalten}
              mitMerkstellen={mitMerkstellen}
              mitArtikel={mitArtikel}
            />
          </div>
        </div>
      </div>

      <PrintPortal>
        <WortkartenDocument
          woerter={gewaehlt}
          spalten={spalten}
          mitMerkstellen={mitMerkstellen}
          mitArtikel={mitArtikel}
        />
      </PrintPortal>
    </div>
  );
}
