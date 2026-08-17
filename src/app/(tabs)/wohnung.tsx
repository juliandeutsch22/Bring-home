// wohnung.tsx — was in der Wohnung liegen bleibt.
//
// Aufgaben wie in Stoa, aber bewusst SCHLANKER: keine Projekte, keine
// Wiederholungen, keine Lebensspanne. Was hier steht, ist eine Sache, die
// jemand irgendwann macht — „Filter tauschen", „Vermieter anrufen".
//
// Zwei Dinge behält es aus Stoa, weil sie in einer geteilten Wohnung erst
// richtig Sinn ergeben:
//  · Eine Aufgabe kann an einer PERSON hängen — bei einem Zusammenleben ist
//    „wer macht das?" die eigentliche Frage.
//  · „Warten auf" für alles, was bei jemand anderem liegt (Hausverwaltung,
//    Handwerker). Es verschwindet aus dem Offenen, ohne verloren zu gehen.
import { Hammer, PauseCircle } from 'lucide-react-native';
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
  { id: '1', titel: 'Filter der Dunstabzugshaube tauschen', person: null as string | null },
  { id: '2', titel: 'Regal im Flur anbringen', person: 'Anna' },
  { id: '3', titel: 'Fahrräder aus dem Keller holen', person: null },
];
const WARTEND = [{ id: '4', titel: 'Heizung entlüften', person: 'Hausverwaltung', worauf: 'Termin' }];

export default function WohnungScreen() {
  const colors = useColors();
  const [entwurf, setEntwurf] = useState('');
  const [zeigeWartend, setZeigeWartend] = useState(false);

  return (
    <Screen>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Hammer size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Wohnung</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {`${OFFEN.length} offen · ${WARTEND.length} wartet`}
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
            accessibilityLabel="Aufgabe hinzufügen"
            value={entwurf}
            onChangeText={setEntwurf}
            placeholder="Was steht an?"
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
          {OFFEN.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Seam marginVertical={2} />}
              <PressableScale
                accessibilityLabel={`${a.titel} erledigen`}
                onPress={() => hapticSelect()}
                pressedScale={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border3 }} />
                <View style={{ flex: 1 }}>
                  <Type variant="body" numberOfLines={2}>{a.titel}</Type>
                  {a.person && <Type variant="caption" tone="text3" numberOfLines={1}>{a.person}</Type>}
                </View>
              </PressableScale>
            </View>
          ))}
        </GlassPanel>
      </Reveal>

      {/* Wartendes steht unter dem Offenen und eingeklappt: es ist da, aber es
          ist nichts, woran man gerade arbeiten kann. */}
      <Reveal delay={120}>
        <View>
          <Seam variant="ornament" marginVertical={Spacing.md} />
          <PressableScale
            accessibilityLabel={zeigeWartend ? 'Wartendes ausblenden' : 'Wartendes anzeigen'}
            onPress={() => {
              hapticSelect();
              setZeigeWartend((v) => !v);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Type variant="eyebrow" tone="text3">Warten auf · {WARTEND.length}</Type>
            <DisclosureChevron open={zeigeWartend} color={colors.text3} />
          </PressableScale>
          {zeigeWartend && (
            <GlassPanel style={{ marginTop: Spacing.xs }}>
              {WARTEND.map((a, i) => (
                <View key={a.id}>
                  {i > 0 && <Seam marginVertical={2} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}>
                    <PauseCircle size={20} color={colors.accentA} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Type variant="body" numberOfLines={2}>{a.titel}</Type>
                      <Type variant="caption" tone="text3" numberOfLines={1}>
                        {`${a.person} · wartet auf ${a.worauf}`}
                      </Type>
                    </View>
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
