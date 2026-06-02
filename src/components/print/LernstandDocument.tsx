// Druckbare Lernstands-Übersicht eines Kindes (für Lernentwicklungsgespräche,
// Elterngespräche oder die eigene Dokumentation). A4 quer wie alle Druckansichten.
import type { Lernwort, WortStatus } from '@/types';

const STATUS_LABEL: Record<WortStatus, string> = {
  neu: 'neu',
  wird_geuebt: 'wird geübt',
  sitzt: 'sitzt',
};

export function LernstandDocument({
  kindName,
  lernstand,
  datum,
  woerter,
  lehrkraft,
  schule,
}: {
  kindName: string;
  lernstand: string;
  datum?: string;
  woerter: Lernwort[];
  lehrkraft?: string;
  schule?: string;
}) {
  const gruppen: WortStatus[] = ['sitzt', 'wird_geuebt', 'neu'];
  const zahl = (s: WortStatus) => woerter.filter((w) => w.status === s).length;

  return (
    <div className="print-page p-[4mm]">
      <div className="mb-3 flex items-end justify-between border-b-2 border-ink/70 pb-1.5">
        <div>
          <h2 className="font-serif text-xl font-semibold">Lernstands-Übersicht</h2>
          <p className="text-sm">
            <span className="text-ink-faint">Name: </span>
            <span className="font-semibold">{kindName}</span>
            <span className="text-ink-faint"> · Lernstand: </span>
            {lernstand}
          </p>
        </div>
        <div className="text-right text-sm">
          <span className="text-ink-faint">Datum: </span>
          {datum || '__________'}
        </div>
      </div>

      <div className="mb-4 flex gap-4 text-sm">
        <span>
          Gesamt: <b>{woerter.length}</b>
        </span>
        <span>
          sitzt: <b>{zahl('sitzt')}</b>
        </span>
        <span>
          wird geübt: <b>{zahl('wird_geuebt')}</b>
        </span>
        <span>
          neu: <b>{zahl('neu')}</b>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ columnGap: '12mm' }}>
        {gruppen.map((s) => (
          <div key={s}>
            <h3 className="mb-1 border-b border-paper-300 pb-0.5 text-sm font-semibold text-ink-soft">
              {STATUS_LABEL[s]} ({zahl(s)})
            </h3>
            <ul className="space-y-0.5 font-serif text-sm">
              {woerter
                .filter((w) => w.status === s)
                .map((w) => (
                  <li key={w.id}>
                    {w.artikel ? `${w.artikel} ` : ''}
                    {w.wort}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {(lehrkraft || schule) && (
        <p className="mt-6 text-[10px] text-ink-faint">
          {[lehrkraft, schule].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
