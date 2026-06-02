// Druckdokument „Knickblatt" – DIN A4 quer. Zeilen = Lernwörter,
// Spalten = Übungsstrategien. Datengetrieben aus KnickblattConfig.
import { activeSpalten, paginate, resolveLineatur } from '@/core/knickblatt';
import { Schreiblinie } from './Schreiblinie';
import { WortAnzeige } from './WortAnzeige';
import type { KnickblattConfig, Lernwort, LineaturMasse } from '@/types';

export interface KnickblattKopf {
  kindName: string;
  klasse?: string;
  datum?: string;
  thema?: string;
  lehrkraft?: string;
  schule?: string;
}

export function KnickblattDocument({
  woerter,
  config,
  kopf,
  lineaturMasse,
}: {
  woerter: Lernwort[];
  config: KnickblattConfig;
  kopf: KnickblattKopf;
  lineaturMasse?: LineaturMasse;
}) {
  const spalten = activeSpalten(config);
  const seiten = paginate(woerter, config.woerterProBlatt);
  const masse = lineaturMasse ?? resolveLineatur(config.lineatur);

  return (
    <>
      {seiten.map((seite) => (
        <div key={seite.seitenNr} className="print-page p-[2mm]">
          <Kopfzeile kopf={kopf} seite={seite.seitenNr} gesamt={seiten.length} />
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {spalten.map((s) => (
                <col key={s.id} style={{ width: s.istVorlage ? '18%' : 'auto' }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {spalten.map((s) => (
                  <th
                    key={s.id}
                    style={{
                      borderLeft: s.falzDavor ? '1.5px dashed #b3712a' : '1px solid #d8d4c8',
                    }}
                    className="border-b border-paper-300 px-1 py-1 text-center align-bottom"
                  >
                    {s.falzDavor && (
                      <div className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-accent-600">
                        ✂ hier knicken
                      </div>
                    )}
                    <div className="text-base leading-none">{s.symbol}</div>
                    <div className="text-[10px] font-semibold leading-tight text-ink-soft">
                      {s.titel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seite.woerter.map((w) => (
                <tr key={w.id} className="no-break">
                  {spalten.map((s) => (
                    <td
                      key={s.id}
                      style={{
                        borderLeft: s.falzDavor ? '1.5px dashed #b3712a' : '1px solid #e6e2d6',
                      }}
                      className="border-b border-paper-200 px-1.5 py-1 align-middle"
                    >
                      {s.istVorlage ? (
                        <WortAnzeige
                          wort={w.wort}
                          silben={w.silben}
                          merkstellen={w.merkstellen}
                          mitSilben={config.vorlageMitSilben}
                          mitMerkstellen={config.vorlageMitMerkstellen}
                          artikel={w.artikel || undefined}
                          groesse={22}
                          fontFamily={config.vorlageFont}
                        />
                      ) : (
                        <Schreiblinie masse={masse} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {seite.woerter.length === 0 && (
                <tr>
                  <td colSpan={spalten.length} className="py-8 text-center text-sm text-ink-faint">
                    Keine Wörter ausgewählt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

function Kopfzeile({
  kopf,
  seite,
  gesamt,
}: {
  kopf: KnickblattKopf;
  seite: number;
  gesamt: number;
}) {
  return (
    <div className="mb-2 border-b-2 border-ink/70 pb-1.5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-1 items-baseline gap-4 text-sm">
          <span>
            <span className="text-ink-faint">Name: </span>
            <span className="font-semibold">{kopf.kindName || '________________'}</span>
          </span>
          {kopf.klasse && (
            <span>
              <span className="text-ink-faint">Klasse: </span>
              <span className="font-semibold">{kopf.klasse}</span>
            </span>
          )}
        </div>
        <div className="text-right text-sm">
          <span className="text-ink-faint">Datum: </span>
          <span className="font-medium">{kopf.datum || '__________'}</span>
        </div>
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-4">
        <div className="font-serif text-base font-semibold text-ink">
          Lernwörter üben{kopf.thema ? `: ${kopf.thema}` : ''}
        </div>
        <div className="text-[10px] text-ink-faint">
          {[kopf.lehrkraft, kopf.schule].filter(Boolean).join(' · ')}
          {gesamt > 1 ? `  ·  Blatt ${seite}/${gesamt}` : ''}
        </div>
      </div>
    </div>
  );
}
