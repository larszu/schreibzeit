// Plattformübergreifendes Drucken.
//
// Im Browser/PWA: window.print(). In der Desktop-App (Electron) über IPC den
// nativen Chromium-Druck von Electron nutzen – das vermeidet die Windows-
// Meldung „Diese App unterstützt keine Seitenansicht" und nutzt dieselbe
// Druck-CSS (@media print).

export function drucke(): void {
  const sz = typeof window !== 'undefined' ? window.schreibzeit : undefined;
  if (sz?.istDesktop && typeof sz.print === 'function') {
    void sz.print();
    return;
  }
  window.print();
}

/** Optional (nur Desktop): direkt als PDF speichern. Gibt false zurück, wenn nicht verfügbar. */
export async function alsPdfSpeichern(): Promise<boolean> {
  const sz = typeof window !== 'undefined' ? window.schreibzeit : undefined;
  if (sz?.istDesktop && typeof sz.printToPDF === 'function') {
    return sz.printToPDF();
  }
  // Fallback: normaler Druckdialog (dort „Als PDF speichern" wählbar).
  window.print();
  return false;
}
