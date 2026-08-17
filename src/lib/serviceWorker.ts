// serviceWorker.ts — meldet den Service Worker an. Nur im Browser.
//
// Bewusst ohne jede Rückmeldung an den Nutzer: gelingt es, startet die App
// künftig offline; gelingt es nicht, läuft sie wie zuvor. Beides ist kein
// Ereignis, über das jemand informiert werden möchte.
import { Platform } from 'react-native';

export function serviceWorkerAnmelden(): void {
  if (Platform.OS !== 'web') return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const anmelden = () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  // Erst nach dem Laden — vorher konkurriert die Anmeldung mit dem Bundle.
  // ABER: dieses Modul läuft womöglich erst, wenn `load` längst durch ist
  // (das Bundle IST der Grund, warum es dauert). Wer sich dann nur auf den
  // Ereignis-Zuhörer verlässt, meldet nie an — genau so ist es hier
  // aufgefallen, der Service Worker fehlte still.
  if (document.readyState === 'complete') anmelden();
  else window.addEventListener('load', anmelden);
}
