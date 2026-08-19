// Schalter.tsx — an oder aus, und man sieht es, ohne zu lesen.
//
// Warum es das neben `Haken` gibt: ein Haken heißt „erledigt" — die Zeile
// verlässt danach die Liste. Ein Schalter heißt „eingeschaltet, bis auf
// weiteres": nichts rutscht weg, der Zustand bleibt stehen und man kommt
// jederzeit zurück. Mitteilungen sind das Zweite, keine Erledigung.
//
// Die Formensprache bleibt dieselbe wie überall: die getönte Fläche IST das
// „an". Aus liegt der Knopf auf der vertieften Steinfläche mit ihrer Haarlinie,
// an fährt er über Kuppel-Blau. Kein zweites Signal, keine Beschriftung im
// Schalter — er sagt es über Farbe und Ort.
//
// Die Dauer ist dieselbe wie beim Haken (`Dur.press + 60`): beides ist die
// Antwort auf einen Tipp, und zwei verschiedene Geschwindigkeiten dafür wären
// zwei verschiedene Behauptungen darüber, wie schnell die App ist.
import React from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { Dur, Ease } from '@/theme/motion.tokens';
import { R, Shadow } from '@/theme/theme.tokens';
import { useColors, useReducedMotion } from '@/theme/ThemeProvider';

const BREITE = 50;
const HOEHE = 30;
const KNOPF = 24;
const LUFT = (HOEHE - KNOPF) / 2;
const WEG = BREITE - KNOPF - LUFT * 2;

export function Schalter({
  an,
  onPress,
  accessibilityLabel,
  /**
   * Aus und nicht umlegbar — z. B. wenn iOS Mitteilungen im Browser-Tab gar
   * nicht anbietet. Der Schalter bleibt STEHEN statt zu verschwinden: er zeigt
   * dann, dass es diese Möglichkeit gibt und dass sie gerade aus ist. Warum sie
   * sich nicht umlegen lässt, sagt der Satz daneben — das kann kein Schalter.
   */
  gesperrt = false,
}: {
  an: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  gesperrt?: boolean;
}) {
  const colors = useColors();
  const reduced = useReducedMotion();

  const p = useDerivedValue(() => {
    const ziel = an ? 1 : 0;
    return reduced ? ziel : withTiming(ziel, { duration: Dur.press + 60, easing: Ease.out });
  }, [an, reduced]);

  // Fläche und Rand wandern MIT, statt in der Mitte umzuspringen — genau dort
  // schaut das Auge hin.
  const bahn = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.sunk, colors.accentA]),
    borderColor: interpolateColor(p.value, [0, 1], [colors.chipBorder, colors.accentA]),
  }));
  const knopf = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * WEG }] }));

  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityState={{ checked: an, disabled: gesperrt }}
      // BEIDES, und das ist kein Versehen: `accessibilityState` trägt am Gerät,
      // im Web kam es nicht an — gemessen stand dort `aria-checked: null`. Ein
      // Schalter ohne diese Angabe wird vorgelesen als „Schalter", ohne zu
      // sagen, ob er an ist. Das ist die eine Auskunft, für die es ihn gibt.
      aria-checked={an}
      aria-disabled={gesperrt}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={gesperrt}
      pressedScale={0.94}
      style={{ opacity: gesperrt ? 0.4 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: BREITE,
            height: HOEHE,
            borderRadius: R.pill,
            borderWidth: 1,
            padding: LUFT,
            justifyContent: 'center',
          },
          bahn,
        ]}
      >
        <Animated.View style={knopf}>
          {/* Der Knopf trägt den einzigen Schatten hier — er liegt AUF der
              Bahn, alles andere in dieser App liegt flach. */}
          <View
            style={[
              { width: KNOPF, height: KNOPF, borderRadius: KNOPF / 2, backgroundColor: '#FFFFFF' },
              Shadow.sm,
            ]}
          />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}
