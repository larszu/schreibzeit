// Foto-Texterkennung (OCR) für die „Aus Text herauspicken"-Funktion.
//
// Engine-Auswahl:
//   - Claude Vision (falls in den Einstellungen aktiviert und Schlüssel gesetzt)
//     → beste Erkennung, besonders bei Handschrift.
//   - sonst Gemini (multimodal) als Standard, sofern ein Gemini-Schlüssel
//     vorhanden ist.
// Beide sind bewusst ausgelöste externe Aufrufe (Datenschutzhinweis beachten).

import { geminiOcr } from './gemini';
import { claudeOcr } from './claude';
import type { Einstellungen } from '@/types';

const ERLAUBTE_TYPEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface OcrErgebnis {
  text: string;
  engine: 'claude' | 'gemini';
}

/** Liest eine Bilddatei als Base64 (ohne Daten-URL-Präfix). */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Die Bilddatei konnte nicht gelesen werden.'));
    reader.onload = () => {
      const result = String(reader.result);
      const komma = result.indexOf(',');
      resolve({ base64: result.slice(komma + 1), mimeType: file.type || 'image/png' });
    };
    reader.readAsDataURL(file);
  });
}

/** Führt die Texterkennung gemäß den Einstellungen aus. */
export async function erkenneTextAusFoto(
  file: File,
  einstellungen: Einstellungen,
): Promise<OcrErgebnis> {
  if (!ERLAUBTE_TYPEN.includes(file.type)) {
    throw new Error('Bitte ein Bild im Format JPG, PNG, WebP oder GIF wählen.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Das Bild ist zu groß (max. 8 MB). Bitte ein kleineres Foto wählen.');
  }

  const { base64, mimeType } = await fileToBase64(file);

  const claudeMoeglich = einstellungen.claudeVisionAktiv && einstellungen.claudeApiKey.trim();
  if (claudeMoeglich) {
    const text = await claudeOcr(base64, mimeType, {
      apiKey: einstellungen.claudeApiKey,
      modell: einstellungen.claudeModell,
    });
    return { text, engine: 'claude' };
  }

  if (einstellungen.geminiApiKey.trim()) {
    const text = await geminiOcr(base64, mimeType, {
      apiKey: einstellungen.geminiApiKey,
      modell: einstellungen.geminiModell,
    });
    return { text, engine: 'gemini' };
  }

  throw new Error(
    'Für die Foto-Texterkennung wird ein KI-Schlüssel benötigt: entweder Gemini oder (für bessere Ergebnisse) Claude Vision in den Einstellungen.',
  );
}
