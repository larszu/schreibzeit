import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StatusBadge, EmptyState } from '@/components/ui';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconCopy,
  IconCheck,
  IconSparkles,
} from '@/components/icons';
import { repository } from '@/db/repository';
import { useLernwoerter } from '@/state/hooks';
import { syllablesFromBreakpoints, breakpointsFromSyllables } from '@/core/syllables';
import { suggestMerkstellen } from '@/core/merkstellen';
import { tokenize, buildExistingSet, normalizeForCompare } from '@/core/tokenize';
import { formatSyllables } from '@/core/syllables';
import { lookupWort, woerterbuchSilben } from '@/services/dictionary';
import { erkenneTextAusFoto } from '@/services/ocr';
import { IconCamera } from '@/components/icons';
import { t } from '@/i18n/de';
import type { Einstellungen, Kind, Lernwort, WortStatus } from '@/types';

const STATUS_REIHENFOLGE: WortStatus[] = ['neu', 'wird_geuebt', 'sitzt'];

export function KarteiView({
  kind,
  einstellungen,
}: {
  kind: Kind;
  einstellungen: Einstellungen;
}) {
  const woerter = useLernwoerter(kind.id);
  const [filter, setFilter] = useState<WortStatus | 'alle'>('alle');
  const [editor, setEditor] = useState<{ offen: boolean; wort?: Lernwort }>({ offen: false });
  const [extraktorOffen, setExtraktorOffen] = useState(false);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());

  const gefiltert = useMemo(
    () => (filter === 'alle' ? woerter : woerter.filter((w) => w.status === filter)),
    [woerter, filter],
  );

  function toggleAuswahl(id: string) {
    setAuswahl((alt) => {
      const neu = new Set(alt);
      if (neu.has(id)) neu.delete(id);
      else neu.add(id);
      return neu;
    });
  }

  async function massenStatus(status: WortStatus) {
    await Promise.all([...auswahl].map((id) => repository.updateLernwort(id, { status })));
    setAuswahl(new Set());
  }
  async function massenLoeschen() {
    if (!confirm(`${auswahl.size} Wörter löschen?`)) return;
    await repository.deleteLernwoerter([...auswahl]);
    setAuswahl(new Set());
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => setEditor({ offen: true })}>
          <IconPlus width={18} height={18} /> Wort hinzufügen
        </button>
        <button className="btn-secondary" onClick={() => setExtraktorOffen(true)}>
          <IconSparkles width={18} height={18} /> Aus Text herauspicken
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-paper-300 bg-white p-0.5">
          {(['alle', ...STATUS_REIHENFOLGE] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f ? 'bg-brand-500 text-white' : 'text-ink-soft hover:bg-paper-100'
              }`}
            >
              {f === 'alle' ? `Alle (${woerter.length})` : t.status[f]}
            </button>
          ))}
        </div>
      </div>

      {auswahl.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
          <span className="font-medium text-brand-700">{auswahl.size} ausgewählt</span>
          {STATUS_REIHENFOLGE.map((s) => (
            <button key={s} className="btn-ghost py-1" onClick={() => massenStatus(s)}>
              → {t.status[s]}
            </button>
          ))}
          <button className="btn-ghost py-1 text-danger-500" onClick={massenLoeschen}>
            <IconTrash width={16} height={16} /> Löschen
          </button>
          <button className="btn-ghost py-1" onClick={() => setAuswahl(new Set())}>
            Auswahl aufheben
          </button>
        </div>
      )}

      {gefiltert.length === 0 ? (
        <EmptyState
          titel="Noch keine Lernwörter"
          text="Fügen Sie Wörter manuell hinzu oder picken Sie sie aus einem eingefügten Kindertext heraus."
        >
          <button className="btn-primary" onClick={() => setExtraktorOffen(true)}>
            <IconSparkles width={18} height={18} /> Aus Text herauspicken
          </button>
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {gefiltert.map((w) => (
            <LernwortZeile
              key={w.id}
              wort={w}
              ausgewaehlt={auswahl.has(w.id)}
              onToggle={() => toggleAuswahl(w.id)}
              onEdit={() => setEditor({ offen: true, wort: w })}
            />
          ))}
        </ul>
      )}

      <LernwortEditor
        state={editor}
        kindId={kind.id}
        onClose={() => setEditor({ offen: false })}
      />
      <TextExtraktor
        offen={extraktorOffen}
        kind={kind}
        einstellungen={einstellungen}
        vorhandene={woerter}
        onClose={() => setExtraktorOffen(false)}
      />
    </div>
  );
}

function LernwortZeile({
  wort,
  ausgewaehlt,
  onToggle,
  onEdit,
}: {
  wort: Lernwort;
  ausgewaehlt: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  async function zyklusStatus() {
    const idx = STATUS_REIHENFOLGE.indexOf(wort.status);
    const next = STATUS_REIHENFOLGE[(idx + 1) % STATUS_REIHENFOLGE.length];
    await repository.updateLernwort(wort.id, { status: next });
  }
  async function duplizieren() {
    await repository.addLernwort(wort.kindId, wort.wort, {
      artikel: wort.artikel,
      wortart: wort.wortart,
      silben: wort.silben,
      merkstellen: wort.merkstellen,
      quelle: wort.quelle,
      notiz: wort.notiz,
    });
  }
  async function loeschen() {
    if (confirm(`„${wort.wort}" löschen?`)) await repository.deleteLernwort(wort.id);
  }

  const merkSet = new Set(wort.merkstellen);

  return (
    <li className="card flex items-center gap-3 px-3 py-2.5">
      <input
        type="checkbox"
        checked={ausgewaehlt}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 accent-brand-500"
        aria-label={`${wort.wort} auswählen`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {wort.artikel && <span className="text-sm text-ink-faint">{wort.artikel}</span>}
          <span className="font-serif text-lg text-ink">
            {wort.wort.split('').map((ch, i) => (
              <span
                key={i}
                className={merkSet.has(i) ? 'border-b-2 border-danger-500 text-danger-500' : ''}
              >
                {ch}
              </span>
            ))}
          </span>
          <span className="text-sm text-ink-faint">{formatSyllables(wort.silben)}</span>
        </div>
        {(wort.quelle || wort.notiz) && (
          <p className="truncate text-xs text-ink-faint">
            {[wort.quelle, wort.notiz].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <button onClick={zyklusStatus} aria-label="Status ändern" title="Status weiterschalten">
        <StatusBadge status={wort.status} />
      </button>
      <div className="flex shrink-0">
        <button className="btn-ghost p-1.5" onClick={onEdit} aria-label="Bearbeiten">
          <IconEdit width={16} height={16} />
        </button>
        <button className="btn-ghost p-1.5" onClick={duplizieren} aria-label="Duplizieren">
          <IconCopy width={16} height={16} />
        </button>
        <button
          className="btn-ghost p-1.5 text-danger-500"
          onClick={loeschen}
          aria-label="Löschen"
        >
          <IconTrash width={16} height={16} />
        </button>
      </div>
    </li>
  );
}

function LernwortEditor({
  state,
  kindId,
  onClose,
}: {
  state: { offen: boolean; wort?: Lernwort };
  kindId: string;
  onClose: () => void;
}) {
  const vorhanden = state.wort;
  const [wort, setWort] = useState('');
  const [artikel, setArtikel] = useState('');
  const [wortart, setWortart] = useState('');
  const [breaks, setBreaks] = useState<number[]>([]);
  const [merkstellen, setMerkstellen] = useState<number[]>([]);
  const [status, setStatus] = useState<WortStatus>('neu');
  const [quelle, setQuelle] = useState('');
  const [notiz, setNotiz] = useState('');

  useEffect(() => {
    if (!state.offen) return;
    const w = vorhanden;
    setWort(w?.wort ?? '');
    setArtikel(w?.artikel ?? '');
    setWortart(w?.wortart ?? '');
    setBreaks(w ? breakpointsFromSyllables(w.silben) : []);
    setMerkstellen(w?.merkstellen ?? []);
    setStatus(w?.status ?? 'neu');
    setQuelle(w?.quelle ?? '');
    setNotiz(w?.notiz ?? '');
  }, [state.offen, vorhanden]);

  // Beim Tippen eines neuen Wortes automatisch Vorschläge aus dem Wörterbuch
  // erzeugen (korrekte Silbentrennung; Artikel, falls bekannt).
  function onWortChange(v: string) {
    setWort(v);
    if (!vorhanden) {
      const info = lookupWort(v);
      setBreaks(breakpointsFromSyllables(info.silben));
      setMerkstellen(info.merkstellen);
      if (info.artikelGefunden && info.artikel) setArtikel(info.artikel);
    }
  }

  function toggleBreak(idx: number) {
    setBreaks((alt) =>
      alt.includes(idx) ? alt.filter((b) => b !== idx) : [...alt, idx].sort((a, b) => a - b),
    );
  }
  function toggleMerk(idx: number) {
    setMerkstellen((alt) =>
      alt.includes(idx) ? alt.filter((m) => m !== idx) : [...alt, idx].sort((a, b) => a - b),
    );
  }

  const silben = syllablesFromBreakpoints(wort, breaks);

  async function speichern() {
    if (!wort.trim()) return;
    const daten: Partial<Lernwort> = {
      artikel: (artikel as Lernwort['artikel']) || '',
      wortart: wortart.trim() || undefined,
      silben,
      merkstellen,
      status,
      quelle: quelle.trim() || undefined,
      notiz: notiz.trim() || undefined,
    };
    if (vorhanden) {
      await repository.updateLernwort(vorhanden.id, { wort: wort.trim(), ...daten });
    } else {
      await repository.addLernwort(kindId, wort.trim(), daten);
    }
    onClose();
  }

  return (
    <Modal
      offen={state.offen}
      titel={vorhanden ? 'Lernwort bearbeiten' : 'Lernwort hinzufügen'}
      onClose={onClose}
      weit
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label className="label" htmlFor="lw-wort">
              Wort
            </label>
            <input
              id="lw-wort"
              className="input font-serif text-lg"
              value={wort}
              autoFocus
              onChange={(e) => onWortChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="lw-artikel">
              Artikel
            </label>
            <select
              id="lw-artikel"
              className="input"
              value={artikel}
              onChange={(e) => setArtikel(e.target.value)}
            >
              <option value="">—</option>
              <option value="der">der</option>
              <option value="die">die</option>
              <option value="das">das</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lw-wortart">
              Wortart (optional)
            </label>
            <input
              id="lw-wortart"
              className="input"
              value={wortart}
              placeholder="Nomen, Verb …"
              onChange={(e) => setWortart(e.target.value)}
            />
          </div>
        </div>

        {/* Silbentrennung – Trennstellen per Klick setzen/entfernen */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label mb-0">Silbentrennung (Vorschlag – bitte prüfen)</span>
            <button
              className="text-xs text-brand-600 hover:underline"
              onClick={() => setBreaks(breakpointsFromSyllables(woerterbuchSilben(wort)))}
            >
              Vorschlag neu
            </button>
          </div>
          <ClickbareLuecken
            wort={wort}
            breaks={breaks}
            onToggle={toggleBreak}
          />
          <p className="mt-1 text-sm text-ink-faint">
            Ergebnis: <span className="font-serif">{formatSyllables(silben) || '—'}</span>
          </p>
        </div>

        {/* Merkstellen – Buchstaben per Klick markieren */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label mb-0">Merkstellen (schwierige Stellen)</span>
            <button
              className="text-xs text-brand-600 hover:underline"
              onClick={() => setMerkstellen(suggestMerkstellen(wort))}
            >
              Vorschlag neu
            </button>
          </div>
          <ClickbareBuchstaben wort={wort} markiert={merkstellen} onToggle={toggleMerk} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="lw-status">
              Status
            </label>
            <select
              id="lw-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as WortStatus)}
            >
              {STATUS_REIHENFOLGE.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="lw-quelle">
              Quelle / Textbezug
            </label>
            <input
              id="lw-quelle"
              className="input"
              value={quelle}
              placeholder="z. B. Aufsatz Wochenende"
              onChange={(e) => setQuelle(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="lw-notiz">
            Notiz
          </label>
          <textarea
            id="lw-notiz"
            className="input min-h-[52px]"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary" onClick={onClose}>
            {t.common.abbrechen}
          </button>
          <button className="btn-primary" onClick={speichern} disabled={!wort.trim()}>
            <IconCheck width={18} height={18} /> {t.common.speichern}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Wort mit klickbaren Lücken zwischen den Buchstaben (Trennstellen-Editor). */
function ClickbareLuecken({
  wort,
  breaks,
  onToggle,
}: {
  wort: string;
  breaks: number[];
  onToggle: (idx: number) => void;
}) {
  if (!wort) return <p className="text-sm text-ink-faint">Bitte zuerst ein Wort eingeben.</p>;
  const breakSet = new Set(breaks);
  return (
    <div className="flex flex-wrap items-center rounded-lg border border-paper-300 bg-paper-50 px-2 py-3 font-serif text-2xl">
      {wort.split('').map((ch, i) => (
        <span key={i} className="flex items-center">
          <span>{ch}</span>
          {i < wort.length - 1 && (
            <button
              onClick={() => onToggle(i + 1)}
              className={`mx-0.5 h-7 w-2 rounded-full transition-colors ${
                breakSet.has(i + 1) ? 'bg-brand-500' : 'bg-paper-300 hover:bg-brand-200'
              }`}
              aria-label={breakSet.has(i + 1) ? 'Trennstelle entfernen' : 'Trennstelle setzen'}
              title="Trennstelle umschalten"
            />
          )}
        </span>
      ))}
    </div>
  );
}

/** Wort mit klickbaren Buchstaben (Merkstellen-Editor). */
function ClickbareBuchstaben({
  wort,
  markiert,
  onToggle,
}: {
  wort: string;
  markiert: number[];
  onToggle: (idx: number) => void;
}) {
  if (!wort) return <p className="text-sm text-ink-faint">Bitte zuerst ein Wort eingeben.</p>;
  const markSet = new Set(markiert);
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-paper-300 bg-paper-50 px-2 py-3 font-serif text-2xl">
      {wort.split('').map((ch, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className={`min-w-[1.4rem] rounded px-1 transition-colors ${
            markSet.has(i)
              ? 'bg-danger-500 text-white'
              : 'hover:bg-paper-200'
          }`}
          aria-pressed={markSet.has(i)}
          aria-label={`Buchstabe ${ch} markieren`}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

function TextExtraktor({
  offen,
  kind,
  einstellungen,
  vorhandene,
  onClose,
}: {
  offen: boolean;
  kind: Kind;
  einstellungen: Einstellungen;
  vorhandene: Lernwort[];
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [hinzugefuegt, setHinzugefuegt] = useState<Set<string>>(new Set());
  const [ocrLaden, setOcrLaden] = useState(false);
  const [ocrInfo, setOcrInfo] = useState<string | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (offen) {
      setText('');
      setHinzugefuegt(new Set());
      setOcrInfo(null);
    }
  }, [offen]);

  const tokens = useMemo(() => tokenize(text), [text]);
  const existierende = useMemo(
    () => buildExistingSet(vorhandene.map((w) => w.wort)),
    [vorhandene],
  );

  async function uebernehmen(token: { wort: string; key: string }) {
    const info = lookupWort(token.wort);
    await repository.addLernwort(kind.id, token.wort, {
      quelle: 'Text-Extraktion',
      silben: info.silben,
      merkstellen: info.merkstellen,
      artikel: info.artikel || '',
    });
    setHinzugefuegt((alt) => new Set(alt).add(normalizeForCompare(token.wort)));
  }

  async function fotoGewaehlt(file: File) {
    setOcrLaden(true);
    setOcrInfo(null);
    try {
      const { text: erkannt, engine } = await erkenneTextAusFoto(file, einstellungen);
      setText((alt) => (alt.trim() ? `${alt}\n${erkannt}` : erkannt));
      setOcrInfo(`Text erkannt mit ${engine === 'claude' ? 'Claude Vision' : 'Gemini'}.`);
    } catch (e) {
      setOcrInfo(e instanceof Error ? e.message : 'Texterkennung fehlgeschlagen.');
    } finally {
      setOcrLaden(false);
    }
  }

  return (
    <Modal offen={offen} titel="Wörter aus Text herauspicken" onClose={onClose} weit>
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">
          Fügen Sie den (abgetippten) Text des Kindes ein oder laden Sie ein Foto hoch – klicken Sie
          dann die Lernwörter an. Bereits vorhandene Wörter sind markiert.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void fotoGewaehlt(f);
              e.target.value = '';
            }}
          />
          <button
            className="btn-secondary"
            onClick={() => fotoRef.current?.click()}
            disabled={ocrLaden}
          >
            <IconCamera width={18} height={18} />
            {ocrLaden ? 'Text wird erkannt …' : 'Foto hochladen (Texterkennung)'}
          </button>
          {ocrInfo && <span className="text-xs text-ink-soft">{ocrInfo}</span>}
        </div>
        <textarea
          className="input min-h-[120px] font-serif"
          placeholder="Text hier einfügen oder per Foto erkennen lassen …"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        {tokens.length > 0 && (
          <div className="rounded-lg border border-paper-200 bg-paper-50 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
              Wörter anklicken zum Übernehmen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((token) => {
                const norm = normalizeForCompare(token.wort);
                const schonDa = existierende.has(norm) || hinzugefuegt.has(norm);
                return (
                  <button
                    key={token.key}
                    onClick={() => uebernehmen(token)}
                    disabled={schonDa}
                    className={`rounded-md px-2 py-1 font-serif text-sm transition-colors ${
                      schonDa
                        ? 'cursor-default bg-brand-100 text-brand-700'
                        : 'bg-white text-ink shadow-sm hover:bg-brand-500 hover:text-white'
                    }`}
                    title={schonDa ? 'Bereits in der Kartei' : 'Als Lernwort übernehmen'}
                  >
                    {schonDa && <IconCheck width={12} height={12} className="mr-1 inline" />}
                    {token.wort}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button className="btn-primary" onClick={onClose}>
            Fertig
          </button>
        </div>
      </div>
    </Modal>
  );
}
