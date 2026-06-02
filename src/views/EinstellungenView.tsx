import { useRef, useState } from 'react';
import { IconDownload, IconUpload, IconTrash, IconCheck, IconPlus } from '@/components/icons';
import { repository } from '@/db/repository';
import {
  exportAll,
  downloadBackup,
  parseBackup,
  importBackup,
  type ImportModus,
} from '@/services/backup';
import { fontHinzufuegen, fontLoeschen } from '@/services/fonts';
import { useFonts } from '@/state/hooks';
import { GRUNDWORTSCHATZ_LISTEN } from '@/data/grundwortschatz';
import { newId } from '@/core/id';
import { t } from '@/i18n/de';
import type { CustomLineatur, Einstellungen, Lineatur } from '@/types';

const LINEATUREN: Lineatur[] = ['klasse1', 'klasse2', 'klasse3', 'klasse4', 'haus'];

export function EinstellungenModal({
  einstellungen,
  onClose,
}: {
  einstellungen: Einstellungen;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);

  // API-Schlüssel/Modelle werden erst per „Speichern"-Button übernommen.
  const [geminiKey, setGeminiKey] = useState(einstellungen.geminiApiKey);
  const [geminiModell, setGeminiModell] = useState(einstellungen.geminiModell);
  const [claudeKey, setClaudeKey] = useState(einstellungen.claudeApiKey);
  const [claudeModell, setClaudeModell] = useState(einstellungen.claudeModell);
  const [gespeichert, setGespeichert] = useState<string | null>(null);

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

  // Eigene Lineaturen
  const fonts = useFonts();
  const fontFileRef = useRef<HTMLInputElement>(null);
  const [fontName, setFontName] = useState('');
  const [nl, setNl] = useState({ name: '', ober: 4, band: 8, unter: 4, farbig: false });

  function lineaturHinzufuegen() {
    if (!nl.name.trim()) return;
    const neu: CustomLineatur = {
      id: newId(),
      name: nl.name.trim(),
      oberHoehe: nl.ober,
      bandHoehe: nl.band,
      unterHoehe: nl.unter,
      mittelbandFarbig: nl.farbig,
    };
    void repository.saveEinstellungen({
      customLineaturen: [...einstellungen.customLineaturen, neu],
    });
    setNl({ name: '', ober: 4, band: 8, unter: 4, farbig: false });
    flash('Eigene Lineatur gespeichert.');
  }
  function lineaturLoeschen(id: string) {
    void repository.saveEinstellungen({
      customLineaturen: einstellungen.customLineaturen.filter((l) => l.id !== id),
    });
  }
  async function fontHochladen(file: File) {
    try {
      await fontHinzufuegen(fontName, file);
      setFontName('');
      flash('Schriftart hinzugefügt.');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Schriftart konnte nicht hinzugefügt werden.');
    }
  }

  async function exportieren() {
    const backup = await exportAll();
    downloadBackup(backup);
  }

  async function importieren(datei: File, modus: ImportModus) {
    try {
      const text = await datei.text();
      const backup = parseBackup(text);
      if (
        modus === 'ersetzen' &&
        !confirm('Achtung: Alle vorhandenen Daten werden ersetzt. Fortfahren?')
      ) {
        return;
      }
      await importBackup(backup, modus);
      const anzahl =
        backup.daten.kinder.length + ' Kinder, ' + backup.daten.lernwoerter.length + ' Wörter';
      setImportInfo(`Import erfolgreich: ${anzahl}.`);
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
    <div className="space-y-6">
      {gespeichert && (
        <div className="rounded-lg bg-brand-100 px-3 py-2 text-sm text-brand-700" role="status">
          {gespeichert}
        </div>
      )}
      {/* KI / Gemini */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">KI-Textfunktion (Google Gemini)</h3>
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="set-key">
              API-Schlüssel
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
              Kostenlos erhältlich unter{' '}
              <a
                className="text-brand-600 underline"
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                aistudio.google.com/apikey
              </a>{' '}
              (ohne Kreditkarte). Der Schlüssel bleibt nur lokal gespeichert.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="set-modell">
              Modellname
            </label>
            <input
              id="set-modell"
              className="input font-mono"
              value={geminiModell}
              onChange={(e) => setGeminiModell(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Standard: <code>gemini-2.5-flash</code>. Bei neuen Modellen hier anpassbar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={speichereGemini}>
              <IconCheck width={18} height={18} /> Gemini-Zugang speichern
            </button>
          </div>
        </div>
      </section>

      {/* Foto-Texterkennung */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Foto-Texterkennung</h3>
        <p className="mb-2 text-sm text-ink-soft">
          In „Aus Text herauspicken" können Sie ein Foto hochladen; der Text wird automatisch
          erkannt. Standardmäßig wird dafür Gemini genutzt. Für deutlich bessere Ergebnisse
          (besonders bei Handschrift) lässt sich optional <strong>Claude Vision</strong> aktivieren.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={einstellungen.claudeVisionAktiv}
            onChange={(e) => set('claudeVisionAktiv', e.target.checked)}
          />
          Claude Vision für die Texterkennung verwenden
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
                <a
                  className="text-brand-600 underline"
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                >
                  console.anthropic.com
                </a>
                . Bleibt nur lokal gespeichert. Foto-Uploads gehen nur beim Erkennen an Claude.
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
              <p className="mt-1 text-xs text-ink-faint">
                Standard: <code>claude-opus-4-8</code>. Für günstigere/schnellere Erkennung z. B.{' '}
                <code>claude-haiku-4-5</code>.
              </p>
            </div>
            <button className="btn-primary" onClick={speichereClaude}>
              <IconCheck width={18} height={18} /> Claude-Zugang speichern
            </button>
          </div>
        )}
      </section>

      {/* Blattkopf & Standardwerte */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Blattkopf & Standardwerte</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="set-lehrkraft">
              Lehrkraft
            </label>
            <input
              id="set-lehrkraft"
              className="input"
              value={einstellungen.lehrkraftName}
              onChange={(e) => set('lehrkraftName', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="set-schule">
              Schule
            </label>
            <input
              id="set-schule"
              className="input"
              value={einstellungen.schulName}
              onChange={(e) => set('schulName', e.target.value)}
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
                  {t.lineatur[l]}
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
              value={einstellungen.standardWoerterProBlatt}
              onChange={(e) =>
                set('standardWoerterProBlatt', Math.max(1, Math.min(20, Number(e.target.value) || 10)))
              }
            />
          </div>
        </div>
      </section>

      {/* Grundwortschatz */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Grundwortschatz (Bundesland)</h3>
        <p className="mb-2 text-sm text-ink-soft">
          Wählen Sie eine offizielle Wortliste vor. In der Kartei können Sie daraus dann mit einem
          Klick Wörter in die Kartei eines Kindes übernehmen.
        </p>
        <select
          className="input"
          value={einstellungen.grundwortschatzId}
          onChange={(e) => set('grundwortschatzId', e.target.value)}
        >
          <option value="">— keine —</option>
          {GRUNDWORTSCHATZ_LISTEN.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-faint">
          Enthalten: Bayern (1/2, 3/4) und Nordrhein-Westfalen. Weitere Bundesländer (z. B. Hessen,
          Baden-Württemberg) lassen sich als zusätzliche Listen ergänzen.
        </p>
      </section>

      {/* Eigene Lineaturen */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Eigene Lineaturen</h3>
        <p className="mb-2 text-sm text-ink-soft">
          Legen Sie eigene Schreiblinien an (Maße in Millimetern: Oberlänge · Mittelband · Unterlänge).
          Diese erscheinen im Knickblatt zur Auswahl.
        </p>
        {einstellungen.customLineaturen.length > 0 && (
          <ul className="mb-2 divide-y divide-paper-200 rounded-lg border border-paper-200">
            {einstellungen.customLineaturen.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                <span>
                  {l.name}{' '}
                  <span className="text-ink-faint">
                    ({l.oberHoehe}·{l.bandHoehe}·{l.unterHoehe} mm
                    {l.mittelbandFarbig ? ', Mittelband' : ''})
                  </span>
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input
            className="input sm:col-span-2"
            placeholder="Name"
            value={nl.name}
            onChange={(e) => setNl({ ...nl, name: e.target.value })}
          />
          <input
            type="number"
            step="0.5"
            min={1}
            className="input"
            aria-label="Oberlänge mm"
            value={nl.ober}
            onChange={(e) => setNl({ ...nl, ober: Number(e.target.value) || 0 })}
          />
          <input
            type="number"
            step="0.5"
            min={2}
            className="input"
            aria-label="Mittelband mm"
            value={nl.band}
            onChange={(e) => setNl({ ...nl, band: Number(e.target.value) || 0 })}
          />
          <input
            type="number"
            step="0.5"
            min={1}
            className="input"
            aria-label="Unterlänge mm"
            value={nl.unter}
            onChange={(e) => setNl({ ...nl, unter: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={nl.farbig}
              onChange={(e) => setNl({ ...nl, farbig: e.target.checked })}
            />
            Mittelband farbig (Haus-Lineatur)
          </label>
          <button className="btn-secondary" onClick={lineaturHinzufuegen} disabled={!nl.name.trim()}>
            <IconPlus width={18} height={18} /> Lineatur hinzufügen
          </button>
        </div>
      </section>

      {/* Schriftarten */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Schriftarten</h3>
        <p className="mb-2 text-sm text-ink-soft">
          Fügen Sie eigene Schriften hinzu (z. B. eine Grundschrift/Schulausgangsschrift, für die Sie
          eine Lizenz besitzen). Die Datei bleibt lokal auf dem Gerät. Im Knickblatt ist die Schrift
          dann für die Vorlage wählbar.
        </p>
        {fonts.length > 0 && (
          <ul className="mb-2 divide-y divide-paper-200 rounded-lg border border-paper-200">
            {fonts.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="text-sm" style={{ fontFamily: f.name }}>
                  {f.name} – Aa Bb Cc Som-mer
                </span>
                <button
                  className="btn-ghost p-1 text-danger-500"
                  onClick={() => void fontLoeschen(f.id)}
                  aria-label="Schrift löschen"
                >
                  <IconTrash width={15} height={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input max-w-[12rem]"
            placeholder="Name (z. B. Grundschrift)"
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
          <button className="btn-secondary" onClick={() => fontFileRef.current?.click()}>
            <IconUpload width={18} height={18} /> Schriftdatei wählen
          </button>
        </div>
        <details className="mt-2 text-xs text-ink-soft">
          <summary className="cursor-pointer text-brand-600">
            Wo bekomme ich Grundschul-Schriften?
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>
              <strong>Kostenlos/offen:</strong>{' '}
              <a className="text-brand-600 underline" href="https://www.peter-wiegel.de/" target="_blank" rel="noreferrer">
                peter-wiegel.de
              </a>{' '}
              (freie deutsche Schulschriften, u. a. Schulausgangsschrift) ·{' '}
              <a className="text-brand-600 underline" href="https://software.sil.org/andika/" target="_blank" rel="noreferrer">
                Andika (SIL OFL)
              </a>{' '}
              – gut lesbare Fibelschrift.
            </li>
            <li>
              <strong>Lizenzpflichtig</strong> (offizielle „Grundschrift" / Ausgangsschriften):
              z. B. Grundschulverband, Pelikan, „medienwerkstatt", „Will Software". Nach dem Kauf die
              Schriftdatei hier hinzufügen.
            </li>
            <li>Hinweis: Bitte nur Schriften hinzufügen, deren Lizenz die Nutzung erlaubt.</li>
          </ul>
        </details>
      </section>

      {/* Datenschutz */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">{t.datenschutz.titel}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={einstellungen.nurInitialen}
            onChange={(e) => set('nurInitialen', e.target.checked)}
          />
          Nur Initialen/Spitznamen statt Klarnamen anzeigen
        </label>
        <p className="mt-1 text-xs text-ink-faint">{t.datenschutz.text}</p>
      </section>

      {/* Backup */}
      <section>
        <h3 className="mb-2 font-serif font-semibold text-ink">Datensicherung</h3>
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
      </section>

      {/* Zurücksetzen – bewusst zurückhaltend gestaltet */}
      <section className="border-t border-paper-200 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-faint">
            Alle Klassen, Kinder, Lernwörter und Texte unwiderruflich von diesem Gerät entfernen.
          </p>
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-danger-600 hover:bg-danger-500/10"
            onClick={allesLoeschen}
          >
            <IconTrash width={16} height={16} /> Alle Daten löschen
          </button>
        </div>
      </section>
    </div>
  );
}
