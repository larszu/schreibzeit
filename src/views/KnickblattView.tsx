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
  LINEATUR_LABEL,
  createDefaultKnickblattConfig,
  defaultKnickspalten,
  resolveLineatur,
} from '@/core/knickblatt';
import { useFonts, useLernwoerter } from '@/state/hooks';
import { displayName } from '@/state/store';
import { repository } from '@/db/repository';
import { t } from '@/i18n/de';
import type {
  Einstellungen,
  Kind,
  Klasse,
  Knickspalte,
  KnickblattConfig,
  Lernwort,
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
  const fonts = useFonts();
  const [config, setConfig] = useState<KnickblattConfig>(() =>
    createDefaultKnickblattConfig({
      spalten: vollstaendigeSpalten(einstellungen.standardSpalten),
      lineatur: einstellungen.standardLineatur,
      woerterProBlatt: einstellungen.standardWoerterProBlatt,
    }),
  );
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [thema, setThema] = useState('');
  const [stapel, setStapel] = useState(false);
  const [klassenDaten, setKlassenDaten] = useState<{ kind: Kind; woerter: Lernwort[] }[]>([]);
  const [previewRef, scale] = useFitScale(PAGE_WIDTH_PX);

  // Stapeldruck: Wörter aller Kinder der Klasse laden (eine Seite je Kind).
  useEffect(() => {
    if (!stapel || !kind.klasseId) {
      setKlassenDaten([]);
      return;
    }
    let abbruch = false;
    void (async () => {
      const alle = await repository.getKinder();
      const klasse = alle.filter((k) => k.klasseId === kind.klasseId);
      const daten = await Promise.all(
        klasse.map(async (k) => ({ kind: k, woerter: await repository.getLernwoerter(k.id) })),
      );
      if (!abbruch) setKlassenDaten(daten);
    })();
    return () => {
      abbruch = true;
    };
  }, [stapel, kind.klasseId]);

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

  const kopfFuer = (k: Kind): KnickblattKopf => ({
    kindName: displayName(k.name, einstellungen.nurInitialen),
    klasse: klassen.find((c) => c.id === k.klasseId)?.name,
    datum: new Date().toLocaleDateString('de-DE'),
    thema: thema.trim() || undefined,
    lehrkraft: einstellungen.lehrkraftName || undefined,
    schule: einstellungen.schulName || undefined,
  });
  const kopf = kopfFuer(kind);
  const klassenName = klassen.find((c) => c.id === kind.klasseId)?.name;
  const lineaturMasse = resolveLineatur(config.lineatur, einstellungen.customLineaturen);

  // Schnellvorlagen: Standardwerte bzw. ein LRS-/leicht-Preset.
  function presetStandard() {
    setConfig((c) => ({
      ...c,
      lineatur: einstellungen.standardLineatur,
      woerterProBlatt: einstellungen.standardWoerterProBlatt,
      vorlageMitSilben: false,
      vorlageMitMerkstellen: false,
    }));
  }
  function presetLRS() {
    setConfig((c) => ({
      ...c,
      lineatur: 'klasse1',
      woerterProBlatt: 6,
      vorlageMitSilben: true,
      vorlageMitMerkstellen: true,
    }));
  }

  function setSpalten(spalten: Knickspalte[]) {
    setConfig((c) => ({ ...c, spalten }));
  }
  function toggleSpalte(id: string) {
    setSpalten(config.spalten.map((s) => (s.id === id ? { ...s, aktiv: !s.aktiv } : s)));
  }
  function renameSpalte(id: string, titel: string) {
    setSpalten(config.spalten.map((s) => (s.id === id ? { ...s, titel } : s)));
  }
  function setSymbol(id: string, symbol: string) {
    setSpalten(config.spalten.map((s) => (s.id === id ? { ...s, symbol } : s)));
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
              <span className="label">Schnellvorlage</span>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 py-1.5 text-xs" onClick={presetStandard}>
                  Standard
                </button>
                <button
                  className="btn-secondary flex-1 py-1.5 text-xs"
                  onClick={presetLRS}
                  title="Größere Lineatur, weniger Wörter, Silbenbögen & Merkstellen vorgedruckt"
                >
                  LRS / leicht
                </button>
              </div>
            </div>
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
                  onChange={(e) => setConfig((c) => ({ ...c, lineatur: e.target.value }))}
                >
                  {LINEATUREN.map((l) => (
                    <option key={l} value={l}>
                      {LINEATUR_LABEL[l]}
                    </option>
                  ))}
                  {einstellungen.customLineaturen.length > 0 && (
                    <optgroup label="Eigene Lineaturen">
                      {einstellungen.customLineaturen.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="kb-font">
                Schrift der Vorlage
              </label>
              <select
                id="kb-font"
                className="input"
                value={config.vorlageFont ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, vorlageFont: e.target.value || undefined }))
                }
              >
                <option value="">Standard (Serif)</option>
                <option value="'Inter', system-ui, sans-serif">Serifenlos (LRS-freundlich)</option>
                {fonts.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} (eigene Schrift)
                  </option>
                ))}
              </select>
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
                  <input
                    className="w-8 shrink-0 rounded border border-transparent bg-transparent px-0.5 py-0.5 text-center text-base hover:border-paper-300 focus:border-brand-400 focus:bg-white focus:outline-none"
                    value={s.symbol ?? def.symbol}
                    onChange={(e) => setSymbol(s.id, e.target.value)}
                    aria-label="Symbol"
                    title="Symbol/Emoji ändern"
                    maxLength={3}
                  />
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-soft">
            Vorschau · A4 quer ·{' '}
            {stapel
              ? `${klassenDaten.length} Kinder der Klasse ${klassenName ?? ''}`
              : `${Math.ceil(ausgewaehlteWoerter.length / config.woerterProBlatt) || 1} Blatt`}
          </p>
          <button
            className="btn-primary"
            onClick={() => window.print()}
            disabled={stapel ? klassenDaten.length === 0 : ausgewaehlteWoerter.length === 0}
          >
            <IconPrint width={18} height={18} /> {t.common.drucken}
          </button>
        </div>
        {kind.klasseId && (
          <label className="mb-3 flex items-center gap-2 rounded-lg border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={stapel}
              onChange={(e) => setStapel(e.target.checked)}
            />
            Ganze Klasse {klassenName ? `(${klassenName})` : ''} drucken – ein Blattsatz je Kind (mit
            allen Wörtern des Kindes)
          </label>
        )}
        <div ref={previewRef} className="overflow-hidden rounded-xl2 bg-paper-200 p-4">
          {/* `zoom` skaliert inkl. Layouthöhe, sodass keine Leerfläche entsteht. */}
          <div className="print-preview" style={{ zoom: scale } as React.CSSProperties}>
            <KnickblattDocument
              woerter={ausgewaehlteWoerter}
              config={config}
              kopf={kopf}
              lineaturMasse={lineaturMasse}
            />
          </div>
        </div>
        {stapel ? (
          <p className="mt-2 text-sm text-ink-faint">
            Vorschau zeigt {kopf.kindName}. Beim Drucken wird für jedes Kind der Klasse ein eigener
            Blattsatz erzeugt.
          </p>
        ) : (
          ausgewaehlteWoerter.length === 0 && (
            <p className="mt-2 flex items-center gap-1 text-sm text-ink-faint">
              <IconCheck width={16} height={16} /> Wählen Sie links Wörter aus.
            </p>
          )
        )}
      </div>

      {/* Druckbereich (nur beim Drucken sichtbar) */}
      <PrintPortal>
        {stapel ? (
          klassenDaten.map((d) => (
            <KnickblattDocument
              key={d.kind.id}
              woerter={d.woerter}
              config={config}
              kopf={kopfFuer(d.kind)}
              lineaturMasse={lineaturMasse}
            />
          ))
        ) : (
          <KnickblattDocument
            woerter={ausgewaehlteWoerter}
            config={config}
            kopf={kopf}
            lineaturMasse={lineaturMasse}
          />
        )}
      </PrintPortal>
    </div>
  );
}
