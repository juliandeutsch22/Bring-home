// Mulde.tsx — der aufgeklappte Teil einer Zeile: ein BLOCK aus Zeilen.
//
// Eine Mulde mit HELLEM Grund. Das klingt zunächst falsch, deshalb steht die
// ganze Vorgeschichte hier — sie erklärt jede Zeile weiter unten:
//
//  1. Zuerst lagen dort zwei, drei gerundete Felder frei auf dem Stein. Das sah
//     billig aus, und zwar aus drei Gründen — sie gehörten zu nichts, sie
//     hatten dieselbe Form wie das große Eingabefeld am Kopf des Bildschirms,
//     und sie waren unbeschriftet.
//  2. Die Antwort war eine dunkle Mulde: getönte Fläche, Schnittkante oben,
//     Schlagschatten nach innen, Lichtgrat unten. Lehrbuchmäßig, aber im
//     Gebrauch zu laut — der Block las sich als eingesetztes Fremdteil, egal
//     wie leise die Tönung wurde. Gemessen war er 5,1 Helligkeitsstufen dunkler
//     als die Platte.
//  3. Dann gar keine Fläche mehr. Ehrlich, aber ohne Auskunft: Nichts sagte
//     mehr, wo der Block anfängt und aufhört.
//  4. Dann erhaben und hell — Lichtgrat oben, Schattengrat unten.
//  5. Dieselbe HELLE Fläche wie in 4, aber der Meißel wieder wie in 2:
//     Schnittkante oben, Lichtgrat unten.
//  6. Jetzt zusätzlich der Schatten, den die Oberkante nach innen wirft — die
//     eine Ebene, die eine Kerbe wirklich tief macht (siehe `INNENSCHATTEN`).
//
// Warum eine helle Vertiefung nicht widersinnig ist: Was den Block in 2 zum
// Fremdteil machte, war die TÖNUNG, nicht die Kante. Eine dunkle Fläche mitten
// im Stein liest sich als anderes Material; eine helle liest sich als derselbe
// Stein, nur sauberer — wie eine frisch ausgeschliffene Stelle, die noch nicht
// nachgedunkelt ist. Die Auskunft „hier ist eine Stufe" trägt danach allein die
// Kante, und die sagt mit dem Schnitt oben: nach innen, nicht nach oben.
//
// Ehrlich bleibt: Streng genommen wäre eine Vertiefung dunkler, weil Licht von
// links oben auf die untere Innenwand fällt und die obere im Schatten liegt.
// Der Grat oben stimmt damit, die Fläche nicht. Das ist eine bewusste
// Abweichung — Fassung 2 war physikalisch korrekt und sah trotzdem falsch aus.
//
// Der Preis, den die helle Fläche kostet, steht in `FUELLUNG`.
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Feld } from '@/components/Feld';
import { PressableScale } from '@/components/PressableScale';
import { Type } from '@/components/Type';
import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R, Spacing } from '@/theme/theme.tokens';

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
 * Wie hell der Grund der Mulde ist — als Schleier über dem Marmor, nicht als
 * eigene Farbe. Die Maserung bleibt dadurch sichtbar, sie wird nur ruhiger.
 *
 * Die Dosis ist ein Handel, und der Preis ist gemessen (dpr 2, Graustufen,
 * Standardabweichung als Maß fürs Korn):
 *
 *   Fläche       Helligkeit   Korn    Δ zur Platte
 *   Platte          241,8     2,3         —
 *   0,40            246,7     1,38      +4,5
 *   0,65            250,5     0,80      +8,3   ← hier
 *   0,90            253,7     0,47     +14,0
 *   dunkle Fassung  234,6     2,15      −5,1
 *
 * Je heller, desto eindeutiger hebt sich der Block ab — und desto weniger Stein
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
 * Der Schlagschatten der Oberkante, nach innen — das, was eine Vertiefung
 * wirklich tief macht.
 *
 * Erwogen und verworfen wurde stattdessen eine dunkle Linie RUNDUM. Sie hätte
 * getrennt, aber nicht vertieft: Ein Rand ist auf allen vier Seiten gleich
 * dunkel, und das kann kein Licht. Gemessen war bei der Rand-Fassung die linke
 * Flanke 231,5 und die rechte 237,7 — beide dunkel, also ohne Richtung. Die
 * Kerbe wurde dadurch nicht tiefer, nur umrissen; dazu wäre unten eine dunkle
 * Linie direkt unter dem weißen Lichtgrat gelandet.
 *
 * Der Verlauf hier hat eine Richtung: Er beginnt unter der Schnittkante und
 * läuft nach unten aus, so wie die obere Innenwand auf den Grund schattet.
 *
 *   Deckkraft   unter der Kante   3 px   6 px   12 px   Fläche
 *   ohne              251          251    251    251     250
 *   0,06              240          241    243    248     250
 *   0,10              231          234    238    246     250   ← hier
 *   0,16              220          224    230    243     250
 *
 * 0,10 ist der Punkt, an dem der Verlauf als Schatten liest und nicht als
 * Balken: Nach 12 px ist er praktisch weg, die Fläche bleibt also Fläche. Ab
 * 0,16 legt sich ein sichtbares Band über die oberste Zeile. Wer es leiser
 * mag, nimmt 0,06 — dann ist die Kerbe flacher, aber nichts stimmt weniger.
 *
 * Dunkel ist UNGEPRÜFT (die App läuft nur hell).
 */
const INNENSCHATTEN = {
  hell: ['rgba(45,40,28,0.10)', 'rgba(45,40,28,0)'] as const,
  dunkel: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'] as const,
};
/** Wie weit der Schatten reicht. Danach ist der Grund wieder Grund. */
const SCHATTEN_TIEFE = 16;

/**
 * Der Block: eine flache Mulde im Stein, mit hell ausgeschliffenem Grund.
 *
 * Drei Ebenen erzählen die Stufe, alle drei gerichtet — Licht kommt wie überall
 * in dieser App von links oben:
 *
 *  · die Schnittkante oben,
 *  · ihr Schatten, der von dort nach innen ausläuft,
 *  · der Lichtgrat unten, wo die untere Innenwand das Licht fängt.
 *
 * Keine Umrandung, aus demselben Grund wie bei der Steinplatte: Wo eine Kante
 * behauen ist, wäre der Strich der letzte Rest „gezeichnetes Rechteck".
 */
export function Mulde({ children }: { children: React.ReactNode }) {
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
        // hatte, war das egal; mit Fläche braucht er auch rechts Luft, sonst
        // stößt seine Kante an die Kante der Platte.
        marginRight: Spacing.xs,
      }}
    >
      {children}
      {/* Der Schatten beginnt UNTER der Schnittkante, nicht an ihr: Sonst
          addierten sich Grat und Verlauf an derselben Zeile, und die Kante
          würde beliebig dunkel statt scharf. */}
      <LinearGradient
        pointerEvents="none"
        colors={[...(dunkel ? INNENSCHATTEN.dunkel : INNENSCHATTEN.hell)]}
        style={{ position: 'absolute', top: GRAT, left: 0, right: 0, height: SCHATTEN_TIEFE }}
      />
      {/* OBEN die Schnittkante: In einer Vertiefung liegt die obere Innenwand
          im Schatten, weil das Licht von links oben darüber hinwegstreicht.
          Sie ist der Grat, der die Stufe wirklich erzählt — gemessen −31,6
          gegen die Fläche, während der Lichtgrat unten nur +4,5 trägt. Dass
          es so ungleich ist, liegt an der hellen Fläche: Nach unten ist noch
          Weg bis Schwarz, nach oben kaum noch bis Weiß. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: einzug,
          right: einzug,
          height: GRAT,
          backgroundColor: dunkel ? 'rgba(0,0,0,0.7)' : 'rgba(60,55,40,0.16)',
        }}
      />
      {/* UNTEN der Lichtgrat: die untere Innenwand fängt das Licht. Volles
          Weiß, nicht die 0,6 der Steinplatte — die Fläche darüber ist schon
          fast weiß, ein halbdurchlässiger Grat verschwände in ihr. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: einzug,
          right: einzug,
          height: GRAT,
          backgroundColor: dunkel ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,1)',
        }}
      />
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
          {/* `text2`, nicht `text3` — und zwar aus derselben Überlegung, aus
              der die Zeile daneben (unten, `!breit`) schon immer `text2`
              trägt: Das hier ist die BEZEICHNUNG des Feldes, nicht eine leise
              Nebenauskunft. Gemessen war sie mit `text3` bei 3,08:1, also
              unter der Schwelle 4,5:1 für Kleintext (10 px); mit `text2` sind
              es 7,4:1. Dass beide Zweige jetzt denselben Ton tragen, ist der
              eigentliche Gewinn: „Was" und „Menge" stehen untereinander und
              sahen vorher verschieden wichtig aus, obwohl sie dasselbe sind. */}
          <Type variant="caption" tone="text2" numberOfLines={1}>{label}</Type>
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
