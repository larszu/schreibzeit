// Darstellung eines Lernworts als Vorlage – optional mit Silbenbögen und/oder
// markierten Merkstellen. Wird im Knickblatt (Vorlage-Spalte) und auf
// Wortkarten verwendet.
import type { CSSProperties } from 'react';
import { breakpointsFromSyllables } from '@/core/syllables';

const MERK_FARBE = '#c0492f';
const BOGEN_FARBE = '#2f6f5e';

export function WortAnzeige({
  wort,
  silben,
  merkstellen,
  mitSilben = false,
  mitMerkstellen = false,
  umriss = false,
  artikel,
  groesse = 28,
  fontFamily,
}: {
  wort: string;
  silben: string[];
  merkstellen: number[];
  mitSilben?: boolean;
  mitMerkstellen?: boolean;
  /** Hohlschrift (Umriss) zum Nachspuren. */
  umriss?: boolean;
  artikel?: string;
  /** Schriftgröße in px. */
  groesse?: number;
  /** Schriftfamilie (eigener Font-Name oder CSS-Familie); Standard: Serif. */
  fontFamily?: string;
}) {
  const merkSet = new Set(merkstellen);
  // Trennstellen aus den Silben ableiten, um die Bögen zu positionieren.
  const breaks = mitSilben ? breakpointsFromSyllables(silben) : [];

  // Wort in Silbensegmente zerlegen (für Bögen), Buchstaben einzeln rendern
  // (für Merkstellen-Markierung).
  const segmente: { text: string; start: number }[] = [];
  let prev = 0;
  for (const b of breaks) {
    segmente.push({ text: wort.slice(prev, b), start: prev });
    prev = b;
  }
  segmente.push({ text: wort.slice(prev), start: prev });

  return (
    <div
      style={{
        fontFamily: fontFamily?.trim() || '"Andika", "Source Serif 4", Georgia, serif',
        color: '#111',
      }}
      className="leading-none"
    >
      {artikel && (
        <span style={{ fontSize: groesse * 0.6, color: '#666', marginRight: 6 }}>{artikel}</span>
      )}
      <span style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
        {segmente.map((seg, si) => (
          <span
            key={si}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: groesse, letterSpacing: '0.5px', whiteSpace: 'pre' }}>
              {seg.text.split('').map((ch, ci) => {
                const idx = seg.start + ci;
                const markiert = mitMerkstellen && merkSet.has(idx);
                const strichFarbe = markiert ? MERK_FARBE : '#555';
                const style: CSSProperties = {};
                if (umriss) {
                  // Hohlschrift zum Nachspuren.
                  style.color = 'transparent';
                  (style as Record<string, string>).WebkitTextStrokeWidth = '0.7px';
                  (style as Record<string, string>).WebkitTextStrokeColor = strichFarbe;
                } else if (markiert) {
                  style.color = MERK_FARBE;
                }
                if (markiert) style.borderBottom = `2px solid ${MERK_FARBE}`;
                return (
                  <span key={ci} style={Object.keys(style).length ? style : undefined}>
                    {ch}
                  </span>
                );
              })}
            </span>
            {mitSilben && segmente.length > 1 && (
              // Silbenbogen: nach unten geöffneter Bogen unter der Silbe.
              <span
                style={{
                  display: 'block',
                  width: '90%',
                  height: groesse * 0.28,
                  borderBottom: `2px solid ${BOGEN_FARBE}`,
                  borderLeft: `2px solid ${BOGEN_FARBE}`,
                  borderRight: `2px solid ${BOGEN_FARBE}`,
                  borderBottomLeftRadius: '60%',
                  borderBottomRightRadius: '60%',
                  marginTop: 2,
                }}
              />
            )}
          </span>
        ))}
      </span>
    </div>
  );
}
