# Datenquelle: nouns.json

`nouns.json` ist eine kompakte Zuordnung *deutsches Nomen → Artikel* (der/die/das)
mit rund 90.000 Einträgen.

- Abgeleitet aus dem Projekt **german-nouns** (https://github.com/gambolputty/german-nouns),
  dessen Daten aus dem **deutschen Wiktionary** stammen.
- Lizenz der Wörterbuchdaten: **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/).
- In Schreibzeit wird daraus nur Lemma + Genus verwendet (stark verkleinert).

Die kuratierte Kurzliste (`src/data/germanNouns.ts`) hat bei Treffern Vorrang.
