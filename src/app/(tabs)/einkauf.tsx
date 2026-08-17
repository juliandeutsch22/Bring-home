// einkauf.tsx — die Liste. Der Grund, warum es die App gibt.
//
// Aufbau: Eingabe ganz oben (ein Gedanke, ein Feld, sofort), darunter was noch
// fehlt, darunter der Wagen — eingeklappt, weil er beim Einkaufen niemanden
// interessiert.
//
// Zwei Entscheidungen, die man sehen können sollte:
//  · Abhaken LÖSCHT nicht. Was im Wagen liegt, bleibt sichtbar, bis jemand den
//    Wagen leert — ein Fehlgriff ist damit ein Tipp, keine Rekonstruktion.
//  · Ein Artikel, den es schon gibt, wird nicht verdoppelt. Wer „Milch" ein
//    zweites Mal tippt, meint dieselbe Milch.
import { Check, Plus, ShoppingBasket, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
import {
  useArtikel,
  useArtikelAnlegen,
  useArtikelLoeschen,
  useArtikelUmschalten,
  useWagenLeeren,
} from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { findeArtikel, kuerze, teileListe } from '@/lib/listenLogik';
import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

export default function EinkaufScreen() {
  const colors = useColors();
  const { data: artikel } = useArtikel();
  const anlegen = useArtikelAnlegen();
  const umschalten = useArtikelUmschalten();
  const loeschen = useArtikelLoeschen();
  const wagenLeeren = useWagenLeeren();

  const [entwurf, setEntwurf] = useState('');
  const [zeigeWagen, setZeigeWagen] = useState(false);

  const { offen, imWagen } = useMemo(() => teileListe(artikel ?? []), [artikel]);
  const [gezeigterWagen, restWagen] = useMemo(() => kuerze(imWagen), [imWagen]);

  const hinzufuegen = () => {
    const text = entwurf.trim();
    if (!text) return;
    // Steht es schon offen da, ist nichts zu tun. Liegt es im Wagen, kommt es
    // wieder heraus — man tippt es ja, weil man es (noch einmal) braucht.
    const vorhanden = findeArtikel(artikel ?? [], text);
    if (vorhanden && vorhanden.erledigtAm === null) {
      setEntwurf('');
      return;
    }
    hapticSuccess();
    if (vorhanden) umschalten.mutate({ id: vorhanden.id, imWagen: true });
    else anlegen.mutate({ text });
    setEntwurf('');
  };

  return (
    <Screen>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <ShoppingBasket size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Einkauf</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {offen.length === 1 ? '1 Sache fehlt' : `${offen.length} Sachen fehlen`}
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
            accessibilityLabel="Etwas hinzufügen"
            value={entwurf}
            onChangeText={setEntwurf}
            onSubmitEditing={hinzufuegen}
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
            onPress={hinzufuegen}
            style={{ padding: Spacing.xs, opacity: entwurf.trim() ? 1 : 0.35 }}
          >
            <Plus size={20} color={colors.accentA} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </Reveal>

      <Reveal delay={90}>
        {offen.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<ShoppingBasket size={20} color={colors.accentA} strokeWidth={2} />}
              title="Nichts fehlt"
              body="Was euch einfällt, kommt oben hinein — und steht ab Etappe 3 sofort auch beim anderen."
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {offen.map((a, i) => (
              <View key={a.id}>
                {i > 0 && <Seam marginVertical={2} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <PressableScale
                    accessibilityLabel={`${a.text} abhaken`}
                    onPress={() => {
                      hapticSelect();
                      umschalten.mutate({ id: a.id, imWagen: false });
                    }}
                    pressedScale={0.99}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingVertical: Spacing.sm + 2 }}
                  >
                    {/* Nacktes Kästchen: getönt heißt in diesem System „an". */}
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border3 }} />
                    <View style={{ flex: 1 }}>
                      <Type variant="body" numberOfLines={1}>{a.text}</Type>
                      {a.vonWem && <Type variant="caption" tone="text3" numberOfLines={1}>{`von ${a.vonWem}`}</Type>}
                    </View>
                    {a.menge && <Type variant="label" tone="text3" tabular>{a.menge}</Type>}
                  </PressableScale>
                  <PressableScale
                    accessibilityLabel={`${a.text} entfernen`}
                    onPress={() => {
                      hapticSelect();
                      loeschen.mutate(a.id);
                    }}
                    style={{ padding: Spacing.xs }}
                  >
                    <Trash2 size={16} color={colors.text3} strokeWidth={2} />
                  </PressableScale>
                </View>
              </View>
            ))}
          </GlassPanel>
        )}
      </Reveal>

      {imWagen.length > 0 && (
        <Reveal delay={120}>
          <View>
            <Seam variant="ornament" marginVertical={Spacing.md} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <PressableScale
                accessibilityLabel={zeigeWagen ? 'Wagen einklappen' : 'Wagen ansehen'}
                onPress={() => {
                  hapticSelect();
                  setZeigeWagen((v) => !v);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}
              >
                <Type variant="eyebrow" tone="text3">Im Wagen · {imWagen.length}</Type>
                <DisclosureChevron open={zeigeWagen} color={colors.text3} />
              </PressableScale>
              {zeigeWagen && (
                <PressableScale
                  accessibilityLabel="Wagen leeren"
                  onPress={() => {
                    hapticSuccess();
                    wagenLeeren.mutate();
                  }}
                  style={{ padding: Spacing.xs }}
                >
                  <Type variant="label" tone="accentB">Leeren</Type>
                </PressableScale>
              )}
            </View>
            {zeigeWagen && (
              <GlassPanel style={{ marginTop: Spacing.xs }}>
                {gezeigterWagen.map((a, i) => (
                  <View key={a.id}>
                    {i > 0 && <Seam marginVertical={2} />}
                    <PressableScale
                      accessibilityLabel={`${a.text} zurück auf die Liste`}
                      onPress={() => {
                        hapticSelect();
                        umschalten.mutate({ id: a.id, imWagen: true });
                      }}
                      pressedScale={0.99}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                    >
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
                      <Type variant="body" tone="text3" style={{ flex: 1 }} numberOfLines={1}>{a.text}</Type>
                    </PressableScale>
                  </View>
                ))}
                {restWagen > 0 && (
                  <Type variant="caption" tone="text3" style={{ paddingTop: Spacing.sm }}>
                    {`… und ${restWagen} weitere`}
                  </Type>
                )}
              </GlassPanel>
            )}
          </View>
        </Reveal>
      )}
    </Screen>
  );
}
