// ids.ts — Kennungen entstehen auf dem GERÄT, nicht auf dem Server.
//
// Das ist die Voraussetzung dafür, dass die App ohne Netz vollständig
// funktioniert: ein Eintrag, den man im Supermarkt anlegt, hat sofort seine
// endgültige Kennung. Käme sie vom Server, müsste man sie später austauschen —
// und jede Verknüpfung darauf mit.
export function neueId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Rückfall für Umgebungen ohne WebCrypto (ältere RN-Laufzeiten).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Ein Zeitstempel in der Form, in der alles gespeichert wird. */
export function jetzt(): string {
  return new Date().toISOString();
}
