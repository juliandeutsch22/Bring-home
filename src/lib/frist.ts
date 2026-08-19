// frist.ts — ein Versprechen, das nicht ewig offen bleibt.
//
// Der Fall, für den es das gibt: ein Netzwerk, das nicht ablehnt, sondern
// SCHWEIGT (Hotelportal, Funkloch mit Balken, blockierender Zwischenserver).
// `fetch` wartet dann minutenlang, und auf dem Bildschirm steht „Einen
// Moment …", bis jemand die App wegwischt.
//
// Eine abgelaufene Frist ist eine Antwort; keine Antwort ist keine.
//
// Stand hier einmal in `haushalt.ts` und wurde beim Einbau der Mitteilungen ein
// zweites Mal gebraucht — deshalb liegt es jetzt für sich.

/** Nach so vielen Millisekunden gilt der Server als nicht erreichbar. */
export const FRIST_MS = 8000;

export function mitFrist<T>(versprechen: Promise<T>, frist = FRIST_MS): Promise<T> {
  return new Promise<T>((erfuellen, ablehnen) => {
    const uhr = setTimeout(() => ablehnen(new Error('Der Server antwortet nicht.')), frist);
    versprechen.then(
      (w) => {
        clearTimeout(uhr);
        erfuellen(w);
      },
      (e) => {
        clearTimeout(uhr);
        ablehnen(e);
      },
    );
  });
}
