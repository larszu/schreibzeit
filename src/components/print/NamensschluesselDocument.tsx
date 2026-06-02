// Druckbarer „Namensschlüssel": ordnet das in der App verwendete Kürzel /
// Pseudonym (z. B. „Kind 1", „2a-07") dem echten Namen zu, der von Hand
// eingetragen und offline (Papier, abschließbar) aufbewahrt wird.
//
// So lassen sich Kinder DSGVO-schonend nur mit Pseudonymen in der App führen;
// der Klarname steht nicht digital in der App.
import type { Kind, Klasse } from '@/types';

export function NamensschluesselDocument({
  kinder,
  klassen,
  schule,
  lehrkraft,
}: {
  kinder: Kind[];
  klassen: Klasse[];
  schule?: string;
  lehrkraft?: string;
}) {
  // Gruppierung nach Klasse (inkl. „ohne Klasse").
  const gruppen: { name: string; kinder: Kind[] }[] = [];
  for (const k of klassen) {
    const liste = kinder.filter((kind) => kind.klasseId === k.id);
    if (liste.length) gruppen.push({ name: k.name, kinder: liste });
  }
  const ohne = kinder.filter((kind) => !kind.klasseId);
  if (ohne.length) gruppen.push({ name: 'ohne Klasse', kinder: ohne });

  return (
    <div className="print-page p-[6mm]" style={{ color: '#111' }}>
      <div className="mb-3 border-b-2 border-ink/70 pb-1.5">
        <h2 className="font-serif text-xl font-semibold">Namensschlüssel — VERTRAULICH</h2>
        <p className="text-sm">
          Bitte den Klarnamen von Hand eintragen und dieses Blatt <strong>offline und sicher</strong>{' '}
          (z. B. abschließbar) aufbewahren. In der App werden nur die Kürzel/Pseudonyme verwendet.
        </p>
        {(lehrkraft || schule) && (
          <p className="mt-0.5 text-[10px] text-ink-faint">
            {[lehrkraft, schule].filter(Boolean).join(' · ')} · Datum: __________
          </p>
        )}
      </div>

      {gruppen.length === 0 ? (
        <p className="text-sm text-ink-faint">Noch keine Kinder angelegt.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {gruppen.map((g) => (
            <div key={g.name} className="no-break">
              <h3 className="mb-1 text-sm font-semibold text-ink-soft">Klasse: {g.name}</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-ink/40 py-1 text-left font-medium">
                      In der App (Kürzel)
                    </th>
                    <th className="border-b border-ink/40 py-1 text-left font-medium">
                      Klarname (von Hand)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.kinder.map((kind) => (
                    <tr key={kind.id}>
                      <td className="border-b border-paper-300 py-2 align-bottom font-serif">
                        {kind.name}
                      </td>
                      <td className="border-b border-paper-300 py-2">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
