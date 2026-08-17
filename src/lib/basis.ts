// basis.ts — unter welchem Pfad die App ausgeliefert wird.
//
// GitHub Pages stellt ein Projekt-Repo NICHT unter „/" bereit, sondern unter
// „/<Repo-Name>/". Alles Absolute („/sw.js", „/icons/…") zeigt dort ins Leere.
//
// Die eine Quelle dafür ist `app.json` → `experiments.baseUrl`; Expo trägt sie
// in die Konfiguration ein, und `expo-constants` reicht sie zur Laufzeit
// heraus. So kann der Pfad nicht an zwei Stellen auseinanderlaufen.
import Constants from 'expo-constants';

/** Ohne Schrägstrich am Ende. Leer, wenn die App an der Wurzel liegt. */
export const BASIS: string =
  (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl?.replace(/\/$/, '') ?? '';

/** Ein absoluter Pfad, korrekt vorangestellt. */
export function unterBasis(pfad: string): string {
  return `${BASIS}/${pfad.replace(/^\//, '')}`;
}
