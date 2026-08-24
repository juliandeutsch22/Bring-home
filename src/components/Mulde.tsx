// Mulde.tsx — der aufgeklappte Teil einer Zeile als VERTIEFUNG in der Platte.
//
// Warum es das gibt: Vorher lagen dort zwei, drei gerundete Felder frei auf
// dem Stein. Drei Dinge fehlten ihnen, und zusammen ließen sie den Editor
// billig aussehen:
//
//  1. Sie gehörten zu nichts. Kein gemeinsamer Rahmen, keine geteilte Kante —
//     nichts sagte, dass sie die Zeile darüber beschreiben.
//  2. Sie hatten DIESELBE Form wie das große Eingabefeld am Kopf des
//     Bildschirms. Ein Detail sah aus wie eine Haupthandlung; die Form trug
//     keine Bedeutung mehr.
//  3. Sie waren unbeschriftet. Man sah zwei graue Blasen und musste raten.
//
// Die Antwort steht schon in `Glass.tsx`: „ein Feld ist eine Mulde im Stein,
// kein aufgelegtes Plättchen." Bisher war das nur eine Tönung. Hier wird es
// Physik — und zwar die UMGEKEHRTE der Platte:
//
//   Platte (erhaben):  Lichtgrat OBEN, Schattengrat UNTEN.
//   Mulde (vertieft):  Schattengrat OBEN, Lichtgrat UNTEN.
//
// Das ist dieselbe Überlegung wie beim Meißel in `Type.tsx`, nur eine Ebene
// höher: Licht kommt von links oben, also liegt der Schatten dort, wo der
// Stein weggenommen wurde, und das Licht auf der gegenüberliegenden Wand.
// Eine Mulde mit Lichtgrat oben sähe aus wie eine zweite, kleinere Platte —
// und genau das war der alte Zustand.
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

// Dieselben Blätter wie in `Glass.tsx` — die Mulde liegt IN der Platte, also
// muss die Maserung dieselbe sein. Zwei Steinsorten nebeneinander sähen aus
// wie zwei Materialien.
const MARMOR_HELL = require('../../assets/images/marble-light.jpg');
const MARMOR_DUNKEL = require('../../assets/images/marble-dark.jpg');

/**
 * Die Vertiefung selbst. Nimmt Zeilen auf, keine freien Felder.
 *
 * Die erste Fassung war zwei harte Striche auf einer flachen Tönung — und sah
 * genau danach aus. Zwei Fehler, beide gelernt:
 *
 *  · Die Stärken waren VERTAUSCHT. Der Lichtgrat unten lag bei 2 px und 0,9
 *    Deckkraft und war das Lauteste am ganzen Element; der Schattengrat oben
 *    bei 0,14 war fast unsichtbar. Ein aufgemalter weißer Streifen also, dort
 *    wo Licht nur streifen sollte.
 *  · Es fehlte der SCHLAGSCHATTEN DER OBEREN WAND. Das ist der eigentliche
 *    Hinweis auf Tiefe: In einer echten Mulde wirft die obere Kante Schatten
 *    auf den Boden, und der läuft nach unten aus. Ohne ihn bleibt jede
 *    Vertiefung ein Rechteck mit Rändern, egal wie fein die Ränder sind.
 *
 * Deshalb steht hier ein Verlauf und keine Linie. Die Grate laufen außerdem
 * über die volle Breite und werden von der Rundung beschnitten, statt seitlich
 * eingerückt abzubrechen — eine Kante hört an der Ecke auf, nicht davor.
 */
export function Mulde({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const isDark = useScheme() === 'dark';

  // Licht kommt von links oben (wie im Backdrop und an der Platte). In einer
  // VERTIEFUNG heißt das: Schatten oben und links, Licht unten und rechts —
  // die Umkehrung der erhabenen Platte.
  const schatten = isDark ? 'rgba(0,0,0,0.60)' : 'rgba(52,46,32,0.20)';
  const schattenWeich = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(52,46,32,0.075)';
  const licht = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.55)';

  return (
    <View style={{ borderRadius: R.md, backgroundColor: colors.sunk, overflow: 'hidden' }}>
      {/* DASSELBE Korn wie die Platte ringsum — und das ist keine Kosmetik.
          Ohne Textur ist die Mulde eine glatte Fläche in einer gemaserten, und
          sie liest sich als Kunststoff, der in Stein eingelassen wurde. Eine
          Mulde ist derselbe Stein, nur tiefer; also trägt sie dieselbe
          Maserung. Das war der eigentliche Grund, warum die erste Fassung
          „flach und unnatürlich" wirkte — nicht die Grate. */}
      {/* Im View verpackt wie in `Glass.tsx`: `Image` kennt `pointerEvents`
          nicht. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={isDark ? MARMOR_DUNKEL : MARMOR_HELL}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Der Schnitt selbst: die Kante, an der Stein weggenommen wurde. Eine
          Haarlinie, nicht mehr — sie ist scharf, aber sie ist dünn. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: schatten }}
      />
      {/* Der Schlagschatten der oberen Wand, nach unten auslaufend. Das ist das
          Stück, das Tiefe macht. */}
      <LinearGradient
        pointerEvents="none"
        colors={[schattenWeich, 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16 }}
      />
      {/* Dasselbe von links, deutlich schwächer: die dem Licht zugewandte Wand
          liegt im Schatten ihrer eigenen Kante. */}
      <LinearGradient
        pointerEvents="none"
        colors={[schattenWeich, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 10, opacity: 0.7 }}
      />
      {/* Unten sammelt sich Licht auf der gegenüberliegenden Wand — als
          Verlauf, nicht als Strich, und schwächer als der Schatten oben.
          Tiefe liest man am Schatten, nicht am Glanz. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', licht]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8 }}
      />
      {children}
    </View>
  );
}

/**
 * Eine Zeile in der Mulde: Bezeichnung links, Wert rechts.
 *
 * Die Bezeichnung ist der eigentliche Gewinn gegenüber dem alten Zustand. Ein
 * Platzhalter verschwindet, sobald man tippt — danach steht dort ein Wert ohne
 * Namen, und beim nächsten Öffnen weiß niemand mehr, was in welchem Feld
 * stand. Eine Bezeichnung bleibt.
 */
export function MuldenZeile({
  label,
  children,
  /** Die letzte Zeile bekommt keinen Trenner. */
  letzte = false,
}: {
  label: string;
  children: React.ReactNode;
  letzte?: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm + 2,
          minHeight: 44,
        }}
      >
        <Type variant="body" tone="text2" numberOfLines={1}>{label}</Type>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
      </View>
      {/* An der TEXTKANTE eingerückt, nicht über die volle Breite: so liest
          sich die Mulde als ein Block mit Zeilen, nicht als Stapel von
          Kästchen. */}
      {!letzte && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginLeft: Spacing.md,
          }}
        />
      )}
    </View>
  );
}

/**
 * Eine Handlung als eigene Zeile in der Mulde — für Löschen und Ähnliches.
 *
 * Vorher hing so ein Satz frei unter den Feldern, ohne Trenner und ohne
 * Fläche; er sah aus wie vergessen. In der Mulde bekommt er dieselbe Zeilenhöhe
 * wie alles andere und einen Trenner darüber. Der Zweitton bleibt: In dieser
 * App schreit auch das Löschen nicht.
 */
export function MuldenHandlung({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.md }} />
      <PressableScale
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        pressedScale={0.99}
        style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, minHeight: 44, justifyContent: 'center' }}
      >
        <Type variant="body" tone="accentB">{label}</Type>
      </PressableScale>
    </View>
  );
}
