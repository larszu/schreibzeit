// Lehrer-Dialog: erzeugt einen teilbaren Übungslink für ein einzelnes Kind.
// Der Link enthält die Lernwörter (im Anker codiert) und öffnet beim Kind den
// kindgerechten Schüler-Client – komplett offline, ohne Server/Konto.

import { useMemo, useState } from 'react';
import { Modal } from './ui';
import { IconCheck, IconCopy, IconLink } from './icons';
import { baueUebenLink, type UebenPaket } from '@/core/uebenLink';
import { displayName } from '@/state/store';
import type { Einstellungen, Kind, Lernwort } from '@/types';

export function UebungslinkModal({
  offen,
  kind,
  woerter,
  einstellungen,
  onClose,
}: {
  offen: boolean;
  kind: Kind;
  woerter: Lernwort[];
  einstellungen: Einstellungen;
  onClose: () => void;
}) {
  const [kopiert, setKopiert] = useState(false);

  const link = useMemo(() => {
    const paket: UebenPaket = {
      v: 1,
      n: displayName(kind.name, einstellungen.nurInitialen),
      woerter: woerter.map((w) => ({
        w: w.wort,
        s: w.silben,
        m: w.merkstellen,
        a: w.artikel || undefined,
      })),
    };
    return baueUebenLink(paket);
  }, [kind, woerter, einstellungen.nurInitialen]);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      // Clipboard-API nicht verfügbar – das Feld lässt sich manuell markieren.
    }
  }

  return (
    <Modal offen={offen} titel="Übungslink teilen" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Mit diesem Link kann{' '}
          <strong className="text-ink">{displayName(kind.name, einstellungen.nurInitialen)}</strong>{' '}
          die {woerter.length} Lernwörter selbst üben – auf jedem Gerät, offline. Die Wörter sind im
          Link enthalten; es wird nichts hochgeladen.
        </p>

        <div>
          <label className="label" htmlFor="ueben-link">
            Link
          </label>
          <div className="flex gap-2">
            <input
              id="ueben-link"
              className="input font-mono text-xs"
              value={link}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
            <button className="btn-secondary shrink-0" onClick={kopieren}>
              {kopiert ? (
                <>
                  <IconCheck width={16} height={16} /> Kopiert
                </>
              ) : (
                <>
                  <IconCopy width={16} height={16} /> Kopieren
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <a className="btn-secondary" href={link} target="_blank" rel="noopener noreferrer">
            <IconLink width={16} height={16} /> Vorschau öffnen
          </a>
          <button className="btn-primary" onClick={onClose}>
            Fertig
          </button>
        </div>

        <p className="rounded-lg bg-paper-50 px-3 py-2 text-xs leading-relaxed text-ink-faint">
          Tipp: Der Link enthält die Wortliste vom Zeitpunkt des Teilens. Wenn Sie später Wörter
          ändern, teilen Sie einfach einen neuen Link. Der Lernfortschritt des Kindes bleibt auf
          dessen Gerät und ist hier nicht sichtbar.
        </p>
      </div>
    </Modal>
  );
}
