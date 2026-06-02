// Druckdokument „Wortkarten" – Raster mehrerer Kärtchen pro A4-Seite zum
// Ausschneiden für einen physischen Karteikasten.
import { WortAnzeige } from './WortAnzeige';
import type { Lernwort } from '@/types';

export function WortkartenDocument({
  woerter,
  spalten = 3,
  mitMerkstellen = true,
  mitArtikel = true,
  mitSilben = false,
}: {
  woerter: Lernwort[];
  spalten?: number;
  mitMerkstellen?: boolean;
  mitArtikel?: boolean;
  mitSilben?: boolean;
}) {
  // Kärtchen pro Seite abhängig von der Spaltenzahl (feste 4 Reihen).
  const reihen = 4;
  const proSeite = spalten * reihen;
  const seiten: Lernwort[][] = [];
  for (let i = 0; i < woerter.length; i += proSeite) {
    seiten.push(woerter.slice(i, i + proSeite));
  }
  if (seiten.length === 0) seiten.push([]);

  return (
    <>
      {seiten.map((seite, si) => (
        <div key={si} className="print-page p-[2mm]">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${spalten}, 1fr)` }}
          >
            {seite.map((w) => (
              <div
                key={w.id}
                className="no-break m-[2mm] flex min-h-[38mm] flex-col items-center justify-center rounded-md p-2 text-center"
                style={{ border: '1.5px dashed #b7b1a1' }}
              >
                <WortAnzeige
                  wort={w.wort}
                  silben={w.silben}
                  merkstellen={w.merkstellen}
                  mitMerkstellen={mitMerkstellen}
                  mitSilben={mitSilben}
                  artikel={mitArtikel ? w.artikel || undefined : undefined}
                  groesse={30}
                />
              </div>
            ))}
            {seite.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-ink-faint">
                Keine Wörter ausgewählt.
              </p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
