// wohnung.tsx — was in der Wohnung liegen bleibt.
//
// Aufgaben wie in Stoa, aber bewusst SCHLANKER: keine Projekte, keine
// Lebensspannen, keine Wiederholungsregeln. Das wäre Stoa ein zweites Mal.
//
// Drei Dinge sind geblieben oder dazugekommen, weil sie in einer geteilten
// Wohnung erst richtig Sinn ergeben:
//  · Eine Aufgabe kann an einer PERSON hängen — „wer macht das?" ist dort die
//    eigentliche Frage. Frei getippt, kein Konto.
//  · „Warten auf" für alles, was bei jemand anderem liegt (Hausverwaltung,
//    Handwerker). Es verschwindet damit aus dem Offenen, ohne verloren zu
//    gehen — und mahnt nicht, weil man selbst nichts tun kann.
//  · Ein RHYTHMUS in Tagen. Das ist ausdrücklich nicht Stoas Regelwerk,
//    sondern ein einziger Satz: „Nach dem Abhaken kommt sie in N Tagen
//    wieder." Der Müll muss eine Woche nach dem letzten Mal raus, nicht jeden
//    Montag — und wer im Urlaub war, kommt nicht zu einem Stapel Überfälligem
//    zurück.
import { Hammer, PauseCircle, Repeat, Send, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
import { Eingabezeile } from '@/components/Eingabezeile';
import { Haken } from '@/components/Haken';
import { Auflage, AuflagenFeldZeile, AuflagenZeile } from '@/components/Auflage';
import { Faltet, Listenzeile } from '@/components/Listenzeile';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
import { Wahlzeile } from '@/components/Wahlzeile';
import { useHaushalt } from '@/data/haushalt';
import type { Aufgabe } from '@/data/types';
import {
  useAufgabeAendern,
  useAufgabeAnlegen,
  useAufgabeLoeschen,
  useAufgabeUmschalten,
  useAufgaben,
} from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { useNachklang } from '@/lib/nachklang';
import { RHYTHMEN, kuerze, teileAufgaben, wiederIn, wiederkehrend } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

export default function WohnungScreen() {
  const colors = useColors();
  const router = useRouter();
  const geteilt = useHaushalt((s) => s.id !== null);
  const { data: aufgaben } = useAufgaben();
  const anlegen = useAufgabeAnlegen();
  const umschalten = useAufgabeUmschalten();
  const aendern = useAufgabeAendern();
  const loeschen = useAufgabeLoeschen();

  const [entwurf, setEntwurf] = useState('');
  const [zeigeWartend, setZeigeWartend] = useState(false);
  const [zeigeRuhend, setZeigeRuhend] = useState(false);
  const [zeigeErledigt, setZeigeErledigt] = useState(false);
  /** Welche Aufgabe gerade ihre Zeile aufgeklappt hat (Person / Warten auf). */
  const [offeneId, setOffeneId] = useState<string | null>(null);
  // Erst den Haken zeigen, dann die Zeile fortschaffen (siehe `nachklang.ts`).
  const { markiert, anstossen } = useNachklang();

  const { offen, wartend, ruhend, erledigt } = useMemo(() => teileAufgaben(aufgaben ?? []), [aufgaben]);
  const [gezeigtErledigt, restErledigt] = useMemo(() => kuerze(erledigt), [erledigt]);

  const hinzufuegen = () => {
    const titel = entwurf.trim();
    if (!titel) return;
    hapticSuccess();
    anlegen.mutate({ titel });
    setEntwurf('');
  };

  /**
   * Eine Zeile plus ihr Editor.
   *
   * Die `Listenzeile` umschließt NUR die Zeile selbst — der aufklappende Teil
   * liegt daneben. Läge er darin, würde die Layout-Animation ihn beim Wachsen
   * stauchen (siehe `Listenzeile.tsx`).
   */
  const zeile = (a: Aufgabe, art: 'offen' | 'wartend' | 'ruhend', trenner: boolean) => {
    const aufgeklappt = offeneId === a.id;
    // Ruhendes anzutippen heißt „doch schon wieder dran" — es kommt zurück ins
    // Offene, statt erledigt zu werden. Der Haken hieße hier das Falsche.
    const nebensatz = [
      a.person,
      a.wartetAuf ? `wartet auf ${a.wartetAuf}` : null,
      art === 'ruhend' ? wiederIn(a) : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <View key={a.id}>
        <Listenzeile>
        {trenner && <Seam marginVertical={2} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <PressableScale
            accessibilityLabel={art === 'ruhend' ? `${a.titel} wieder aufnehmen` : `${a.titel} erledigen`}
            onPress={() => {
              hapticSelect();
              anstossen(a.id, () => umschalten.mutate(a));
            }}
            style={{ paddingVertical: Spacing.sm + 2 }}
          >
            {art === 'wartend' && !markiert.has(a.id) ? (
              <PauseCircle size={22} color={colors.accentA} strokeWidth={2} />
            ) : art === 'ruhend' && !markiert.has(a.id) ? (
              <Repeat size={22} color={colors.accentA} strokeWidth={2} />
            ) : (
              <Haken an={markiert.has(a.id)} />
            )}
          </PressableScale>
          <PressableScale
            accessibilityLabel={aufgeklappt ? `${a.titel} zuklappen` : `${a.titel} bearbeiten`}
            onPress={() => {
              hapticSelect();
              setOffeneId(aufgeklappt ? null : a.id);
            }}
            pressedScale={0.99}
            style={{ flex: 1, paddingVertical: Spacing.sm + 2 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Type variant="body" style={{ flexShrink: 1 }} numberOfLines={2}>{a.titel}</Type>
              {/* Ein Zeichen, das nur es selbst ist, liegt nackt auf der Platte
                  und trägt seine Farbe im Strich — keine getönte Fläche, denn
                  „wiederkehrend" ist eine Eigenschaft und kein Zustand „an". */}
              {wiederkehrend(a) && art !== 'ruhend' && (
                <Repeat size={13} color={colors.text3} strokeWidth={2.4} />
              )}
            </View>
            {nebensatz.length > 0 && (
              <Type variant="caption" tone="text3" numberOfLines={1}>{nebensatz}</Type>
            )}
          </PressableScale>
          <PressableScale
            accessibilityLabel={`${a.titel} löschen`}
            onPress={() => {
              hapticSelect();
              loeschen.mutate(a.id);
            }}
            style={{ padding: Spacing.xs }}
          >
            <Trash2 size={16} color={colors.text3} strokeWidth={2} />
          </PressableScale>
        </View>
        </Listenzeile>

        {aufgeklappt && (
          <Faltet>
            {/* Die Auflage sitzt unter dem TITEL, nicht unter dem Haken: sie
                beschreibt die Aufgabe, nicht ihre Erledigung. */}
            <View style={{ paddingBottom: Spacing.sm, paddingLeft: Spacing.xl }}>
              <Auflage>
                <AuflagenFeldZeile
                  label="Wer macht das"
                  eingabeLabel={`Wer kümmert sich um ${a.titel}`}
                  platzhalter="niemand"
                  wert={a.person}
                  onSichern={(v) => aendern.mutate({ id: a.id, patch: { person: v } })}
                />
                <AuflagenFeldZeile
                  label="Wartet auf"
                  eingabeLabel={`Worauf ${a.titel} wartet`}
                  platzhalter="nichts"
                  wert={a.wartetAuf}
                  onSichern={(v) => aendern.mutate({ id: a.id, patch: { wartetAuf: v } })}
                />
                <AuflagenZeile label="Kommt wieder" letzte>
                  <Wahlzeile
                    nackt
                    label="Kommt wieder"
                    accessibilityPraefix={a.titel}
                    optionen={RHYTHMEN.map((r) => ({ label: r.label, wert: r.tage }))}
                    wert={a.rhythmusTage ?? null}
                    leer={null}
                    onWert={(tage) =>
                      aendern.mutate({
                        id: a.id,
                        // Den Rhythmus abzuschalten muss auch das Ruhen
                        // beenden — sonst bliebe eine Aufgabe unsichtbar
                        // liegen, die gar nicht mehr wiederkehrt.
                        patch: tage === null ? { rhythmusTage: null, faelligAb: null } : { rhythmusTage: tage },
                      })
                    }
                  />
                </AuflagenZeile>
              </Auflage>
            </View>
          </Faltet>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <Reveal>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Hammer size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Wohnung</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {wartend.length > 0 ? `${offen.length} offen · ${wartend.length} wartet` : `${offen.length} offen`}
        </Type>
      </Reveal>

      <Reveal delay={40}>
        <Eingabezeile
          label="Aufgabe hinzufügen"
          platzhalter="Was steht an?"
          wert={entwurf}
          onWert={setEntwurf}
          onAbschicken={hinzufuegen}
          knopfLabel="Aufgabe anlegen"
        />
      </Reveal>

      <Reveal delay={80}>
        {offen.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<Hammer size={20} color={colors.accentA} strokeWidth={2} />}
              title="Nichts offen"
              body="Was in der Wohnung liegen bleibt, kommt oben hinein. Tippe eine Aufgabe an, um sie jemandem zuzuordnen."
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {offen.map((a, i) => zeile(a, 'offen', i > 0))}
          </GlassPanel>
        )}
      </Reveal>

      {/* Wie im Einkauf: nur wenn es überhaupt jemanden zu bitten gibt. Ohne
          geteilte Liste hätte der Weg kein Ziel, und ein Knopf, der ins Leere
          führt, ist schlimmer als keiner.

          Gebeten wird nur um OFFENES — Wartendes liegt bei jemand Drittem, da
          hilft kein Mitbewohner. */}
      {geteilt && offen.length > 0 && (
        <Reveal delay={100}>
          <PressableScale
            accessibilityLabel="Jemanden bitten, etwas zu übernehmen"
            onPress={() => {
              hapticSelect();
              router.push('/bitten?was=wohnung');
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', paddingVertical: Spacing.xs }}
          >
            <Send size={16} color={colors.accentA} strokeWidth={2.2} />
            <Type variant="label" tone="accentA">Soll das jemand übernehmen?</Type>
          </PressableScale>
        </Reveal>
      )}

      {/* Wartendes steht unter dem Offenen und eingeklappt: es ist da, aber es
          ist nichts, woran man gerade arbeiten kann. */}
      {wartend.length > 0 && (
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
              <Type variant="eyebrow" tone="text3">Warten auf · {wartend.length}</Type>
              <DisclosureChevron open={zeigeWartend} color={colors.text3} />
            </PressableScale>
            {/* Klappt auf, statt hart ins Bild zu knallen — der Pfeil darüber
                dreht ja auch. */}
            {zeigeWartend && (
              <Faltet>
                <GlassPanel style={{ marginTop: Spacing.xs }}>
                  {wartend.map((a, i) => zeile(a, 'wartend', i > 0))}
                </GlassPanel>
              </Faltet>
            )}
          </View>
        </Reveal>
      )}

      {/* Ruhendes: abgehakt, kommt aber wieder. Eingeklappt und mit Zahl —
          das Abhaken einer wiederkehrenden Aufgabe soll sich nicht anfühlen
          wie Löschen, also muss irgendwo stehen, dass sie zurückkommt. */}
      {ruhend.length > 0 && (
        <Reveal delay={120}>
          <View>
            <PressableScale
              accessibilityLabel={zeigeRuhend ? 'Wiederkehrendes ausblenden' : 'Wiederkehrendes anzeigen'}
              onPress={() => {
                hapticSelect();
                setZeigeRuhend((v) => !v);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md }}
            >
              <Type variant="eyebrow" tone="text3">Kommt wieder · {ruhend.length}</Type>
              <DisclosureChevron open={zeigeRuhend} color={colors.text3} />
            </PressableScale>
            {zeigeRuhend && (
              <Faltet>
                <GlassPanel style={{ marginTop: Spacing.xs }}>
                  {ruhend.map((a, i) => zeile(a, 'ruhend', i > 0))}
                </GlassPanel>
              </Faltet>
            )}
          </View>
        </Reveal>
      )}

      {erledigt.length > 0 && (
        <Reveal delay={120}>
          <View>
            <PressableScale
              accessibilityLabel={zeigeErledigt ? 'Erledigtes ausblenden' : 'Erledigtes anzeigen'}
              onPress={() => {
                hapticSelect();
                setZeigeErledigt((v) => !v);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md }}
            >
              <Type variant="eyebrow" tone="text3">Erledigt · {erledigt.length}</Type>
              <DisclosureChevron open={zeigeErledigt} color={colors.text3} />
            </PressableScale>
            {zeigeErledigt && (
              <Faltet>
              <GlassPanel style={{ marginTop: Spacing.xs }}>
                {gezeigtErledigt.map((a, i) => (
                  <Listenzeile key={a.id} versatz={i}>
                    {i > 0 && <Seam marginVertical={2} />}
                    <PressableScale
                      accessibilityLabel={`${a.titel} wieder öffnen`}
                      onPress={() => {
                        hapticSelect();
                        anstossen(a.id, () => umschalten.mutate(a));
                      }}
                      pressedScale={0.99}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                    >
                      <Haken an={!markiert.has(a.id)} />
                      <Type variant="body" tone="text3" style={{ flex: 1 }} numberOfLines={1}>{a.titel}</Type>
                    </PressableScale>
                  </Listenzeile>
                ))}
                {restErledigt > 0 && (
                  <Type variant="caption" tone="text3" style={{ paddingTop: Spacing.sm }}>
                    {`… und ${restErledigt} weitere`}
                  </Type>
                )}
              </GlassPanel>
              </Faltet>
            )}
          </View>
        </Reveal>
      )}
    </Screen>
  );
}
