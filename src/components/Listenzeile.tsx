// Listenzeile.tsx — eine Zeile, die kommt und geht, ohne zu springen.
//
// Das Problem, das sie löst: eine Einkaufsliste ist die ganze Zeit in Bewegung.
// Man hakt etwas ab, es wandert in den Wagen, darunter rutscht alles nach. Ohne
// Übergang ist das ein harter Schnitt — man sieht nicht, WAS passiert ist,
// sondern nur, dass sich etwas geändert hat. Mit Übergang folgt das Auge.
//
// Drei Bewegungen, alle aus denselben Tokens wie in Stoa:
//  · `entering` — Neues blendet ein, statt aufzupoppen.
//  · `exiting`  — Gehendes blendet aus. Ein harter Schnitt nach einem weichen
//                 Auftritt liest sich als Fehler, nicht als Ruhe.
//  · `layout`   — die ÜBRIGEN Zeilen gleiten nach. Das ist die wichtigste von
//                 den dreien und die, die man am wenigsten bemerkt.
//
// Bewusst KEIN Versatz und keine Feder: Zeilen sollen nicht auftreten. Die
// einzige Ausnahme ist das Häkchen selbst (siehe `Haken`), denn das ist die
// Handlung.
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

export function Listenzeile({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={EIN} exiting={AUS} layout={RUTSCH}>
      {children}
    </Animated.View>
  );
}

/** Ein Block, der sich beim Auf- und Zuklappen mitbewegt (ohne Ein-/Ausblenden). */
export function Rutscht({ children }: { children: React.ReactNode }) {
  return <Animated.View layout={RUTSCH}>{children}</Animated.View>;
}
