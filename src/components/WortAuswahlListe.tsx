// Wiederverwendbare, scrollbare Auswahlliste von Lernwörtern mit Checkboxen.
// Genutzt von Knickblatt, Wortkarten und Übungstext (vermeidet 3× fast
// identischen Code).
import type { Lernwort } from '@/types';

export function WortAuswahlListe({
  woerter,
  istGewaehlt,
  onToggle,
  maxHeight = 'max-h-56',
}: {
  woerter: Lernwort[];
  istGewaehlt: (id: string) => boolean;
  onToggle: (id: string) => void;
  maxHeight?: string;
}) {
  return (
    <ul className={`${maxHeight} space-y-0.5 overflow-y-auto`}>
      {woerter.map((w) => (
        <li key={w.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-paper-100">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={istGewaehlt(w.id)}
              onChange={() => onToggle(w.id)}
            />
            <span className="font-serif">{w.wort}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
