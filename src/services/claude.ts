// Claude-Vision-Anbindung für die optionale, bessere Foto-Texterkennung.
//
// Datenschutz: Dies ist – wie der Gemini-Aufruf – ein bewusst von der
// Lehrkraft ausgelöster externer Aufruf. Übertragen wird nur das Foto und die
// Aufgabenbeschreibung. Der Schlüssel bleibt lokal gespeichert.
//
// Hinweis: Im Browser wird der Header `anthropic-dangerous-direct-browser-access`
// benötigt, damit der Aufruf per CORS erlaubt ist. In der Desktop-App entfällt
// die CORS-Beschränkung.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly kind: 'kein_key' | 'auth' | 'rate_limit' | 'netzwerk' | 'refusal' | 'leer' | 'unbekannt',
  ) {
    super(message);
    this.name = 'ClaudeError';
  }
}

const OCR_PROMPT =
  'Transkribiere den handgeschriebenen oder abgedruckten deutschen Text auf diesem Bild so genau wie möglich. ' +
  'Gib ausschließlich den reinen Text zurück – ohne Kommentare, ohne Anführungszeichen, ohne Überschriften. ' +
  'Behalte Zeilenumbrüche bei.';

/** Erkennt Text auf einem Bild mit Claude Vision. */
export async function claudeOcr(
  base64: string,
  mimeType: string,
  settings: { apiKey: string; modell: string },
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new ClaudeError(
      'Es ist kein Claude-API-Schlüssel hinterlegt. Bitte in den Einstellungen eintragen.',
      'kein_key',
    );
  }
  const modell = settings.modell.trim() || 'claude-opus-4-8';

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modell,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: OCR_PROMPT },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new ClaudeError(
      'Keine Verbindung zu Claude. Bitte Internetverbindung prüfen (in der Web-/Desktop-Version verfügbar).',
      'netzwerk',
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ClaudeError('Der Claude-Schlüssel wurde abgelehnt. Bitte prüfen.', 'auth');
  }
  if (response.status === 429) {
    throw new ClaudeError('Claude ist gerade ausgelastet. Bitte kurz warten und erneut versuchen.', 'rate_limit');
  }
  if (!response.ok) {
    throw new ClaudeError(`Claude hat einen Fehler gemeldet (Code ${response.status}).`, 'unbekannt');
  }

  const data = await response.json();
  if (data?.stop_reason === 'refusal') {
    throw new ClaudeError('Claude hat die Anfrage aus Sicherheitsgründen abgelehnt.', 'refusal');
  }
  const text: string | undefined = Array.isArray(data?.content)
    ? data.content
        .filter((b: { type?: string }) => b.type === 'text')
        .map((b: { text?: string }) => b.text ?? '')
        .join('')
        .trim()
    : undefined;
  if (!text) {
    throw new ClaudeError('Claude hat keinen Text erkannt. Bitte erneut versuchen.', 'leer');
  }
  return text;
}
