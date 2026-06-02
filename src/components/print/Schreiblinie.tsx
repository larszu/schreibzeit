// Grundschul-Schreiblinien (Lineatur) – exakt in Millimetern für sauberen
// Druck. Eine „Schreiblinie" besteht aus Oberlinie, Mittellinie, Grundlinie
// und Unterlinie; das Mittelband kann (Haus-Lineatur) farbig hinterlegt sein.
import type { LineaturMasse } from '@/types';

const LINIE_FARBE = '#9aa0a6';
const GRUNDLINIE_FARBE = '#5b6066';
const MITTELBAND_FARBE = '#fbe6cf';

function Linie({ top, stark }: { top: number; stark?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${top}mm`,
        height: stark ? '0.35mm' : '0.2mm',
        backgroundColor: stark ? GRUNDLINIE_FARBE : LINIE_FARBE,
      }}
    />
  );
}

/** Eine einzelne Schreibzeile in der gewählten Lineatur. */
export function Schreiblinie({ masse }: { masse: LineaturMasse }) {
  const m = masse;
  const total = m.oberHoehe + m.bandHoehe + m.unterHoehe;
  return (
    <div style={{ position: 'relative', height: `${total}mm`, width: '100%' }}>
      {m.mittelbandFarbig && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${m.oberHoehe}mm`,
            height: `${m.bandHoehe}mm`,
            backgroundColor: MITTELBAND_FARBE,
          }}
        />
      )}
      <Linie top={0} />
      <Linie top={m.oberHoehe} />
      <Linie top={m.oberHoehe + m.bandHoehe} stark />
      <Linie top={total} />
    </div>
  );
}

/** Mehrere Schreibzeilen übereinander mit etwas Abstand. */
export function Schreiblinien({ masse, anzahl = 1 }: { masse: LineaturMasse; anzahl?: number }) {
  return (
    <div className="flex flex-col gap-[3mm] py-[1.5mm]">
      {Array.from({ length: anzahl }, (_, i) => (
        <Schreiblinie key={i} masse={masse} />
      ))}
    </div>
  );
}
