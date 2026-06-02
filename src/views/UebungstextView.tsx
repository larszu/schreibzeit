import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui';
import { IconSparkles, IconPrint, IconTrash, IconCheck } from '@/components/icons';
import { PrintPortal } from '@/components/print/PrintPortal';
import { TextDocument } from '@/components/print/TextDocument';
import { generateUebungstext, GeminiError } from '@/services/gemini';
import { repository } from '@/db/repository';
import { useLernwoerter, useUebungstexte } from '@/state/hooks';
import { displayName } from '@/state/store';
import { t } from '@/i18n/de';
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
  const [textart, setTextart] = useState<TextArt>('geschichte');
  const [laenge, setLaenge] = useState(5);
  const [thema, setThema] = useState('');
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  // Aktueller (noch nicht gespeicherter) Ergebnistext.
  const [ergebnis, setErgebnis] = useState<Uebungstext | null>(null);
  const [druckText, setDruckText] = useState<Uebungstext | null>(null);

  useEffect(() => {
    setErgebnis(null);
    setFehler(null);
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
      setErgebnis({
        id: '',
        kindId: kind.id,
        titel: `${t.textart[textart]}${thema ? ` – ${thema}` : ''}`,
        textart,
        text: res.text,
        loesungswoerter: res.loesungswoerter,
        verwendeteWoerter: gewaehlteWoerter,
        erstelltAm: Date.now(),
        geaendertAm: Date.now(),
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

  async function speichern() {
    if (!ergebnis) return;
    await repository.saveUebungstext({
      kindId: kind.id,
      titel: ergebnis.titel,
      textart: ergebnis.textart,
      text: ergebnis.text,
      loesungswoerter: ergebnis.loesungswoerter,
      verwendeteWoerter: ergebnis.verwendeteWoerter,
    });
    setErgebnis(null);
  }

  function drucke(text: Uebungstext) {
    setDruckText(text);
    // Nach dem Rendern des Druckbereichs den Druckdialog öffnen.
    setTimeout(() => window.print(), 60);
  }

  if (woerter.length === 0) {
    return (
      <EmptyState
        titel="Noch keine Lernwörter"
        text="Legen Sie zuerst Lernwörter an, damit die KI einen passenden Übungstext erzeugen kann."
      />
    );
  }

  const keinKey = !einstellungen.geminiApiKey.trim();

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-3 font-serif font-semibold text-ink">KI-Übungstext erzeugen</h3>

          {keinKey && (
            <div className="mb-3 rounded-lg border border-accent-400/40 bg-accent-400/10 p-3 text-sm text-ink-soft">
              Noch kein Gemini-Schlüssel hinterlegt. Bitte in den{' '}
              <strong>Einstellungen</strong> eintragen (kostenlos unter{' '}
              <a
                className="text-brand-600 underline"
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                aistudio.google.com/apikey
              </a>
              ).
            </div>
          )}

          <div className="space-y-3">
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
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 font-serif font-semibold text-ink">
            Lernwörter ({auswahl.size})
          </h3>
          <ul className="max-h-52 space-y-0.5 overflow-y-auto">
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

        <button
          className="btn-primary w-full"
          onClick={generieren}
          disabled={laden || keinKey || gewaehlteWoerter.length === 0}
        >
          <IconSparkles width={18} height={18} />
          {laden ? 'Text wird erzeugt …' : 'Text erzeugen'}
        </button>
      </div>

      {/* Ergebnis + gespeicherte Texte */}
      <div className="space-y-4">
        {fehler && (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 p-3 text-sm text-danger-600">
            {fehler}
          </div>
        )}

        {ergebnis && (
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                className="input font-serif font-semibold"
                value={ergebnis.titel}
                onChange={(e) => setErgebnis({ ...ergebnis, titel: e.target.value })}
              />
            </div>
            <textarea
              className="input min-h-[200px] font-serif text-base leading-relaxed"
              value={ergebnis.text}
              onChange={(e) => setErgebnis({ ...ergebnis, text: e.target.value })}
            />
            {ergebnis.loesungswoerter && ergebnis.loesungswoerter.length > 0 && (
              <p className="mt-2 text-sm text-ink-soft">
                <span className="font-medium">Lösungswörter:</span>{' '}
                {ergebnis.loesungswoerter.join(' · ')}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => drucke(ergebnis)}>
                <IconPrint width={18} height={18} /> {t.common.drucken}
              </button>
              <button className="btn-primary" onClick={speichern}>
                <IconCheck width={18} height={18} /> Am Kind speichern
              </button>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 font-serif font-semibold text-ink">Gespeicherte Texte</h3>
          {gespeicherte.length === 0 ? (
            <p className="text-sm text-ink-faint">Noch keine Texte gespeichert.</p>
          ) : (
            <ul className="space-y-2">
              {gespeicherte.map((text) => (
                <GespeicherterText key={text.id} text={text} onDruck={() => drucke(text)} />
              ))}
            </ul>
          )}
        </div>
      </div>

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
