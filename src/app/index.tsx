// index.tsx — die Liste. In Etappe 0 noch ohne Daten: eine Hülle, an der sich
// die Haut beurteilen lässt, bevor irgendetwas Inhaltliches gebaut ist.
//
// Der Aufbau steht aber schon: Eingabe ganz oben (ein Gedanke, ein Feld,
// sofort), darunter die offenen Punkte, darunter das Erledigte — eingeklappt,
// weil es im Laden niemanden interessiert.
import { Check, Plus, Share2, ShoppingBasket } from 'lucide-react-native';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
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
const OFFEN = [
  { id: '1', text: 'Milch', menge: '2', von: null as string | null },
  { id: '2', text: 'Vollkornbrot', menge: null, von: 'Anna' },
  { id: '3', text: 'Tomaten', menge: '500 g', von: null },
  { id: '4', text: 'Kaffee', menge: null, von: 'Anna' },
];
const ERLEDIGT = [
  { id: '5', text: 'Butter' },
  { id: '6', text: 'Eier' },
];

export default function ListeScreen() {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState('');
  const [zeigeErledigt, setZeigeErledigt] = useState(false);

  return (
    <Screen withTabBar={false}>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <ShoppingBasket size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Zuhause</Type>
          <PressableScale accessibilityLabel="Liste teilen" onPress={() => hapticSelect()} style={{ padding: Spacing.sm }}>
            <Share2 size={20} color={colors.text3} strokeWidth={2} />
          </PressableScale>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {`${OFFEN.length} offen · mit Anna geteilt`}
        </Type>
      </Reveal>

      {/* Ein Gedanke, ein Feld, sofort. */}
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
            accessibilityLabel="Etwas hinzufügen"
            value={entwurf}
            onChangeText={setEntwurf}
            placeholder="Was fehlt?"
            placeholderTextColor={colors.text3}
            returnKeyType="done"
            style={[
              { flex: 1, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm + 4, minHeight: 24 },
              webNoOutline,
            ]}
          />
          <PressableScale
            accessibilityLabel="Hinzufügen"
            onPress={() => setEntwurf('')}
            style={{ padding: Spacing.xs, opacity: entwurf.trim() ? 1 : 0.35 }}
          >
            <Plus size={20} color={colors.accentA} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </Reveal>

      <Reveal delay={90}>
        <GlassPanel>
          {OFFEN.map((e, i) => (
            <View key={e.id}>
              {i > 0 && <Seam marginVertical={2} />}
              <PressableScale
                accessibilityLabel={`${e.text} abhaken`}
                onPress={() => hapticSelect()}
                pressedScale={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
              >
                {/* Leeres Kästchen: nackt auf der Platte, kein getönter Grund —
                    getönt heißt in diesem System „an". */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: colors.border3,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Type variant="body" numberOfLines={1}>{e.text}</Type>
                  {e.von && <Type variant="caption" tone="text3" numberOfLines={1}>{`von ${e.von}`}</Type>}
                </View>
                {e.menge && <Type variant="label" tone="text3" tabular>{e.menge}</Type>}
              </PressableScale>
            </View>
          ))}
        </GlassPanel>
      </Reveal>

      <Reveal delay={120}>
        <View>
          <Seam variant="ornament" marginVertical={Spacing.md} />
          <PressableScale
            accessibilityLabel={zeigeErledigt ? 'Erledigtes ausblenden' : 'Erledigtes anzeigen'}
            onPress={() => {
              hapticSelect();
              setZeigeErledigt((v) => !v);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Type variant="eyebrow" tone="text3">Im Wagen · {ERLEDIGT.length}</Type>
            <DisclosureChevron open={zeigeErledigt} color={colors.text3} />
          </PressableScale>
          {zeigeErledigt && (
            <GlassPanel style={{ marginTop: Spacing.xs }}>
              {ERLEDIGT.map((e, i) => (
                <View key={e.id}>
                  {i > 0 && <Seam marginVertical={2} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: colors.accentA,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <Type variant="body" tone="text3" style={{ flex: 1 }} numberOfLines={1}>{e.text}</Type>
                  </View>
                </View>
              ))}
            </GlassPanel>
          )}
        </View>
      </Reveal>
    </Screen>
  );
}
