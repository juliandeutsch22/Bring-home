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
//  · `Faltet`      — für den Block, der auf- und zugeht. Blendet nur ein und
//    aus, ohne `layout`. Seine Höhe ändert sich sofort; die Zeilen DARUNTER
//    gleiten dann von selbst nach, denn die bewegen sich ja nur.
//
// Ein aufklappbarer Editor gehört damit NEBEN die `Listenzeile`, nicht hinein:
//
//    <View key={id}>
//      <Listenzeile>…die Zeile…</Listenzeile>
//      {offen && <Faltet>…der Editor…</Faltet>}
//    </View>
import React from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { Dur, Ease } from '@/theme/motion.tokens';

/**
 * `ReduceMotion.System` statt eigener Abfrage: Reanimated schaltet die
 * Animation dann selbst ab, ohne dass die Komponente neu rendert. Wer im
 * Betriebssystem „Bewegung reduzieren" gesetzt hat, bekommt harte Wechsel —
 * und das ist genau richtig, denn er hat darum gebeten.
 */
const EIN = FadeIn.duration(Dur.card).easing(Ease.out).reduceMotion(ReduceMotion.System);
const AUS = FadeOut.duration(Dur.pressOut).easing(Ease.out).reduceMotion(ReduceMotion.System);
const RUTSCH = LinearTransition.duration(Dur.card).easing(Ease.inOut).reduceMotion(ReduceMotion.System);

/** Eine Zeile fester Höhe. Kommt, geht, und gleitet an ihren neuen Platz. */
export function Listenzeile({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={EIN} exiting={AUS} layout={RUTSCH}>
      {children}
    </Animated.View>
  );
}

/**
 * Ein Block, der auf- und zugeht. Blendet ein und aus, mehr nicht.
 *
 * Bewusst OHNE `layout`: er ist ja gerade das Element, dessen Höhe sich ändert
 * — und dort verzerrt eine Layout-Animation den Inhalt (siehe oben).
 */
export function Faltet({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={EIN} exiting={AUS}>
      {children}
    </Animated.View>
  );
}
