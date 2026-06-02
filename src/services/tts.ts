// Wort vorlesen über die Web-Speech-API (SpeechSynthesis).
// Nutzt die im Betriebssystem vorhandenen Stimmen – keine externe Verbindung,
// kein zusätzliches Paket. Bei fehlender Unterstützung passiert nichts.

export function ttsVerfuegbar(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Bricht laufende Sprachausgabe ab. */
export function stoppeSprache(): void {
  if (ttsVerfuegbar()) window.speechSynthesis.cancel();
}

/** Spricht einen Text und ruft danach (oder bei Fehler) den Callback. */
export function spreche(text: string, onEnde: () => void): void {
  if (!ttsVerfuegbar() || !text.trim()) {
    onEnde();
    return;
  }
  const u = new SpeechSynthesisUtterance(text.trim());
  u.lang = 'de-DE';
  u.rate = 0.8;
  const stimme = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'));
  if (stimme) u.voice = stimme;
  u.onend = onEnde;
  u.onerror = onEnde;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function sprichWort(text: string): void {
  if (!ttsVerfuegbar() || !text.trim()) return;
  const u = new SpeechSynthesisUtterance(text.trim());
  u.lang = 'de-DE';
  u.rate = 0.85; // etwas langsamer – gut zum Mitschreiben/Diktieren
  // Bevorzugt eine deutsche Stimme wählen, falls vorhanden.
  const stimme = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'));
  if (stimme) u.voice = stimme;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
