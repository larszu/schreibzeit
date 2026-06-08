import { useRef, useState } from 'react';
import { IconDownload, IconUpload, IconTrash, IconCheck, IconKey } from '@/components/icons';
import { Accordion } from '@/components/ui';
import { LineaturCropper } from '@/components/LineaturCropper';
import { PrintPortal } from '@/components/print/PrintPortal';
import { NamensschluesselDocument } from '@/components/print/NamensschluesselDocument';
import { drucke } from '@/services/print';
import { repository } from '@/db/repository';
import {
  exportAll,
  downloadBackup,
  parseBackup,
  importBackup,
  verworfenGesamt,
  type ImportModus,
} from '@/services/backup';
import { fontHinzufuegen, fontLoeschen, leseSchriftname, EINGEBAUTE_SCHRIFTEN } from '@/services/fonts';
import { SystemSchriftPicker } from '@/components/SystemSchriftPicker';
import { useFonts, useWortlisten } from '@/state/hooks';
import {
  GRUNDWORTSCHATZ_LISTEN,
  parseWortliste,
  wortlisteImportieren,
  wortlisteAktualisieren,
  wortlisteLoeschen,
  grundwortschatzCacheLeeren,
} from '@/data/grundwortschatz';
import { LINEATUR_LABEL } from '@/core/knickblatt';
import { newId } from '@/core/id';
import { t } from '@/i18n/de';
import type { CustomLineatur, Einstellungen, Kind, Klasse, Lineatur } from '@/types';

const LINEATUREN: Lineatur[] = ['klasse1', 'klasse2', 'klasse3', 'klasse4', 'haus'];

export function EinstellungenModal({
  einstellungen,
  kinder,
  klassen,
  onClose,
}: {
  einstellungen: Einstellungen;
  kinder: Kind[];
  klassen: Klasse[];
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const wortlisteRef = useRef<HTMLInputElement>(null);
  const fonts = useFonts();
  const wortlisten = useWortlisten();

  const [importInfo, setImportInfo] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState<string | null>(null);
  const [schluesselDruck, setSchluesselDruck] = useState(false);

  // API-Schlüssel/Modelle werden erst per „Speichern"-Button übernommen.
  const [geminiKey, setGeminiKey] = useState(einstellungen.geminiApiKey);
  const [geminiModell, setGeminiModell] = useState(einstellungen.geminiModell);
  const [claudeKey, setClaudeKey] = useState(einstellungen.claudeApiKey);
  const [claudeModell, setClaudeModell] = useState(einstellungen.claudeModell);
  const [fontName, setFontName] = useState('');
  // Ziel beim Wortlisten-Import: 'neu' = neue Liste, sonst die zu ersetzende ID.
  const [importZiel, setImportZiel] = useState<string>('neu');
  // Freitextfelder lokal halten (sonst „verschluckt" der an die Datenbank
  // gebundene Wert beim schnellen Tippen Zeichen) und erst beim Verlassen speichern.
  const [lehrkraft, setLehrkraft] = useState(einstellungen.lehrkraftName);
  const [schule, setSchule] = useState(einstellungen.schulName);
  const [wpb, setWpb] = useState(einstellungen.standardWoerterProBlatt);

  function flash(m: string) {
    setGespeichert(m);
    window.setTimeout(() => setGespeichert(null), 2500);
  }
  function set<K extends keyof Einstellungen>(key: K, value: Einstellungen[K]) {
    void repository.saveEinstellungen({ [key]: value } as Partial<Einstellungen>);
  }
  function speichereGemini() {
    void repository.saveEinstellungen({
      geminiApiKey: geminiKey.trim(),
      geminiModell: geminiModell.trim() || 'gemini-2.5-flash',
    });
    flash('Gemini-Zugang gespeichert.');
  }
  function speichereClaude() {
    void repository.saveEinstellungen({
      claudeApiKey: claudeKey.trim(),
      claudeModell: claudeModell.trim() || 'claude-opus-4-8',
    });
    flash('Claude-Zugang gespeichert.');
  }
  function addLineatur(name: string, bildUrl: string, hoeheMm: number) {
    const neu: CustomLineatur = { id: newId(), name, bildUrl, hoeheMm };
    void repository.saveEinstellungen({
      customLineaturen: [...einstellungen.customLineaturen, neu],
    });
    flash('Eigene Lineatur gespeichert.');
  }
  function lineaturLoeschen(id: string) {
    void repository.saveEinstellungen({
      customLineaturen: einstellungen.customLineaturen.filter((l) => l.id !== id),
    });
  }
  async function fontHochladen(file: File) {
    try {
      // Namensfeld leer? Internen Familiennamen aus der Datei auslesen.
      const name = fontName.trim() || (await leseSchriftname(file)) || '';
      const eintrag = await fontHinzufuegen(name, file);
      setFontName('');
      flash(`Schriftart „${eintrag.name}" hinzugefügt.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Schriftart konnte nicht hinzugefügt werden.');
    }
  }
  async function wortlisteHochladen(file: File) {
    try {
      const woerter = parseWortliste(await file.text());
      if (woerter.length === 0) {
        flash('Keine Wörter in der Datei gefunden.');
        return;
      }
      if (importZiel === 'neu') {
        const label = file.name.replace(/\.[^.]+$/, '');
        await wortlisteImportieren(label, woerter);
        flash(`Wortliste „${label}" importiert (${woerter.length} Wörter).`);
      } else {
        await wortlisteAktualisieren(importZiel, woerter);
        flash(`Wortliste aktualisiert (${woerter.length} Wörter).`);
      }
      setImportZiel('neu');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Import fehlgeschlagen.');
    }
  }
  function listenAktualisieren() {
    grundwortschatzCacheLeeren();
    flash('Wortlisten neu geladen.');
  }
  async function exportieren() {
    downloadBackup(await exportAll());
  }
  async function importieren(datei: File, modus: ImportModus) {
    try {
      const { backup, bericht } = parseBackup(await datei.text());
      if (modus === 'ersetzen' && !confirm('Achtung: Alle vorhandenen Daten werden ersetzt. Fortfahren?')) {
        return;
      }
      await importBackup(backup, modus);
      const verworfen = verworfenGesamt(bericht);
      const warnung = verworfen > 0 ? ` ${verworfen} Einträge konnten nicht gelesen werden und wurden übersprungen.` : '';
      setImportInfo(
        `Import erfolgreich: ${backup.daten.kinder.length} Kinder, ${backup.daten.lernwoerter.length} Wörter.${warnung}`,
      );
    } catch (e) {
      setImportInfo(e instanceof Error ? e.message : 'Import fehlgeschlagen.');
    }
  }
  async function allesLoeschen() {
    if (!confirm('Wirklich ALLE Daten unwiderruflich löschen?')) return;
    if (!confirm('Sind Sie ganz sicher? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    await repository.clearAll();
    onClose();
  }

  return (
    <div className="space-y-3">
      {gespeichert && (
        <div className="rounded-lg bg-brand-100 px-3 py-2 text-sm text-brand-700" role="status">
          {gespeichert}
        </div>
      )}

      <Accordion titel="KI &amp; Texterkennung" beschreibung="Übungstexte und Foto-Texterkennung">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="set-key">
              Gemini API-Schlüssel (Übungstexte &amp; Standard-Texterkennung)
            </label>
            <input
              id="set-key"
              type="password"
              className="input font-mono"
              value={geminiKey}
              placeholder="AIza…"
              onChange={(e) => setGeminiKey(e.target.value)}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Kostenlos unter{' '}
              <a className="text-brand-600 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                aistudio.google.com/apikey
              </a>
              . Bleibt nur lokal gespeichert.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="set-modell">
              Gemini-Modell
            </label>
            <input
              id="set-modell"
              className="input font-mono"
              value={geminiModell}
              onChange={(e) => setGeminiModell(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={speichereGemini}>
            <IconCheck width={18} height={18} /> Gemini-Zugang speichern
          </button>

          <div className="mt-2 border-t border-paper-200 pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-500"
                checked={einstellungen.claudeVisionAktiv}
                onChange={(e) => set('claudeVisionAktiv', e.target.checked)}
              />
              Claude Vision für die Foto-Texterkennung verwenden (bessere Handschrift-Erkennung)
            </label>
            {einstellungen.claudeVisionAktiv && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="label" htmlFor="set-claude-key">
                    Claude API-Schlüssel
                  </label>
                  <input
                    id="set-claude-key"
                    type="password"
                    className="input font-mono"
                    value={claudeKey}
                    placeholder="sk-ant-…"
                    onChange={(e) => setClaudeKey(e.target.value)}
                    autoComplete="off"
                  />
                  <p className="mt-1 text-xs text-ink-faint">
                    Schlüssel unter{' '}
                    <a className="text-brand-600 underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
                      console.anthropic.com
                    </a>
                    .
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="set-claude-modell">
                    Claude-Modell
                  </label>
                  <input
                    id="set-claude-modell"
                    className="input font-mono"
                    value={claudeModell}
                    onChange={(e) => setClaudeModell(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={speichereClaude}>
                  <IconCheck width={18} height={18} /> Claude-Zugang speichern
                </button>
              </div>
            )}
          </div>
        </div>
      </Accordion>

      <Accordion titel="Blatt-Standards" beschreibung="Kopfzeile, Lineatur, Wörter pro Blatt">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="set-lehrkraft">
              Lehrkraft
            </label>
            <input
              id="set-lehrkraft"
              className="input"
              value={lehrkraft}
              onChange={(e) => setLehrkraft(e.target.value)}
              onBlur={() => set('lehrkraftName', lehrkraft.trim())}
            />
          </div>
          <div>
            <label className="label" htmlFor="set-schule">
              Schule
            </label>
            <input
              id="set-schule"
              className="input"
              value={schule}
              onChange={(e) => setSchule(e.target.value)}
              onBlur={() => set('schulName', schule.trim())}
            />
          </div>
          <div>
            <label className="label" htmlFor="set-lineatur">
              Standard-Lineatur
            </label>
            <select
              id="set-lineatur"
              className="input"
              value={einstellungen.standardLineatur}
              onChange={(e) => set('standardLineatur', e.target.value as Lineatur)}
            >
              {LINEATUREN.map((l) => (
                <option key={l} value={l}>
                  {LINEATUR_LABEL[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="set-wpb">
              Wörter pro Knickblatt
            </label>
            <input
              id="set-wpb"
              type="number"
              min={1}
              max={20}
              className="input"
              value={wpb}
              onChange={(e) => setWpb(Math.max(1, Math.min(20, Number(e.target.value) || 10)))}
              onBlur={() => set('standardWoerterProBlatt', wpb)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="set-font">
            Standard-Schrift der Vorlage
          </label>
          <select
            id="set-font"
            className="input"
            value={einstellungen.standardVorlageFont}
            onChange={(e) => set('standardVorlageFont', e.target.value)}
          >
            {EINGEBAUTE_SCHRIFTEN.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
            {fonts.map((f) => (
              <option key={f.id} value={f.name}>
                {f.name} {f.system ? '(System-Schrift)' : '(eigene Schrift)'}
              </option>
            ))}
          </select>
          <p
            className="mt-1 truncate text-xl text-ink"
            style={{ fontFamily: einstellungen.standardVorlageFont || 'Andika' }}
          >
            Am Montag üben wir Som-mer.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Gilt für Knickblatt, Wortkarten und Elternblatt. Eigene Schriften unten hinzufügen.
          </p>
        </div>
      </Accordion>

      <Accordion titel="Eigene Lineaturen &amp; Schriftarten" beschreibung="Layout personalisieren">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-ink-soft">
              Eigene Lineatur aus einem Bild zuschneiden (z. B. ein abfotografiertes Heftlinien-Muster).
              Erscheint im Knickblatt zur Auswahl.
            </p>
            {einstellungen.customLineaturen.length > 0 && (
              <ul className="mb-2 divide-y divide-paper-200 rounded-lg border border-paper-200">
                {einstellungen.customLineaturen.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="flex items-center gap-2 text-sm">
                      <img src={l.bildUrl} alt="" className="h-6 w-24 rounded border border-paper-200 object-cover" />
                      {l.name} <span className="text-ink-faint">({l.hoeheMm} mm)</span>
                    </span>
                    <button
                      className="btn-ghost p-1 text-danger-500"
                      onClick={() => lineaturLoeschen(l.id)}
                      aria-label="Lineatur löschen"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <LineaturCropper onSave={addLineatur} />
          </div>

          <div className="border-t border-paper-200 pt-3">
            <p className="mb-2 text-sm text-ink-soft">
              Eigene Schriften (z. B. lizenzierte Grundschrift/Schulausgangsschrift) bleiben lokal und
              sind im Knickblatt für die Vorlage wählbar. Standard ist die mitgelieferte freie Schrift
              <strong> Andika</strong>.
            </p>
            {fonts.length > 0 && (
              <ul className="mb-3 divide-y divide-paper-200 rounded-lg border border-paper-200">
                {fonts.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm" style={{ fontFamily: `"${f.name}"` }}>
                      {f.name} – Aa Bb Som-mer
                      {f.system && <span className="ml-1 text-xs text-ink-faint">(System)</span>}
                    </span>
                    <button
                      className="btn-ghost shrink-0 p-1 text-danger-500"
                      onClick={() => void fontLoeschen(f.id)}
                      aria-label="Schrift löschen"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-4">
              {/* Eigene Schriftdatei hochladen */}
              <div className="space-y-2">
                <span className="label">Eigene Schriftdatei hochladen</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className="input sm:max-w-[14rem]"
                    placeholder="Name (optional)"
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                  />
                  <input
                    ref={fontFileRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void fontHochladen(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    className="btn-secondary shrink-0"
                    onClick={() => fontFileRef.current?.click()}
                  >
                    <IconUpload width={18} height={18} /> Schriftdatei wählen
                  </button>
                </div>
                <p className="text-xs text-ink-faint">
                  Name leer lassen → wird automatisch aus der Datei gelesen (.ttf/.otf).
                </p>
              </div>

              {/* Schon installierte System-Schrift verwenden (durchsuchbar, wie in Word) */}
              <div className="space-y-1.5">
                <span className="label">Schon installierte Schrift verwenden</span>
                <p className="text-xs text-ink-faint">
                  Nutzt eine bereits installierte Schrift (z. B. aus Word) – ohne erneutes Installieren.
                </p>
                <SystemSchriftPicker onAdded={(name) => flash(`Schrift „${name}" hinzugefügt.`)} />
              </div>
            </div>

            <details className="mt-3 text-xs text-ink-soft">
              <summary className="cursor-pointer text-brand-600">
                Wo bekomme ich Grundschul-Schriften?
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>
                  Frei/offen:{' '}
                  <a className="text-brand-600 underline" href="https://software.sil.org/andika/" target="_blank" rel="noreferrer">
                    Andika (mitgeliefert)
                  </a>
                </li>
                <li>Lizenzpflichtig: Grundschulverband, Pelikan, medienwerkstatt, Will Software – nach Kauf die Datei hier hinzufügen.</li>
              </ul>
            </details>
          </div>
        </div>
      </Accordion>

      <Accordion titel="Grundwortschatz (Bundesland)" beschreibung="Offizielle Wortlisten vorauswählen, eigene importieren">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="set-gws">
              Vorausgewählte Liste
            </label>
            <select
              id="set-gws"
              className="input"
              value={einstellungen.grundwortschatzId}
              onChange={(e) => set('grundwortschatzId', e.target.value)}
            >
              <option value="">— keine —</option>
              <optgroup label="Mitgeliefert">
                {GRUNDWORTSCHATZ_LISTEN.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
              {wortlisten.length > 0 && (
                <optgroup label="Eigene (importiert)">
                  {wortlisten.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} ({l.woerter.length})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="mt-1 text-xs text-ink-faint">
              Mitgeliefert: Bayern (1/2, 3/4) und NRW. In der Kartei dann „Aus Grundwortschatz" nutzen.
            </p>
          </div>

          <div className="border-t border-paper-200 pt-3">
            <p className="mb-2 text-sm text-ink-soft">
              Eigene Wortliste importieren – als <strong>.txt</strong> (ein Wort je Zeile) oder
              <strong> .json</strong> (Array). Bleibt lokal gespeichert.
            </p>
            {wortlisten.length > 0 && (
              <ul className="mb-2 divide-y divide-paper-200 rounded-lg border border-paper-200">
                {wortlisten.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                    <span>
                      {l.label} <span className="text-ink-faint">({l.woerter.length} Wörter)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        onClick={() => {
                          setImportZiel(l.id);
                          wortlisteRef.current?.click();
                        }}
                        title="Datei wählen und Wörter dieser Liste ersetzen"
                      >
                        Aktualisieren
                      </button>
                      <button
                        className="btn-ghost p-1 text-danger-500"
                        onClick={() => void wortlisteLoeschen(l.id)}
                        aria-label="Wortliste löschen"
                      >
                        <IconTrash width={15} height={15} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={wortlisteRef}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void wortlisteHochladen(f);
                e.target.value = '';
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-secondary"
                onClick={() => {
                  setImportZiel('neu');
                  wortlisteRef.current?.click();
                }}
              >
                <IconUpload width={18} height={18} /> Wortliste importieren
              </button>
              <button className="btn-secondary" onClick={listenAktualisieren} title="Zwischengespeicherte Listen neu laden">
                <IconCheck width={18} height={18} /> Listen aktualisieren
              </button>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion titel="Datenschutz" beschreibung="Pseudonyme &amp; lokale Speicherung">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={einstellungen.nurInitialen}
            onChange={(e) => set('nurInitialen', e.target.checked)}
          />
          Nur Initialen/Spitznamen statt Klarnamen anzeigen
        </label>
        <p className="mt-2 text-xs text-ink-faint">{t.datenschutz.text}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Tipp: Kinder mit Nummern/Decknamen anlegen und den Namensschlüssel auf Papier ausfüllen –
          so liegt kein Klarname in der App.
        </p>
        <button
          className="btn-secondary mt-3"
          onClick={() => {
            setSchluesselDruck(true);
            setTimeout(() => drucke(), 60);
          }}
          disabled={kinder.length === 0}
          title="Zuordnung Kürzel ↔ Klarname zum Ausdrucken (offline aufbewahren)"
        >
          <IconKey width={18} height={18} /> Namensschlüssel drucken
        </button>
      </Accordion>

      <Accordion titel="Datensicherung" beschreibung="Backup exportieren/importieren">
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportieren}>
            <IconDownload width={18} height={18} /> Backup exportieren
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importieren(f, (fileRef.current?.dataset.modus as ImportModus) || 'zusammenfuehren');
              e.target.value = '';
            }}
          />
          <button
            className="btn-secondary"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.dataset.modus = 'zusammenfuehren';
                fileRef.current.click();
              }
            }}
          >
            <IconUpload width={18} height={18} /> Import (zusammenführen)
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.dataset.modus = 'ersetzen';
                fileRef.current.click();
              }
            }}
          >
            <IconUpload width={18} height={18} /> Import (ersetzen)
          </button>
        </div>
        {importInfo && <p className="mt-2 text-sm text-brand-700">{importInfo}</p>}
      </Accordion>

      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <p className="text-xs text-ink-faint">Alle Daten unwiderruflich von diesem Gerät entfernen.</p>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-danger-600 hover:bg-danger-500/10"
          onClick={allesLoeschen}
        >
          <IconTrash width={16} height={16} /> Alle Daten löschen
        </button>
      </div>

      {schluesselDruck && (
        <PrintPortal solo>
          <NamensschluesselDocument
            kinder={kinder}
            klassen={klassen}
            schule={einstellungen.schulName || undefined}
            lehrkraft={einstellungen.lehrkraftName || undefined}
          />
        </PrintPortal>
      )}
    </div>
  );
}
