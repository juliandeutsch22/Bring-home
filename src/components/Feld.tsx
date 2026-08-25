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
  eingabeRef,
}: {
  label: string;
  platzhalter: string;
  wert: string | null;
  onSichern: (v: string | null) => void;
  /** Für nebeneinanderliegende Felder (Text `flex: 1`, Menge feste Breite). */
  stil?: ViewStyle;
  /**
   * Ohne eigene Hülle — für den Einsatz IN einer `Mulde`, die die Fläche
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
  /**
   * Zeiger auf das Eingabefeld, damit die ganze ZEILE es fokussieren kann.
   * Ohne ihn traf man nur den rechten Bereich, in dem der Text steht — links
   * neben der Bezeichnung passierte beim Tippen nichts.
   */
  eingabeRef?: React.RefObject<TextInput | null>;
}) {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState(wert ?? '');

  // Eigener Zeiger, falls von außen keiner kommt: Das Mitwachsen braucht das
  // Element, die Aufrufstelle aber nicht immer.
  const eigener = React.useRef<TextInput | null>(null);
  const feld = eingabeRef ?? eigener;

  /**
   * Das breite Feld wächst mit dem Text.
   *
   * Vorher stand hier eine feste Zahl Zeilen, und der Kommentar daneben nannte
   * den Preis: „etwas Leerraum bei kurzen Namen". In der Hand war das kein
   * bisschen „etwas" — unter „Eier" klaffte eine ganze Zeile bis zum Trenner,
   * und der Block sah aus, als fehlte ihm etwas.
   *
   * Im Web ist das Feld ein `<textarea>`, und das wächst NICHT von selbst: Es
   * hat eine Zeilenzahl und scrollt darüber hinaus. Der Weg dorthin ist der
   * bekannte Zweischritt — Höhe auf `auto`, damit `scrollHeight` die WIRKLICHE
   * Höhe des Inhalts meldet und nicht die eingestellte, dann diese Höhe
   * setzen.
   *
   * Auf einem Gerät (nicht im Browser) gibt es kein `scrollHeight`. Dort
   * greift der Effekt gar nicht — und muss es auch nicht: Ein mehrzeiliges
   * Feld ohne feste Höhe wächst dort ohnehin mit.
   */
  React.useEffect(() => {
    if (!breit) return;
    const el = feld.current as unknown as { style?: { height: string }; scrollHeight?: number } | null;
    if (!el?.style || typeof el.scrollHeight !== 'number') return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [breit, entwurf, feld]);

  const sichern = () => {
    const sauber = entwurf.trim();
    if (sauber === (wert ?? '')) return;
    onSichern(sauber || null);
  };

  const eingabe = (
    <TextInput
      ref={feld}
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
      // EINE Zeile als Ausgangspunkt, nicht mehr zwei: Von hier aus setzt der
      // Effekt oben die Höhe auf die des Inhalts. Stünde hier weiter 2, wäre
      // das der Boden, unter den das Feld nicht käme — genau der Leerraum,
      // der weg soll.
      numberOfLines={breit ? 1 : undefined}
      blurOnSubmit={breit ? true : undefined}
      style={[
        { fontSize: T.md, color: colors.text, minHeight: 22 },
        breit
          // `overflow: hidden` gehört zum Mitwachsen dazu: Ohne es blitzt beim
          // Tippen für einen Moment eine Bildlaufleiste auf, bevor der Effekt
          // die neue Höhe setzt.
          ? { width: '100%', textAlign: 'left', overflow: 'hidden' as const }
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
