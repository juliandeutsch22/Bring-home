// einkauf.tsx — die Liste. Der Grund, warum es die App gibt.
//
// Aufbau: Eingabe ganz oben (ein Gedanke, ein Feld, sofort), darunter was noch
// fehlt, darunter Wagen und Vorrat — beide eingeklappt, weil sie beim
// Einkaufen niemanden interessieren.
//
// Ein Artikel wandert dabei eine Bahn entlang, und jeder Abschnitt ist eine
// Station darauf:
//
//     Liste  →  Wagen  →  Vorrat  →  weg
//
// Der Vorrat ist die jüngste Station und der Grund, warum es ihn gibt: Vorher
// endete die Bahn beim Wagen, und „Wagen leeren" löschte. Damit ging jedes
// Wissen über einen Einkauf verloren — ein Gericht, dessen Zutaten am Samstag
// gekauft wurden, stand am Sonntag wieder auf „fehlt". Nicht weil etwas
// fehlte, sondern weil niemand mehr wusste, dass es da war.
//
// Drei Entscheidungen, die man sehen können sollte:
//  · Abhaken LÖSCHT nicht. Was im Wagen liegt, bleibt sichtbar, bis jemand ihn
//    einräumt — ein Fehlgriff ist damit ein Tipp, keine Rekonstruktion.
//  · Ein Artikel, den es schon gibt, wird nicht verdoppelt. Wer „Milch" ein
//    zweites Mal tippt, meint dieselbe Milch.
//  · Rechts steht ein STIFT, kein Mülleimer. Die ganze Zeile hakt ab — das ist
//    im Supermarkt die einzige Handlung, die schnell gehen muss —, und alles
//    Übrige (umbenennen, Menge, löschen) liegt eine Ebene tiefer. Vorher war
//    das Löschen ein einzelner Tipp direkt neben dem Abhaken; ein Danebengreifen
//    war damit unwiderruflich.
import { Link2, Pencil, Send, ShoppingBasket } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DisclosureChevron } from '@/components/DisclosureChevron';
import { Eingabezeile } from '@/components/Eingabezeile';
import { Haken } from '@/components/Haken';
import { Mulde, MuldenFeldZeile, MuldenHandlung } from '@/components/Mulde';
import { Faltet, Listenzeile } from '@/components/Listenzeile';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
import {
  useArtikel,
  useArtikelAendern,
  useArtikelAnlegen,
  useArtikelLoeschen,
  useArtikelUmschalten,
  useVorratAufgebraucht,
  useWagenEinraeumen,
} from '@/data/queries';
import { useHaushalt } from '@/data/haushalt';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { useNachklang } from '@/lib/nachklang';
import { findeArtikel, imVorratSeit, kuerze, teileListe } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

export default function EinkaufScreen() {
  const colors = useColors();
  const router = useRouter();
  const geteilt = useHaushalt((s) => s.id !== null);
  const { data: artikel } = useArtikel();
  const anlegen = useArtikelAnlegen();
  const umschalten = useArtikelUmschalten();
  const aendern = useArtikelAendern();
  const loeschen = useArtikelLoeschen();
  const einraeumen = useWagenEinraeumen();
  const aufgebraucht = useVorratAufgebraucht();

  const [entwurf, setEntwurf] = useState('');
  const [zeigeWagen, setZeigeWagen] = useState(false);
  const [zeigeVorrat, setZeigeVorrat] = useState(false);
  /** Welcher Artikel gerade seinen Editor offen hat. Immer höchstens einer. */
  const [bearbeitet, setBearbeitet] = useState<string | null>(null);
  // Erst den Haken zeigen, dann die Zeile fortschaffen (siehe `nachklang.ts`).
  const { markiert, anstossen } = useNachklang();

  const { offen, imWagen, imVorrat } = useMemo(() => teileListe(artikel ?? []), [artikel]);
  const [gezeigterWagen, restWagen] = useMemo(() => kuerze(imWagen), [imWagen]);
  const [gezeigterVorrat, restVorrat] = useMemo(() => kuerze(imVorrat), [imVorrat]);

  const hinzufuegen = () => {
    const text = entwurf.trim();
    if (!text) return;
    // Steht es schon OFFEN da, ist nichts zu tun. Liegt es im Wagen, kommt es
    // wieder heraus — man tippt es ja, weil man es (noch einmal) braucht.
    //
    // Was im VORRAT steht, wird bewusst nicht angefasst: Wer „Milch" tippt,
    // während eine Packung im Schrank steht, will Nachschub, nicht die alte
    // Packung zurück auf die Liste. Es entsteht also eine zweite Zeile
    // desselben Namens — und genau dafür kann `zutatStatus` mehrere Treffer
    // (siehe `findeAlleArtikel`).
    const offeneOderImWagen = (artikel ?? []).filter((a) => a.vorratAb === null);
    const vorhanden = findeArtikel(offeneOderImWagen, text);
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
          {/* Getönt heißt in dieser App „an": das Glied trägt seine Farbe erst,
              wenn die Liste wirklich an einem zweiten Gerät hängt. */}
          <PressableScale
            accessibilityLabel={geteilt ? 'Geteilte Liste' : 'Liste teilen'}
            onPress={() => {
              hapticSelect();
              router.push('/haushalt');
            }}
            style={{ padding: Spacing.xs }}
          >
            <Link2 size={20} color={geteilt ? colors.accentA : colors.text3} strokeWidth={2.2} />
          </PressableScale>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {offen.length === 1 ? '1 Sache fehlt' : `${offen.length} Sachen fehlen`}
        </Type>
      </Reveal>

      <Reveal delay={40}>
        <Eingabezeile
          label="Etwas hinzufügen"
          platzhalter="Was fehlt?"
          wert={entwurf}
          onWert={setEntwurf}
          onAbschicken={hinzufuegen}
          knopfLabel="Hinzufügen"
        />
      </Reveal>

      <Reveal delay={80}>
        {offen.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<ShoppingBasket size={20} color={colors.accentA} strokeWidth={2} />}
              title="Nichts fehlt"
              body="Was euch einfällt, kommt oben hinein. Habt ihr die Liste geteilt, steht es sofort auch beim anderen."
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {offen.map((a, i) => {
              const auf = bearbeitet === a.id;
              return (
              // Der äußere Kasten ist NICHT animiert: er ist das Element, das
              // beim Aufklappen wächst, und eine Layout-Animation würde seinen
              // Inhalt dabei stauchen (siehe `Listenzeile.tsx`).
              <View key={a.id}>
                <Listenzeile>
                {i > 0 && <Seam marginVertical={2} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <PressableScale
                    accessibilityLabel={`${a.text} abhaken`}
                    onPress={() => {
                      hapticSelect();
                      anstossen(a.id, () => umschalten.mutate({ id: a.id, imWagen: false }));
                    }}
                    pressedScale={0.99}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingVertical: Spacing.sm + 2 }}
                  >
                    {/* Nacktes Kästchen: getönt heißt in diesem System „an".
                        Beim Abhaken füllt es sich — und ERST danach wandert die
                        Zeile in den Wagen. */}
                    <Haken an={markiert.has(a.id)} />
                    <View style={{ flex: 1 }}>
                      {/* ZWEI Zeilen wie in der Wohnung. Ein Name wie
                          „Apfelessig / Balsamico non filtrato" war einzeilig
                          abgeschnitten und nur über den Editor ganz zu lesen —
                          ein Umweg für etwas, das schon dastehen sollte. */}
                      <Type variant="body" numberOfLines={2}>{a.text}</Type>
                      {a.vonWem && <Type variant="caption" tone="text3" numberOfLines={1}>{`von ${a.vonWem}`}</Type>}
                    </View>
                    {a.menge && <Type variant="label" tone="text3" tabular>{a.menge}</Type>}
                  </PressableScale>
                  <PressableScale
                    accessibilityLabel={auf ? `${a.text} fertig bearbeiten` : `${a.text} bearbeiten`}
                    onPress={() => {
                      hapticSelect();
                      setBearbeitet(auf ? null : a.id);
                    }}
                    style={{ padding: Spacing.xs }}
                  >
                    <Pencil size={16} color={auf ? colors.accentA : colors.text3} strokeWidth={2} />
                  </PressableScale>
                </View>
                </Listenzeile>

                {auf && (
                  <Faltet>
                    <View style={{ paddingBottom: Spacing.sm, paddingLeft: Spacing.xl }}>
                      <Mulde>
                        {/* Der Name darf nicht leer werden — ein namenloser
                            Punkt wäre auf der Liste nicht wiederzufinden. */}
                        {/* Breit, weil der Name der INHALT ist und nicht eine
                            Eigenschaft: „Apfelessig / Balsamico non filtrato"
                            passt in keine rechte Spalte. */}
                        <MuldenFeldZeile
                          breit
                          label="Was"
                          eingabeLabel={`${a.text} umbenennen`}
                          platzhalter="Was?"
                          wert={a.text}
                          onSichern={(v) => v && aendern.mutate({ id: a.id, patch: { text: v } })}
                        />
                        {/* `letzte`, weil die Handlungszeile darunter ihren
                            eigenen Trenner mitbringt — sonst lägen zwei
                            Haarlinien übereinander. */}
                        <MuldenFeldZeile
                          letzte
                          label="Menge"
                          eingabeLabel={`Menge von ${a.text}`}
                          platzhalter="egal"
                          wert={a.menge}
                          onSichern={(v) => aendern.mutate({ id: a.id, patch: { menge: v } })}
                        />
                        {/* Die destruktive Handlung bekommt eine EIGENE Zeile in
                            derselben Mulde, statt darunter im Nichts zu hängen.
                            Ein Tipp, keine Rückfrage: hierher kommt man nur über
                            den Stift, das Löschen ist also schon der zweite. */}
                        <MuldenHandlung
                          label="Von der Liste nehmen"
                          accessibilityLabel={`${a.text} entfernen`}
                          onPress={() => {
                            hapticSelect();
                            setBearbeitet(null);
                            loeschen.mutate(a.id);
                          }}
                        />
                      </Mulde>
                    </View>
                  </Faltet>
                )}
              </View>
              );
            })}
          </GlassPanel>
        )}
      </Reveal>

      {/* Nur wenn es überhaupt jemanden zu bitten gibt: ohne geteilte Liste
          hätte der Weg kein Ziel, und ein Knopf, der ins Leere führt, ist
          schlimmer als keiner. */}
      {geteilt && offen.length > 0 && (
        <Reveal delay={100}>
          <PressableScale
            accessibilityLabel="Jemanden bitten, etwas mitzunehmen"
            onPress={() => {
              hapticSelect();
              router.push('/bitten');
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', paddingVertical: Spacing.xs }}
          >
            <Send size={16} color={colors.accentA} strokeWidth={2.2} />
            <Type variant="label" tone="accentA">Du brauchst etwas dringend?</Type>
          </PressableScale>
        </Reveal>
      )}

      {imWagen.length > 0 && (
        <Reveal delay={120}>
          <Faltet>
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
                // `accentA`, nicht mehr der Zweitton: Einräumen NIMMT nichts
                // mehr weg, es bringt den Einkauf an seinen Platz. Der
                // Zweitton war richtig, solange der Knopf löschte.
                <PressableScale
                  accessibilityLabel="Wagen in den Vorrat einräumen"
                  onPress={() => {
                    hapticSuccess();
                    einraeumen.mutate();
                  }}
                  style={{ padding: Spacing.xs }}
                >
                  <Type variant="label" tone="accentA">Einräumen</Type>
                </PressableScale>
              )}
            </View>
            {/* Klappt auf, statt hart ins Bild zu knallen — der Pfeil darüber
                dreht ja auch. `versatz` staffelt außerdem den Abgang, wenn der
                Wagen geleert wird: sonst verschwinden zehn Zeilen im selben
                Bild, und das ist ein Schnitt, keine Handlung. */}
            {zeigeWagen && (
              <Faltet>
              <GlassPanel style={{ marginTop: Spacing.xs }}>
                {gezeigterWagen.map((a, i) => (
                  <Listenzeile key={a.id} versatz={i}>
                    {i > 0 && <Seam marginVertical={2} />}
                    <PressableScale
                      accessibilityLabel={`${a.text} zurück auf die Liste`}
                      onPress={() => {
                        hapticSelect();
                        anstossen(a.id, () => umschalten.mutate({ id: a.id, imWagen: true }));
                      }}
                      pressedScale={0.99}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                    >
                      <Haken an={!markiert.has(a.id)} />
                      <Type variant="body" tone="text3" style={{ flex: 1 }} numberOfLines={1}>{a.text}</Type>
                    </PressableScale>
                  </Listenzeile>
                ))}
                {restWagen > 0 && (
                  <Type variant="caption" tone="text3" style={{ paddingTop: Spacing.sm }}>
                    {`… und ${restWagen} weitere`}
                  </Type>
                )}
              </GlassPanel>
              </Faltet>
            )}
          </Faltet>
        </Reveal>
      )}

      {/* Der Vorrat steht UNTER dem Wagen, weil er in der Bahn dahinter liegt.
          Und er trägt KEINEN Mäander: Der ist einmal je Bildschirm erlaubt,
          und er sitzt schon über dem Wagen. */}
      {imVorrat.length > 0 && (
        <Reveal delay={140}>
          <Faltet>
            <Seam marginVertical={Spacing.md} />
            <PressableScale
              accessibilityLabel={zeigeVorrat ? 'Vorrat einklappen' : 'Vorrat ansehen'}
              onPress={() => {
                hapticSelect();
                setZeigeVorrat((v) => !v);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
            >
              <Type variant="eyebrow" tone="text3">Im Vorrat · {imVorrat.length}</Type>
              <DisclosureChevron open={zeigeVorrat} color={colors.text3} />
            </PressableScale>
            {zeigeVorrat && (
              <Faltet>
                <GlassPanel style={{ marginTop: Spacing.xs }}>
                  {gezeigterVorrat.map((a, i) => {
                    const auf = bearbeitet === a.id;
                    return (
                    <View key={a.id}>
                      <Listenzeile versatz={i}>
                      {i > 0 && <Seam marginVertical={2} />}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                        {/* Ein Tipp heißt „aufgebraucht" UND setzt es wieder
                            auf die Liste. Das ist im Alltag EINE Handlung: Wer
                            merkt, dass die Milch leer ist, will Milch kaufen.
                            Aufbrauchen ohne Nachkaufen ist der seltenere Fall
                            und liegt deshalb hinter dem Stift. */}
                        <PressableScale
                          accessibilityLabel={`${a.text} ist aufgebraucht`}
                          accessibilityHint="Kommt damit wieder auf die Einkaufsliste"
                          onPress={() => {
                            hapticSelect();
                            anstossen(a.id, () => aufgebraucht.mutate(a.id));
                          }}
                          pressedScale={0.99}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingVertical: Spacing.sm + 2 }}
                        >
                          <Haken an={!markiert.has(a.id)} />
                          <View style={{ flex: 1 }}>
                            <Type variant="body" tone="text3" numberOfLines={1}>{a.text}</Type>
                            {/* Das Alter ohne jede Wertung: keine Farbe, keine
                                Warnung. Die App weiß nicht, was in eurem
                                Schrank verdirbt — sie sagt nur, wie alt ihre
                                eigene Auskunft ist. */}
                            <Type variant="caption" tone="text3" numberOfLines={1}>
                              {imVorratSeit(a)}
                            </Type>
                          </View>
                        </PressableScale>
                        <PressableScale
                          accessibilityLabel={auf ? `${a.text} fertig bearbeiten` : `${a.text} bearbeiten`}
                          onPress={() => {
                            hapticSelect();
                            setBearbeitet(auf ? null : a.id);
                          }}
                          style={{ padding: Spacing.xs }}
                        >
                          <Pencil size={16} color={auf ? colors.accentA : colors.text3} strokeWidth={2} />
                        </PressableScale>
                      </View>
                      </Listenzeile>

                      {auf && (
                        <Faltet>
                          <View style={{ paddingBottom: Spacing.sm, paddingLeft: Spacing.xl }}>
                            {/* DERSELBE Editor wie auf der Liste, nur mit
                                anderer Handlung unten. Der Stift soll überall
                                dasselbe bedeuten — ein Stift, der hier nur
                                löschen könnte, wäre ein anderes Werkzeug mit
                                demselben Zeichen. Umbenennen ist im Schrank
                                außerdem echter Bedarf: Gekauft wurde „Milch",
                                dasteht „Hafermilch". */}
                            <Mulde>
                              <MuldenFeldZeile
                                breit
                                label="Was"
                                eingabeLabel={`${a.text} umbenennen`}
                                platzhalter="Was?"
                                wert={a.text}
                                onSichern={(v) => v && aendern.mutate({ id: a.id, patch: { text: v } })}
                              />
                              <MuldenFeldZeile
                                letzte
                                label="Menge"
                                eingabeLabel={`Menge von ${a.text}`}
                                platzhalter="egal"
                                wert={a.menge}
                                onSichern={(v) => aendern.mutate({ id: a.id, patch: { menge: v } })}
                              />
                              {/* Nicht „von der Liste nehmen": Hier geht es
                                  ohne Nachkaufen weg — das ist der seltenere
                                  Fall, den der Tipp auf die Zeile nicht
                                  abdeckt. */}
                              <MuldenHandlung
                                label="Aus dem Vorrat nehmen"
                                accessibilityLabel={`${a.text} aus dem Vorrat nehmen, ohne es nachzukaufen`}
                                onPress={() => {
                                  hapticSelect();
                                  setBearbeitet(null);
                                  loeschen.mutate(a.id);
                                }}
                              />
                            </Mulde>
                          </View>
                        </Faltet>
                      )}
                    </View>
                    );
                  })}
                  {restVorrat > 0 && (
                    <Type variant="caption" tone="text3" style={{ paddingTop: Spacing.sm }}>
                      {`… und ${restVorrat} weitere`}
                    </Type>
                  )}
                </GlassPanel>
              </Faltet>
            )}
          </Faltet>
        </Reveal>
      )}
    </Screen>
  );
}
