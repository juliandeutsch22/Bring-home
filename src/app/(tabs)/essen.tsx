// essen.tsx — Essenswünsche.
//
// Ein Wunsch ist kein Termin: kein Datum, keine Mahnung. Er liegt da, bis
// jemand ihn kocht.
//
// Der eigentliche Ertrag ist die Brücke zum Einkauf: aus einem Gericht werden
// Zutaten, und die landen mit EINEM Tipp auf der Liste — aber nur die, die
// dort noch fehlen (`fehlendeZutaten`). Was im Wagen liegt, zählt dabei nicht
// als vorhanden: es ist gekauft, nicht eingeplant.
//
// Der Gemini-Vorschlag („Zutaten vorschlagen lassen") kommt in einer späteren
// Etappe. Bis er wirklich etwas tut, steht er hier NICHT — ein Knopf, der
// nichts kann, ist schlimmer als keiner.
import { ChevronRight, Plus, Trash2, UtensilsCrossed } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
import {
  useArtikel,
  useWuensche,
  useWunschAnlegen,
  useWunschLoeschen,
  useZutatAnlegen,
  useZutaten,
  useZutatenUebernehmen,
  useZutatLoeschen,
} from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { fehlendeZutaten } from '@/lib/listenLogik';
import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

export default function EssenScreen() {
  const colors = useColors();
  const { data: wuensche } = useWuensche();
  const { data: zutaten } = useZutaten();
  const { data: artikel } = useArtikel();
  const wunschAnlegen = useWunschAnlegen();
  const wunschLoeschen = useWunschLoeschen();
  const zutatAnlegen = useZutatAnlegen();
  const zutatLoeschen = useZutatLoeschen();
  const uebernehmen = useZutatenUebernehmen();

  const [entwurf, setEntwurf] = useState('');
  const [offenerWunsch, setOffenerWunsch] = useState<string | null>(null);
  const [zutatEntwurf, setZutatEntwurf] = useState('');

  const zutatenJeWunsch = useMemo(() => {
    const m = new Map<string, typeof zutaten>();
    for (const z of zutaten ?? []) m.set(z.wunschId, [...(m.get(z.wunschId) ?? []), z]);
    return m;
  }, [zutaten]);

  const wunschHinzufuegen = () => {
    const gericht = entwurf.trim();
    if (!gericht) return;
    hapticSuccess();
    wunschAnlegen.mutate({ gericht });
    setEntwurf('');
  };

  const feldStil = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.sunk,
    paddingHorizontal: Spacing.md,
  };

  return (
    <Screen>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <UtensilsCrossed size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Essen</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {(wuensche ?? []).length === 1 ? '1 Wunsch' : `${(wuensche ?? []).length} Wünsche`}
        </Type>
      </Reveal>

      <Reveal delay={60}>
        <View style={feldStil}>
          <TextInput
            accessibilityLabel="Essenswunsch eintragen"
            value={entwurf}
            onChangeText={setEntwurf}
            onSubmitEditing={wunschHinzufuegen}
            placeholder="Worauf hättest du Lust?"
            placeholderTextColor={colors.text3}
            returnKeyType="done"
            style={[
              { flex: 1, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm + 4, minHeight: 24 },
              webNoOutline,
            ]}
          />
          <PressableScale
            accessibilityLabel="Wunsch hinzufügen"
            onPress={wunschHinzufuegen}
            style={{ padding: Spacing.xs, opacity: entwurf.trim() ? 1 : 0.35 }}
          >
            <Plus size={20} color={colors.accentA} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </Reveal>

      <Reveal delay={90}>
        {(wuensche ?? []).length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<UtensilsCrossed size={20} color={colors.accentA} strokeWidth={2} />}
              title="Noch kein Wunsch"
              body="Trag ein, worauf du mal wieder Lust hättest. Zutaten kommen dazu, wenn du das Gericht öffnest."
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {(wuensche ?? []).map((w, i) => {
              const meine = zutatenJeWunsch.get(w.id) ?? [];
              const fehlen = fehlendeZutaten(meine, artikel ?? []);
              const offen = offenerWunsch === w.id;
              return (
                <View key={w.id}>
                  {i > 0 && <Seam marginVertical={2} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <PressableScale
                      accessibilityLabel={offen ? `${w.gericht} zuklappen` : `${w.gericht} öffnen`}
                      onPress={() => {
                        hapticSelect();
                        setOffenerWunsch(offen ? null : w.id);
                        setZutatEntwurf('');
                      }}
                      pressedScale={0.99}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingVertical: Spacing.sm + 2 }}
                    >
                      <UtensilsCrossed size={18} color={offen ? colors.accentA : colors.text3} strokeWidth={2} />
                      <View style={{ flex: 1 }}>
                        <Type variant="body" numberOfLines={1}>{w.gericht}</Type>
                        {w.vonWem && <Type variant="caption" tone="text3" numberOfLines={1}>{`von ${w.vonWem}`}</Type>}
                      </View>
                      {meine.length > 0 && (
                        <Type variant="caption" tone="text3" tabular>{`${meine.length} Zutaten`}</Type>
                      )}
                      <ChevronRight
                        size={15}
                        color={colors.text3}
                        strokeWidth={2}
                        style={{ transform: [{ rotate: offen ? '90deg' : '0deg' }] }}
                      />
                    </PressableScale>
                    <PressableScale
                      accessibilityLabel={`${w.gericht} löschen`}
                      onPress={() => {
                        hapticSelect();
                        wunschLoeschen.mutate(w.id);
                      }}
                      style={{ padding: Spacing.xs }}
                    >
                      <Trash2 size={16} color={colors.text3} strokeWidth={2} />
                    </PressableScale>
                  </View>

                  {offen && (
                    <View style={{ gap: Spacing.sm, paddingBottom: Spacing.sm }}>
                      {meine.map((z) => (
                        <View key={z.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: Spacing.xl }}>
                          <Type variant="body" tone="text2" style={{ flex: 1 }} numberOfLines={1}>{z.text}</Type>
                          <PressableScale
                            accessibilityLabel={`Zutat ${z.text} entfernen`}
                            onPress={() => {
                              hapticSelect();
                              zutatLoeschen.mutate(z.id);
                            }}
                            style={{ padding: Spacing.xs }}
                          >
                            <Trash2 size={14} color={colors.text3} strokeWidth={2} />
                          </PressableScale>
                        </View>
                      ))}

                      <View style={[feldStil, { marginLeft: Spacing.xl }]}>
                        <TextInput
                          accessibilityLabel="Zutat hinzufügen"
                          value={zutatEntwurf}
                          onChangeText={setZutatEntwurf}
                          onSubmitEditing={() => {
                            const text = zutatEntwurf.trim();
                            if (!text) return;
                            hapticSuccess();
                            zutatAnlegen.mutate({ wunschId: w.id, text });
                            setZutatEntwurf('');
                          }}
                          placeholder="Zutat"
                          placeholderTextColor={colors.text3}
                          returnKeyType="done"
                          style={[
                            { flex: 1, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm, minHeight: 22 },
                            webNoOutline,
                          ]}
                        />
                      </View>

                      {/* Nur anbieten, wenn es wirklich etwas zu übernehmen
                          gibt — sonst wäre es ein Knopf, der nichts tut. */}
                      {fehlen.length > 0 && (
                        <PressableScale
                          accessibilityLabel={`${fehlen.length} Zutaten auf die Einkaufsliste`}
                          onPress={() => {
                            hapticSuccess();
                            uebernehmen.mutate({ zutaten: fehlen, gericht: w.gericht });
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: Spacing.xl, paddingVertical: Spacing.xs }}
                        >
                          <Plus size={16} color={colors.accentA} strokeWidth={2.4} />
                          <Type variant="label" tone="accentA">
                            {fehlen.length === 1 ? '1 Zutat auf die Liste' : `${fehlen.length} Zutaten auf die Liste`}
                          </Type>
                        </PressableScale>
                      )}
                      {meine.length > 0 && fehlen.length === 0 && (
                        <Type variant="caption" tone="text3" style={{ paddingLeft: Spacing.xl }}>
                          Alles steht schon auf der Einkaufsliste.
                        </Type>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </GlassPanel>
        )}
      </Reveal>
    </Screen>
  );
}
