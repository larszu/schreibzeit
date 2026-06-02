import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconEdit,
  IconTrash,
  IconKey,
} from './icons';
import { Modal } from './ui';
import { PrintPortal } from './print/PrintPortal';
import { NamensschluesselDocument } from './print/NamensschluesselDocument';
import { repository } from '@/db/repository';
import { displayName } from '@/state/store';
import { t } from '@/i18n/de';
import { drucke } from '@/services/print';
import { KLASSEN_FARBEN, farbeFuerIndex } from '@/core/farben';
import type { Einstellungen, Kind, Klasse, Lernstand } from '@/types';

const LERNSTAENDE: Lernstand[] = ['klasse1', 'klasse2', 'klasse3', 'klasse4', 'foerder', 'lrs'];

export function Sidebar({
  kinder,
  klassen,
  einstellungen,
  selectedKindId,
  onSelect,
}: {
  kinder: Kind[];
  klassen: Klasse[];
  einstellungen: Einstellungen;
  selectedKindId?: string;
  onSelect: (id: string) => void;
}) {
  const [suche, setSuche] = useState('');
  const [klasseFilter, setKlasseFilter] = useState<string>('alle');
  const [kindModal, setKindModal] = useState<{ offen: boolean; kind?: Kind }>({ offen: false });
  const [klassenModal, setKlassenModal] = useState(false);
  const [schluesselDruck, setSchluesselDruck] = useState(false);

  const klasseFarbe = useMemo(() => {
    const m = new Map<string, string | undefined>();
    klassen.forEach((c) => m.set(c.id, c.farbe));
    return m;
  }, [klassen]);

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return kinder.filter((k) => {
      if (klasseFilter === 'ohne' && k.klasseId) return false;
      if (klasseFilter !== 'alle' && klasseFilter !== 'ohne' && k.klasseId !== klasseFilter) return false;
      return !q || k.name.toLowerCase().includes(q);
    });
  }, [kinder, suche, klasseFilter]);

  return (
    <aside className="flex h-full flex-col border-r border-paper-200 bg-paper-50">
      {/* Kein Logo/Titel mehr – steht bereits in der Menüleiste oben links. */}
      <div className="px-3 pt-3">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            className="input pl-9"
            placeholder="Kind suchen…"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            aria-label="Kind suchen"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button className="btn-primary flex-1" onClick={() => setKindModal({ offen: true })}>
            <IconPlus width={18} height={18} /> Kind anlegen
          </button>
          <button
            className="btn-secondary shrink-0"
            onClick={() => setKlassenModal(true)}
            title="Klassen verwalten"
          >
            <IconUsers width={18} height={18} />
          </button>
        </div>
        {klassen.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <FilterChip aktiv={klasseFilter === 'alle'} onClick={() => setKlasseFilter('alle')}>
              Alle
            </FilterChip>
            {klassen.map((c) => (
              <FilterChip
                key={c.id}
                aktiv={klasseFilter === c.id}
                farbe={c.farbe}
                onClick={() => setKlasseFilter(c.id)}
              >
                {c.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
        {gefiltert.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-faint">
            {kinder.length === 0 ? 'Noch keine Kinder angelegt.' : 'Keine Treffer.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {gefiltert.map((kind) => {
              const aktiv = kind.id === selectedKindId;
              return (
                <li key={kind.id}>
                  <button
                    onClick={() => onSelect(kind.id)}
                    className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      aktiv ? 'bg-brand-100 text-brand-800' : 'hover:bg-paper-200'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: kind.klasseId
                            ? klasseFarbe.get(kind.klasseId) || '#c9c4b5'
                            : '#d8d4c8',
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {displayName(kind.name, einstellungen.nurInitialen)}
                        </span>
                        <span className="block text-xs text-ink-faint">
                          {t.lernstand[kind.lernstand]}
                          {kind.klasseId &&
                            ` · ${klassen.find((c) => c.id === kind.klasseId)?.name ?? ''}`}
                        </span>
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="opacity-0 transition-opacity hover:text-brand-600 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKindModal({ offen: true, kind });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          setKindModal({ offen: true, kind });
                        }
                      }}
                      aria-label={`${kind.name} bearbeiten`}
                    >
                      <IconEdit width={16} height={16} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-paper-200 p-2">
        <button
          className="btn-ghost w-full justify-start"
          onClick={() => {
            setSchluesselDruck(true);
            setTimeout(() => drucke(), 60);
          }}
          title="Zuordnung Kürzel ↔ Klarname zum Ausdrucken (offline aufbewahren)"
        >
          <IconKey width={18} height={18} /> Namensschlüssel drucken
        </button>
      </div>

      <KindModal
        state={kindModal}
        klassen={klassen}
        onClose={() => setKindModal({ offen: false })}
        onSaved={(id) => {
          setKindModal({ offen: false });
          onSelect(id);
        }}
      />
      <KlassenModal offen={klassenModal} klassen={klassen} onClose={() => setKlassenModal(false)} />

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
    </aside>
  );
}

function KindModal({
  state,
  klassen,
  onClose,
  onSaved,
}: {
  state: { offen: boolean; kind?: Kind };
  klassen: Klasse[];
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const kind = state.kind;
  const [name, setName] = useState('');
  const [klasseId, setKlasseId] = useState('');
  const [neueKlasse, setNeueKlasse] = useState('');
  const [lernstand, setLernstand] = useState<Lernstand>('klasse2');
  const [notiz, setNotiz] = useState('');
  // Beim ersten Kind (noch keine Klassen) direkt eine Klasse mit anlegen.
  const klasseNeuModus = klassen.length === 0 || klasseId === '__neu__';

  // Felder bei jedem Öffnen synchronisieren.
  useEffect(() => {
    if (state.offen) {
      setName(kind?.name ?? '');
      setKlasseId(kind?.klasseId ?? '');
      setNeueKlasse('');
      setLernstand(kind?.lernstand ?? 'klasse2');
      setNotiz(kind?.notiz ?? '');
    }
  }, [state.offen, kind]);

  async function speichern() {
    if (!name.trim()) return;
    // Falls eine neue Klasse eingegeben wurde, diese zuerst anlegen.
    let zugewieseneKlasse: string | undefined = klasseId && klasseId !== '__neu__' ? klasseId : undefined;
    if (klasseNeuModus && neueKlasse.trim()) {
      const k = await repository.saveKlasse({ name: neueKlasse.trim() });
      zugewieseneKlasse = k.id;
    }
    const gespeichert = await repository.saveKind({
      id: kind?.id,
      name: name.trim(),
      klasseId: zugewieseneKlasse,
      lernstand,
      notiz: notiz.trim() || undefined,
    });
    onSaved(gespeichert.id);
  }

  async function loeschen() {
    if (!kind) return;
    if (!confirm(`„${kind.name}" mit allen Wörtern und Texten löschen?`)) return;
    await repository.deleteKind(kind.id);
    onClose();
  }

  return (
    <Modal offen={state.offen} titel={kind ? 'Kind bearbeiten' : 'Kind anlegen'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="kind-name">
            {t.common.name} (auch Initialen/Spitzname möglich)
          </label>
          <input
            id="kind-name"
            className="input"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && speichern()}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="kind-klasse">
              Klasse
            </label>
            {klassen.length > 0 ? (
              <select
                id="kind-klasse"
                className="input"
                value={klasseId}
                onChange={(e) => setKlasseId(e.target.value)}
              >
                <option value="">— keine —</option>
                {klassen.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__neu__">+ Neue Klasse …</option>
              </select>
            ) : (
              <input
                id="kind-klasse"
                className="input"
                value={neueKlasse}
                placeholder="z. B. 2a"
                onChange={(e) => setNeueKlasse(e.target.value)}
              />
            )}
            {klassen.length > 0 && klasseId === '__neu__' && (
              <input
                className="input mt-2"
                value={neueKlasse}
                placeholder="Name der neuen Klasse, z. B. 2a"
                onChange={(e) => setNeueKlasse(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div>
            <label className="label" htmlFor="kind-lernstand">
              Lernstand
            </label>
            <select
              id="kind-lernstand"
              className="input"
              value={lernstand}
              onChange={(e) => setLernstand(e.target.value as Lernstand)}
            >
              {LERNSTAENDE.map((l) => (
                <option key={l} value={l}>
                  {t.lernstand[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="kind-notiz">
            {t.common.notiz}
          </label>
          <textarea
            id="kind-notiz"
            className="input min-h-[60px]"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          {kind ? (
            <button className="btn-danger" onClick={loeschen}>
              <IconTrash width={18} height={18} /> {t.common.loeschen}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              {t.common.abbrechen}
            </button>
            <button className="btn-primary" onClick={speichern} disabled={!name.trim()}>
              {t.common.speichern}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function KlassenModal({
  offen,
  klassen,
  onClose,
}: {
  offen: boolean;
  klassen: Klasse[];
  onClose: () => void;
}) {
  const [neu, setNeu] = useState('');

  async function anlegen() {
    if (!neu.trim()) return;
    await repository.saveKlasse({ name: neu.trim(), farbe: farbeFuerIndex(klassen.length) });
    setNeu('');
  }

  return (
    <Modal offen={offen} titel="Klassen verwalten" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="z. B. 2a"
            value={neu}
            onChange={(e) => setNeu(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && anlegen()}
          />
          <button className="btn-primary shrink-0" onClick={anlegen} disabled={!neu.trim()}>
            <IconPlus width={18} height={18} /> Anlegen
          </button>
        </div>
        {klassen.length === 0 ? (
          <p className="text-sm text-ink-faint">Noch keine Klassen.</p>
        ) : (
          <ul className="divide-y divide-paper-200 rounded-lg border border-paper-200">
            {klassen.map((c) => (
              <KlasseZeile key={c.id} klasse={c} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function KlasseZeile({ klasse }: { klasse: Klasse }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [name, setName] = useState(klasse.name);

  async function speichern() {
    if (name.trim()) await repository.saveKlasse({ id: klasse.id, name: name.trim() });
    setBearbeiten(false);
  }
  async function loeschen() {
    if (confirm(`Klasse „${klasse.name}" löschen? Zugeordnete Kinder bleiben erhalten.`)) {
      await repository.deleteKlasse(klasse.id);
    }
  }

  function setFarbe(farbe: string) {
    void repository.saveKlasse({ id: klasse.id, name: klasse.name, farbe });
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: klasse.farbe || '#c9c4b5' }}
        aria-hidden
      />
      {bearbeiten ? (
        <input
          className="input"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && speichern()}
          onBlur={speichern}
        />
      ) : (
        <span className="flex-1 text-sm">{klasse.name}</span>
      )}
      <div className="flex items-center gap-0.5">
        {KLASSEN_FARBEN.map((f) => (
          <button
            key={f}
            onClick={() => setFarbe(f)}
            className={`h-4 w-4 rounded-full border ${
              klasse.farbe === f ? 'border-ink' : 'border-transparent'
            }`}
            style={{ backgroundColor: f }}
            aria-label={`Farbe ${f}`}
            title="Farbe wählen"
          />
        ))}
      </div>
      <button className="btn-ghost p-1.5" onClick={() => setBearbeiten(true)} aria-label="Umbenennen">
        <IconEdit width={16} height={16} />
      </button>
      <button className="btn-ghost p-1.5 text-danger-500" onClick={loeschen} aria-label="Löschen">
        <IconTrash width={16} height={16} />
      </button>
    </li>
  );
}

function FilterChip({
  aktiv,
  farbe,
  onClick,
  children,
}: {
  aktiv: boolean;
  farbe?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
        aktiv ? 'border-brand-400 bg-brand-100 text-brand-700' : 'border-paper-300 text-ink-soft hover:bg-paper-200'
      }`}
    >
      {farbe && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: farbe }} />}
      {children}
    </button>
  );
}
