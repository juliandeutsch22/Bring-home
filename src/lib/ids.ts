// ids.ts — Kennungen entstehen auf dem GERÄT, nicht auf dem Server.
//
// Das ist die Voraussetzung dafür, dass die App ohne Netz vollständig
// funktioniert: ein Eintrag, den man im Supermarkt anlegt, hat sofort seine
// endgültige Kennung. Käme sie vom Server, müsste man sie später austauschen —
// und jede Verknüpfung darauf mit.
export function neueId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Rückfall für Umgebungen ohne WebCrypto (ältere RN-Laufzeiten). Er muss
  // ebenfalls eine echte UUID ergeben: seit Etappe 3 landen diese Kennungen in
  // einer `uuid`-Spalte, und alles andere würde der Server zurückweisen —
  // ausgerechnet auf dem Gerät, das den Rückfall überhaupt braucht.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (z) => {
    const r = Math.floor(Math.random() * 16);
    return (z === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Ein Zeitstempel in der Form, in der alles gespeichert wird. */
export function jetzt(): string {
  return new Date().toISOString();
}
