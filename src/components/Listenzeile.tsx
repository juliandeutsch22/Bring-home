// Listenzeile.tsx — eine Zeile, die kommt und geht, ohne zu springen.
//
// Das Problem, das sie löst: eine Einkaufsliste ist die ganze Zeit in Bewegung.
// Man hakt etwas ab, es wandert in den Wagen, darunter rutscht alles nach. Ohne
// Übergang ist das ein harter Schnitt — man sieht nicht, WAS passiert ist,
// sondern nur, dass sich etwas geändert hat. Mit Übergang folgt das Auge.
//
// DIE REGEL, teuer gelernt: `layout` gehört an Dinge, die sich BEWEGEN — nie an
// Dinge, die ihre Höhe ändern.
//
// Reanimated setzt eine Layout-Animation im Web über `transform` um. Verschiebt
// sich ein Element nur, ist das ein reines `translate`, und man sieht genau das
// Richtige. Ändert es dagegen seine HÖHE, wird daraus `scaleY` — gemessen
// `matrix(1, 0, 0, 0.43, 0, -33.5)` beim Aufklappen eines Editors. Die ganze
// Zeile wird auf 43 % gestaucht und schnellt auf, die Schrift mit ihr. Das
// liest sich als Ziehen und Zerren, nicht als Aufklappen.
//
// Deshalb zwei Werkzeuge mit klarer Aufgabenteilung:
//  · `Listenzeile` — trägt `layout` und darf NUR Inhalt gleichbleibender Höhe
//    umschließen. Sie gleitet, wenn über ihr etwas verschwindet.
//  · `Faltet`      — für den Block, der auf- und zugeht. Er misst seine eigene
//    Höhe und CLIPPT sie auf, statt sich zu verformen.
//
// Ein aufklappbarer Editor gehört damit NEBEN die `Listenzeile`, nicht hinein:
//
//    <View key={id}>
//      <Listenzeile>…die Zeile…</Listenzeile>
//      {offen && <Faltet>…der Editor…</Faltet>}
//    </View>
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Dur, Ease } from '@/theme/motion.tokens';
import { useReducedMotion } from '@/theme/ThemeProvider';

/**
 * `ReduceMotion.System` statt eigener Abfrage: Reanimated schaltet die
 * Animation dann selbst ab, ohne dass die Komponente neu rendert. Wer im
 * Betriebssystem „Bewegung reduzieren" gesetzt hat, bekommt harte Wechsel —
 * und das ist genau richtig, denn er hat darum gebeten.
 */
const EIN = FadeIn.duration(Dur.card).easing(Ease.out).reduceMotion(ReduceMotion.System);
const AUS = FadeOut.duration(Dur.pressOut).easing(Ease.out).reduceMotion(ReduceMotion.System);
const RUTSCH = LinearTransition.duration(Dur.card).easing(Ease.inOut).reduceMotion(ReduceMotion.System);

/**
 * Eine Zeile fester Höhe. Kommt, geht, und gleitet an ihren neuen Platz.
 *
 * `versatz` staffelt den Abgang: verschwinden viele Zeilen auf einmal (der
 * geleerte Wagen), sieht ein gleichzeitiges Ausblenden aus wie ein Schnitt,
 * ein gestaffeltes wie eine Geste. Nach oben gedeckelt — bei zwanzig Zeilen
 * würde sonst die letzte eine gefühlte Ewigkeit später gehen.
 */
export function Listenzeile({ children, versatz = 0 }: { children: React.ReactNode; versatz?: number }) {
  const aus = versatz > 0 ? AUS.delay(Math.min(versatz, 6) * 30) : AUS;
  return (
    <Animated.View entering={EIN} exiting={aus} layout={RUTSCH}>
      {children}
    </Animated.View>
  );
}

/**
 * Ein Block, der auf- und zugeht.
 *
 * Er MISST seine natürliche Höhe (innerer `onLayout`) und klappt sie auf,
 * während der Rahmen darum `overflow: hidden` trägt. Der Inhalt wird dabei
 * geclippt, nicht transformiert — deshalb kann die Schrift gar nicht verzerren,
 * und genau das war der Fehler der ersten Fassung.
 *
 * `height` läuft nicht auf der GPU, anders als `transform` und `opacity`. Das
 * ist hier der richtige Tausch: es geht um EINEN kleinen Block für 250 ms, und
 * die Alternative war sichtbar verzogene Schrift.
 *
 * Der Abgang bleibt ein reines Ausblenden. Beim Zuklappen hält das gehende
 * Element seine Höhe, bis es fertig ist, und die Zeilen darunter gleiten
 * anschließend über `layout` nach oben — reine Verschiebung, keine Verzerrung.
 */
export function Faltet({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [natur, setNatur] = useState(0);
  const p = useSharedValue(0);

  useEffect(() => {
    if (natur <= 0) return;
    p.value = reduced ? 1 : withTiming(1, { duration: Dur.card, easing: Ease.out });
  }, [natur, reduced, p]);

  // Vor der ersten Messung 0 hoch und unsichtbar: der innere Kasten liegt
  // trotzdem im Fluss und meldet seine natürliche Höhe. Das kostet genau einen
  // Bilddurchlauf — zu kurz, um es zu sehen.
  const stil = useAnimatedStyle(() => ({ height: natur * p.value, opacity: p.value }));

  return (
    <Animated.View exiting={AUS} style={[{ overflow: 'hidden' }, stil]}>
      <View onLayout={(e) => setNatur(e.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  );
}
