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
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

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
  const isDark = useScheme() === 'dark';

  // Licht kommt von links oben (wie im Backdrop und an der Platte). In einer
  // VERTIEFUNG heißt das: Schatten oben und links, Licht unten und rechts —
  // die Umkehrung der erhabenen Platte.
  // Die Kante ist scharf, aber sie ist LEISE. Bei 0,20 las sie sich als
  // gezogener Strich statt als Schnittkante — der Verlauf darunter trägt die
  // Tiefe, die Linie sagt nur, wo sie anfängt.
  const schatten = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(52,46,32,0.13)';
  const schattenWeich = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(52,46,32,0.075)';
  const licht = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.55)';
  // DEUTLICH leiser als der `sunk`-Ton, aus dem sie gerechnet war.
  //
  // 0,085 traf zwar rechnerisch die alte Tönung, aber die lag auf einer
  // NACKTEN Fläche; hier liegt sie über dem Marmor und verdunkelt ihn
  // zusätzlich. Vor allem füllt die Mulde bei einem aufgeklappten Gericht fast
  // die ganze Platte — ein großes, gleichmäßig dunkles Rechteck darin liest
  // sich als eingesetztes Fremdteil, nicht als Vertiefung.
  //
  // Eine Mulde nimmt LICHT WEG, sie legt keine Farbe auf. Die Tiefe trägt der
  // Schlagschatten oben, nicht die Füllung.
  const tiefe = isDark ? 'rgba(0,0,0,0.16)' : 'rgba(52,46,32,0.038)';

  return (
    // DURCHSCHEINEND statt eigener Fläche — und das ist der Kern der Sache.
    //
    // Erst lag hier eine deckende Tönung plus ein eigenes Marmor-Blatt. Zwei
    // Probleme auf einmal: Das Blatt ist 400x300 groß und wurde bei einer
    // 437 px hohen Mulde nicht mitgestreckt, sondern hörte nach 300 px auf —
    // gemessen. Der Rest stand ohne Korn da, und die Kante dazwischen lief
    // quer durch den Block.
    //
    // Die Antwort war nicht ein größeres Blatt, sondern gar keins: Eine Mulde
    // hat keinen EIGENEN Stein. Sie ist dieselbe Platte, nur weniger
    // belichtet. Ein durchscheinender dunkler Ton lässt die Maserung der
    // Platte stehen und nimmt ihr nur Licht — bei jeder Höhe, ohne Bild, ohne
    // Skalierung. (Im dunklen Thema ist `sunk` ohnehin schon durchscheinend;
    // hier ziehen beide Fassungen endlich gleich.)
    <View style={{ borderRadius: R.md, backgroundColor: tiefe, overflow: 'hidden' }}>
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
 * Eine freie Zeile in der Mulde — Inhalt statt Bezeichnung/Wert.
 *
 * Für LISTEN: Zutaten haben keine Bezeichnungsspalte, sie sind selbst der
 * Inhalt. Sie bekommen trotzdem die Polsterung und den Trenner der Mulde,
 * damit eine Liste und ein Eigenschaftsblock in derselben Vertiefung dieselbe
 * Zeilenhöhe und dieselbe Kante haben.
 */
export function MuldenReihe({
  children,
  letzte = false,
  einzug = false,
}: {
  children: React.ReactNode;
  letzte?: boolean;
  /** Eingerückt — für Zeilen, die zu der darüber gehören. */
  einzug?: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      <View
        style={{
          paddingLeft: einzug ? Spacing.md + Spacing.lg : Spacing.md,
          paddingRight: Spacing.md,
          paddingVertical: Spacing.xs,
          minHeight: 44,
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
      {!letzte && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginLeft: einzug ? Spacing.md + Spacing.lg : Spacing.md,
          }}
        />
      )}
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
  breit = false,
  einzug = false,
}: {
  label: string;
  children: React.ReactNode;
  letzte?: boolean;
  /** Eingerückt — für Zeilen, die zu der Listenzeile darüber gehören. */
  einzug?: boolean;
  /**
   * Bezeichnung OBEN, Wert darunter über die volle Breite und linksbündig.
   *
   * Für Inhalt statt Eigenschaft. „Menge" ist eine Eigenschaft und passt in
   * eine Zeile; der NAME eines Artikels ist der Inhalt selbst und kann lang
   * sein. Rechtsbündig neben einer Bezeichnung wurde er abgeschnitten — man
   * sah „Apfelessig / Balsamico no…" und kam nur durch Scrollen im Feld an
   * den Rest. Ein Wert, den man nicht lesen kann, ist kein Wert.
   */
  breit?: boolean;
}) {
  const colors = useColors();
  const links = einzug ? Spacing.md + Spacing.lg : Spacing.md;
  return (
    <View>
      {breit ? (
        <View style={{ paddingLeft: links, paddingRight: Spacing.md, paddingVertical: Spacing.sm + 2, gap: 2 }}>
          <Type variant="caption" tone="text3" numberOfLines={1}>{label}</Type>
          {children}
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            paddingLeft: links,
            paddingRight: Spacing.md,
            paddingVertical: Spacing.sm + 2,
            minHeight: 44,
          }}
        >
          <Type variant="body" tone="text2" numberOfLines={1}>{label}</Type>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
        </View>
      )}
      {/* An der TEXTKANTE eingerückt, nicht über die volle Breite: so liest
          sich die Mulde als ein Block mit Zeilen, nicht als Stapel von
          Kästchen. */}
      {!letzte && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginLeft: links,
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
  einzug = false,
  /** Zweitfarbig (Default) fürs Wegnehmen, `accentA` fürs Hinzufügen. */
  ton = 'accentB',
  davor,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  einzug?: boolean;
  ton?: 'accentA' | 'accentB';
  /** Ein Zeichen vor dem Text, z. B. ein Plus. */
  davor?: React.ReactNode;
}) {
  const colors = useColors();
  const links = einzug ? Spacing.md + Spacing.lg : Spacing.md;
  return (
    <View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: links }} />
      <PressableScale
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        pressedScale={0.99}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingLeft: links,
          paddingRight: Spacing.md,
          paddingVertical: Spacing.sm + 2,
          minHeight: 44,
        }}
      >
        {davor}
        <Type variant="body" tone={ton}>{label}</Type>
      </PressableScale>
    </View>
  );
}
