import { beforeEach, describe, expect, it } from 'vitest';
import { repository } from '@/db/repository';
import { db } from '@/db/db';
import { exportAll, importBackup } from '@/services/backup';

beforeEach(async () => {
  await repository.clearAll();
});

describe('Repository – Kinder & Lernwörter', () => {
  it('legt ein Kind an und fügt Lernwörter mit Auto-Vorschlägen hinzu', async () => {
    const kind = await repository.saveKind({ name: 'Lena', lernstand: 'klasse2' });
    expect(kind.id).toBeTruthy();

    const wort = await repository.addLernwort(kind.id, 'Sommer', { quelle: 'Aufsatz' });
    expect(wort.silben).toEqual(['Som', 'mer']);
    expect(wort.merkstellen).toEqual([2, 3]);
    expect(wort.status).toBe('neu');

    const liste = await repository.getLernwoerter(kind.id);
    expect(liste).toHaveLength(1);
  });

  it('aktualisiert und löscht Lernwörter', async () => {
    const kind = await repository.saveKind({ name: 'Tom' });
    const w = await repository.addLernwort(kind.id, 'Hund');
    await repository.updateLernwort(w.id, { status: 'sitzt' });
    let liste = await repository.getLernwoerter(kind.id);
    expect(liste[0].status).toBe('sitzt');

    await repository.deleteLernwort(w.id);
    liste = await repository.getLernwoerter(kind.id);
    expect(liste).toHaveLength(0);
  });

  it('löscht beim Entfernen eines Kindes auch dessen Wörter', async () => {
    const kind = await repository.saveKind({ name: 'Mia' });
    await repository.addLernwort(kind.id, 'Katze');
    await repository.deleteKind(kind.id);
    const liste = await repository.getLernwoerter(kind.id);
    expect(liste).toHaveLength(0);
  });
});

describe('Backup – Export/Import über die Datenbank', () => {
  it('exportiert und importiert verlustfrei (ersetzen)', async () => {
    const kind = await repository.saveKind({ name: 'Nora' });
    await repository.addLernwort(kind.id, 'Schule');
    await repository.addLernwort(kind.id, 'Pause');

    const backup = await exportAll();
    expect(backup.daten.lernwoerter).toHaveLength(2);

    await repository.clearAll();
    expect(await db.lernwoerter.count()).toBe(0);

    await importBackup(backup, 'ersetzen');
    expect(await db.lernwoerter.count()).toBe(2);
    expect(await db.kinder.count()).toBe(1);
  });

  it('führt beim Import zusammen, ohne Bestehendes zu verlieren', async () => {
    const a = await repository.saveKind({ name: 'Kind A' });
    await repository.addLernwort(a.id, 'Apfel');
    const backup = await exportAll();

    await repository.clearAll();
    const b = await repository.saveKind({ name: 'Kind B' });
    await repository.addLernwort(b.id, 'Birne');

    await importBackup(backup, 'zusammenfuehren');
    expect(await db.kinder.count()).toBe(2);
    expect(await db.lernwoerter.count()).toBe(2);
  });

  it('exportiert keine API-Schlüssel', async () => {
    await repository.saveEinstellungen({ geminiApiKey: 'GEHEIM-G', claudeApiKey: 'GEHEIM-C' });
    const backup = await exportAll();
    expect(backup.daten.einstellungen?.geminiApiKey).toBe('');
    expect(backup.daten.einstellungen?.claudeApiKey).toBe('');
  });

  it('überschreibt beim Import niemals vorhandene lokale API-Schlüssel', async () => {
    await repository.saveEinstellungen({ geminiApiKey: 'MEIN-LOKALER-KEY' });
    const fremd = await exportAll(); // enthält leere Keys
    await importBackup(fremd, 'zusammenfuehren');
    const e = await repository.getEinstellungen();
    expect(e.geminiApiKey).toBe('MEIN-LOKALER-KEY');
  });
});
