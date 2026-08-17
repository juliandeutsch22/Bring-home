// Backdrop.tsx — der Grund, auf dem alles liegt.
//
// In Stoa war das ein dorischer Tempel. Hier ist es das, was zu einer
// Einkaufsliste gehört: ein Blatt Papier, das etwas schmaler ist als der
// Bildschirm und oben und unten aus dem Bild läuft.
//
// Zwei Regeln vom Vorbild gelten weiter: KEINE Konturlinien (die Form entsteht
// rein über weiche Hell-Dunkel-Flächen), und der Grund ist Grund, kein Motiv —
// wer ihn bemerkt, hat schon zu viel gesehen.
//
// Ausdrücklich OHNE waagerechte Elemente. Der erste Entwurf hatte Falze quer
// über das Blatt; sie lasen sich nicht wie Papier, sondern wie Striche, die
// versehentlich über den Bildschirm laufen. Senkrechte Kanten verzeichnen beim
// Strecken nicht, waagerechte schon.
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

import { useColors, useReducedMotion, useScheme } from '@/theme/ThemeProvider';

/** Wie stark der Grund dem Scrollen folgt (klein = weit hinten). */
const PARALLAX_FACTOR = 0.08;
/** Über-Ausdehnung, damit die Bewegung keine Ränder freilegt. */
const BLEED = 120;
/** Wie weit das Blatt vom Bildschirmrand einrückt (Anteil der Breite). */
const RAND = 0.055;

export function Backdrop({ scrollY }: { scrollY?: SharedValue<number> }) {
  const colors = useColors();
  const isDark = useScheme() === 'dark';
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();

  const blatt = '#FFFFFF';
  const schatten = isDark ? '#000000' : '#3A3226';
  // Im Dunkeln ist Papier nicht weiß, sondern nur eine Spur heller als der
  // Tisch — sonst leuchtet der Grund und die Platten darüber verschwinden.
  const blattDeckung = isDark ? 0.03 : 0.55;

  const style = useAnimatedStyle(() => {
    if (!scrollY || reduced) return { transform: [{ translateY: 0 }] };
    return { transform: [{ translateY: -scrollY.value * PARALLAX_FACTOR }] };
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: -BLEED, height: height + BLEED * 2 }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            {/* Der Schatten, den die Blattkante auf den Tisch wirft — nach
                außen auslaufend, damit keine Linie entsteht. */}
            <SvgGradient id="schattenRechts" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={schatten} stopOpacity={isDark ? 0.45 : 0.09} />
              <Stop offset="1" stopColor={schatten} stopOpacity="0" />
            </SvgGradient>
            <SvgGradient id="schattenLinks" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={schatten} stopOpacity="0" />
              <Stop offset="1" stopColor={schatten} stopOpacity={isDark ? 0.45 : 0.09} />
            </SvgGradient>
          </Defs>

          {/* Das Blatt. */}
          <Rect x={RAND * 100} y="0" width={100 - RAND * 200} height="100" fill={blatt} fillOpacity={blattDeckung} />
          {/* Seine Kantenschatten, außerhalb des Blattes. */}
          <Rect x={RAND * 100 - 4} y="0" width="4" height="100" fill="url(#schattenLinks)" />
          <Rect x={100 - RAND * 100} y="0" width="4" height="100" fill="url(#schattenRechts)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
