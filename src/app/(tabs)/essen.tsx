// essen.tsx — Essenswünsche.
//
// Ein Wunsch ist kein Termin: kein Datum, keine Mahnung. Er liegt da, bis
// jemand ihn kocht.
//
// Der eigentliche Ertrag ist die Brücke zum Einkauf: aus einem Gericht werden
// Zutaten, und die landen auf der Liste — einzeln oder alle fehlenden mit einem
// Tipp. Jede Zutat sagt dabei selbst, wo sie steht (`zutatStatus`): fehlt, auf
// der Liste, im Wagen, oder „haben wir".
//
// Dieser Status ist ABGELEITET, nicht gespeichert (bis auf „haben wir"). Ein
// Häkchen „schon übernommen" an der Zutat würde lügen, sobald jemand den
// Artikel wieder von der Einkaufsliste nimmt — dann stünde das Gericht als
// versorgt da, obwohl nichts mehr da ist.
//
// Der Gemini-Vorschlag („Zutaten vorschlagen lassen") kommt in einer späteren
// Etappe. Bis er wirklich etwas tut, steht er hier NICHT — ein Knopf, der
// nichts kann, ist schlimmer als keiner.
import { Check, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
import { Eingabezeile, Nebenzeile } from '@/components/Eingabezeile';
import { Feld } from '@/components/Feld';
import { GlassPanel } from '@/components/GlassPanel';
import { Haken } from '@/components/Haken';
import { Faltet, Listenzeile } from '@/components/Listenzeile';
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
  useZutatAendern,
  useZutatAnlegen,
  useZutaten,
  useZutatenUebernehmen,
  useZutatLoeschen,
} from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { fehlendeZutaten, zutatStatus, type ZutatStatus } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

/**
 * Der Status als Wort, nicht als Farbe. Zwei Akzente hat diese App, und beide
 * sind vergeben — ein dritter Ton für „im Wagen" wäre genau der Ampel-Reflex,
 * den der Rest der Oberfläche vermeidet.
 */
const STATUS_WORT: Record<ZutatStatus, string> = {
  fehlt: 'fehlt',
  aufDerListe: 'auf der Liste',
  imWagen: 'im Wagen',
  habenWir: 'haben wir da',
};

export default function EssenScreen() {
  const colors = useColors();
  const { data: wuensche } = useWuensche();
  const { data: zutaten } = useZutaten();
  const { data: artikel } = useArtikel();
  const wunschAnlegen = useWunschAnlegen();
  const wunschLoeschen = useWunschLoeschen();
  const zutatAnlegen = useZutatAnlegen();
  const zutatAendern = useZutatAendern();
  const zutatLoeschen = useZutatLoeschen();
  const uebernehmen = useZutatenUebernehmen();

  const [entwurf, setEntwurf] = useState('');
  const [offenerWunsch, setOffenerWunsch] = useState<string | null>(null);
  const [zutatEntwurf, setZutatEntwurf] = useState('');
  /** Welche Zutat gerade ihren Editor offen hat. Immer höchstens eine. */
  const [bearbeitet, setBearbeitet] = useState<string | null>(null);

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
        <Eingabezeile
          label="Essenswunsch eintragen"
          platzhalter="Worauf hättest du Lust?"
          wert={entwurf}
          onWert={setEntwurf}
          onAbschicken={wunschHinzufuegen}
          knopfLabel="Wunsch hinzufügen"
        />
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
                // Nicht animiert: dieser Kasten wächst beim Aufklappen, und
                // eine Layout-Animation würde seinen Inhalt stauchen
                // (siehe `Listenzeile.tsx`).
                <View key={w.id}>
                  <Listenzeile>
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
                      {/* Die Kennzeichnung an der ZUGEKLAPPTEN Zeile: ob das
                          Gericht kochbar ist, soll man sehen, ohne es zu
                          öffnen. Ein Haken, der nur er selbst ist — nackt auf
                          der Platte, die Farbe im Strich. Er steht nur bei
                          Gerichten, die überhaupt Zutaten haben: eines ohne
                          ist nicht versorgt, sondern ungeplant. */}
                      {meine.length > 0 && fehlen.length === 0 && (
                        <View accessibilityLabel={`${w.gericht}: alles da`}>
                          <Check size={15} color={colors.accentA} strokeWidth={2.6} />
                        </View>
                      )}
                      {meine.length > 0 && (
                        <Type variant="caption" tone="text3" tabular>{`${meine.length} Zutaten`}</Type>
                      )}
                      {/* Dieselbe Komponente wie überall sonst. Vorher stand
                          hier ein rohes Icon mit hartem Umschalten — und weil
                          `style` auf einem lucide-Symbol im Web nicht ankommt,
                          drehte es gar nicht. Gemessen, nicht vermutet. */}
                      <DisclosureChevron open={offen} size={15} color={colors.text3} />
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
                  </Listenzeile>

                  {offen && (
                    <Faltet>
                      <View style={{ gap: Spacing.sm, paddingBottom: Spacing.sm }}>
                      {meine.map((z) => {
                        const status = zutatStatus(z, artikel ?? []);
                        const auf = bearbeitet === z.id;
                        return (
                        <View key={z.id}>
                          <Listenzeile>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: Spacing.xl }}>
                          <View style={{ flex: 1 }}>
                            <Type variant="body" tone="text2" numberOfLines={1}>{z.text}</Type>
                            <Type variant="caption" tone="text3" numberOfLines={1}>
                              {[z.menge, STATUS_WORT[status]].filter(Boolean).join(' · ')}
                            </Type>
                          </View>
                          {/* Der Plus steht bei „fehlt" und bei „im Wagen":
                              Gekauftes braucht man manchmal noch einmal, und
                              der Tipp holt es dann aus dem Wagen zurück auf die
                              Liste. Steht es schon offen da oder habt ihr es
                              immer, wäre der Knopf ein Knopf ohne Wirkung. */}
                          {(status === 'fehlt' || status === 'imWagen') && (
                            <PressableScale
                              accessibilityLabel={
                                status === 'imWagen'
                                  ? `${z.text} noch einmal auf die Einkaufsliste`
                                  : `${z.text} auf die Einkaufsliste`
                              }
                              onPress={() => {
                                hapticSuccess();
                                uebernehmen.mutate({ zutaten: [z], gericht: w.gericht });
                              }}
                              style={{ padding: Spacing.sm }}
                            >
                              <Plus size={18} color={colors.accentA} strokeWidth={2.4} />
                            </PressableScale>
                          )}
                          <PressableScale
                            accessibilityLabel={auf ? `${z.text} fertig bearbeiten` : `Zutat ${z.text} bearbeiten`}
                            onPress={() => {
                              hapticSelect();
                              setBearbeitet(auf ? null : z.id);
                            }}
                            style={{ padding: Spacing.sm }}
                          >
                            <Pencil size={16} color={auf ? colors.accentA : colors.text3} strokeWidth={2} />
                          </PressableScale>
                          </View>
                          </Listenzeile>

                          {auf && (
                            <Faltet>
                              <View style={{ gap: Spacing.sm, paddingLeft: Spacing.xl, paddingVertical: Spacing.sm }}>
                                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                                  <Feld
                                    label={`${z.text} umbenennen`}
                                    platzhalter="Zutat"
                                    wert={z.text}
                                    stil={{ flex: 1 }}
                                    onSichern={(v) => v && zutatAendern.mutate({ id: z.id, patch: { text: v } })}
                                  />
                                  <Feld
                                    label={`Menge von ${z.text}`}
                                    platzhalter="Menge"
                                    wert={z.menge}
                                    stil={{ width: 96 }}
                                    onSichern={(v) => zutatAendern.mutate({ id: z.id, patch: { menge: v } })}
                                  />
                                </View>
                                {/* Das Einzige, was die App nicht selbst wissen
                                    kann: was im Vorratsschrank steht. */}
                                <PressableScale
                                  accessibilityLabel={
                                    z.habenWir ? `${z.text} haben wir doch nicht` : `${z.text} haben wir da`
                                  }
                                  onPress={() => {
                                    hapticSelect();
                                    zutatAendern.mutate({ id: z.id, patch: { habenWir: !z.habenWir } });
                                  }}
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', paddingVertical: Spacing.xs }}
                                >
                                  <Haken an={z.habenWir} groesse={20} />
                                  <Type variant="label" tone={z.habenWir ? 'accentA' : 'text3'}>
                                    Haben wir immer da
                                  </Type>
                                </PressableScale>
                                <PressableScale
                                  accessibilityLabel={`Zutat ${z.text} entfernen`}
                                  onPress={() => {
                                    hapticSelect();
                                    setBearbeitet(null);
                                    zutatLoeschen.mutate(z.id);
                                  }}
                                  style={{ alignSelf: 'flex-start', paddingVertical: Spacing.xs }}
                                >
                                  <Type variant="label" tone="accentB">Zutat streichen</Type>
                                </PressableScale>
                              </View>
                            </Faltet>
                          )}
                        </View>
                        );
                      })}

                      {/* Eine Stufe leiser als die Zeile oben: hier ist sie
                          keine Tür, sondern eine Zeile im Formular. */}
                      <Nebenzeile
                        label="Zutat hinzufügen"
                        platzhalter="Zutat"
                        wert={zutatEntwurf}
                        onWert={setZutatEntwurf}
                        onAbschicken={() => {
                          const text = zutatEntwurf.trim();
                          if (!text) return;
                          hapticSuccess();
                          zutatAnlegen.mutate({ wunschId: w.id, text });
                          setZutatEntwurf('');
                        }}
                        stil={{ marginLeft: Spacing.xl }}
                      />

                      {/* Nur anbieten, wenn es wirklich etwas zu übernehmen
                          gibt — sonst wäre es ein Knopf, der nichts tut. */}
                      {fehlen.length > 0 && (
                        <PressableScale
                          accessibilityLabel={
                            fehlen.length === 1
                              ? '1 Zutat auf die Einkaufsliste'
                              : `${fehlen.length} Zutaten auf die Einkaufsliste`
                          }
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
                          Alles beisammen.
                        </Type>
                      )}
                      </View>
                    </Faltet>
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
