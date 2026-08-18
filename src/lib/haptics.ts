// haptics.ts — taktiles Feedback, so weit die Plattform es hergibt.
//
// EHRLICHE BESTANDSAUFNAHME:
//
//  · Nativ (iOS/Android als App): `expo-haptics`, volle Taptic Engine.
//  · Android im Browser/als PWA: `navigator.vibrate()` — ein echter, wenn auch
//    grober Motor. Millisekunden statt Nuancen.
//  · iOS im Browser/als PWA: die Vibrations-API gibt es NICHT. Es bleibt ein
//    Kunstgriff, und der funktioniert: seit iOS 17.4 löst das native
//    Schalter-Bedienelement (`<input type="checkbox" switch>`) beim Umlegen
//    einen Tick der Taptic Engine aus. Ein verstecktes Exemplar, per Skript
//    angeklickt, tickt mit.
//
// ZUR VORGESCHICHTE, weil sie eine Warnung enthält: hier stand dieser
// Kunstgriff schon einmal, kaputt. Zwei Fehler auf einmal —
//
//   1. Ausgelöst wurde mit `element.checked = !element.checked`. Das ist eine
//      Eigenschaftsänderung und kein Klick; es passiert schlicht nichts.
//      Nötig ist `label.click()` auf dem umschließenden Etikett.
//   2. Der Schalter trug eigenes CSS (1×1 Pixel, `opacity: 0`). Sobald man ihm
//      Maße gibt, hört Safari auf, ihn NATIV zu zeichnen — und ohne natives
//      Bedienelement kein Tick. Er braucht `all: initial` und
//      `appearance: auto`, also ausdrücklich KEINE eigene Gestaltung.
//
// Der zweite Fehler steckte danach auch in meiner Testseite, weshalb die erste
// Messung „geht nicht" ergab und ich daraus fälschlich „geht grundsätzlich
// nicht" gemacht habe. Erst der zweite, ungestylte Test auf einem iPhone 14 Pro
// hat es gezeigt: es tickt.
//
// MERKSATZ: Der Aufbau unten ist genau der, der gemessen wurde. Wer daran etwas
// ändert — Maße, Sichtbarkeit, `aria-hidden`, `tabindex` —, ändert an einem
// Nebeneffekt, den niemand dokumentiert hat, und muss auf einem echten Gerät
// nachmessen. Nicht nachdenken, nachmessen.
//
// Kein npm-Paket dafür: `web-haptics` macht genau dies (nachgelesen in
// `dist/chunk-4NSAIXAB.mjs`), und eine Abhängigkeit für dreißig Zeilen, die wir
// inzwischen verstehen, wäre der schlechtere Tausch.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const nativ = Platform.OS === 'ios' || Platform.OS === 'android';
const web = Platform.OS === 'web';

/** Das Etikett, auf das geklickt wird. Eins für die ganze App, nicht eins pro Tipp. */
let etikett: HTMLLabelElement | null = null;
let gebaut = false;

/**
 * Baut den versteckten Schalter — beim ersten Bedarf, nicht beim Import.
 *
 * `display: none` auf beiden Elementen ist Absicht und geprüft: der Tick kommt
 * trotzdem, und ein unsichtbares Element nimmt weder Platz noch Tastaturfokus
 * und steht auch nicht im Vorleseprogramm.
 */
function baueSchalter(): HTMLLabelElement | null {
  if (gebaut) return etikett;
  gebaut = true;
  if (typeof document === 'undefined') return null;
  try {
    const kennung = 'bring-home-haptik';
    const l = document.createElement('label');
    l.setAttribute('for', kennung);
    l.style.display = 'none';

    const s = document.createElement('input');
    s.type = 'checkbox';
    // `switch` ist ein Attribut, kein Typ — TypeScript kennt es nicht.
    s.setAttribute('switch', '');
    s.id = kennung;
    // Die zwei Zeilen, an denen alles hängt: keine eigene Gestaltung, sondern
    // ausdrücklich das native Bedienelement.
    s.style.all = 'initial';
    s.style.appearance = 'auto';
    s.style.display = 'none';

    l.appendChild(s);
    document.body.appendChild(l);
    etikett = l;
    return l;
  } catch {
    return null;
  }
}

/**
 * Ein Tick. Auf Android der echte Motor, auf iOS der Schalter.
 *
 * Die Vibrations-API kommt zuerst: wo es sie gibt, ist sie die richtige Antwort
 * und kennt sogar Dauern. Der Schalter ist der Rückfall, und er kann genau eins
 * — ticken. Stärke und Länge sind nicht einstellbar.
 */
function webTick(ms: number): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
      return;
    } catch {
      /* fällt durch auf den Schalter */
    }
  }
  baueSchalter()?.click();
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

/**
 * Etwas ist entstanden — angelegt, übernommen, gesichert.
 *
 * Zwei Ticks statt einem: „fertig" soll sich anders anfühlen als „gemerkt".
 * Weil der Schalter keine Stärke kennt, ist der Abstand das einzige Mittel,
 * das bleibt — kurz genug, dass es als EIN Ereignis durchgeht, lang genug, dass
 * man zwei zählt.
 */
export function hapticSuccess(): void {
  if (nativ) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return;
  }
  if (!web) return;
  webTick(14);
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    // Nur auf dem Schalter-Weg nachlegen. Wo `vibrate` läuft, trägt schon die
    // Dauer die Aussage, und ein zweiter Stoß wäre bloß Lärm.
    setTimeout(() => baueSchalter()?.click(), 90);
  }
}
