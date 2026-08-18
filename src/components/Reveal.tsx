// Reveal.tsx — sanftes Einschweben beim Mounten (Opacity + leichtes Anheben).
// Web-sicher: endet garantiert im sichtbaren Zustand. Reduced-Motion → sofort da.
//
// ZUR DAUER: 260 ms und 8 px, nicht mehr. Das hier ist die meistgesehene
// Bewegung der App — sie läuft bei JEDEM Start. Vorher standen 520 ms und 14 px
// da, und mit der Staffelung der Blöcke war der Bildschirm erst nach zwei
// Dritteln einer Sekunde fertig. Das ist keine Ruhe mehr, das ist Warten.
//
// Kürzerer Weg, kürzere Zeit: es liest sich jetzt als „setzt sich" statt als
// „fliegt ein" — und bleibt unter den 300 ms, die für Bewegung in einer
// Oberfläche gelten. Dauer und Kurve kommen aus den Tokens; vorher stand hier
// beides hartkodiert, und genau so driftet eine Komponente vom Rest weg.
import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Dur, Ease } from '@/theme/motion.tokens';
import { useReducedMotion } from '@/theme/ThemeProvider';

export function Reveal({ children, delay = 0, distance = 8, style }: { children: React.ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    p.value = reduced ? 1 : withDelay(delay, withTiming(1, { duration: Dur.card, easing: Ease.out }));
  }, [reduced, delay, p]);

  const animStyle = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * distance }] }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
