// Reaktive Datenhaltung über Dexie Live-Queries: Komponenten aktualisieren
// sich automatisch, sobald sich die lokale Datenbank ändert.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { DEFAULT_EINSTELLUNGEN } from '@/db/repository';
import type {
  Einstellungen,
  FontEintrag,
  Kind,
  Klasse,
  Lernwort,
  Uebungstext,
  Wortliste,
} from '@/types';

export function useFonts(): FontEintrag[] {
  return useLiveQuery(async () => db.fonts.toArray(), []) ?? [];
}

export function useWortlisten(): Wortliste[] {
  return (
    useLiveQuery(async () => {
      const list = await db.wortlisten.toArray();
      return list.sort((a, b) => a.label.localeCompare(b.label, 'de'));
    }, []) ?? []
  );
}

export function useKlassen(): Klasse[] {
  return (
    useLiveQuery(async () => {
      const list = await db.klassen.toArray();
      return list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }, []) ?? []
  );
}

export function useKinder(): Kind[] {
  return (
    useLiveQuery(async () => {
      const list = await db.kinder.toArray();
      return list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }, []) ?? []
  );
}

export function useLernwoerter(kindId: string | undefined): Lernwort[] {
  return (
    useLiveQuery(async () => {
      if (!kindId) return [];
      const list = await db.lernwoerter.where('kindId').equals(kindId).toArray();
      return list.sort((a, b) => b.erstelltAm - a.erstelltAm);
    }, [kindId]) ?? []
  );
}

export function useUebungstexte(kindId: string | undefined): Uebungstext[] {
  return (
    useLiveQuery(async () => {
      if (!kindId) return [];
      const list = await db.uebungstexte.where('kindId').equals(kindId).toArray();
      return list.sort((a, b) => b.erstelltAm - a.erstelltAm);
    }, [kindId]) ?? []
  );
}

export function useEinstellungen(): Einstellungen {
  return (
    useLiveQuery(async () => {
      const e = await db.einstellungen.get('app');
      return { ...DEFAULT_EINSTELLUNGEN, ...(e ?? {}) };
    }, []) ?? DEFAULT_EINSTELLUNGEN
  );
}
