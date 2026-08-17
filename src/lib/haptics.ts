// haptics.ts — taktiles Feedback, so weit die Plattform es hergibt.
//
// EHRLICHE BESTANDSAUFNAHME, weil hier viel Halbwissen kursiert:
//
//  · Nativ (iOS/Android als App): `expo-haptics`, volle Taptic Engine.
//  · Android im Browser/als PWA: `navigator.vibrate()` — ein echter, wenn auch
//    grober Motor. Millisekunden statt Nuancen.
//  · iOS im Browser/als PWA: NICHTS. Am 17.08.2026 auf dem Gerät durchgemessen,
//    nicht vermutet — mit einer Testseite, die vier Varianten nebeneinander
//    zum Antippen anbot. Keine einzige hat getickt.
//
// Damit ist auch der Kunstgriff erledigt, der hier einmal stand, und weil er
// zäh ist, hier sein Nachruf: seit iOS 17.4 löst das native
// Schalter-Bedienelement (`<input type="checkbox" switch>`) beim Umlegen einen
// Tick aus, heißt es. Daraus wurde die Idee, einen unsichtbaren Schalter per
// Skript umzulegen. Das konnte schon im Ansatz nichts werden — der Tick hängt
// daran, dass ein MENSCH ein sichtbares Bedienelement berührt, und
// `element.checked = !…` ist eine Eigenschaftsänderung, kein Bedienen. Aber
// auch die saubere Fassung, ein echter sichtbarer Schalter unter dem Finger,
// blieb im Test stumm. Es gibt hier nichts zu retten.
//
// WER ALSO IN EINEM JAHR HIERHER KOMMT: bitte nicht erneut anfangen. Wenn, dann
// mit einer Messung auf einem echten Gerät, nicht mit einem Blogeintrag.
//
// Bleibt: auf iOS trägt der SICHTBARE Kanal die Bestätigung allein — das
// Häkchen federt, die Zeile rutscht nach. Genau deshalb war Haptik hier von
// Anfang an nie tragend; sie bestätigt, was man ohnehin sieht. Fällt sie aus,
// fehlt nichts. Echte Haptik auf iOS gäbe es nur mit einer nativen App, und
// die wurde für diese App bewusst nicht gewählt.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const nativ = Platform.OS === 'ios' || Platform.OS === 'android';
const web = Platform.OS === 'web';

/**
 * Im Browser gibt es genau einen Weg, und wo es ihn nicht gibt, passiert
 * nichts. Kein Ersatz, kein Kunstgriff — ein stiller Fehlschlag ist besser als
 * Code, der Arbeit vortäuscht.
 */
function webTick(ms: number): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* Ein verweigerter Tick ist kein Grund, irgendetwas anzuhalten. */
  }
}

/** Leichter Tap — für Knöpfe und Auswahl. */
export function hapticTap(): void {
  if (nativ) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    return;
  }
  if (web) webTick(10);
}

/** Weiche Auswahl — Abhaken, Umschalten, Aufklappen. */
export function hapticSelect(): void {
  if (nativ) {
    Haptics.selectionAsync().catch(() => {});
    return;
  }
  if (web) webTick(8);
}

/** Etwas ist entstanden — angelegt, übernommen, gesichert. */
export function hapticSuccess(): void {
  if (nativ) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return;
  }
  if (web) webTick(14);
}
