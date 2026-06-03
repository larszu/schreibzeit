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
import { uebernehmeWort, uebernehmeWoerter } from '@/services/lernwortHelfer';
import { erkenneTextAusFoto } from '@/services/ocr';
import { sprichWort, spreche, stoppeSprache, ttsVerfuegbar } from '@/services/tts';
import { faelligeWoerter, fachVon, naechsterStand } from '@/core/srs';
import { GRUNDWORTSCHATZ_LISTEN, ladeGrundwortschatz } from '@/data/grundwortschatz';
import { IconCamera, IconSpeaker, IconList, IconBook } from '@/components/icons';
import { WortChips } from '@/components/WortChips';
import { PrintPortal } from '@/components/print/PrintPortal';
import { LernstandDocument } from '@/components/print/LernstandDocument';
import { ElternblattDocument } from '@/components/print/ElternblattDocument';
import { WortAnzeige } from '@/components/print/WortAnzeige';
import { displayName } from '@/state/store';
import { t } from '@/i18n/de';
import { drucke } from '@/services/print';
import type { Einstellungen, Kind, Lernwort, WortStatus } from '@/types';

const TTS_OK = ttsVerfuegbar();

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
  const [gwsOffen, setGwsOffen] = useState(false);
  const [diktatOffen, setDiktatOffen] = useState(false);
  const [uebenOffen, setUebenOffen] = useState(false);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [uebersichtDruck, setUebersichtDruck] = useState(false);
  const [elternDruck, setElternDruck] = useState(false);

  const gefiltert = useMemo(
    () => (filter === 'alle' ? woerter : woerter.filter((w) => w.status === filter)),
    [woerter, filter],
  );
  const faelligAnzahl = useMemo(() => faelligeWoerter(woerter).length, [woerter]);

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
        <button className="btn-secondary" onClick={() => setGwsOffen(true)}>
          <IconBook width={18} height={18} /> Aus Grundwortschatz
        </button>
        {woerter.length > 0 && (
          <button
            className="btn-secondary"
            onClick={() => setUebenOffen(true)}
            title="Fällige Wörter wiederholen (Spaced Repetition)"
          >
            <IconCheck width={18} height={18} /> Üben
            {faelligAnzahl > 0 && (
              <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                {faelligAnzahl}
              </span>
            )}
          </button>
        )}
        {woerter.length > 0 && TTS_OK && (
          <button
            className="btn-ghost"
            onClick={() => setDiktatOffen(true)}
            title="Wörter als Diktat vorlesen"
          >
            <IconSpeaker width={18} height={18} /> Diktat
          </button>
        )}
        {woerter.length > 0 && (
          <button
            className="btn-ghost"
            onClick={() => {
              setElternDruck(true);
              setTimeout(() => drucke(), 60);
            }}
            title="Übungsblatt für zu Hause drucken"
          >
            <IconBook width={18} height={18} /> Elternblatt
          </button>
        )}
        {woerter.length > 0 && (
          <button
            className="btn-ghost"
            onClick={() => {
              setUebersichtDruck(true);
              setTimeout(() => drucke(), 60);
            }}
            title="Lernstands-Übersicht drucken"
          >
            <IconList width={18} height={18} /> Übersicht
          </button>
        )}

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
      <GrundwortschatzModal
        offen={gwsOffen}
        kind={kind}
        einstellungen={einstellungen}
        vorhandene={woerter}
        onClose={() => setGwsOffen(false)}
      />
      <DiktatModal offen={diktatOffen} woerter={gefiltert} onClose={() => setDiktatOffen(false)} />
      <UebenModal offen={uebenOffen} woerter={woerter} onClose={() => setUebenOffen(false)} />

      {uebersichtDruck && (
        <PrintPortal solo>
          <LernstandDocument
            kindName={displayName(kind.name, einstellungen.nurInitialen)}
            lernstand={t.lernstand[kind.lernstand]}
            datum={new Date().toLocaleDateString('de-DE')}
            woerter={woerter}
            lehrkraft={einstellungen.lehrkraftName || undefined}
            schule={einstellungen.schulName || undefined}
          />
        </PrintPortal>
      )}
      {elternDruck && (
        <PrintPortal solo>
          <ElternblattDocument
            woerter={gefiltert}
            kindName={displayName(kind.name, einstellungen.nurInitialen)}
            datum={new Date().toLocaleDateString('de-DE')}
            lineatur={einstellungen.standardLineatur}
            lehrkraft={einstellungen.lehrkraftName || undefined}
            schule={einstellungen.schulName || undefined}
          />
        </PrintPortal>
      )}
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
        {TTS_OK && (
          <button
            className="btn-ghost p-1.5"
            onClick={() => sprichWort(wort.wort)}
            aria-label="Wort vorlesen"
            title="Wort vorlesen"
          >
            <IconSpeaker width={16} height={16} />
          </button>
        )}
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
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoGross, setFotoGross] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (offen) {
      setText('');
      setHinzugefuegt(new Set());
      setOcrInfo(null);
      setFotoUrl(null);
      setFotoGross(false);
    }
  }, [offen]);

  const tokens = useMemo(() => tokenize(text), [text]);
  const existierende = useMemo(
    () => buildExistingSet(vorhandene.map((w) => w.wort)),
    [vorhandene],
  );

  async function uebernehmen(wort: string) {
    await uebernehmeWort(kind.id, wort, 'Text-Extraktion');
    setHinzugefuegt((alt) => new Set(alt).add(normalizeForCompare(wort)));
  }

  // Offene (noch nicht vorhandene) Wörter der Tokenliste, ohne Dubletten.
  const offeneWoerter = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const tk of tokens) {
      const n = normalizeForCompare(tk.wort);
      if (existierende.has(n) || hinzugefuegt.has(n) || seen.has(n)) continue;
      seen.add(n);
      result.push(tk.wort);
    }
    return result;
  }, [tokens, existierende, hinzugefuegt]);

  async function alleUebernehmen() {
    const woerter = offeneWoerter;
    await uebernehmeWoerter(kind.id, woerter, 'Text-Extraktion');
    setHinzugefuegt((alt) => {
      const s = new Set(alt);
      woerter.forEach((w) => s.add(normalizeForCompare(w)));
      return s;
    });
  }

  async function fotoGewaehlt(file: File) {
    // Vorschau erzeugen (vorherige URL freigeben)
    setFotoUrl((alt) => {
      if (alt) URL.revokeObjectURL(alt);
      return URL.createObjectURL(file);
    });
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
          {fotoUrl && (
            <button
              type="button"
              onClick={() => setFotoGross(true)}
              className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-paper-300"
              title="Foto groß anzeigen"
            >
              <img src={fotoUrl} alt="Hochgeladenes Foto" className="h-full w-full object-cover" />
              <span className="absolute inset-0 hidden items-center justify-center bg-ink/40 text-[10px] font-medium text-white group-hover:flex">
                Groß
              </span>
            </button>
          )}
          {ocrInfo && <span className="text-xs text-ink-soft">{ocrInfo}</span>}
        </div>
        {fotoGross && fotoUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-6"
            onClick={() => setFotoGross(false)}
            role="dialog"
            aria-label="Foto-Vollansicht"
          >
            <img
              src={fotoUrl}
              alt="Hochgeladenes Foto (groß)"
              className="max-h-full max-w-full rounded-lg shadow-card"
            />
            <button
              className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-ink"
              onClick={() => setFotoGross(false)}
            >
              Schließen
            </button>
          </div>
        )}
        <textarea
          className="input min-h-[120px] font-serif"
          placeholder="Text hier einfügen oder per Foto erkennen lassen …"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        {tokens.length > 0 && (
          <div className="rounded-lg border border-paper-200 bg-paper-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Wörter anklicken zum Übernehmen
              </p>
              {offeneWoerter.length > 0 && (
                <button className="btn-ghost py-1 text-xs" onClick={alleUebernehmen}>
                  <IconCheck width={14} height={14} /> Alle übernehmen ({offeneWoerter.length})
                </button>
              )}
            </div>
            <WortChips
              items={tokens}
              istVorhanden={(w) => {
                const n = normalizeForCompare(w);
                return existierende.has(n) || hinzugefuegt.has(n);
              }}
              onAdd={uebernehmen}
            />
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

function GrundwortschatzModal({
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
  const [listeId, setListeId] = useState('');
  const [woerter, setWoerter] = useState<string[]>([]);
  const [hinzugefuegt, setHinzugefuegt] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (offen) {
      setHinzugefuegt(new Set());
      setListeId(einstellungen.grundwortschatzId || GRUNDWORTSCHATZ_LISTEN[0].id);
    }
  }, [offen, einstellungen.grundwortschatzId]);

  useEffect(() => {
    if (offen && listeId) void ladeGrundwortschatz(listeId).then(setWoerter);
  }, [offen, listeId]);

  const existierende = useMemo(
    () => buildExistingSet(vorhandene.map((w) => w.wort)),
    [vorhandene],
  );

  const offene = useMemo(
    () =>
      woerter.filter((w) => {
        const n = normalizeForCompare(w);
        return !existierende.has(n) && !hinzugefuegt.has(n);
      }),
    [woerter, existierende, hinzugefuegt],
  );

  async function uebernehmen(w: string) {
    await uebernehmeWort(kind.id, w, 'Grundwortschatz');
    setHinzugefuegt((alt) => new Set(alt).add(normalizeForCompare(w)));
  }

  async function alleUebernehmen() {
    const liste = offene;
    await uebernehmeWoerter(kind.id, liste, 'Grundwortschatz');
    setHinzugefuegt((alt) => {
      const s = new Set(alt);
      liste.forEach((w) => s.add(normalizeForCompare(w)));
      return s;
    });
  }

  return (
    <Modal offen={offen} titel="Aus Grundwortschatz hinzufügen" onClose={onClose} weit>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input max-w-xs"
            value={listeId}
            onChange={(e) => setListeId(e.target.value)}
          >
            {GRUNDWORTSCHATZ_LISTEN.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          {offene.length > 0 && (
            <button className="btn-secondary" onClick={alleUebernehmen}>
              <IconCheck width={16} height={16} /> Alle übernehmen ({offene.length})
            </button>
          )}
        </div>
        <p className="text-sm text-ink-soft">
          {woerter.length} Wörter · bereits in der Kartei vorhandene sind markiert.
        </p>
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-paper-200 bg-paper-50 p-3">
          <WortChips
            items={woerter.map((w) => ({ wort: w, key: w }))}
            istVorhanden={(w) => {
              const n = normalizeForCompare(w);
              return existierende.has(n) || hinzugefuegt.has(n);
            }}
            onAdd={uebernehmen}
          />
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={onClose}>
            Fertig
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DiktatModal({
  offen,
  woerter,
  onClose,
}: {
  offen: boolean;
  woerter: Lernwort[];
  onClose: () => void;
}) {
  const [laufend, setLaufend] = useState(false);
  const [index, setIndex] = useState(-1);
  const [pauseSek, setPauseSek] = useState(6);
  const [zweimal, setZweimal] = useState(true);
  const laufendRef = useRef(false);
  const pauseRef = useRef(6);
  pauseRef.current = pauseSek;

  const warte = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
  const sag = (text: string) => new Promise<void>((r) => spreche(text, r));

  function stop() {
    laufendRef.current = false;
    setLaufend(false);
    setIndex(-1);
    stoppeSprache();
  }

  async function start() {
    if (woerter.length === 0) return;
    laufendRef.current = true;
    setLaufend(true);
    for (let i = 0; i < woerter.length; i++) {
      if (!laufendRef.current) return;
      setIndex(i);
      await sag(woerter[i].wort);
      if (!laufendRef.current) return;
      if (zweimal) {
        await warte(600);
        if (!laufendRef.current) return;
        await sag(woerter[i].wort);
      }
      await warte(pauseRef.current * 1000);
    }
    stop();
  }

  // Beim Schließen/Unmount Sprache stoppen.
  useEffect(() => {
    if (!offen) stop();
    return () => stop();
  }, [offen]);

  return (
    <Modal offen={offen} titel="Diktat vorlesen" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Liest die {woerter.length} Wörter nacheinander vor – zum Selbst-Diktat. Tipp: Bildschirm
          fürs Kind verdecken.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="dik-pause">
              Pause zwischen den Wörtern: {pauseSek} s
            </label>
            <input
              id="dik-pause"
              type="range"
              min={3}
              max={15}
              value={pauseSek}
              className="w-full accent-brand-500"
              onChange={(e) => setPauseSek(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={zweimal}
              onChange={(e) => setZweimal(e.target.checked)}
            />
            Jedes Wort 2× vorlesen
          </label>
        </div>

        <div className="rounded-lg border border-paper-200 bg-paper-50 px-3 py-4 text-center">
          {laufend && index >= 0 ? (
            <>
              <p className="text-xs text-ink-faint">
                Wort {index + 1} / {woerter.length}
              </p>
              <p className="font-serif text-2xl text-ink">{woerter[index]?.wort}</p>
            </>
          ) : (
            <p className="text-sm text-ink-faint">Bereit – auf „Start" klicken.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {!laufend ? (
            <button className="btn-primary" onClick={start} disabled={woerter.length === 0}>
              <IconSpeaker width={18} height={18} /> Start
            </button>
          ) : (
            <button className="btn-danger" onClick={stop}>
              Stopp
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            {t.common.schliessen}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UebenModal({
  offen,
  woerter,
  onClose,
}: {
  offen: boolean;
  woerter: Lernwort[];
  onClose: () => void;
}) {
  const [liste, setListe] = useState<Lernwort[]>([]);
  const [index, setIndex] = useState(0);
  const [aufgedeckt, setAufgedeckt] = useState(false);
  const [richtig, setRichtig] = useState(0);
  const [falsch, setFalsch] = useState(0);

  useEffect(() => {
    if (offen) {
      setListe(faelligeWoerter(woerter));
      setIndex(0);
      setAufgedeckt(false);
      setRichtig(0);
      setFalsch(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  const aktuell = liste[index];
  const fertig = liste.length > 0 && index >= liste.length;

  async function bewerten(korrekt: boolean) {
    if (!aktuell) return;
    await repository.updateLernwort(aktuell.id, naechsterStand(aktuell, korrekt));
    if (korrekt) setRichtig((r) => r + 1);
    else setFalsch((f) => f + 1);
    setAufgedeckt(false);
    setIndex((i) => i + 1);
  }

  return (
    <Modal offen={offen} titel="Üben (Wiederholung)" onClose={onClose}>
      {liste.length === 0 ? (
        <div className="space-y-3 text-center">
          <p className="font-serif text-lg text-ink">Aktuell ist nichts fällig 🎉</p>
          <p className="text-sm text-ink-soft">Alle Wörter sind bis zur nächsten Wiedervorlage geübt.</p>
          <div className="flex justify-center gap-2">
            <button
              className="btn-secondary"
              onClick={() => {
                setListe(woerter);
                setIndex(0);
              }}
            >
              Trotzdem alle üben
            </button>
            <button className="btn-primary" onClick={onClose}>
              {t.common.schliessen}
            </button>
          </div>
        </div>
      ) : fertig ? (
        <div className="space-y-3 text-center">
          <p className="font-serif text-lg text-ink">Fertig!</p>
          <p className="text-sm text-ink-soft">
            ✅ {richtig} richtig · ✏️ {falsch} zu üben
          </p>
          <button className="btn-primary" onClick={onClose}>
            {t.common.schliessen}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-faint">
            <span>
              Wort {index + 1} / {liste.length}
            </span>
            <span>Fach {fachVon(aktuell)}/5</span>
          </div>

          <div className="rounded-lg border border-paper-200 bg-paper-50 px-3 py-6 text-center">
            {aufgedeckt ? (
              <div className="flex justify-center">
                <WortAnzeige
                  wort={aktuell.wort}
                  silben={aktuell.silben}
                  merkstellen={aktuell.merkstellen}
                  mitMerkstellen
                  artikel={aktuell.artikel || undefined}
                  groesse={30}
                />
              </div>
            ) : (
              <p className="text-sm text-ink-soft">
                Wort anhören, aufschreiben – dann aufdecken und vergleichen.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {TTS_OK && (
              <button className="btn-ghost" onClick={() => sprichWort(aktuell.wort)}>
                <IconSpeaker width={18} height={18} /> Vorlesen
              </button>
            )}
            {!aufgedeckt ? (
              <button className="btn-primary" onClick={() => setAufgedeckt(true)}>
                Aufdecken
              </button>
            ) : (
              <>
                <button className="btn-danger" onClick={() => bewerten(false)}>
                  Nochmal üben
                </button>
                <button className="btn-primary" onClick={() => bewerten(true)}>
                  <IconCheck width={18} height={18} /> Richtig
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
