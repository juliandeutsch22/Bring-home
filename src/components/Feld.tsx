// Feld.tsx — ein Textfeld, das seinen Wert beim Abschicken UND beim Verlassen
// sichert.
//
// Warum beides: `onEndEditing` allein reicht nicht — auf iOS feuert es, im Web
// nicht zuverlässig. Da die App zuerst im Browser lebt, wäre das Feld dort
// still wirkungslos gewesen: man tippt etwas, nichts passiert. Deshalb
// `onSubmitEditing` (Enter) plus `onBlur` (woanders hingetippt).
//
// Es liegt hier und nicht in einem Screen, weil inzwischen drei Stellen es
// brauchen: Aufgaben (Person, Warten auf), Einkauf (Text, Menge) und Zutaten.
import React, { useState } from 'react';
import { TextInput, View, type ViewStyle } from 'react-native';

import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

export function Feld({
  label,
  platzhalter,
  wert,
  onSichern,
  stil,
}: {
  label: string;
  platzhalter: string;
  wert: string | null;
  onSichern: (v: string | null) => void;
  /** Für nebeneinanderliegende Felder (Text `flex: 1`, Menge feste Breite). */
  stil?: ViewStyle;
}) {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState(wert ?? '');

  const sichern = () => {
    const sauber = entwurf.trim();
    if (sauber === (wert ?? '')) return;
    onSichern(sauber || null);
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: colors.chipBorder,
          backgroundColor: colors.sunk,
          paddingHorizontal: Spacing.md,
        },
        stil,
      ]}
    >
      <TextInput
        accessibilityLabel={label}
        value={entwurf}
        onChangeText={setEntwurf}
        onSubmitEditing={sichern}
        onBlur={sichern}
        placeholder={platzhalter}
        placeholderTextColor={colors.text3}
        returnKeyType="done"
        style={[{ flex: 1, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm, minHeight: 22 }, webNoOutline]}
      />
    </View>
  );
}
