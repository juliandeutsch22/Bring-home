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
  nackt = false,
  breit = false,
}: {
  label: string;
  platzhalter: string;
  wert: string | null;
  onSichern: (v: string | null) => void;
  /** Für nebeneinanderliegende Felder (Text `flex: 1`, Menge feste Breite). */
  stil?: ViewStyle;
  /**
   * Ohne eigene Hülle — für den Einsatz IN einer `Mulde`, die die Vertiefung
   * schon trägt. Ein gerundetes Feld in einer gerundeten Mulde wären zwei
   * Vertiefungen ineinander, und die zweite hätte keine Bedeutung.
   */
  nackt?: boolean;
  /**
   * Volle Breite, linksbündig, MEHRZEILIG — für Inhalt, der lang werden darf.
   * Rechtsbündig in einer Zeile wurde ein langer Name abgeschnitten, und man
   * kam nur durch Scrollen im Feld an den Rest.
   */
  breit?: boolean;
}) {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState(wert ?? '');

  const sichern = () => {
    const sauber = entwurf.trim();
    if (sauber === (wert ?? '')) return;
    onSichern(sauber || null);
  };

  const eingabe = (
    <TextInput
      accessibilityLabel={label}
      value={entwurf}
      onChangeText={setEntwurf}
      onSubmitEditing={sichern}
      onBlur={sichern}
      placeholder={platzhalter}
      placeholderTextColor={colors.text3}
      returnKeyType="done"
      // Mehrzeilig, aber Enter SICHERT trotzdem: `blurOnSubmit` sorgt dafür,
      // dass die Eingabetaste das Feld schließt, statt einen Zeilenumbruch in
      // einen Artikelnamen zu schreiben.
      multiline={breit}
      // AUSDRÜCKLICH zwei Zeilen, nicht der Zufallswert des Browsers: Ein
      // mehrzeiliges Feld wächst im Web nicht mit, es hat eine feste Höhe.
      // Zwei ist dieselbe Zahl, die auch die Listenzeile zeigt — der Editor
      // zeigt damit nie weniger als die Liste. Der Preis ist etwas Leerraum
      // bei kurzen Namen; die Alternative wäre ein Feld, in dem lange Namen
      // wieder scrollen müssten, und genau das sollte weg.
      numberOfLines={breit ? 2 : undefined}
      blurOnSubmit={breit ? true : undefined}
      style={[
        { fontSize: T.md, color: colors.text, minHeight: 22 },
        breit
          ? { width: '100%', textAlign: 'left' }
          : nackt
            // In der Mulde steht der Wert RECHTS und die Bezeichnung links —
            // wie in einer Einstellungsliste. Ohne eigenes Polster, das trägt
            // die Zeile der Mulde.
            ? { width: '100%', textAlign: 'right' }
            : { flex: 1, paddingVertical: Spacing.sm },
        webNoOutline,
      ]}
    />
  );

  if (nackt || breit) return eingabe;

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
      {eingabe}
    </View>
  );
}
