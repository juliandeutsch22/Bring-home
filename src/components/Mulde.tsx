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
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

/** Die Vertiefung selbst. Nimmt Zeilen auf, keine freien Felder. */
export function Mulde({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const isDark = useScheme() === 'dark';
  const radius = R.md;
  const inset = radius * 0.7;

  return (
    <View style={{ borderRadius: radius, backgroundColor: colors.sunk, overflow: 'hidden' }}>
      {/* Schattengrat oben — hier wurde Stein weggenommen. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: inset,
          right: inset,
          height: 2,
          backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(60,55,40,0.14)',
        }}
      />
      {/* Lichtgrat unten — die gegenüberliegende Wand fängt das Licht. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: inset,
          right: inset,
          height: 2,
          backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.9)',
        }}
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
