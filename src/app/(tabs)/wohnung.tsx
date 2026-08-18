// wohnung.tsx — was in der Wohnung liegen bleibt.
//
// Aufgaben wie in Stoa, aber bewusst SCHLANKER: keine Projekte, keine
// Wiederholungen, keine Lebensspannen. Das wäre Stoa ein zweites Mal.
//
// Zwei Dinge sind geblieben, weil sie in einer geteilten Wohnung erst richtig
// Sinn ergeben:
//  · Eine Aufgabe kann an einer PERSON hängen — „wer macht das?" ist dort die
//    eigentliche Frage. Frei getippt, kein Konto.
//  · „Warten auf" für alles, was bei jemand anderem liegt (Hausverwaltung,
//    Handwerker). Es verschwindet damit aus dem Offenen, ohne verloren zu
//    gehen — und mahnt nicht, weil man selbst nichts tun kann.
import { Hammer, PauseCircle, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
import { Eingabezeile } from '@/components/Eingabezeile';
import { Feld } from '@/components/Feld';
import { Haken } from '@/components/Haken';
import { Faltet, Listenzeile } from '@/components/Listenzeile';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
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
import { kuerze, teileAufgaben } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

export default function WohnungScreen() {
  const colors = useColors();
  const { data: aufgaben } = useAufgaben();
  const anlegen = useAufgabeAnlegen();
  const umschalten = useAufgabeUmschalten();
  const aendern = useAufgabeAendern();
  const loeschen = useAufgabeLoeschen();

  const [entwurf, setEntwurf] = useState('');
  const [zeigeWartend, setZeigeWartend] = useState(false);
  const [zeigeErledigt, setZeigeErledigt] = useState(false);
  /** Welche Aufgabe gerade ihre Zeile aufgeklappt hat (Person / Warten auf). */
  const [offeneId, setOffeneId] = useState<string | null>(null);
  // Erst den Haken zeigen, dann die Zeile fortschaffen (siehe `nachklang.ts`).
  const { markiert, anstossen } = useNachklang();

  const { offen, wartend, erledigt } = useMemo(() => teileAufgaben(aufgaben ?? []), [aufgaben]);
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
  const zeile = (a: Aufgabe, art: 'offen' | 'wartend', trenner: boolean) => {
    const aufgeklappt = offeneId === a.id;
    return (
      <View key={a.id}>
        <Listenzeile>
        {trenner && <Seam marginVertical={2} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <PressableScale
            accessibilityLabel={`${a.titel} erledigen`}
            onPress={() => {
              hapticSelect();
              anstossen(a.id, () => umschalten.mutate({ id: a.id, erledigt: false }));
            }}
            style={{ paddingVertical: Spacing.sm + 2 }}
          >
            {art === 'wartend' && !markiert.has(a.id) ? (
              <PauseCircle size={22} color={colors.accentA} strokeWidth={2} />
            ) : (
              <Haken an={markiert.has(a.id)} rund />
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
            <Type variant="body" numberOfLines={2}>{a.titel}</Type>
            {(a.person || a.wartetAuf) && (
              <Type variant="caption" tone="text3" numberOfLines={1}>
                {[a.person, a.wartetAuf ? `wartet auf ${a.wartetAuf}` : null].filter(Boolean).join(' · ')}
              </Type>
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
            <View style={{ gap: Spacing.sm, paddingBottom: Spacing.sm, paddingLeft: Spacing.xl }}>
              <Feld
                label={`Wer kümmert sich um ${a.titel}`}
                platzhalter="Wer macht das?"
                wert={a.person}
                onSichern={(v) => aendern.mutate({ id: a.id, patch: { person: v } })}
              />
              <Feld
                label={`Worauf ${a.titel} wartet`}
                platzhalter="Wartet auf … (dann ruht sie)"
                wert={a.wartetAuf}
              onSichern={(v) => aendern.mutate({ id: a.id, patch: { wartetAuf: v } })}
              />
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
                        anstossen(a.id, () => umschalten.mutate({ id: a.id, erledigt: true }));
                      }}
                      pressedScale={0.99}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                    >
                      <Haken an={!markiert.has(a.id)} rund />
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
