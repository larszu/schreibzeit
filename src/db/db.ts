// IndexedDB-Schema via Dexie. Local-first: alle Daten bleiben im Browser.
import Dexie, { type Table } from 'dexie';
import type {
  Einstellungen,
  Kind,
  Klasse,
  Lernwort,
  Uebungstext,
} from '@/types';

export class SchreibzeitDB extends Dexie {
  klassen!: Table<Klasse, string>;
  kinder!: Table<Kind, string>;
  lernwoerter!: Table<Lernwort, string>;
  uebungstexte!: Table<Uebungstext, string>;
  einstellungen!: Table<Einstellungen, string>;

  constructor() {
    super('schreibzeit');
    this.version(1).stores({
      klassen: 'id, name, erstelltAm',
      kinder: 'id, name, klasseId, erstelltAm',
      lernwoerter: 'id, kindId, status, wort, erstelltAm',
      uebungstexte: 'id, kindId, erstelltAm',
      einstellungen: 'id',
    });
  }
}

export const db = new SchreibzeitDB();
