// Datei-Menü-Aktionen „Öffnen / Speichern / Speichern unter".
//
// Wo verfügbar (Chromium, Electron) wird die File System Access API genutzt –
// dann kann „Speichern" dieselbe Datei erneut beschreiben (echtes Speichern),
// und „Speichern unter" legt eine neue an. In anderen Browsern gibt es einen
// Fallback über Datei-Download bzw. Datei-Auswahl.

import { exportAll, parseBackup, importBackup, backupDateiname, downloadBackup } from './backup';

interface FileSystemFileHandleLike {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
  getFile: () => Promise<File>;
  name: string;
}

// Merkt sich die zuletzt geöffnete/gespeicherte Datei für „Speichern".
let aktuellerHandle: FileSystemFileHandleLike | null = null;

function hatFsApi(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

const PICKER_OPTS = {
  types: [{ description: 'Schreibzeit-Backup', accept: { 'application/json': ['.json'] } }],
};

async function schreibeHandle(handle: FileSystemFileHandleLike): Promise<void> {
  const backup = await exportAll();
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(backup, null, 2));
  await writable.close();
}

/** „Speichern unter …" – immer neue Datei wählen. */
export async function speichernUnter(): Promise<string | null> {
  if (hatFsApi()) {
    try {
      const handle: FileSystemFileHandleLike = await (window as any).showSaveFilePicker({
        suggestedName: backupDateiname(),
        ...PICKER_OPTS,
      });
      await schreibeHandle(handle);
      aktuellerHandle = handle;
      return handle.name;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return null;
      throw e;
    }
  }
  // Fallback: Download
  const backup = await exportAll();
  downloadBackup(backup);
  return backupDateiname();
}

/** „Speichern" – in die geöffnete Datei zurückschreiben, sonst wie „… unter". */
export async function speichern(): Promise<string | null> {
  if (hatFsApi() && aktuellerHandle) {
    await schreibeHandle(aktuellerHandle);
    return aktuellerHandle.name;
  }
  return speichernUnter();
}

export interface OeffnenErgebnis {
  name: string;
  kinder: number;
  woerter: number;
}

/** „Öffnen …" – Backup-Datei wählen, einlesen und importieren. */
export async function oeffnen(modus: 'ersetzen' | 'zusammenfuehren'): Promise<OeffnenErgebnis | null> {
  let text: string;
  let name: string;

  if (hatFsApi()) {
    try {
      const [handle]: FileSystemFileHandleLike[] = await (window as any).showOpenFilePicker(PICKER_OPTS);
      const file = await handle.getFile();
      text = await file.text();
      name = handle.name;
      aktuellerHandle = handle; // spätere „Speichern" schreiben hierhin zurück
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return null;
      throw e;
    }
  } else {
    const datei = await waehleDateiUeberInput();
    if (!datei) return null;
    text = await datei.text();
    name = datei.name;
  }

  const backup = parseBackup(text);
  await importBackup(backup, modus);
  return {
    name,
    kinder: backup.daten.kinder.length,
    woerter: backup.daten.lernwoerter.length,
  };
}

/** Fallback-Dateiauswahl über ein verstecktes input[type=file]. */
function waehleDateiUeberInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
