import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui';
import { IconPrint, IconCheck, IconPlus, IconTrash } from '@/components/icons';
import { PrintPortal } from '@/components/print/PrintPortal';
import { useFitScale } from '@/components/print/useFitScale';
import { newId } from '@/core/id';
import {
  KnickblattDocument,
  type KnickblattKopf,
} from '@/components/print/KnickblattDocument';
import {
  SPALTEN_DEFS,
  createDefaultKnickblattConfig,
  defaultKnickspalten,
} from '@/core/knickblatt';
import { useLernwoerter } from '@/state/hooks';
import { displayName } from '@/state/store';
import { t } from '@/i18n/de';
import type {
  Einstellungen,
  Kind,
  Klasse,
  Knickspalte,
  KnickblattConfig,
  Lineatur,
  SpaltenTyp,
} from '@/types';

const ALLE_SPALTEN: SpaltenTyp[] = [
  'vorlage',
  'schwingen',
  'merkstellen',
  'auswendig',
  'partner',
  'verlaengern',
  'ableiten',
  'merkwort',
];
const LINEATUREN: Lineatur[] = ['klasse1', 'klasse2', 'klasse3', 'klasse4', 'haus'];
const PAGE_WIDTH_PX = 281 * 3.7795; // 281mm in px (96dpi)

/** Vollständige Spaltenliste: Standardspalten zuerst aktiv, Rest inaktiv. */
function vollstaendigeSpalten(standard: SpaltenTyp[]): Knickspalte[] {
  const aktiveSet = defaultKnickspalten(standard);
  const result: Knickspalte[] = [...aktiveSet];
  for (const typ of ALLE_SPALTEN) {
    if (!result.some((s) => s.typ === typ)) {
      result.push({ id: typ, typ, aktiv: false, falzDavor: typ === 'auswendig' });
    }
  }
  return result;
}

export function KnickblattView({
  kind,
  einstellungen,
  klassen,
}: {
  kind: Kind;
  einstellungen: Einstellungen;
  klassen: Klasse[];
}) {
  const woerter = useLernwoerter(kind.id);
  const [config, setConfig] = useState<KnickblattConfig>(() =>
    createDefaultKnickblattConfig({
      spalten: vollstaendigeSpalten(einstellungen.standardSpalten),
      lineatur: einstellungen.standardLineatur,
      woerterProBlatt: einstellungen.standardWoerterProBlatt,
    }),
  );
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [thema, setThema] = useState('');
  const [previewRef, scale] = useFitScale(PAGE_WIDTH_PX);

  // Vorauswahl: alle Wörter aufnehmen, sobald sie geladen sind (pro Kind einmal).
  const initialisiertFuer = useRef<string | null>(null);
  useEffect(() => {
    if (initialisiertFuer.current !== kind.id && woerter.length > 0) {
      setAuswahl(new Set(woerter.map((w) => w.id)));
      initialisiertFuer.current = kind.id;
    }
  }, [kind.id, woerter]);

  const ausgewaehlteWoerter = useMemo(
    () => woerter.filter((w) => auswahl.has(w.id)),
    [woerter, auswahl],
  );

  const kopf: KnickblattKopf = {
    kindName: displayName(kind.name, einstellungen.nurInitialen),
    klasse: klassen.find((c) => c.id === kind.klasseId)?.name,
    datum: new Date().toLocaleDateString('de-DE'),
    thema: thema.trim() || undefined,
    lehrkraft: einstellungen.lehrkraftName || undefined,
    schule: einstellungen.schulName || undefined,
  };

  function setSpalten(spalten: Knickspalte[]) {
    setConfig((c) => ({ ...c, spalten }));
  }
  function toggleSpalte(id: string) {
    setSpalten(config.spalten.map((s) => (s.id === id ? { ...s, aktiv: !s.aktiv } : s)));
  }
  function renameSpalte(id: string, titel: string) {
    setSpalten(config.spalten.map((s) => (s.id === id ? { ...s, titel } : s)));
  }
  function deleteSpalte(id: string) {
    setSpalten(config.spalten.filter((s) => s.id !== id));
  }
  function addSpalte() {
    setSpalten([
      ...config.spalten,
      { id: newId(), typ: 'benutzerdefiniert', titel: 'Neue Spalte', aktiv: true },
    ]);
  }
  function verschiebe(id: string, richtung: -1 | 1) {
    const idx = config.spalten.findIndex((s) => s.id === id);
    const ziel = idx + richtung;
    if (idx < 0 || ziel < 0 || ziel >= config.spalten.length) return;
    const neu = [...config.spalten];
    [neu[idx], neu[ziel]] = [neu[ziel], neu[idx]];
    setSpalten(neu);
  }

  // Wortauswahl-Presets
  function setPreset(preset: 'alle' | 'keine' | 'neu' | 'geuebt' | 'neueste' | 'zufall') {
    if (preset === 'alle') return setAuswahl(new Set(woerter.map((w) => w.id)));
    if (preset === 'keine') return setAuswahl(new Set());
    if (preset === 'neu')
      return setAuswahl(new Set(woerter.filter((w) => w.status === 'neu').map((w) => w.id)));
    if (preset === 'geuebt')
      return setAuswahl(
        new Set(woerter.filter((w) => w.status === 'wird_geuebt').map((w) => w.id)),
      );
    if (preset === 'neueste')
      return setAuswahl(new Set(woerter.slice(0, config.woerterProBlatt).map((w) => w.id)));
    if (preset === 'zufall') {
      const gemischt = [...woerter].sort(() => Math.random() - 0.5);
      return setAuswahl(new Set(gemischt.slice(0, config.woerterProBlatt).map((w) => w.id)));
    }
  }

  if (woerter.length === 0) {
    return (
      <EmptyState
        titel="Noch keine Lernwörter"
        text="Legen Sie zuerst Lernwörter in der Kartei an, um ein Knickblatt zu erzeugen."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Konfigurationsspalte */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-3 font-serif font-semibold text-ink">Blatt-Einstellungen</h3>
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="kb-thema">
                Thema (optional)
              </label>
              <input
                id="kb-thema"
                className="input"
                value={thema}
                placeholder="z. B. Wörter mit ck"
                onChange={(e) => setThema(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="kb-anzahl">
                  Wörter / Blatt
                </label>
                <input
                  id="kb-anzahl"
                  type="number"
                  min={1}
                  max={20}
                  className="input"
                  value={config.woerterProBlatt}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      woerterProBlatt: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                    }))
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="kb-lineatur">
                  Lineatur
                </label>
                <select
                  id="kb-lineatur"
                  className="input"
                  value={config.lineatur}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, lineatur: e.target.value as Lineatur }))
                  }
                >
                  {LINEATUREN.map((l) => (
                    <option key={l} value={l}>
                      {t.lineatur[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="rounded-lg border border-paper-200 p-3">
              <legend className="px-1 text-xs font-medium text-ink-soft">
                Differenzierung (Vorlage)
              </legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={config.vorlageMitSilben}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, vorlageMitSilben: e.target.checked }))
                  }
                />
                Silbenbögen vordrucken
              </label>
              <label className="mt-1.5 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={config.vorlageMitMerkstellen}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, vorlageMitMerkstellen: e.target.checked }))
                  }
                />
                Merkstellen markieren
              </label>
            </fieldset>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 font-serif font-semibold text-ink">Spalten</h3>
          <ul className="space-y-1">
            {config.spalten.map((s, i) => {
              const def = SPALTEN_DEFS[s.typ];
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-paper-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-brand-500"
                    checked={s.aktiv}
                    disabled={s.typ === 'vorlage'}
                    onChange={() => toggleSpalte(s.id)}
                    aria-label="Spalte anzeigen"
                  />
                  <span className="shrink-0 text-base">{def.symbol}</span>
                  <input
                    className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-paper-300 focus:border-brand-400 focus:bg-white focus:outline-none"
                    value={s.titel ?? def.titel}
                    onChange={(e) => renameSpalte(s.id, e.target.value)}
                    aria-label="Spaltentitel"
                    title="Titel bearbeiten"
                  />
                  <button
                    className="btn-ghost p-1 disabled:opacity-30"
                    onClick={() => verschiebe(s.id, -1)}
                    disabled={i === 0}
                    aria-label="nach oben"
                  >
                    ↑
                  </button>
                  <button
                    className="btn-ghost p-1 disabled:opacity-30"
                    onClick={() => verschiebe(s.id, 1)}
                    disabled={i === config.spalten.length - 1}
                    aria-label="nach unten"
                  >
                    ↓
                  </button>
                  <button
                    className="btn-ghost p-1 text-danger-500 disabled:opacity-20"
                    onClick={() => deleteSpalte(s.id)}
                    disabled={s.typ === 'vorlage'}
                    aria-label="Spalte löschen"
                    title="Spalte löschen"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn-ghost mt-2 w-full justify-start text-sm" onClick={addSpalte}>
            <IconPlus width={16} height={16} /> Eigene Spalte hinzufügen
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            Titel anklicken zum Umbenennen. Vor „Auswendig schreiben" wird automatisch eine Falzlinie
            gedruckt.
          </p>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 font-serif font-semibold text-ink">
            Wörter ({auswahl.size}/{woerter.length})
          </h3>
          <div className="mb-2 flex flex-wrap gap-1">
            {(
              [
                ['alle', 'Alle'],
                ['keine', 'Keine'],
                ['geuebt', 'wird geübt'],
                ['neu', 'neu'],
                ['neueste', 'Neueste'],
                ['zufall', 'Zufall'],
              ] as const
            ).map(([p, label]) => (
              <button key={p} className="btn-ghost py-1 text-xs" onClick={() => setPreset(p)}>
                {label}
              </button>
            ))}
          </div>
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {woerter.map((w) => (
              <li key={w.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-paper-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={auswahl.has(w.id)}
                    onChange={() =>
                      setAuswahl((alt) => {
                        const neu = new Set(alt);
                        if (neu.has(w.id)) neu.delete(w.id);
                        else neu.add(w.id);
                        return neu;
                      })
                    }
                  />
                  <span className="font-serif">{w.wort}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Vorschau */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            Vorschau · A4 quer ·{' '}
            {Math.ceil(ausgewaehlteWoerter.length / config.woerterProBlatt) || 1} Blatt
          </p>
          <button
            className="btn-primary"
            onClick={() => window.print()}
            disabled={ausgewaehlteWoerter.length === 0}
          >
            <IconPrint width={18} height={18} /> {t.common.drucken}
          </button>
        </div>
        <div ref={previewRef} className="overflow-hidden rounded-xl2 bg-paper-200 p-4">
          {/* `zoom` skaliert inkl. Layouthöhe, sodass keine Leerfläche entsteht. */}
          <div className="print-preview" style={{ zoom: scale } as React.CSSProperties}>
            <KnickblattDocument woerter={ausgewaehlteWoerter} config={config} kopf={kopf} />
          </div>
        </div>
        {ausgewaehlteWoerter.length === 0 && (
          <p className="mt-2 flex items-center gap-1 text-sm text-ink-faint">
            <IconCheck width={16} height={16} /> Wählen Sie links Wörter aus.
          </p>
        )}
      </div>

      {/* Druckbereich (nur beim Drucken sichtbar) */}
      <PrintPortal>
        <KnickblattDocument woerter={ausgewaehlteWoerter} config={config} kopf={kopf} />
      </PrintPortal>
    </div>
  );
}
