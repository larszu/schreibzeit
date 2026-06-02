import { useRef, useState } from 'react';
import { IconDownload, IconUpload, IconTrash } from '@/components/icons';
import { repository } from '@/db/repository';
import {
  exportAll,
  downloadBackup,
  parseBackup,
  importBackup,
  type ImportModus,
} from '@/services/backup';
import { t } from '@/i18n/de';
import type { Einstellungen, Lineatur } from '@/types';

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

  function set<K extends keyof Einstellungen>(key: K, value: Einstellungen[K]) {
    void repository.saveEinstellungen({ [key]: value } as Partial<Einstellungen>);
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
              value={einstellungen.geminiApiKey}
              placeholder="AIza…"
              onChange={(e) => set('geminiApiKey', e.target.value)}
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
              value={einstellungen.geminiModell}
              onChange={(e) => set('geminiModell', e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Standard: <code>gemini-2.5-flash</code>. Bei neuen Modellen hier anpassbar.
            </p>
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
                value={einstellungen.claudeApiKey}
                placeholder="sk-ant-…"
                onChange={(e) => set('claudeApiKey', e.target.value)}
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
                value={einstellungen.claudeModell}
                onChange={(e) => set('claudeModell', e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-faint">
                Standard: <code>claude-opus-4-8</code>. Für günstigere/schnellere Erkennung z. B.{' '}
                <code>claude-haiku-4-5</code>.
              </p>
            </div>
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

      {/* Gefahrenzone */}
      <section className="rounded-lg border border-danger-500/30 bg-danger-500/5 p-3">
        <h3 className="mb-1 font-serif font-semibold text-danger-600">Alle Daten löschen</h3>
        <p className="mb-2 text-sm text-ink-soft">
          Entfernt alle Klassen, Kinder, Lernwörter und Texte unwiderruflich von diesem Gerät.
        </p>
        <button className="btn-danger" onClick={allesLoeschen}>
          <IconTrash width={18} height={18} /> Alle Daten löschen
        </button>
      </section>
    </div>
  );
}
