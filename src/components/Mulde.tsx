// Mulde.tsx — der aufgeklappte Teil einer Zeile: ein BLOCK aus Zeilen.
//
// Vorgeschichte, weil sie die heutige Form erklärt: Zuerst lagen dort zwei,
// drei gerundete Felder frei auf dem Stein. Das sah billig aus, und zwar aus
// drei Gründen — sie gehörten zu nichts, sie hatten dieselbe Form wie das
// große Eingabefeld am Kopf des Bildschirms, und sie waren unbeschriftet.
//
// Die Antwort war zunächst eine echte VERTIEFUNG: getönte Fläche, Schnittkante
// oben, Schlagschatten nach innen, Lichtgrat unten. Physikalisch stimmig, aber
// im Gebrauch zu laut — der Block las sich als eingesetztes Fremdteil in der
// Platte, egal wie leise die Tönung wurde.
//
// Also ist die Fläche jetzt WEG. Kein Ton, keine Textur, kein Schatten: Der
// Block liegt auf derselben Platte wie alles andere und ist aus demselben
// Stein. Was ihn zusammenhält, sind nur noch Zeilen, Trenner und ein
// gleichmäßiges Polster — Struktur statt Material.
//
// Was dabei verloren geht, sollte man wissen: Ohne eigene Fläche sagt nichts
// mehr auf einen Blick, wo der Block anfängt und aufhört. Das tragen jetzt
// allein der Einzug und die Haarlinien.
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Feld } from '@/components/Feld';
import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

/**
 * Das Polster der Mulde — an EINER Stelle, damit Zeilen, Trenner und
 * Handlungen nicht auseinanderlaufen.
 *
 * Gemessen lag es vorher bei 16 px seitlich, aber nur 11 px nach oben und
 * unten: Die erste und die letzte Zeile klebten an der Kante, während die
 * Seiten Luft hatten. Eine Vertiefung, in der der Inhalt den Rand berührt,
 * sieht aus, als wäre er hineingerutscht.
 */
const POLSTER = Spacing.md + Spacing.xs; // 20
/** Unterzeilen einer Listenzeile rücken um eine Stufe ein. */
const EINZUG = POLSTER + Spacing.lg;

/**
 * Der Block. Trägt selbst nichts mehr — kein Ton, keine Kante, kein Schatten.
 *
 * Er bleibt als Bauteil bestehen, weil die Zeilen darin eine gemeinsame Klammer
 * brauchen und weil die nächste Änderung sonst wieder an drei Bildschirmen
 * einzeln passieren müsste.
 */
export function Mulde({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
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
          paddingLeft: einzug ? EINZUG : POLSTER,
          paddingRight: POLSTER,
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
            marginLeft: einzug ? EINZUG : POLSTER,
            marginRight: POLSTER,
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
  const links = einzug ? EINZUG : POLSTER;
  return (
    <View>
      {breit ? (
        <View style={{ paddingLeft: links, paddingRight: POLSTER, paddingVertical: Spacing.sm + 2, gap: 2 }}>
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
            paddingRight: POLSTER,
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
            marginRight: POLSTER,
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
  const links = einzug ? EINZUG : POLSTER;
  return (
    <View>
      {/* Beidseitig eingerückt, nicht rechts bündig: In einer Tabelle über die
          volle Breite ist ein auslaufender Trenner richtig, in einem kleinen
          gerundeten Block liest er sich als Ausbruch aus der Form. */}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: links, marginRight: POLSTER }} />
      <PressableScale
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        pressedScale={0.99}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingLeft: links,
          paddingRight: POLSTER,
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

/**
 * Eine Zeile mit Bezeichnung UND Eingabefeld, bei der die ganze Zeile das Feld
 * fokussiert.
 *
 * Der Grund: Vorher lag das Eingabefeld nur in der rechten Spalte. Wer links
 * auf „Menge" tippte — also auf das, was die Zeile benennt —, traf nichts, und
 * bei einem leeren Feld war der treffbare Bereich nur so breit wie das Wort
 * „egal". Ein Feld, dessen Trefferfläche man suchen muss, ist ein Feld, das man
 * nicht benutzt.
 *
 * Jetzt hört die ganze Zeile zu: ein Tipp irgendwo darauf setzt den Cursor.
 */
export function MuldenFeldZeile({
  label,
  eingabeLabel,
  platzhalter,
  wert,
  onSichern,
  letzte = false,
  einzug = false,
  breit = false,
}: {
  label: string;
  /** Der vorgelesene Name des Feldes — trägt den Titel des Eintrags. */
  eingabeLabel: string;
  platzhalter: string;
  wert: string | null;
  onSichern: (v: string | null) => void;
  letzte?: boolean;
  einzug?: boolean;
  breit?: boolean;
}) {
  const feld = React.useRef<TextInput | null>(null);
  return (
    <Pressable
      accessible={false}
      onPress={() => feld.current?.focus()}
      // Ohne das federt die Zeile beim Tippen — sie ist keine Handlung,
      // sondern nur der Weg ins Feld.
      style={{ cursor: 'text' } as never}
    >
      <MuldenZeile label={label} letzte={letzte} einzug={einzug} breit={breit}>
        <Feld
          eingabeRef={feld}
          nackt={!breit}
          breit={breit}
          label={eingabeLabel}
          platzhalter={platzhalter}
          wert={wert}
          onSichern={onSichern}
        />
      </MuldenZeile>
    </Pressable>
  );
}
