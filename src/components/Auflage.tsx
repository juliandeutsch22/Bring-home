// Auflage.tsx — der aufgeklappte Teil einer Zeile: ein BLOCK aus Zeilen.
//
// Der Name ist Programm: Der Block liegt AUF der Platte, er ist nicht in sie
// hineingeschnitten. Bis zuletzt hieß die Datei `Mulde.tsx`, und das war der
// eigentliche Denkfehler — deshalb steht die Vorgeschichte hier, sie erklärt
// jede Zeile weiter unten:
//
//  1. Zuerst lagen dort zwei, drei gerundete Felder frei auf dem Stein. Das sah
//     billig aus, und zwar aus drei Gründen — sie gehörten zu nichts, sie
//     hatten dieselbe Form wie das große Eingabefeld am Kopf des Bildschirms,
//     und sie waren unbeschriftet.
//  2. Die Antwort war eine echte VERTIEFUNG: getönte Fläche, Schnittkante oben,
//     Schlagschatten nach innen, Lichtgrat unten. Physikalisch stimmig, aber im
//     Gebrauch zu laut — der Block las sich als eingesetztes Fremdteil, egal
//     wie leise die Tönung wurde. Gemessen war er 5,1 Helligkeitsstufen DUNKLER
//     als die Platte; genau das macht ein Loch aus.
//  3. Dann gar keine Fläche mehr. Ehrlich, aber ohne Auskunft: Nichts sagte
//     mehr, wo der Block anfängt und aufhört.
//  4. Jetzt liegt er ERHABEN auf der Platte — hell statt dunkel. Das ist kein
//     Geschmack, sondern Physik: Licht kommt im ganzen Backdrop von links oben.
//     Eine höher liegende Fläche fängt mehr davon, also ist sie heller. Und
//     dann kippt auch der Meißel mit: Lichtgrat OBEN, Schattengrat UNTEN —
//     dieselbe Richtung wie bei der Steinplatte in `Glass.tsx`, die ja
//     ebenfalls aufliegt. (In der Mulde lag es umgekehrt, und das musste so
//     sein: In ein Loch fällt das Licht auf die untere Innenwand.)
//
// Der Preis, den die helle Fläche kostet, steht in `FUELLUNG`.
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Feld } from '@/components/Feld';
import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

/**
 * Das Polster der Auflage — an EINER Stelle, damit Zeilen, Trenner und
 * Handlungen nicht auseinanderlaufen.
 *
 * Gemessen lag es vorher bei 16 px seitlich, aber nur 11 px nach oben und
 * unten: Die erste und die letzte Zeile klebten an der Kante, während die
 * Seiten Luft hatten. Eine Platte, auf der der Inhalt bis an die Kante läuft,
 * sieht aus, als wäre sie zu klein für ihn.
 */
const POLSTER = Spacing.md + Spacing.xs; // 20
/** Unterzeilen einer Listenzeile rücken um eine Stufe ein. */
const EINZUG = POLSTER + Spacing.lg;

/**
 * Wie hell die aufliegende Fläche ist — als Schleier über dem Marmor, nicht als
 * eigene Farbe. Die Maserung bleibt dadurch sichtbar, sie wird nur ruhiger.
 *
 * Die Dosis ist ein Handel, und der Preis ist gemessen (dpr 2, Graustufen,
 * Standardabweichung als Maß fürs Korn):
 *
 *   Fläche      Helligkeit   Korn    Δ zur Platte
 *   Platte         239,7     2,23        —
 *   0,40           246,3     1,33      +6,6
 *   0,65           249,9     0,77     +10,2   ← hier
 *   0,90           253,7     0,47     +14,0
 *   Mulde (alt)    234,6     2,15      −5,1
 *
 * Je heller, desto eindeutiger liegt der Block oben — und desto weniger Stein
 * ist er. Bei 0,65 ist er als eigene Ebene sofort lesbar und trägt noch
 * erkennbares Korn; ab 0,90 wird er zu Papier auf Marmor. Wer mehr Maserung
 * will, geht auf 0,40: Die Kante trägt die Definition dann fast allein.
 *
 * Dunkel ist UNGEPRÜFT — die App läuft bisher nur hell (`ThemeProvider` liefert
 * konstant HELL). Der Wert ist bewusst viel kleiner: Auf dunklem Stein reicht
 * ein Hauch Licht, ein 0,65-Schleier wäre dort ein Leuchtkasten.
 */
const FUELLUNG = { hell: 'rgba(255,255,255,0.65)', dunkel: 'rgba(255,255,255,0.06)' } as const;

/** Dicke des Grats — wie in `Glass.tsx`: Dicke andeuten, nicht vorführen. */
const GRAT = 2;

/**
 * Der Block: eine aufliegende Platte aus demselben Stein, nur höher.
 *
 * Sie trägt bewusst KEINEN Schlagschatten. Ein Schatten hätte sie schweben
 * lassen; sie liegt aber auf, sie fliegt nicht. Was ihre Höhe erzählt, sind
 * allein die zwei Grate — und die sind, anders als ein Schatten, gerichtet:
 * Licht oben, Schatten unten, links-oben-Beleuchtung wie überall sonst.
 *
 * Und keine Umrandung, aus demselben Grund wie bei der Steinplatte: Wo eine
 * Kante behauen ist, wäre der Strich der letzte Rest „gezeichnetes Rechteck".
 */
export function Auflage({ children }: { children: React.ReactNode }) {
  const dunkel = useScheme() === 'dark';
  // Die Grate enden vor den Ecken, sonst liefen sie in die Rundung hinein und
  // sähen abgeschnitten aus.
  const einzug = R.md * 0.7;
  return (
    <View
      style={{
        borderRadius: R.md,
        backgroundColor: dunkel ? FUELLUNG.dunkel : FUELLUNG.hell,
        overflow: 'hidden',
        // Die Aufrufstellen rücken den Block links ein (er gehört zur Zeile
        // darüber), geben rechts aber nichts vor. Solange er keine Fläche
        // hatte, war das egal; als Körper braucht er auch rechts Luft, sonst
        // stößt seine Kante an die Kante der Platte.
        marginRight: Spacing.xs,
      }}
    >
      {children}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: einzug,
          right: einzug,
          height: GRAT,
          // Volles Weiß, nicht die 0,6 der Steinplatte: Die Fläche darunter ist
          // schon fast weiß: ein halbdurchlässiger Grat verschwände in ihr.
          backgroundColor: dunkel ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,1)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: einzug,
          right: einzug,
          height: GRAT,
          backgroundColor: dunkel ? 'rgba(0,0,0,0.7)' : 'rgba(60,55,40,0.16)',
        }}
      />
    </View>
  );
}

/**
 * Eine freie Zeile in der Auflage — Inhalt statt Bezeichnung/Wert.
 *
 * Für LISTEN: Zutaten haben keine Bezeichnungsspalte, sie sind selbst der
 * Inhalt. Sie bekommen trotzdem die Polsterung und den Trenner der Auflage,
 * damit eine Liste und ein Eigenschaftsblock auf derselben Platte dieselbe
 * Zeilenhöhe und dieselbe Kante haben.
 */
export function AuflagenReihe({
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
 * Eine Zeile in der Auflage: Bezeichnung links, Wert rechts.
 *
 * Die Bezeichnung ist der eigentliche Gewinn gegenüber dem alten Zustand. Ein
 * Platzhalter verschwindet, sobald man tippt — danach steht dort ein Wert ohne
 * Namen, und beim nächsten Öffnen weiß niemand mehr, was in welchem Feld
 * stand. Eine Bezeichnung bleibt.
 */
export function AuflagenZeile({
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
          sich die Auflage als ein Block mit Zeilen, nicht als Stapel von
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
 * Eine Handlung als eigene Zeile in der Auflage — für Löschen und Ähnliches.
 *
 * Vorher hing so ein Satz frei unter den Feldern, ohne Trenner und ohne
 * Fläche; er sah aus wie vergessen. In der Auflage bekommt er dieselbe Zeilenhöhe
 * wie alles andere und einen Trenner darüber. Der Zweitton bleibt: In dieser
 * App schreit auch das Löschen nicht.
 */
export function AuflagenHandlung({
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
export function AuflagenFeldZeile({
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
      <AuflagenZeile label={label} letzte={letzte} einzug={einzug} breit={breit}>
        <Feld
          eingabeRef={feld}
          nackt={!breit}
          breit={breit}
          label={eingabeLabel}
          platzhalter={platzhalter}
          wert={wert}
          onSichern={onSichern}
        />
      </AuflagenZeile>
    </Pressable>
  );
}
