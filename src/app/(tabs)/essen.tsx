// essen.tsx — Essenswünsche.
//
// Der Gedanke: nicht „was koche ich diese Woche" als Pflichtplan, sondern
// „worauf hätte ich mal wieder Lust". Ein Wunsch ist kein Termin — er hat kein
// Datum und mahnt nicht. Er liegt da, bis jemand ihn kocht.
//
// Die Brücke zum Einkauf ist der eigentliche Ertrag: aus einem Gericht werden
// Zutaten, und die landen mit EINEM Tipp auf der Einkaufsliste. Optional kann
// ein Gemini-Schlüssel die Zutaten vorschlagen — nach demselben Muster wie in
// Stoa: der Vorschlag ist eine Karte, die man bestätigt, kein Automatismus.
// Ohne Schlüssel tippt man sie selbst, und alles andere funktioniert weiter.
import { Sparkles, UtensilsCrossed } from 'lucide-react-native';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { Type } from '@/components/Type';
import { hapticSelect } from '@/lib/haptics';
import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

/** Attrappen für Etappe 0 — sie kommen in Etappe 1 aus der Datenschicht. */
const WUENSCHE = [
  { id: '1', gericht: 'Linsen mit Spätzle', von: 'Anna', zutaten: 6 },
  { id: '2', gericht: 'Ofengemüse mit Feta', von: null as string | null, zutaten: 0 },
  { id: '3', gericht: 'Pasta al limone', von: null, zutaten: 4 },
];

export default function EssenScreen() {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState('');

  return (
    <Screen>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <UtensilsCrossed size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Essen</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {`${WUENSCHE.length} Wünsche`}
        </Type>
      </Reveal>

      <Reveal delay={60}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderRadius: R.lg,
            borderWidth: 1,
            borderColor: colors.chipBorder,
            backgroundColor: colors.sunk,
            paddingHorizontal: Spacing.md,
          }}
        >
          <TextInput
            accessibilityLabel="Essenswunsch eintragen"
            value={entwurf}
            onChangeText={setEntwurf}
            placeholder="Worauf hättest du Lust?"
            placeholderTextColor={colors.text3}
            returnKeyType="done"
            style={[
              { flex: 1, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm + 4, minHeight: 24 },
              webNoOutline,
            ]}
          />
        </View>
      </Reveal>

      <Reveal delay={90}>
        <GlassPanel>
          {WUENSCHE.map((w, i) => (
            <View key={w.id}>
              {i > 0 && <Seam marginVertical={2} />}
              <PressableScale
                accessibilityLabel={`${w.gericht} öffnen`}
                onPress={() => hapticSelect()}
                pressedScale={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
              >
                <UtensilsCrossed size={18} color={colors.text3} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Type variant="body" numberOfLines={1}>{w.gericht}</Type>
                  {w.von && <Type variant="caption" tone="text3" numberOfLines={1}>{`von ${w.von}`}</Type>}
                </View>
                {/* Was schon Zutaten hat, sagt es — der Rest wartet darauf. */}
                {w.zutaten > 0 && (
                  <Type variant="caption" tone="accentA" tabular>{`${w.zutaten} Zutaten`}</Type>
                )}
              </PressableScale>
            </View>
          ))}
        </GlassPanel>
      </Reveal>

      {/* Der Assistent ist ein ANGEBOT, keine Voraussetzung. Deshalb steht er
          unter der Liste und nicht darüber, und die App funktioniert ohne ihn
          vollständig. */}
      <Reveal delay={120}>
        <View style={{ gap: Spacing.sm }}>
          <Type variant="eyebrow" tone="text3">Zutaten</Type>
          <GlassPanel>
            <PressableScale
              accessibilityLabel="Zutaten vorschlagen lassen"
              onPress={() => hapticSelect()}
              pressedScale={0.99}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
            >
              <Sparkles size={18} color={colors.accentA} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Type variant="body">Zutaten vorschlagen lassen</Type>
                <Type variant="caption" tone="text3">
                  Braucht einen eigenen Gemini-Schlüssel. Der Vorschlag wird gezeigt, bevor
                  etwas auf der Einkaufsliste landet.
                </Type>
              </View>
            </PressableScale>
          </GlassPanel>
        </View>
      </Reveal>
    </Screen>
  );
}
