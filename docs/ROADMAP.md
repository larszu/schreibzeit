# Schreibzeit – Ideen & Roadmap

Grundlage: Recherche in Lehrkräfte-Communities (lehrerforen.de, 4teachers/Eduki,
Materialwiese/Ideenreise/Zebrafanclub & Co., Worksheet-Crafter-Reviews,
Teachers-Pay-Teachers-Bewertungen, LRS-/Datenschutz-Quellen, sowie Doku-Tools
wie edoop/DocuDiary). Ziel: das umsetzen, was Lehrkräfte real wünschen – ohne
das datensparsame, lokale Wesen der App zu verlieren.

## Was Lehrkräfte immer wieder sagen (Kurzfassung)

- **„Einmal bauen, nur die Wörter tauschen."** Wiederverwendbare Vorlagen, bei denen sich nur die Wortliste ändert – die meistgenannte Zeitspar-Idee.
- **Die Karteikasten-Methode ist beliebt, aber Handarbeit nervt** (Wörter abschreiben + kontrollieren). Eine digitale Kartei nimmt genau diese Last ab.
- **Differenzierung für ~25 sehr unterschiedliche Kinder** (inkl. Inklusion/LRS) ist der Alltagskern – Wunsch: automatische Varianten (kurz/standard/lang).
- **Worksheet Crafter ist der Maßstab beim Drucken** (Grundschrift/Schreibschrift, Silbenfärbung, viele Lineaturen). Daran wird jedes Druck-Tool gemessen.
- **Cloud-Tools frustrieren** (kein Offline, nur PDF-Export, „zweiter Speicherort") → bestätigt den Local-first-Ansatz.
- **Starke, konkrete DSGVO-Sorge** bei Schülerdaten in der Cloud → lokal speichern ist Vertrauensfaktor Nr. 1.
- **KI-Texterzeugung ist erwünscht** (Zeitersparnis, Lückentexte, Niveaustufen) – mit dem klaren Vorbehalt „immer prüfen".
- **Zu viele Tools** → Wunsch nach *einer* integrierten Lösung statt Zettelwirtschaft.

> **Direkter Wettbewerber:** *Diktatheld* (kostenloser KI-Diktat-Trainer für die Grundschule). Schreibzeits Abgrenzung: persistente **Kartei pro Kind mit Verlauf**, **Knickblatt/Lineatur/Schrift in Worksheet-Crafter-Qualität**, **echtes Offline/Local-first** und **Lehrkräfte-Workflow + Berichte**.

---

## 20 Feature-Vorschläge

Legende: ✅ bereits in Schreibzeit · 🟡 teilweise · ⬜ geplant/Idee

**Inhalte erzeugen (KI + Vorlagen)**
1. ✅ *Eine Wortliste → viele Übungen*: Knickblatt, Wortkarten, KI-Text aus denselben Lernwörtern.
2. ✅ *KI-Übungstext* webt die Lernwörter eines Kindes in Geschichte/Lückentext/Quatschsätze ein.
3. ⬜ *Ein-Klick-Niveaustufen* (Kurz-/Grund-/Langtext) für jedes erzeugte Blatt („dreifach differenziertes Diktat").
4. 🟡 *Immer editierbare Listen ohne Längenbegrenzung*, importierbar aus Lehrwerk-Wortschätzen (FRESCH/Zebra) – aktuell JSON-Import; CSV-Import geplant.

**Drucken & Arbeitsblätter**
5. ✅ *Knickblatt-Generator* (Vorlage → schwingen → markieren → knicken → auswendig).
6. 🟡 *Grundschul-Lineaturen* (Klasse 1–4 / Haus) vorhanden; ⬜ *Grundschrift/Schreibschrift-Fonts* und ⬜ *gepunktete Nachspur-Schrift* fehlen noch.
7. ✅ *Silbenbögen* (zuschaltbar) und Merkstellen-Markierung auf der Vorlage.
8. 🟡 *Druckfertiges PDF*; ⬜ *Stapeldruck* (ganze Klasse / pro Kind in einem Rutsch).

**Differenzierung**
9. ✅ *Wortpool pro Kind* (individuelle Lernwörter) – Klassen-Grundwortschatz-Mix ⬜ geplant.
10. 🟡 *Lernstand-Tag pro Kind* vorhanden (steuert KI-Schwierigkeit); ⬜ automatische Wortzahl/Komplexität daraus.
11. ⬜ *LRS-/Barrierearm-Preset* (serifenlos, größer, Zeilenabstand ≥1,5, ≤8 Wörter/Zeile) per Schalter.

**Fortschritt verfolgen (CRM-Kern)**
12. ✅ *Digitale Lernwörter-Kartei pro Kind* mit Status `neu/wird geübt/sitzt`.
13. ⬜ *Fehlerwort-Erfassung → Auto-Kartei*: einmal eintragen, fließt in den Übungsstapel.
14. ⬜ *Spaced-Repetition / „5-Fächer"-Logik*: Sitzendes fällt raus, Wackliges kommt wieder.
15. ⬜ *Fortschritt über Zeit* je Kind und je Rechtschreib-Phänomen (Auswertung).

**Elternkommunikation**
16. ⬜ *Übungspaket für zu Hause*: Wochen-Lernwörter als Blatt + optional Audio-Diktat (TTS).
17. ⬜ *Kurzer Eltern-Status* („8/10 geübt") – ohne Eltern-Cloud-Konto.

**Berichte**
18. ⬜ *Lernentwicklungs-Export* je Kind für LEG/Zeugnisse (druckbare Übersicht).

**Ablauf & Organisation**
19. 🟡 *Eine Stelle für alles* (Klassen, Kinder, Wörter, Texte) – Grundgerüst da; ⬜ Beobachtungs-/Notizfunktion.
20. ⬜ *Stationen-Set-Generator* (Laufdiktat, Partnerdiktat, ABC-Ordnen …) automatisch aus den aktuellen Wörtern.

**Querschnitt: Vertrauen/Datenschutz**
21. ✅ *Local-first, offline, keine Schülerdaten in der Cloud* – Headline-Versprechen (siehe `DSGVO.md`).

---

## „Ein CRM für (Deutsch-)Lehrkräfte"

Ja – der Vergleich passt. Ein CRM pflegt Datensätze pro Kontakt, hält Status/Verlauf,
unterstützt Kommunikation und Reporting. Übertragen auf die Klasse:

- **Datensätze (die „Kontakte"):** Kind-Profile, Wortpools, eine Stelle für alles (#9, #12, #19).
- **Status & Verlauf (die „Pipeline"):** Fehlerwort→Kartei, Spaced Repetition, Fortschritt über Zeit (#13–#15).
- **Kommunikation (Eltern):** Übungspakete, Status-Notizen (#16, #17).
- **Reporting:** Lernentwicklungs-Export für LEG/Zeugnisse (#18).

Der verteidigbare, unterversorgte Nischen-Fokus ist ein **datenschutzfreundliches,
offline-fähiges „CRM" für genau einen Job, dafür richtig**: den **Lernwörter-Lebenszyklus
pro Kind** – erfassen → differenzieren → üben/drucken → nachverfolgen → berichten →
kommunizieren – statt noch ein Cloud-Notenheft oder noch ein Cloud-Arbeitsblatt-Tool.
