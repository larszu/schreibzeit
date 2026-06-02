// Wort vorlesen über die Web-Speech-API (SpeechSynthesis).
// Nutzt die im Betriebssystem vorhandenen Stimmen – keine externe Verbindung,
// kein zusätzliches Paket. Bei fehlender Unterstützung passiert nichts.

export function ttsVerfuegbar(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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
