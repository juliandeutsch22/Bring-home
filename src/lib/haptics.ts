// haptics.ts — taktiles Feedback, so weit die Plattform es hergibt.
//
// EHRLICHE BESTANDSAUFNAHME, weil hier viel Halbwissen kursiert:
//
//  · Nativ (iOS/Android als App): `expo-haptics`, volle Taptic Engine.
//  · Android im Browser/als PWA: `navigator.vibrate()` — ein echter, wenn auch
//    grober Motor. Millisekunden statt Nuancen.
//  · iOS im Browser/als PWA: Safari unterstützt die Vibrations-API NICHT.
//    Es gibt genau einen Weg, und der ist ein Kunstgriff: seit iOS 17.4 löst
//    das native Schalter-Bedienelement (`<input type="checkbox" switch>`) beim
//    Umlegen einen Tick aus. Legt man einen unsichtbaren Schalter um, spürt man
//    ihn. Das ist kein API, sondern ein Nebeneffekt — Apple kann ihn jederzeit
//    abstellen, und in älteren iOS-Fassungen passiert schlicht nichts.
//
// Genau deshalb ist Haptik hier NIE tragend: sie bestätigt, was man ohnehin
// sieht. Fällt sie aus, fehlt nichts.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const nativ = Platform.OS === 'ios' || Platform.OS === 'android';
const web = Platform.OS === 'web';

/**
 * Der unsichtbare Schalter für iOS. Wird beim ersten Bedarf angelegt und dann
 * wiederverwendet — ein Element, kein Element pro Tipp.
 *
 * `opacity: 0` statt `display: none`: ein ausgeblendetes Bedienelement wird von
 * Safari nicht bedient, und dann bliebe der Tick aus. Es liegt deshalb da,
 * misst 1×1 Pixel und fängt keine Berührungen ab.
 */
let schalter: HTMLInputElement | null = null;

function iosTick(): void {
  if (typeof document === 'undefined') return;
  try {
    if (!schalter) {
      schalter = document.createElement('input');
      schalter.type = 'checkbox';
      // `switch` ist ein Attribut, kein Typ — TypeScript kennt es nicht.
      schalter.setAttribute('switch', '');
      schalter.setAttribute('aria-hidden', 'true');
      schalter.tabIndex = -1;
      Object.assign(schalter.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
      } as Partial<CSSStyleDeclaration>);
      document.body.appendChild(schalter);
    }
    // Umlegen — die Richtung ist egal, der Tick kommt bei jeder Änderung.
    schalter.checked = !schalter.checked;
  } catch {
    /* Kein Schalter, kein Tick. Kein Problem. */
  }
}

function webTick(ms: number): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
      return;
    } catch {
      /* fällt unten durch */
    }
  }
  iosTick();
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
  // Zwei kurze statt einer langen: „fertig" klingt anders als „gemerkt".
  if (web) webTick(14);
}
