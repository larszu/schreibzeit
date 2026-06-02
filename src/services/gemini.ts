// Google-Gemini-Anbindung für KI-Übungstexte.
//
// Datenschutz: Dies ist der EINZIGE externe Aufruf der App und wird nur durch
// ausdrückliche Aktion der Lehrkraft ausgelöst. Es werden ausschließlich die
// gewählten Lernwörter und die Aufgabenbeschreibung übertragen – keine
// Kindernamen.

import type { Lernstand, TextArt } from '@/types';

const GEMINI_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

export interface GenerateOptions {
  woerter: string[];
  textart: TextArt;
  lernstand: Lernstand;
  /** Ungefähre Länge in Sätzen. */
  laengeSaetze: number;
  thema?: string;
}

export interface GenerateResult {
  text: string;
  /** Nur bei Lückentext gesetzt: die ausgeblendeten Lösungswörter. */
  loesungswoerter?: string[];
}

const LERNSTAND_HINWEIS: Record<Lernstand, string> = {
  klasse1: 'Klasse 1: sehr einfache, kurze Sätze, häufige Wörter, Präsens.',
  klasse2: 'Klasse 2: einfache Sätze, überschaubarer Wortschatz.',
  klasse3: 'Klasse 3: etwas längere Sätze, altersgerechter Wortschatz.',
  klasse4: 'Klasse 4: abwechslungsreiche Sätze, größerer Wortschatz.',
  foerder: 'Förderbedarf: besonders einfache, sehr kurze Sätze, klare Struktur.',
  lrs: 'LRS/Leseschwäche: kurze Sätze, klare Wörter, keine schwierigen Sonderfälle.',
};

const TEXTART_HINWEIS: Record<TextArt, string> = {
  geschichte: 'Schreibe eine kurze, zusammenhängende, kindgerechte Geschichte.',
  lueckentext:
    'Schreibe einen kurzen zusammenhängenden Text. Die Lernwörter werden später als Lücken ausgeblendet.',
  quatschsaetze:
    'Schreibe lustige, voneinander unabhängige Übungssätze (Quatschsätze). Jeder Satz steht in einer eigenen Zeile.',
};

/** Baut den Prompt für die Gemini-Anfrage (rein, testbar). */
export function buildPrompt(opts: GenerateOptions): string {
  const woerterListe = opts.woerter.map((w) => `„${w}"`).join(', ');
  const themaTeil = opts.thema?.trim()
    ? `Das Thema ist: ${opts.thema.trim()}.`
    : 'Wähle ein einfaches, kindgerechtes Thema.';
  return [
    'Du bist eine erfahrene Grundschullehrkraft und erstellst Übungstexte für den Rechtschreibunterricht.',
    TEXTART_HINWEIS[opts.textart],
    LERNSTAND_HINWEIS[opts.lernstand],
    `Verwende dabei zwingend alle folgenden Lernwörter, jeweils mindestens einmal: ${woerterListe}.`,
    'Verwende die Lernwörter in ihrer angegebenen Grundform möglichst unverändert.',
    `Der Text soll ungefähr ${opts.laengeSaetze} Sätze lang sein.`,
    themaTeil,
    'Antworte ausschließlich mit dem fertigen Text auf Deutsch, ohne Überschrift, ohne Erklärungen, ohne Anführungszeichen um den ganzen Text.',
  ].join('\n');
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | 'kein_key'
      | 'rate_limit'
      | 'netzwerk'
      | 'safety'
      | 'auth'
      | 'leer'
      | 'unbekannt',
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

interface GeminiSettings {
  apiKey: string;
  modell: string;
}

/** Ruft die Gemini-API auf und liefert reinen Text zurück. */
export async function generateRawText(
  opts: GenerateOptions,
  settings: GeminiSettings,
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new GeminiError(
      'Es ist kein Gemini-API-Schlüssel hinterlegt. Bitte in den Einstellungen eintragen.',
      'kein_key',
    );
  }
  const modell = settings.modell.trim() || 'gemini-2.5-flash';
  const url = `${GEMINI_BASE}/${encodeURIComponent(modell)}:generateContent`;
  const prompt = buildPrompt(opts);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.apiKey.trim(),
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
  } catch {
    throw new GeminiError(
      'Keine Verbindung zur KI. Bitte Internetverbindung prüfen. (Hinweis: Aus einer als Datei geöffneten Seite ist der Aufruf blockiert – die Web-/Desktop-Version nutzen.)',
      'netzwerk',
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new GeminiError(
      'Der API-Schlüssel wurde abgelehnt. Bitte Schlüssel in den Einstellungen prüfen.',
      'auth',
    );
  }
  if (response.status === 429) {
    throw new GeminiError(
      'Die KI ist gerade ausgelastet (Limit erreicht). Bitte einen Moment warten und erneut versuchen.',
      'rate_limit',
    );
  }
  if (!response.ok) {
    throw new GeminiError(
      `Die KI hat einen Fehler gemeldet (Code ${response.status}). Bitte später erneut versuchen.`,
      'unbekannt',
    );
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY' || data?.promptFeedback?.blockReason) {
    throw new GeminiError(
      'Die KI hat die Antwort aus Sicherheitsgründen blockiert. Bitte Lernwörter oder Thema anpassen.',
      'safety',
    );
  }
  const text: string | undefined = candidate?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim();
  if (!text) {
    throw new GeminiError('Die KI hat keinen Text zurückgegeben. Bitte erneut versuchen.', 'leer');
  }
  return text;
}

/**
 * Erzeugt aus einem Text einen Lückentext: jedes Vorkommen eines Lernworts
 * (als ganzes Wort, Groß-/Kleinschreibung egal) wird durch eine Lücke ersetzt.
 * Rein und testbar.
 */
export function makeLueckentext(
  text: string,
  woerter: string[],
): { text: string; loesungswoerter: string[] } {
  const loesungswoerter: string[] = [];
  let result = text;
  // Längere Wörter zuerst, damit Teilwörter nicht fälschlich greifen.
  const sorted = [...woerter].sort((a, b) => b.length - a.length);
  for (const wort of sorted) {
    const escaped = wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu');
    result = result.replace(regex, () => {
      loesungswoerter.push(wort);
      return '_'.repeat(Math.max(5, wort.length));
    });
  }
  return { text: result, loesungswoerter };
}

/** Komplettablauf: Text generieren und ggf. in Lückentext umwandeln. */
export async function generateUebungstext(
  opts: GenerateOptions,
  settings: GeminiSettings,
): Promise<GenerateResult> {
  const raw = await generateRawText(opts, settings);
  if (opts.textart === 'lueckentext') {
    const { text, loesungswoerter } = makeLueckentext(raw, opts.woerter);
    return { text, loesungswoerter };
  }
  return { text: raw };
}
