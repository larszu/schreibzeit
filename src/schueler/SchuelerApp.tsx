// Schüler-Client: eigene, kindgerechte Oberfläche, die über einen geteilten
// Link (#ueben=…) geöffnet wird. Lädt die Wörter aus dem Link, lässt das Kind
// nach der Methode „Anschauen – Abdecken – Schreiben – Vergleichen" üben und
// speichert den Fortschritt (Leitner-Fächer) lokal auf dem Schülergerät.
//
// Bewusst getrennt von der Lehrer-App: kein Zugriff auf die Kartei-Datenbank,
// keine Einstellungen – nur Link-Inhalt + localStorage.

import { useMemo, useState } from 'react';
import { WortAnzeige } from '@/components/print/WortAnzeige';
import { faelligeWoerter, fachVon, naechsterStand } from '@/core/srs';
import { fortschrittSchluessel, leseUebenPaketAusHash } from '@/core/uebenLink';
import type { WortStatus } from '@/types';

interface Lernitem {
  w: string;
  s: string[];
  m: number[];
  a?: string;
  fach: number;
  faelligAm: number;
  status: WortStatus;
}

type Stand = { fach: number; faelligAm: number; status: WortStatus };
type Fortschritt = Record<string, Stand>;
type Phase = 'anschauen' | 'schreiben' | 'pruefen';

function ladeFortschritt(key: string): Fortschritt {
  try {
    const roh = localStorage.getItem(key);
    return roh ? (JSON.parse(roh) as Fortschritt) : {};
  } catch {
    return {};
  }
}

export function SchuelerApp() {
  const paket = useMemo(() => leseUebenPaketAusHash(), []);
  const key = useMemo(() => fortschrittSchluessel(location.hash), []);

  const [fortschritt, setFortschritt] = useState<Fortschritt>(() => ladeFortschritt(key));
  const [runde, setRunde] = useState<Lernitem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('anschauen');
  const [richtig, setRichtig] = useState(0);
  const [zuUeben, setZuUeben] = useState(0);

  // Wörter des Pakets mit dem lokal gespeicherten Lernstand zusammenführen.
  const items = useMemo<Lernitem[]>(() => {
    if (!paket) return [];
    return paket.woerter.map((w) => {
      const st = fortschritt[w.w];
      return {
        w: w.w,
        s: w.s ?? [w.w],
        m: w.m ?? [],
        a: w.a || undefined,
        fach: st?.fach ?? 1,
        faelligAm: st?.faelligAm ?? 0,
        status: st?.status ?? 'neu',
      };
    });
  }, [paket, fortschritt]);

  const faelligAnzahl = useMemo(() => faelligeWoerter(items).length, [items]);
  const gemeistert = items.filter((i) => i.status === 'sitzt').length;

  if (!paket) return <UngueltigerLink />;

  function starten(alle: boolean) {
    const liste = alle ? items : faelligeWoerter(items);
    if (liste.length === 0) return;
    setRunde(liste);
    setIndex(0);
    setPhase('anschauen');
    setRichtig(0);
    setZuUeben(0);
  }

  function bewerten(korrekt: boolean) {
    const item = runde?.[index];
    if (!item) return;
    const stand = naechsterStand(item, korrekt);
    const next: Fortschritt = {
      ...fortschritt,
      [item.w]: { fach: stand.fach, faelligAm: stand.faelligAm, status: stand.status },
    };
    setFortschritt(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Speicher nicht verfügbar (z. B. privater Modus) – Übung läuft trotzdem.
    }
    if (korrekt) setRichtig((r) => r + 1);
    else setZuUeben((z) => z + 1);
    setPhase('anschauen');
    setIndex((i) => i + 1);
  }

  const aktuell = runde?.[index];
  const fertig = runde !== null && index >= runde.length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper-100">
      <header className="border-b border-paper-200 bg-paper-50 px-4 py-4 text-center">
        <p className="text-sm text-ink-faint">Schreibzeit · Üben</p>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Hallo{paket.n ? ` ${paket.n}` : ''}! 👋
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-6">
        {runde === null ? (
          <Startkarte
            gesamt={items.length}
            faellig={faelligAnzahl}
            gemeistert={gemeistert}
            onStartFaellig={() => starten(false)}
            onStartAlle={() => starten(true)}
          />
        ) : fertig ? (
          <Fertigkarte
            richtig={richtig}
            zuUeben={zuUeben}
            onNochmal={() => setRunde(null)}
          />
        ) : aktuell ? (
          <Uebungskarte
            item={aktuell}
            position={index + 1}
            gesamt={runde.length}
            phase={phase}
            onAbdecken={() => setPhase('schreiben')}
            onAufdecken={() => setPhase('pruefen')}
            onBewerten={bewerten}
          />
        ) : null}
      </main>

      <footer className="px-4 py-3 text-center text-xs text-ink-faint">
        Dein Fortschritt wird nur auf diesem Gerät gespeichert.
      </footer>
    </div>
  );
}

function Startkarte({
  gesamt,
  faellig,
  gemeistert,
  onStartFaellig,
  onStartAlle,
}: {
  gesamt: number;
  faellig: number;
  gemeistert: number;
  onStartFaellig: () => void;
  onStartAlle: () => void;
}) {
  return (
    <div className="card p-6 text-center sm:p-8">
      <p className="text-5xl">📚</p>
      <h2 className="mt-3 font-serif text-xl font-semibold text-ink">Deine Lernwörter</h2>
      <div className="mt-4 flex justify-center gap-6 text-sm text-ink-soft">
        <span>
          <span className="block text-2xl font-semibold text-ink">{gesamt}</span>Wörter
        </span>
        <span>
          <span className="block text-2xl font-semibold text-brand-600">{faellig}</span>heute dran
        </span>
        <span>
          <span className="block text-2xl font-semibold text-accent-600">{gemeistert}</span>sitzen
        </span>
      </div>

      {faellig > 0 ? (
        <button className="btn-primary mt-6 w-full py-3 text-base" onClick={onStartFaellig}>
          ▶ Üben starten ({faellig})
        </button>
      ) : (
        <>
          <p className="mt-6 font-serif text-lg text-ink">Heute ist alles geübt 🎉</p>
          <p className="text-sm text-ink-soft">Komm morgen wieder – oder übe trotzdem alle.</p>
        </>
      )}
      {gesamt > 0 && (
        <button
          className="btn-secondary mt-3 w-full py-2.5"
          onClick={onStartAlle}
        >
          Alle Wörter üben
        </button>
      )}

      <p className="mt-6 text-left text-xs leading-relaxed text-ink-faint">
        <strong className="text-ink-soft">So geht's:</strong> Schau dir das Wort genau an und merk
        es dir. Dann decke es ab und schreibe es auf dein Blatt. Zum Schluss deckst du es wieder auf
        und vergleichst.
      </p>
    </div>
  );
}

function Uebungskarte({
  item,
  position,
  gesamt,
  phase,
  onAbdecken,
  onAufdecken,
  onBewerten,
}: {
  item: Lernitem;
  position: number;
  gesamt: number;
  phase: Phase;
  onAbdecken: () => void;
  onAufdecken: () => void;
  onBewerten: (korrekt: boolean) => void;
}) {
  const fach = fachVon(item);
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>
          Wort {position} von {gesamt}
        </span>
        <span aria-label={`Kasten ${fach} von 5`}>
          {'★'.repeat(fach)}
          <span className="text-paper-300">{'★'.repeat(5 - fach)}</span>
        </span>
      </div>

      <div className="mt-4 flex min-h-[160px] items-center justify-center rounded-xl2 border border-paper-200 bg-paper-50 px-3 py-8">
        {phase === 'schreiben' ? (
          <p className="text-center text-lg text-ink-soft">
            ✍️ Schreibe das Wort
            <br />
            auf dein Blatt.
          </p>
        ) : (
          <WortAnzeige
            wort={item.w}
            silben={item.s}
            merkstellen={item.m}
            mitSilben
            mitMerkstellen
            artikel={item.a}
            groesse={56}
          />
        )}
      </div>

      <p className="mt-4 text-center text-sm text-ink-soft">
        {phase === 'anschauen' && 'Schau genau hin und merk dir das Wort.'}
        {phase === 'schreiben' && 'Fertig geschrieben? Dann vergleiche.'}
        {phase === 'pruefen' && 'Hast du es richtig geschrieben?'}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {phase === 'anschauen' && (
          <button className="btn-primary w-full py-3 text-base" onClick={onAbdecken}>
            Abdecken
          </button>
        )}
        {phase === 'schreiben' && (
          <button className="btn-primary w-full py-3 text-base" onClick={onAufdecken}>
            Aufdecken & vergleichen
          </button>
        )}
        {phase === 'pruefen' && (
          <>
            <button
              className="btn-secondary flex-1 py-3 text-base"
              onClick={() => onBewerten(false)}
            >
              ✗ Nochmal üben
            </button>
            <button className="btn-primary flex-1 py-3 text-base" onClick={() => onBewerten(true)}>
              ✓ Richtig
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Fertigkarte({
  richtig,
  zuUeben,
  onNochmal,
}: {
  richtig: number;
  zuUeben: number;
  onNochmal: () => void;
}) {
  return (
    <div className="card p-6 text-center sm:p-8">
      <p className="text-5xl">{zuUeben === 0 ? '🌟' : '👏'}</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">Geschafft!</h2>
      <p className="mt-2 text-ink-soft">
        ✅ {richtig} richtig{zuUeben > 0 && <> · ✏️ {zuUeben} weiterüben</>}
      </p>
      <button className="btn-primary mt-6 w-full py-3 text-base" onClick={onNochmal}>
        Zurück
      </button>
    </div>
  );
}

function UngueltigerLink() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper-100 p-6">
      <div className="card max-w-md p-8 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-3 font-serif text-xl font-semibold text-ink">Übung nicht gefunden</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Dieser Übungslink ist unvollständig oder beschädigt. Bitte öffne den vollständigen Link,
          den du von deiner Lehrerin oder deinem Lehrer bekommen hast.
        </p>
      </div>
    </div>
  );
}
