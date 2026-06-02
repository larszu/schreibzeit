// Wiederverwendbares Raster anklickbarer Wort-Chips. Bereits vorhandene Wörter
// werden markiert und sind nicht erneut anklickbar. Genutzt von der
// Text-Extraktion und der Grundwortschatz-Auswahl.
import { IconCheck } from './icons';

export interface WortChipItem {
  wort: string;
  key: string;
}

export function WortChips({
  items,
  istVorhanden,
  onAdd,
}: {
  items: WortChipItem[];
  istVorhanden: (wort: string) => boolean;
  onAdd: (wort: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const schonDa = istVorhanden(it.wort);
        return (
          <button
            key={it.key}
            onClick={() => onAdd(it.wort)}
            disabled={schonDa}
            className={`rounded-md px-2 py-1 font-serif text-sm transition-colors ${
              schonDa
                ? 'cursor-default bg-brand-100 text-brand-700'
                : 'bg-white text-ink shadow-sm hover:bg-brand-500 hover:text-white'
            }`}
            title={schonDa ? 'Bereits in der Kartei' : 'Als Lernwort übernehmen'}
          >
            {schonDa && <IconCheck width={12} height={12} className="mr-1 inline" />}
            {it.wort}
          </button>
        );
      })}
    </div>
  );
}
