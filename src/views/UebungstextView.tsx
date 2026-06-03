import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Modal } from '@/components/ui';
import { IconSparkles, IconPrint, IconTrash, IconCheck } from '@/components/icons';
import { PrintPortal } from '@/components/print/PrintPortal';
import { TextDocument } from '@/components/print/TextDocument';
import { WortAuswahlListe } from '@/components/WortAuswahlListe';
import { generateUebungstext, GeminiError } from '@/services/gemini';
import { repository } from '@/db/repository';
import { useLernwoerter, useUebungstexte } from '@/state/hooks';
import { displayName } from '@/state/store';
import { t } from '@/i18n/de';
import { drucke } from '@/services/print';
import type { Einstellungen, Kind, TextArt, Uebungstext } from '@/types';

const TEXTARTEN: TextArt[] = ['geschichte', 'lueckentext', 'quatschsaetze'];

export function UebungstextView({
  kind,
  einstellungen,
}: {
  kind: Kind;
  einstellungen: Einstellungen;
}) {
  const woerter = useLernwoerter(kind.id);
  const gespeicherte = useUebungstexte(kind.id);

  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  // Ein einziges Textfeld – per Hand oder „Automatisch ausfüllen" befüllt.
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [textart, setTextart] = useState<TextArt>('geschichte');
  const [loesungswoerter, setLoesungswoerter] = useState<string[] | undefined>(undefined);
  const [autoOffen, setAutoOffen] = useState(false);
  const [druckText, setDruckText] = useState<Uebungstext | null>(null);

  useEffect(() => {
    setText('');
    setTitel('');
    setLoesungswoerter(undefined);
  }, [kind.id]);

  const initialisiertFuer = useRef<string | null>(null);
  useEffect(() => {
    if (initialisiertFuer.current !== kind.id && woerter.length > 0) {
      setAuswahl(new Set(woerter.slice(0, 8).map((w) => w.id)));
      initialisiertFuer.current = kind.id;
    }
  }, [kind.id, woerter]);

  const gewaehlteWoerter = useMemo(
    () => woerter.filter((w) => auswahl.has(w.id)).map((w) => w.wort),
    [woerter, auswahl],
  );

  // Prüfung: welche gewählten Lernwörter fehlen noch im Text?
  const fehlendeWoerter = useMemo(() => {
    return gewaehlteWoerter.filter((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return !new RegExp(`(?<![\\p{L}])${esc}(?![\\p{L}])`, 'iu').test(text);
    });
  }, [gewaehlteWoerter, text]);

  function aktuellerText(): Uebungstext {
    return {
      id: '',
      kindId: kind.id,
      titel: titel.trim() || 'Übungstext',
      textart,
      text,
      loesungswoerter,
      verwendeteWoerter: gewaehlteWoerter,
      erstelltAm: Date.now(),
      geaendertAm: Date.now(),
    };
  }

  async function speichern() {
    if (!text.trim()) return;
    await repository.saveUebungstext({
      kindId: kind.id,
      titel: titel.trim() || 'Übungstext',
      textart,
      text,
      loesungswoerter,
      verwendeteWoerter: gewaehlteWoerter,
    });
    setText('');
    setTitel('');
    setLoesungswoerter(undefined);
  }

  function druckeText(t: Uebungstext) {
    setDruckText(t);
    // Nach dem Rendern des Druckbereichs den Druck auslösen.
    setTimeout(() => drucke(), 60);
  }

  // Ergebnis der automatischen Texterzeugung in das eine Textfeld übernehmen.
  function autoErgebnis(res: {
    text: string;
    titel: string;
    textart: TextArt;
    loesungswoerter?: string[];
  }) {
    setText(res.text);
    setTextart(res.textart);
    setLoesungswoerter(res.loesungswoerter);
    if (!titel.trim()) setTitel(res.titel);
    setAutoOffen(false);
  }

  if (woerter.length === 0) {
    return (
      <EmptyState
        titel="Noch keine Lernwörter"
        text="Legen Sie zuerst Lernwörter an, um daraus einen Übungstext zu schreiben."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-2 font-serif font-semibold text-ink">Lernwörter ({auswahl.size})</h3>
          <p className="mb-2 text-xs text-ink-faint">
            Diese Wörter sollen im Text vorkommen – sie werden unten geprüft.
          </p>
          <WortAuswahlListe
            woerter={woerter}
            maxHeight="max-h-72"
            istGewaehlt={(id) => auswahl.has(id)}
            onToggle={(id) =>
              setAuswahl((alt) => {
                const neu = new Set(alt);
                if (neu.has(id)) neu.delete(id);
                else neu.add(id);
                return neu;
              })
            }
          />
        </div>
      </div>

      {/* Ein Textfeld + gespeicherte Texte */}
      <div className="space-y-4">
        <div className="card p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 font-serif font-semibold"
              placeholder="Titel (z. B. Übungstext Montag)"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
            />
            <button
              className="btn-secondary shrink-0"
              onClick={() => setAutoOffen(true)}
              title="Text automatisch mit den Lernwörtern erzeugen (KI)"
            >
              <IconSparkles width={18} height={18} /> Automatisch ausfüllen
            </button>
          </div>
          <textarea
            className="input min-h-[220px] font-serif text-base leading-relaxed"
            placeholder="Übungstext schreiben oder „Automatisch ausfüllen“ nutzen … die ausgewählten Lernwörter sollten alle vorkommen."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {loesungswoerter && loesungswoerter.length > 0 && (
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-medium">Lösungswörter:</span> {loesungswoerter.join(' · ')}
            </p>
          )}
          <div className="mt-2 text-sm">
            {gewaehlteWoerter.length === 0 ? (
              <p className="text-ink-faint">Links Lernwörter auswählen, die vorkommen sollen.</p>
            ) : fehlendeWoerter.length === 0 ? (
              <p className="flex items-center gap-1 text-brand-700">
                <IconCheck width={16} height={16} /> Alle {gewaehlteWoerter.length} Lernwörter
                verwendet.
              </p>
            ) : (
              <p className="text-danger-600">
                Noch nicht verwendet ({fehlendeWoerter.length}): {fehlendeWoerter.join(', ')}
              </p>
            )}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => druckeText(aktuellerText())} disabled={!text.trim()}>
              <IconPrint width={18} height={18} /> {t.common.drucken}
            </button>
            <button className="btn-primary" onClick={speichern} disabled={!text.trim()}>
              <IconCheck width={18} height={18} /> Am Kind speichern
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-serif font-semibold text-ink">Gespeicherte Texte</h3>
          {gespeicherte.length === 0 ? (
            <p className="text-sm text-ink-faint">Noch keine Texte gespeichert.</p>
          ) : (
            <ul className="space-y-2">
              {gespeicherte.map((gt) => (
                <GespeicherterText key={gt.id} text={gt} onDruck={() => druckeText(gt)} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <AutoFuellenModal
        offen={autoOffen}
        kind={kind}
        einstellungen={einstellungen}
        gewaehlteWoerter={gewaehlteWoerter}
        onClose={() => setAutoOffen(false)}
        onErgebnis={autoErgebnis}
      />

      {druckText && (
        <PrintPortal solo>
          <TextDocument
            titel={druckText.titel}
            text={druckText.text}
            loesungswoerter={druckText.loesungswoerter}
            kopf={{
              kindName: displayName(kind.name, einstellungen.nurInitialen),
              datum: new Date().toLocaleDateString('de-DE'),
              lehrkraft: einstellungen.lehrkraftName || undefined,
              schule: einstellungen.schulName || undefined,
            }}
          />
        </PrintPortal>
      )}
    </div>
  );
}

/** Dialog mit den KI-Einstellungen; erzeugt einen Text und gibt ihn zurück. */
function AutoFuellenModal({
  offen,
  kind,
  einstellungen,
  gewaehlteWoerter,
  onClose,
  onErgebnis,
}: {
  offen: boolean;
  kind: Kind;
  einstellungen: Einstellungen;
  gewaehlteWoerter: string[];
  onClose: () => void;
  onErgebnis: (res: {
    text: string;
    titel: string;
    textart: TextArt;
    loesungswoerter?: string[];
  }) => void;
}) {
  const [textart, setTextart] = useState<TextArt>('geschichte');
  const [laenge, setLaenge] = useState(5);
  const [thema, setThema] = useState('');
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (offen) setFehler(null);
  }, [offen]);

  const keinKey = !einstellungen.geminiApiKey.trim();

  async function generieren() {
    if (gewaehlteWoerter.length === 0) return;
    setLaden(true);
    setFehler(null);
    try {
      const res = await generateUebungstext(
        {
          woerter: gewaehlteWoerter,
          textart,
          lernstand: kind.lernstand,
          laengeSaetze: laenge,
          thema: thema.trim() || undefined,
        },
        { apiKey: einstellungen.geminiApiKey, modell: einstellungen.geminiModell },
      );
      onErgebnis({
        text: res.text,
        titel: `${t.textart[textart]}${thema.trim() ? ` – ${thema.trim()}` : ''}`,
        textart,
        loesungswoerter: res.loesungswoerter,
      });
    } catch (e) {
      setFehler(
        e instanceof GeminiError
          ? e.message
          : 'Unbekannter Fehler bei der Texterzeugung. Bitte erneut versuchen.',
      );
    } finally {
      setLaden(false);
    }
  }

  return (
    <Modal offen={offen} titel="Automatisch ausfüllen" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">
          Erzeugt aus den {gewaehlteWoerter.length} gewählten Lernwörtern einen passenden Text. Das
          Ergebnis landet im Textfeld und kann dort noch bearbeitet werden.
        </p>

        {keinKey && (
          <div className="rounded-lg border border-accent-400/40 bg-accent-400/10 p-3 text-sm text-ink-soft">
            Noch kein Gemini-Schlüssel hinterlegt. Bitte in den <strong>Einstellungen</strong>{' '}
            eintragen (kostenlos unter{' '}
            <a className="text-brand-600 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              aistudio.google.com/apikey
            </a>
            ).
          </div>
        )}

        <div>
          <label className="label" htmlFor="ut-art">
            Textart
          </label>
          <select
            id="ut-art"
            className="input"
            value={textart}
            onChange={(e) => setTextart(e.target.value as TextArt)}
          >
            {TEXTARTEN.map((a) => (
              <option key={a} value={a}>
                {t.textart[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ut-laenge">
              Länge (Sätze)
            </label>
            <input
              id="ut-laenge"
              type="number"
              min={2}
              max={15}
              className="input"
              value={laenge}
              onChange={(e) => setLaenge(Math.max(2, Math.min(15, Number(e.target.value) || 2)))}
            />
          </div>
          <div>
            <label className="label">Lernstand</label>
            <div className="input bg-paper-50 text-ink-soft">{t.lernstand[kind.lernstand]}</div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ut-thema">
            Thema (optional)
          </label>
          <input
            id="ut-thema"
            className="input"
            value={thema}
            placeholder="z. B. Im Zoo"
            onChange={(e) => setThema(e.target.value)}
          />
        </div>

        {fehler && (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 p-3 text-sm text-danger-600">
            {fehler}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary" onClick={onClose}>
            {t.common.abbrechen}
          </button>
          <button
            className="btn-primary"
            onClick={generieren}
            disabled={laden || keinKey || gewaehlteWoerter.length === 0}
          >
            <IconSparkles width={18} height={18} />
            {laden ? 'Text wird erzeugt …' : 'Text erzeugen'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GespeicherterText({ text, onDruck }: { text: Uebungstext; onDruck: () => void }) {
  const [offen, setOffen] = useState(false);
  return (
    <li className="card p-3">
      <div className="flex items-center gap-2">
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setOffen((o) => !o)}
          aria-expanded={offen}
        >
          <span className="block truncate font-serif font-medium text-ink">{text.titel}</span>
          <span className="text-xs text-ink-faint">
            {t.textart[text.textart]} · {new Date(text.erstelltAm).toLocaleDateString('de-DE')}
          </span>
        </button>
        <button className="btn-ghost p-1.5" onClick={onDruck} aria-label="Drucken">
          <IconPrint width={16} height={16} />
        </button>
        <button
          className="btn-ghost p-1.5 text-danger-500"
          onClick={() => {
            if (confirm('Text löschen?')) void repository.deleteUebungstext(text.id);
          }}
          aria-label="Löschen"
        >
          <IconTrash width={16} height={16} />
        </button>
      </div>
      {offen && (
        <p className="mt-2 whitespace-pre-wrap border-t border-paper-200 pt-2 font-serif text-sm leading-relaxed text-ink-soft">
          {text.text}
        </p>
      )}
    </li>
  );
}
