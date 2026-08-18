// haushalt.tsx — der einzige Bildschirm, auf dem es ums Teilen geht.
//
// Er ist bewusst kein vierter Tab: Teilen richtet man EINMAL ein und schaut
// danach nie wieder hin. Ein Dauerplatz in der Leiste für einen einmaligen
// Handgriff wäre der teuerste Platz der App für den seltensten Weg.
//
// Der ganze Entwurf steht auf einer Zeile Text: eine Liste ist eine Kennung
// plus einen Code. Wer den Code hat, ist dabei. Keine Konten, keine
// Einladungs-Mails, keine Freundesliste.
import { Check, ChevronLeft, Copy, Link2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Share, TextInput, View } from 'react-native';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { Type } from '@/components/Type';
import { useHaushalt } from '@/data/haushalt';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { webNoOutline } from '@/theme/layout';
import { useColors } from '@/theme/ThemeProvider';
import { R, Spacing, T } from '@/theme/theme.tokens';

export default function HaushaltScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, code, stand, meldung, gruenden, beitreten, verlassen } = useHaushalt();
  const [eingabe, setEingabe] = useState('');
  const [kopiert, setKopiert] = useState(false);

  const laedt = stand === 'laedt';

  const beitretenJetzt = () => {
    if (!eingabe.trim()) return;
    hapticSuccess();
    void beitreten(eingabe);
    setEingabe('');
  };

  const teilen = async () => {
    if (!code) return;
    hapticSuccess();
    const satz = `Unsere Einkaufsliste: ${code}`;
    try {
      // Auf dem Gerät der Teilen-Dialog, im Browser die Zwischenablage. Beides
      // endet damit, dass der Code bei jemand anderem landet.
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(code);
        setKopiert(true);
        setTimeout(() => setKopiert(false), 2200);
      } else {
        await Share.share({ message: satz });
      }
    } catch {
      // Zwischenablage verweigert (kein sicherer Kontext, Berechtigung fehlt):
      // der Code steht ohnehin lesbar auf dem Bildschirm.
    }
  };

  return (
    <Screen withTabBar={false}>
      <Reveal>
        <PressableScale
          accessibilityLabel="Zurück"
          onPress={() => {
            hapticSelect();
            router.back();
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start' }}
        >
          <ChevronLeft size={20} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="label" tone="accentA">Zurück</Type>
        </PressableScale>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
          <Link2 size={26} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Teilen</Type>
        </View>
        {/* Drei Zustände, drei Sätze. „Gemerkt, aber nicht verbunden" hatte
            vorher keinen eigenen — und las sich damit wie „läuft", obwohl
            nichts hochging. */}
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }}>
          {!id
            ? 'Diese Liste liegt nur auf diesem Gerät.'
            : stand === 'verbunden'
              ? 'Diese Liste liegt auf beiden Geräten.'
              : 'Geteilt, aber gerade nicht verbunden. Es wird nachgeholt, sobald es geht.'}
        </Type>
      </Reveal>

      {/* Was schiefging, steht ganz oben und nicht unten am Code-Feld: es
          betrifft den ganzen Bildschirm, nicht nur den Beitritt. */}
      {meldung && stand !== 'laedt' && (
        <Reveal delay={30}>
          <GlassPanel>
            <Type variant="eyebrow" tone="text3">Das steht im Weg</Type>
            <Type variant="body" tone="text2" style={{ marginTop: Spacing.xs }}>{meldung}</Type>
          </GlassPanel>
        </Reveal>
      )}

      {id && code ? (
        <Reveal delay={40}>
          <GlassPanel>
            <Type variant="eyebrow" tone="text3">Euer Code</Type>
            <Type variant="heading" style={{ marginTop: Spacing.xs, letterSpacing: 4 }} tabular>{code}</Type>
            <Type variant="caption" tone="text3" style={{ marginTop: Spacing.xs }}>
              Wer ihn eintippt, sieht dieselbe Liste. Er lässt sich vorlesen — er trägt
              weder Null noch O, weder Eins noch I.
            </Type>
            <Seam marginVertical={Spacing.md} />
            <PressableScale
              accessibilityLabel="Code weitergeben"
              onPress={teilen}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
            >
              {kopiert ? (
                <Check size={18} color={colors.accentA} strokeWidth={2.4} />
              ) : (
                <Copy size={18} color={colors.accentA} strokeWidth={2.2} />
              )}
              <Type variant="label" tone="accentA">{kopiert ? 'Kopiert' : 'Code weitergeben'}</Type>
            </PressableScale>
          </GlassPanel>
        </Reveal>
      ) : (
        <Reveal delay={40}>
          <GlassPanel>
            <Type variant="eyebrow" tone="text3">Zu zweit</Type>
            <Type variant="body" tone="text2" style={{ marginTop: Spacing.xs }}>
              Einer legt die geteilte Liste an und gibt den Code weiter, der andere tippt
              ihn ein. Was schon auf diesem Gerät steht, kommt dabei mit.
            </Type>
            <Seam marginVertical={Spacing.md} />
            <PressableScale
              accessibilityLabel="Geteilte Liste anlegen"
              onPress={() => {
                hapticSuccess();
                void gruenden();
              }}
              style={{ opacity: laedt ? 0.4 : 1 }}
            >
              <Type variant="label" tone="accentA">
                {laedt ? 'Einen Moment …' : 'Geteilte Liste anlegen'}
              </Type>
            </PressableScale>
          </GlassPanel>
        </Reveal>
      )}

      <Reveal delay={80}>
        <GlassPanel>
          <Type variant="eyebrow" tone="text3">{id ? 'Zu einer anderen wechseln' : 'Code bekommen?'}</Type>
          {/* Das Feld über die volle Breite, der Knopf DARUNTER — und nicht
              rechts daneben. Nebeneinander wurde „Beitreten" auf einem schmalen
              Gerät angeschnitten: ein Textknopf in einer Zeile mit einem
              dehnbaren Feld hat keine Breite, auf der er bestehen könnte. So
              liegt er außerdem genauso wie „Geteilte Liste anlegen" im Feld
              darüber. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: R.lg,
              borderWidth: 1,
              borderColor: colors.chipBorder,
              backgroundColor: colors.sunk,
              paddingHorizontal: Spacing.md,
              marginTop: Spacing.sm,
            }}
          >
            <TextInput
              accessibilityLabel="Code eintippen"
              value={eingabe}
              onChangeText={setEingabe}
              onSubmitEditing={beitretenJetzt}
              placeholder="Code"
              placeholderTextColor={colors.text3}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              style={[
                { flex: 1, minWidth: 0, fontSize: T.md, color: colors.text, paddingVertical: Spacing.sm + 4, minHeight: 24, letterSpacing: 2 },
                webNoOutline,
              ]}
            />
          </View>
          <Seam marginVertical={Spacing.md} />
          <PressableScale
            accessibilityLabel="Beitreten"
            onPress={beitretenJetzt}
            style={{ alignSelf: 'flex-start', opacity: eingabe.trim() ? 1 : 0.35 }}
          >
            <Type variant="label" tone="accentA">Beitreten</Type>
          </PressableScale>
        </GlassPanel>
      </Reveal>

      {id && (
        <Reveal delay={120}>
          <PressableScale
            accessibilityLabel="Nicht mehr teilen"
            onPress={() => {
              hapticSelect();
              void verlassen();
            }}
            style={{ alignSelf: 'flex-start', paddingVertical: Spacing.xs }}
          >
            <Type variant="label" tone="accentB">Nicht mehr teilen</Type>
          </PressableScale>
          <Type variant="caption" tone="text3" style={{ marginTop: 2 }}>
            Die Liste bleibt auf diesem Gerät, sie gleicht sich nur nicht mehr ab. Mit dem
            Code kommt man jederzeit zurück.
          </Type>
        </Reveal>
      )}
    </Screen>
  );
}
