// Druckdokument für einen Übungstext / Lückentext (A4 quer, wie alle
// Druckansichten der App). Bei Lückentexten wird eine Lösungsliste ergänzt.
export function TextDocument({
  titel,
  text,
  loesungswoerter,
  kopf,
}: {
  titel: string;
  text: string;
  loesungswoerter?: string[];
  kopf: { kindName: string; datum?: string; lehrkraft?: string; schule?: string };
}) {
  return (
    <div className="print-page p-[4mm]">
      <div className="mb-4 flex items-end justify-between border-b-2 border-ink/70 pb-1.5">
        <div className="text-sm">
          <span className="text-ink-faint">Name: </span>
          <span className="font-semibold">{kopf.kindName || '________________'}</span>
        </div>
        <div className="text-sm">
          <span className="text-ink-faint">Datum: </span>
          <span className="font-medium">{kopf.datum || '__________'}</span>
        </div>
      </div>
      <h2 className="mb-3 font-serif text-xl font-semibold">{titel}</h2>
      <div
        className="whitespace-pre-wrap font-serif text-lg leading-relaxed"
        style={{ columnCount: 2, columnGap: '12mm' }}
      >
        {text}
      </div>
      {loesungswoerter && loesungswoerter.length > 0 && (
        <div className="mt-6 border-t border-paper-300 pt-2">
          <p className="text-sm font-semibold text-ink-soft">Lösungswörter:</p>
          <p className="font-serif text-base">{loesungswoerter.join(' · ')}</p>
        </div>
      )}
      {(kopf.lehrkraft || kopf.schule) && (
        <p className="mt-4 text-[10px] text-ink-faint">
          {[kopf.lehrkraft, kopf.schule].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
