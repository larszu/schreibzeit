# Screenshots – Aufnahme- & Anonymisierungs-Leitfaden

Die Bilder in der Haupt-`README.md` werden aus diesem Ordner geladen. Sie sind
noch nicht eingecheckt – so erstellst du sie konsistent und **DSGVO-konform**.

## Benötigte Dateien

| Datei | Inhalt | Empfohlene Breite |
| ----- | ------ | ----------------- |
| `hero.png` | Gesamtansicht: Sidebar + Knickblatt-Vorschau | 1720 px (für 860 px Anzeige, @2x) |
| `kartei.png` | Lernwörter-Kartei eines Kindes | 840 px |
| `wort-editor.png` | Wort-Editor mit Silben-/Merkstellen-Bearbeitung | 840 px |
| `knickblatt.png` | Knickblatt-Generator mit Vorschau | 840 px |
| `uebungstext.png` | KI-Übungstext / Lückentext | 840 px |
| `wortkarten.png` | Wortkarten-Vorschau | 840 px |

## Aufnahme

1. App starten: `npm run dev` und im Browser öffnen.
2. **Testdaten** anlegen – **niemals echte Kinderdaten** verwenden.
3. In den **Einstellungen** die Option *„nur Initialen statt Klarnamen"*
   aktivieren, damit auch im Bild keine Klarnamen erscheinen.
4. Fenster auf eine saubere Breite bringen (Desktop-Layout, ~1280 px).
5. Screenshot des relevanten Bereichs aufnehmen.

## Anonymisierung (Pflicht)

- Nur erfundene Namen / Initialen (z. B. „Mia L.", „A. K.").
- Keine echten Schul- oder Lehrkraftnamen im Blattkopf.
- Den **Gemini-API-Schlüssel** vor dem Screenshot leeren (Einstellungen).
- Vor dem Commit prüfen, dass keine personenbezogenen Daten sichtbar sind.

## Optimierung

```bash
# verlustfrei verkleinern (optional)
npx --yes oxipng -o4 docs/screenshots/*.png   # oder pngquant / imageoptim
```

> Tipp: Für gestochen scharfe Bilder in @2x aufnehmen und in der README per
> `width="…"` herunterskalieren.
