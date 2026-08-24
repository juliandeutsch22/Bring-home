// bitten.tsx — „Bitte auf dem Heimweg mitnehmen: Milch, Brot."
// und „Bitte übernimm, wenn du Zeit hast: Müll rausbringen."
//
// Das ist keine Benachrichtigung, sondern eine BITTE — und der Unterschied
// prägt den ganzen Bildschirm: man wählt aus, worum man wirklich bittet, nicht
// die ganze Liste. Wer unterwegs ist, kann selten alles tragen; wer heimkommt,
// selten alles erledigen.
//
// Warum ein eigener Bildschirm und kein Modus in den Listen: dort bedeutet ein
// Tipp auf die Zeile „abhaken". Das ist die Handlung, die im Supermarkt schnell
// gehen muss, und sie darf nicht plötzlich etwas anderes tun. Ein seltener,
// bewusster Vorgang bekommt seinen eigenen Ort — wie das Teilen auch.
//
// EIN Bildschirm für beide Bereiche, unterschieden über `?was=`. Auswahl,
// Zählen, Verschicken und vor allem die ehrlichen Absagen sind wortgleich; ein
// zweiter Bildschirm hieße, jede künftige Korrektur an zwei Stellen zu machen
// und beim ersten Mal eine davon zu vergessen.
import { ChevronLeft, Send } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useArtikel, useAufgaben } from '@/data/queries';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import { bitteSenden, bitteText, type Bereich } from '@/lib/mitteilungen';
import { teileAufgaben, teileListe } from '@/lib/listenLogik';
import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

/**
 * Was auf dem Bildschirm steht, je Bereich — beisammen und nicht verstreut,
 * damit „Sachen" und „Aufgaben" nicht auseinanderlaufen, sobald jemand einen
 * einzelnen Satz ändert.
 */
const WORTE: Record<
  Bereich,
  {
    titel: string;
    aufforderung: string;
    eines: string;
    viele: string;
    leerTitel: string;
    leerText: string;
    ruhe: string;
  }
> = {
  einkauf: {
    titel: 'Bitte mitnehmen',
    aufforderung: 'Wähle aus, was wirklich mit soll.',
    eines: '1 Sache ausgewählt',
    viele: 'Sachen ausgewählt',
    leerTitel: 'Nichts offen',
    leerText: 'Auf der Einkaufsliste steht gerade nichts, worum man jemanden bitten könnte.',
    ruhe: 'Wähle die Dinge aus, die du dringend brauchst.',
  },
  wohnung: {
    titel: 'Bitte übernehmen',
    aufforderung: 'Wähle aus, worum du bitten möchtest.',
    eines: '1 Aufgabe ausgewählt',
    viele: 'Aufgaben ausgewählt',
    leerTitel: 'Nichts offen',
    leerText: 'In der Wohnung steht gerade nichts Offenes, worum man jemanden bitten könnte.',
    ruhe: 'Wähle aus, was jemand anderes übernehmen könnte.',
  },
};

/** Was eine Zeile hier braucht — mehr sieht dieser Bildschirm nicht. */
type Punkt = { id: string; haupt: string; neben: string | null };

export default function BittenScreen() {
  const colors = useColors();
  const router = useRouter();
  const haushaltId = useHaushalt((s) => s.id);
  const { was } = useLocalSearchParams<{ was?: string }>();
  // Alles, was nicht ausdrücklich die Wohnung ist, ist der Einkauf: `/bitten`
  // ohne Angabe bleibt damit genau der Weg, der er vorher war.
  const bereich: Bereich = was === 'wohnung' ? 'wohnung' : 'einkauf';
  const worte = WORTE[bereich];

  // BEIDE Abfragen laufen immer — Hooks vertragen keine Bedingung, und beide
  // Listen liegen ohnehin schon auf dem Gerät.
  const { data: artikel } = useArtikel();
  const { data: aufgaben } = useAufgaben();

  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string>>(() => new Set());
  const [laeuft, setLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState<string | null>(null);

  const punkte: Punkt[] = useMemo(() => {
    if (bereich === 'wohnung') {
      // NUR das Offene. Wartendes liegt bei jemand Drittem (Hausverwaltung,
      // Handwerker) — jemanden zu bitten, das zu übernehmen, ginge ins Leere.
      return teileAufgaben(aufgaben ?? []).offen.map((a) => ({
        id: a.id,
        haupt: a.titel,
        neben: a.person,
      }));
    }
    return teileListe(artikel ?? []).offen.map((a) => ({
      id: a.id,
      haupt: a.text,
      neben: a.menge,
    }));
  }, [bereich, artikel, aufgaben]);

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

  const gewaehlteNamen = () => punkte.filter((p) => gewaehlt.has(p.id)).map((p) => p.haupt);

  const senden = async () => {
    if (!haushaltId || gewaehlt.size === 0 || laeuft) return;
    hapticSuccess();
    setLaeuft(true);
    setErgebnis(null);
    try {
      const anzahl = await bitteSenden(haushaltId, bitteText(gewaehlteNamen(), bereich));
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
          <Type variant="title" style={{ flex: 1 }}>{worte.titel}</Type>
        </View>
        <Type variant="caption" tone="text3" style={{ marginTop: 2 }} tabular>
          {gewaehlt.size === 0
            ? worte.aufforderung
            : gewaehlt.size === 1
              ? worte.eines
              : `${gewaehlt.size} ${worte.viele}`}
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
        {punkte.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={<Send size={20} color={colors.accentA} strokeWidth={2} />}
              title={worte.leerTitel}
              body={worte.leerText}
            />
          </GlassPanel>
        ) : (
          <GlassPanel>
            {punkte.map((p, i) => (
              <Listenzeile key={p.id}>
                {i > 0 && <Seam marginVertical={2} />}
                <PressableScale
                  accessibilityLabel={gewaehlt.has(p.id) ? `${p.haupt} doch nicht` : `${p.haupt} auswählen`}
                  onPress={() => umschalten(p.id)}
                  pressedScale={0.99}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                >
                  {/* Derselbe Haken wie überall: getönt heißt „an". Hier heißt
                      „an" nicht erledigt, sondern ausgewählt — und weil die
                      Zeile dabei nirgendwohin geht, kann man das nicht
                      verwechseln. */}
                  <Haken an={gewaehlt.has(p.id)} />
                  <View style={{ flex: 1 }}>
                    <Type variant="body" numberOfLines={1}>{p.haupt}</Type>
                    {p.neben && <Type variant="caption" tone="text3" numberOfLines={1}>{p.neben}</Type>}
                  </View>
                </PressableScale>
              </Listenzeile>
            ))}
          </GlassPanel>
        )}
      </Reveal>

      {punkte.length > 0 && (
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
          {/* Der Satz, der ankommt, steht schon VOR dem Senden da — man
              verschickt nichts, was man nicht gelesen hat. */}
          <Type variant="caption" tone="text3" style={{ textAlign: 'center' }}>
            {gewaehlt.size > 0 ? bitteText(gewaehlteNamen(), bereich) : worte.ruhe}
          </Type>
        </Reveal>
      )}
    </Screen>
  );
}
