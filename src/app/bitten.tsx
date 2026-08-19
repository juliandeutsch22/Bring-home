// bitten.tsx — „Bitte auf dem Heimweg mitnehmen: Milch, Brot."
//
// Das ist keine Benachrichtigung, sondern eine BITTE — und der Unterschied
// prägt den ganzen Bildschirm: man wählt aus, was der andere wirklich holen
// soll, nicht die ganze Liste. Wer unterwegs ist, kann selten alles tragen.
//
// Warum ein eigener Bildschirm und kein Modus in der Einkaufsliste: dort
// bedeutet ein Tipp auf die Zeile „abhaken". Das ist die Handlung, die im
// Supermarkt schnell gehen muss, und sie darf nicht plötzlich etwas anderes
// tun. Ein seltener, bewusster Vorgang bekommt seinen eigenen Ort — wie das
// Teilen auch.
import { ChevronLeft, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { GlassPanel } from '@/components/GlassPanel';
import { Haken } from '@/components/Haken';
import { Listenzeile } from '@/components/Listenzeile';
import { PressableScale } from '@/components/PressableScale';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Seam } from '@/components/Seam';
import { EmptyState } from '@/components/StateView';
import { Type } from '@/components/Type';
import { useHaushalt } from '@/data/haushalt';
import { useArtikel } from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { bitteSenden, bitteText } from '@/lib/mitteilungen';
import { teileListe } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

export default function BittenScreen() {
  const colors = useColors();
  const router = useRouter();
  const haushaltId = useHaushalt((s) => s.id);
  const { data: artikel } = useArtikel();

  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string>>(() => new Set());
  const [laeuft, setLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState<string | null>(null);

  const { offen } = useMemo(() => teileListe(artikel ?? []), [artikel]);

  const umschalten = (id: string) => {
    hapticSelect();
    setErgebnis(null);
    setGewaehlt((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const senden = async () => {
    if (!haushaltId || gewaehlt.size === 0 || laeuft) return;
    hapticSuccess();
    setLaeuft(true);
    setErgebnis(null);
    try {
      const namen = offen.filter((a) => gewaehlt.has(a.id)).map((a) => a.text);
      const anzahl = await bitteSenden(haushaltId, bitteText(namen));
      // 0 ist eine ANTWORT, kein Fehler: dann hat niemand sonst Mitteilungen
      // eingeschaltet. Ein stilles „gesendet" wäre an dieser Stelle gelogen.
      setErgebnis(
        anzahl === 0
          ? 'Niemand hat Mitteilungen eingeschaltet. Die andere Person muss sie in der App einmal erlauben — unter „Teilen".'
          : anzahl === 1
            ? 'Verschickt.'
            : `An ${anzahl} Geräte verschickt.`,
      );
      if (anzahl > 0) setGewaehlt(new Set());
    } catch (e) {
      const grund = e instanceof Error ? e.message : String(e);
      setErgebnis(
        /Function not found|404/.test(grund)
          ? 'Der Versand ist auf dem Server noch nicht eingerichtet (Edge Function „bitten").'
          : /antwortet nicht/.test(grund)
            ? // Die Frist ist abgelaufen. Das ist etwas anderes als „abgelehnt":
              // niemand weiß, ob die Bitte losging. Genau das steht hier.
              'Das hat nicht geklappt — der Server antwortet nicht. Ob die Bitte losging, ist unklar.'
            : 'Das hat nicht geklappt. Kein Netz?',
      );
    } finally {
      setLaeuft(false);
    }
  };

  const zurueck = (
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
  );

  return (
    <Screen withTabBar={false}>
      <Reveal>
        {zurueck}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
          <Send size={24} color={colors.accentA} strokeWidth={2.2} />
          <Type variant="title" style={{ flex: 1 }}>Bitte mitnehmen</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {gewaehlt.size === 0
            ? 'Wähle aus, was wirklich mit soll.'
            : gewaehlt.size === 1
              ? '1 Sache ausgewählt'
              : `${gewaehlt.size} Sachen ausgewählt`}
        </Type>
      </Reveal>

      {ergebnis && (
        <Reveal delay={30}>
          <GlassPanel>
            <Type variant="body" tone="text2">{ergebnis}</Type>
          </GlassPanel>
        </Reveal>
      )}

      <Reveal delay={40}>
        {offen.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<Send size={20} color={colors.accentA} strokeWidth={2} />}
              title="Nichts offen"
              body="Auf der Einkaufsliste steht gerade nichts, worum man jemanden bitten könnte."
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {offen.map((a, i) => (
              <Listenzeile key={a.id}>
                {i > 0 && <Seam marginVertical={2} />}
                <PressableScale
                  accessibilityLabel={gewaehlt.has(a.id) ? `${a.text} doch nicht` : `${a.text} auswählen`}
                  onPress={() => umschalten(a.id)}
                  pressedScale={0.99}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                >
                  {/* Derselbe Haken wie überall: getönt heißt „an". Hier heißt
                      „an" nicht erledigt, sondern ausgewählt — und weil die
                      Zeile dabei nirgendwohin geht, kann man das nicht
                      verwechseln. */}
                  <Haken an={gewaehlt.has(a.id)} />
                  <View style={{ flex: 1 }}>
                    <Type variant="body" numberOfLines={1}>{a.text}</Type>
                    {a.menge && <Type variant="caption" tone="text3" numberOfLines={1}>{a.menge}</Type>}
                  </View>
                </PressableScale>
              </Listenzeile>
            ))}
          </GlassPanel>
        )}
      </Reveal>

      {offen.length > 0 && (
        <Reveal delay={80}>
          {/* Der Knopf steht nur da, wenn er etwas tun kann — sonst wäre er ein
              Knopf ohne Wirkung, und davon hat die App keine. */}
          <PressableScale
            accessibilityLabel="Bitte verschicken"
            onPress={() => void senden()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              opacity: gewaehlt.size === 0 || laeuft ? 0.35 : 1,
              paddingVertical: Spacing.sm,
            }}
          >
            <Send size={18} color={colors.accentA} strokeWidth={2.4} />
            <Type variant="label" tone="accentA">
              {laeuft ? 'Einen Moment …' : 'Erinnerung senden'}
            </Type>
          </PressableScale>
          <Type variant="caption" tone="text3" style={{ textAlign: 'center' }}>
            {gewaehlt.size > 0
              ? bitteText(offen.filter((a) => gewaehlt.has(a.id)).map((a) => a.text))
              : 'Wähle die Dinge aus, die du dringend brauchst.'}
          </Type>
        </Reveal>
      )}
    </Screen>
  );
}
