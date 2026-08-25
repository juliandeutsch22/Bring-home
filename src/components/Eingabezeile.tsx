// Eingabezeile.tsx — die EINE Zeile, in die man tippt.
//
// Sie sieht aus wie ihr Vorbild in Stoa und ist es aus demselben Grund: sie ist
// die TÜR, nicht ein Feld unter vielen. Deshalb liegt sie als Pille auf dem
// Stein, nicht als eingesenkter Kasten mit Haarlinie — der sagt „hier ist ein
// Formular", und ein Einkaufszettel ist kein Formular.
//
// Drei Dinge machen den Unterschied, alle aus Stoa übernommen:
//
//  1. Eine `Glass`-PILLE statt Rahmen und Kasten. Dieselbe Steinsorte wie die
//     Platten darunter, nur rund — sie gehört sichtbar zur selben Welt.
//  2. Ein eigener Schatten, flach und weit. Er hebt die Zeile über alles
//     andere. Bewusst KEIN Token: sonst wandert der Wert durch die App und
//     alles fängt an zu schweben.
//  3. Der Knopf rechts ist eine GEFÜLLTE Scheibe in Akzent A und erscheint
//     erst, wenn wirklich etwas dasteht. Getönte Fläche heißt in diesem System
//     „an" — ein dauerhaft sichtbarer Knopf, der meistens nichts tut, wäre
//     genau die Lüge, die die Formensprache vermeidet.
//
// LINKS STEHT NICHTS, und das war eine Korrektur. Zuerst saß dort ein Plus,
// aus Stoa mitkopiert. Dort trägt es seinen Platz: es wird zur Büroklammer,
// sobald es etwas anzuhängen gibt, und bleibt nur ohne Schlüssel ein Zeichen.
// Hier gibt es nichts anzuhängen — es war reine Zierde. Schlimmer noch: sobald
// man tippt, erscheint rechts das ECHTE Plus, und dann standen zwei gleiche
// Zeichen in einer Zeile, von denen nur eines etwas tut. Ein Zeichen, das
// aussieht wie ein Knopf und keiner ist, kostet mehr als der leere Platz.
import { Plus } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { PopIn } from '@/components/PopIn';
import { PressableScale } from '@/components/PressableScale';
import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

/**
 * Flach und weit. Shadow.lg verschwand auf dem cremefarbenen Grund; das hier
 * ist derselbe weiche Charakter, nur weit genug getrieben, dass die Kante
 * trägt.
 */
const SCHATTEN_ZEILE = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.16,
  shadowRadius: 18,
  elevation: 6,
} as const;

export function Eingabezeile({
  label,
  platzhalter,
  wert,
  onWert,
  onAbschicken,
  knopfLabel,
}: {
  label: string;
  platzhalter: string;
  wert: string;
  onWert: (v: string) => void;
  onAbschicken: () => void;
  knopfLabel: string;
}) {
  const colors = useColors();
  const etwasDa = wert.trim().length > 0;

  return (
    <Glass
      variant="pill"
      style={SCHATTEN_ZEILE}
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 5,
        // Links mehr Luft als rechts: dort stand einmal ein Zeichen, und der
        // Text soll nicht an der Rundung der Pille kleben. Rechts hält der
        // Knopf den Abstand von selbst.
        paddingLeft: Spacing.lg,
        paddingRight: Spacing.md,
      }}
    >
      <TextInput
        accessibilityLabel={label}
        value={wert}
        onChangeText={onWert}
        onSubmitEditing={onAbschicken}
        placeholder={platzhalter}
        // Eine Einladung, keine Randnotiz — deshalb text2, nicht text3.
        placeholderTextColor={colors.text2}
        returnKeyType="done"
        submitBehavior="submit"
        // `minHeight` ist kein Schönheitsmaß, sondern eine Reparatur aus Stoa:
        // ohne sie ist der Textkasten kleiner als das Glyphenfeld, und weil ein
        // Eingabefeld `overflow: clip` hat, werden Unterlängen (g, j) leicht
        // abgeschnitten. Man sieht es nur, wenn man es einmal gesehen hat —
        // und dann immer.
        style={[{ flex: 1, minWidth: 0, fontSize: T.md, color: colors.text, paddingVertical: 2, minHeight: 24 }, webNoOutline]}
      />
      {etwasDa && (
        // `von={0.88}` statt der Vorgabe 0.6: dieser Knopf erscheint beim
        // ERSTEN Tastendruck, also ständig. Ein Sprung von 60 % ist für 30 px
        // viel Persönlichkeit an einer Stelle, die man dutzendfach am Tag
        // auslöst — er soll auftauchen, nicht auftreten.
        <PopIn von={0.88}>
          <PressableScale
            accessibilityLabel={knopfLabel}
            onPress={onAbschicken}
            style={{
              width: 30,
              height: 30,
              borderRadius: R.pill,
              backgroundColor: colors.accentA,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={17} color="#FFFFFF" strokeWidth={2.6} />
          </PressableScale>
        </PopIn>
      )}
    </Glass>
  );
}

/** Der Platz, den die Zeile freihält — damit sie nicht am Titel klebt. */
export const ZEILE_LUFT = Spacing.xs;

/**
 * Dasselbe Feld eine Stufe leiser: für Eingaben INNERHALB einer Platte
 * (Zutat zu einem Gericht). Es ist dort keine Tür, sondern eine Zeile im
 * Formular — und trägt deshalb wieder eingesenkte Fläche und Haarlinie.
 */
export function Nebenzeile({
  label,
  platzhalter,
  wert,
  onWert,
  onAbschicken,
  stil,
  nackt = false,
}: {
  label: string;
  platzhalter: string;
  wert: string;
  onWert: (v: string) => void;
  onAbschicken: () => void;
  stil?: object;
  /**
   * Ohne eigene Hülle — für den Einsatz IN einer `Auflage`. Sonst läge auf
   * ihr eine gerundete Pille, also genau das frei herumliegende Feld, das die
   * Auflage abgeschafft hat.
   */
  nackt?: boolean;
}) {
  const colors = useColors();
  const eingabe = (
      <TextInput
        accessibilityLabel={label}
        value={wert}
        onChangeText={onWert}
        onSubmitEditing={onAbschicken}
        placeholder={platzhalter}
        placeholderTextColor={colors.text3}
        returnKeyType="done"
        submitBehavior="submit"
        style={[
          { flex: 1, minWidth: 0, fontSize: T.md, color: colors.text, minHeight: 22 },
          nackt ? { paddingVertical: 0 } : { paddingVertical: Spacing.sm },
          webNoOutline,
        ]}
      />
  );

  if (nackt) return eingabe;

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
