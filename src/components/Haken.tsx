// Haken.tsx — das Kästchen, das man antippt. Der einzige Ort in dieser App,
// an dem etwas federn darf.
//
// Begründung: Abhaken ist DIE Handlung im Einkauf. Alles andere (Zeilen, die
// nachrutschen, Abschnitte, die aufgehen) soll man nicht bemerken; diesen einen
// Tipp soll man spüren, auch mit den Augen. Deshalb bekommt das Häkchen einen
// kleinen Auftritt — und das Kästchen darunter wechselt seine Füllung weich
// statt hart.
//
// Die Formensprache bleibt: leer = nacktes Kästchen mit Strich (getönte Fläche
// hieße in diesem System „an"), voll = getönte Fläche mit weißem Haken.
import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { Dur, Ease } from '@/theme/motion.tokens';
import { useColors, useReducedMotion } from '@/theme/ThemeProvider';

export function Haken({
  an,
  rund = false,
  groesse = 22,
}: {
  an: boolean;
  /** Aufgaben tragen einen Kreis, Einkaufsartikel ein Kästchen. */
  rund?: boolean;
  groesse?: number;
}) {
  const colors = useColors();
  const reduced = useReducedMotion();

  // Ein Wert für beides: Füllung und Häkchen laufen synchron, sonst sieht man
  // das Häkchen kurz auf leerem Grund stehen.
  const p = useDerivedValue(() => {
    const ziel = an ? 1 : 0;
    return reduced ? ziel : withTiming(ziel, { duration: Dur.press + 60, easing: Ease.out });
  }, [an, reduced]);

  // Die Umrandung wandert MIT, statt bei der Hälfte umzuspringen. Vorher stand
  // hier `p.value > 0.5 ? accentA : border3` — ein harter Farbwechsel genau in
  // der Mitte der Animation, also dort, wo das Auge hinschaut. Alles andere
  // (Füllfarbe, Deckkraft) gehört in den statischen Stil: Konstanten in einem
  // animierten Stil werden jeden Frame neu berechnet, ohne sich je zu ändern.
  const kasten = useAnimatedStyle(() => ({
    borderColor: interpolateColor(p.value, [0, 1], [colors.border3, colors.accentA]),
  }));
  const fuellung = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.7 + p.value * 0.3 }] }));
  const haken = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.5 + p.value * 0.5 }] }));

  return (
    <Animated.View
      style={[
        {
          width: groesse,
          height: groesse,
          borderRadius: rund ? groesse / 2 : 6,
          borderWidth: 1.5,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        kasten,
      ]}
    >
      {/* Die Füllung liegt als eigene Fläche darunter — eine animierte
          Hintergrundfarbe müsste zwischen zwei Hex-Werten interpolieren, und
          das ergibt auf halbem Weg einen Ton, den es in der Palette nicht gibt. */}
      <Animated.View
        style={[
          { position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, backgroundColor: colors.accentA },
          fuellung,
        ]}
      />
      <Animated.View style={haken}>
        <View>
          <Check size={groesse * 0.64} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
