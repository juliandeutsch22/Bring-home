// Wahlzeile.tsx — eine Zeile, die aus wenigen Möglichkeiten eine zeigt und
// beim Antippen zur nächsten weiterschaltet.
//
// Warum das und nicht eine Reihe Pillen: Pillen zeigen ALLE Möglichkeiten
// gleichzeitig. Bei zwei oder drei ist das ein Gewinn, bei fünf brechen sie um
// und die Fläche wird zur Schalttafel — in einem aufklappenden Editor, in dem
// darüber schon zwei Felder stehen, kippt das in Unübersichtlichkeit.
//
// Warum kein Auswahl-Menü: Ein natives `<select>` zeichnet das System, und es
// sähe zwischen den Steinplatten aus wie hineingefallen. Ein eigenes Sheet
// wäre viel Maschinerie für eine Eigenschaft, die man je Aufgabe einmal setzt.
//
// Warum kein Schalter: Der kann an und aus. Die Frage ist aber nicht OB,
// sondern WIE OFT — nach dem Schalter käme noch eine Auswahl, also zwei
// Bedienelemente statt einem.
//
// Die Zeile trägt bewusst dieselbe Form wie `Feld`: gleiche Rundung, gleiche
// vertiefte Fläche, gleiche Haarlinie. Im Editor stehen damit drei Zeilen
// untereinander, die aussehen, als gehörten sie zusammen — weil sie das tun.
// Und der ungesetzte Wert steht in derselben stillen Farbe wie ein
// Platzhalter, sodass „nichts gewählt" genauso leise ist wie ein leeres Feld.
import React from 'react';
import { View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { hapticSelect } from '@/lib/haptics';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

export type Wahl<T> = { label: string; wert: T };

export function Wahlzeile<T>({
  label,
  optionen,
  wert,
  onWert,
  /** Welcher Wert „nichts gewählt" bedeutet — er wird still dargestellt. */
  leer,
  accessibilityPraefix,
  nackt = false,
}: {
  label: string;
  optionen: readonly Wahl<T>[];
  wert: T;
  onWert: (w: T) => void;
  leer?: T;
  /** Titel der Zeile, damit mehrere Wahlzeilen unterscheidbar bleiben. */
  accessibilityPraefix?: string;
  /**
   * Ohne eigene Hülle und ohne Bezeichnung — für den Einsatz IN einer
   * `Mulde`, die beides schon trägt. Übrig bleibt der Wert allein.
   */
  nackt?: boolean;
}) {
  const colors = useColors();
  const stelle = Math.max(0, optionen.findIndex((o) => o.wert === wert));
  const jetzt = optionen[stelle] ?? optionen[0];
  const ungesetzt = leer !== undefined && jetzt.wert === leer;

  const weiter = () => {
    hapticSelect();
    onWert(optionen[(stelle + 1) % optionen.length].wert);
  };

  return (
    <PressableScale
      // Der aktuelle Wert steht IM Namen: Ein Vorleseprogramm nennt sonst nur
      // „Kommt wieder" und verschweigt genau die Auskunft, für die es die
      // Zeile gibt.
      accessibilityLabel={`${accessibilityPraefix ? `${accessibilityPraefix} ` : ''}${label}: ${jetzt.label}`}
      accessibilityHint="Antippen wechselt zur nächsten Möglichkeit"
      onPress={weiter}
      pressedScale={0.99}
      style={
        nackt
          ? { alignSelf: 'flex-end' }
          : {
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              borderRadius: R.lg,
              borderWidth: 1,
              borderColor: colors.chipBorder,
              backgroundColor: colors.sunk,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              minHeight: 38,
            }
      }
    >
      {!nackt && (
        <Type variant="body" tone="text3" style={{ flex: 1 }} numberOfLines={1}>{label}</Type>
      )}
      <View>
        {/* Gesetzt trägt der Wert die Handlungsfarbe, ungesetzt die stille —
            wie ein gefülltes gegen ein leeres Feld. */}
        <Type variant="body" tone={ungesetzt ? 'text3' : 'accentA'} numberOfLines={1}>
          {jetzt.label}
        </Type>
      </View>
    </PressableScale>
  );
}
