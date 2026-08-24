// Glass.tsx — Steintafel (Marmor-Design „Antikes Griechenland"): matte,
// gealterte Marmorfläche statt Liquid Glass. Drei Zutaten:
//  1. Stein-Grund   — solide Fläche aus den Tokens (nie reines Weiß).
//  2. Marmor-Textur — assets/images/marble-*.jpg (400x300): feiner Zahn +
//     zarte Patina, rein tonal (Farbrauschen sähe nach Digital-Dreck aus, nicht
//     nach Stein). Zwei Fallstricke, beide teuer gelernt:
//     · Das Blatt muss KLEIN sein. `cover` legt es damit auf einer typischen
//       Karte fast 1:1 an, das Korn überlebt die Skalierung. Die erste Fassung
//       war 800x600 mit stddev 1,1 — beim Herunterskalieren blieb davon nichts
//       als Papierweiß übrig.
//     · Die Dosis liegt bei stddev ~2,6. Darunter (unter ~1,5) kippt es zurück
//       ins Papierweiße, darüber (ab ~4) fängt die Patina an, wie Flecken zu
//       lesen statt wie Stein.
//     · KEIN `resizeMode="repeat"`: react-native-web kachelt damit nicht (es
//       legt genau EINE Kachel an, der Rest bleibt leer) — die Web-Verifikation
//       zeigte dann etwas anderes als das Gerät.
//  3. Meißel-Kante  — Lichtgrat oben, Schattengrat unten, zarte Fasen an den
//     Seiten: eine behauene Platte, kein gezeichnetes Rechteck.
// Karten, Tab-Bar und Pills tragen dieselbe Steinsorte; getönte Flächen (CTA)
// bleiben glatt, damit Handlung heraussticht. Die Glas-Props (intensity,
// sheenTop, …) bleiben aus Kompatibilität erhalten, sind aber ohne Wirkung.
import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useColors, useScheme } from '@/theme/ThemeProvider';
import { R } from '@/theme/theme.tokens';

export type GlassVariant = 'card' | 'pill' | 'bar';

// Steintafeln sind kantiger als Glas-Slabs.
const DEFAULT_RADIUS: Record<GlassVariant, number> = { card: R.xl, pill: R.pill, bar: R.lg };

// Die natürliche Höhe des Blattes. Eine Kachel bleibt damit fast 1:1 —
// waagrecht wird sie auf die Plattenbreite gebracht (400 → ~382, also kaum),
// senkrecht gar nicht.
const KACHEL_HOEHE = 300;

const MARBLE_LIGHT = require('../../assets/images/marble-light.jpg');
const MARBLE_DARK = require('../../assets/images/marble-dark.jpg');

export type GlassProps = {
  variant?: GlassVariant;
  radius?: number;
  intensity?: number;
  tint?: string;
  sheenTop?: string;
  sheenSpan?: number;
  footerShade?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Die Marmorfläche — GEKACHELT, nicht gestreckt.
 *
 * Zwei Fassungen sind hier gescheitert, beide sichtbar:
 *
 *  · `absoluteFill` auf dem Bild GRIFF NICHT. Gemessen war jeder Träger auf
 *    der Seite genau 400x300 — die Maße des Blattes —, egal wie hoch die
 *    Platte war. Auf allem über 300 px hörte die Maserung mittendrin auf, und
 *    quer durch die Platte lief eine Kante.
 *  · Das Blatt dann auf 100 % zu strecken deckte zwar, machte das Korn aber
 *    matschig: Auf einer 535 px hohen Platte wird ein 300 px hohes Blatt
 *    1,8-fach gezogen. Genau davor warnt der Kopf dieser Datei — das Blatt
 *    muss klein bleiben, damit das Korn die Skalierung überlebt.
 *
 * Also weder das eine noch das andere, sondern so viele Blätter
 * untereinander, wie die Höhe braucht — jedes in seiner eigenen Größe.
 *
 * Jedes ZWEITE ist senkrecht gespiegelt. Das ist der Kniff, der die Naht
 * verschwinden lässt: An der Stoßkante treffen dadurch identische Pixelreihen
 * aufeinander, es gibt also gar keinen Sprung. Ohne die Spiegelung liefe alle
 * 300 px ein sichtbarer Strich durch den Stein.
 */
function Marmor({ dunkel }: { dunkel: boolean }) {
  const [hoehe, setHoehe] = React.useState(0);
  const blatt = dunkel ? MARBLE_DARK : MARBLE_LIGHT;
  const anzahl = Math.max(1, Math.ceil(hoehe / KACHEL_HOEHE));

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      pointerEvents="none"
      onLayout={(e) => setHoehe(e.nativeEvent.layout.height)}
    >
      {Array.from({ length: anzahl }, (_, i) => (
        <Image
          key={i}
          source={blatt}
          resizeMode="cover"
          style={[
            { width: '100%', height: KACHEL_HOEHE },
            i % 2 === 1 ? { transform: [{ scaleY: -1 }] } : null,
          ]}
        />
      ))}
    </View>
  );
}

export function Glass({ variant = 'card', radius, tint, style, contentStyle, children }: GlassProps) {
  const scheme = useScheme();
  const colors = useColors();
  const isDark = scheme === 'dark';
  const borderRadius = radius ?? DEFAULT_RADIUS[variant];
  const backgroundColor = tint ?? colors.bg2;
  const showTexture = !tint;
  // Pills bleiben bewusst OHNE Relief: der 3-px-Schattengrat braucht eine hohe
  // Platte, um als Dicke gelesen zu werden. Auf einer 52 px hohen Pille sitzt
  // er direkt unter der Grundlinie der Schrift und liest sich als Unterstrich.
  // (Für die EINE Zeile ausprobiert und wieder verworfen — siehe UEBERGABE.)
  const showChisel = !tint && variant !== 'pill';
  const inset = Math.min(borderRadius * 0.7, 16);
  // Wie dick die behauene Kante ist — feiner als früher (3 bzw. 2 px). Auf dem
  // WEISSEN Grund tritt der Lichtgrat oben stärker hervor als auf Creme, und
  // was dort eine Fase war, las sich hier als Leiste. Weniger Material,
  // dieselbe Aussage: die Platte soll ihre Dicke andeuten, nicht vorführen.
  const GRAT = 2;
  const FASE = 1.5;

  return (
    <View
      style={[
        {
          borderRadius,
          backgroundColor,
          // Haarlinie NUR dort, wo kein Meißel greift (getönte Flächen, Pills).
          // Wo die Platte Grate und Fasen trägt, wäre der Strich der letzte Rest
          // „gezeichnetes Rechteck" — die Kante ist behauen, nicht umrandet.
          borderWidth: showChisel ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {showTexture && <Marmor dunkel={isDark} />}
      {showChisel && (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: inset,
              right: inset,
              height: GRAT,
              // Nicht mehr reines Weiß. Auf dem cremefarbenen Grund von früher
              // las sich das als Licht, das die Oberkante fängt; auf WEISSEM
              // Grund ist es dieselbe Farbe wie die Luft darüber — die Platte
              // sah aus, als fehle ihr die obere Kante. Halbdurchlässig lässt
              // es den Stein durchscheinen und bleibt trotzdem ein Grat.
              backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.6)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: inset,
              right: inset,
              height: GRAT,
              backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(60,55,40,0.16)',
            }}
          />
          {/* Seitliche Fasen — sehr schwach dosiert: sie sollen die Dicke der
              Platte andeuten, nicht als Umrandung gelesen werden. Licht kommt
              wie im Backdrop von links oben. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: inset,
              bottom: inset,
              left: 0,
              width: FASE,
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.55)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: inset,
              bottom: inset,
              right: 0,
              width: FASE,
              backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(60,55,40,0.07)',
            }}
          />
        </>
      )}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
