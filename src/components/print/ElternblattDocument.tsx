// Druckbares Übungsblatt für zu Hause (Wochenblatt). Enthält eine kurze
// Eltern-Anleitung (FRESCH-Schritte) und je Lernwort eine Vorlage + leere
// Schreibzeilen zum Üben. A4 quer wie die übrigen Druckansichten.
import { Schreiblinie } from './Schreiblinie';
import { WortAnzeige } from './WortAnzeige';
import { LINEATUR_MASSE } from '@/core/knickblatt';
import type { Lernwort } from '@/types';

export function ElternblattDocument({
  woerter,
  kindName,
  klasse,
  datum,
  lehrkraft,
  schule,
  lineatur = 'klasse2',
  fontFamily,
}: {
  woerter: Lernwort[];
  kindName: string;
  klasse?: string;
  datum?: string;
  lehrkraft?: string;
  schule?: string;
  lineatur?: keyof typeof LINEATUR_MASSE;
  fontFamily?: string;
}) {
  const masse = LINEATUR_MASSE[lineatur];
  // Wörter auf zwei Spalten verteilen.
  const proSpalte = Math.ceil(woerter.length / 2) || 1;
  const spalten = [woerter.slice(0, proSpalte), woerter.slice(proSpalte)];

  return (
    <div className="print-page p-[5mm]" style={{ color: '#111' }}>
      <div className="mb-2 flex items-end justify-between border-b-2 border-ink/70 pb-1.5">
        <div className="text-sm">
          <h2 className="font-serif text-lg font-semibold">Übungswörter für zu Hause</h2>
          <span className="text-ink-faint">Name: </span>
          <span className="font-semibold">{kindName || '________________'}</span>
          {klasse && (
            <>
              <span className="text-ink-faint"> · Klasse: </span>
              {klasse}
            </>
          )}
        </div>
        <div className="text-right text-sm">
          <span className="text-ink-faint">Datum: </span>
          {datum || '__________'}
        </div>
      </div>

      <div className="mb-3 rounded-md border border-paper-300 bg-paper-50 px-3 py-1.5 text-[11px] leading-snug text-ink-soft">
        <b>So übt ihr zu Hause (je Wort):</b> 1. Wort lesen und in Silben <i>schwingen</i> · 2.
        schwierige Stellen <i>merken</i> · 3. Wort <i>abdecken</i> und aus dem Kopf schreiben · 4.
        mit der Vorlage <i>vergleichen</i> und verbessern.
      </div>

      <div className="grid grid-cols-2 gap-x-8">
        {spalten.map((sp, ci) => (
          <div key={ci}>
            {sp.map((w) => (
              <div key={w.id} className="no-break mb-2.5">
                <WortAnzeige
                  wort={w.wort}
                  silben={w.silben}
                  merkstellen={w.merkstellen}
                  artikel={w.artikel || undefined}
                  groesse={18}
                  fontFamily={fontFamily}
                />
                <div className="mt-1 flex flex-col gap-[2.5mm]">
                  <Schreiblinie render={{ typ: 'parametrisch', masse }} />
                  <Schreiblinie render={{ typ: 'parametrisch', masse }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-paper-300 pt-2 text-[11px] text-ink-faint">
        <span>Geübt am: __________ Unterschrift: ____________________</span>
        <span>{[lehrkraft, schule].filter(Boolean).join(' · ')}</span>
      </div>
    </div>
  );
}
