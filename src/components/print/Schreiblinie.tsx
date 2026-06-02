// Grundschul-Schreiblinien (Lineatur) – exakt in Millimetern für sauberen
// Druck. Eingebaute Lineaturen werden als Linien gezeichnet; eigene Lineaturen
// sind ein zugeschnittener Bildstreifen.
import type { LineaturMasse } from '@/types';
import type { LineaturRender } from '@/core/knickblatt';

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

function ParametrischeLinie({ masse }: { masse: LineaturMasse }) {
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

/** Eine einzelne Schreibzeile (gezeichnet oder als Bildstreifen). */
export function Schreiblinie({ render }: { render: LineaturRender }) {
  if (render.typ === 'bild') {
    return (
      <div
        style={{
          width: '100%',
          height: `${render.hoeheMm}mm`,
          backgroundImage: `url(${render.url})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }
  return <ParametrischeLinie masse={render.masse} />;
}

/** Mehrere Schreibzeilen übereinander mit etwas Abstand. */
export function Schreiblinien({ render, anzahl = 1 }: { render: LineaturRender; anzahl?: number }) {
  return (
    <div className="flex flex-col gap-[3mm] py-[1.5mm]">
      {Array.from({ length: anzahl }, (_, i) => (
        <Schreiblinie key={i} render={render} />
      ))}
    </div>
  );
}
