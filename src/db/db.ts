// IndexedDB-Schema via Dexie. Local-first: alle Daten bleiben im Browser.
import Dexie, { type Table } from 'dexie';
import type {
  Einstellungen,
  FontEintrag,
  Kind,
  Klasse,
  Lernwort,
  Uebungstext,
  Wortliste,
} from '@/types';

export class SchreibzeitDB extends Dexie {
  klassen!: Table<Klasse, string>;
  kinder!: Table<Kind, string>;
  lernwoerter!: Table<Lernwort, string>;
  uebungstexte!: Table<Uebungstext, string>;
  einstellungen!: Table<Einstellungen, string>;
  fonts!: Table<FontEintrag, string>;
  wortlisten!: Table<Wortliste, string>;

  constructor() {
    super('schreibzeit');
    this.version(1).stores({
      klassen: 'id, name, erstelltAm',
      kinder: 'id, name, klasseId, erstelltAm',
      lernwoerter: 'id, kindId, status, wort, erstelltAm',
      uebungstexte: 'id, kindId, erstelltAm',
      einstellungen: 'id',
    });
    // v2: eigene Schriftarten (lokal gespeichert).
    this.version(2).stores({
      fonts: 'id, name',
    });
    // v3: selbst importierte Grundwortschatz-Listen.
    this.version(3).stores({
      wortlisten: 'id, label, erstelltAm',
    });
  }
}

export const db = new SchreibzeitDB();
