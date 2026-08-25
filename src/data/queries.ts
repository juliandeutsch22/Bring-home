// queries.ts — TanStack-Query-Hooks über die Ablagen.
//
// Eine Quelle je Sorte; alles Weitere (offen/im Wagen, wartend/erledigt) ist
// ein reiner Filter darüber (`lib/listenLogik.ts`) — nie eine zweite Abfrage.
// So kann es gar nicht passieren, dass zwei Abschnitte verschiedener Meinung
// darüber sind, was auf der Liste steht.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { findeArtikel, naechsterStand } from '@/lib/listenLogik';

import { holeArtikel, holeAufgaben, holeWuensche, holeZutaten } from './index';
import type {
  Artikel,
  Aufgabe,
  NeueAufgabe,
  NeueZutat,
  NeuerArtikel,
  NeuerWunsch,
  Wunsch,
  Zutat,
} from './types';

export const keys = {
  artikel: ['artikel'] as const,
  wuensche: ['wuensche'] as const,
  zutaten: ['zutaten'] as const,
  aufgaben: ['aufgaben'] as const,
};

/* ------------------------------------------------------------------ Einkauf */

export function useArtikel() {
  return useQuery<Artikel[]>({ queryKey: keys.artikel, queryFn: () => holeArtikel().alle() });
}

function useFrischArtikel() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: keys.artikel });
}

export function useArtikelAnlegen() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: (eingabe: NeuerArtikel) => holeArtikel().anlegen(eingabe),
    onSuccess: frisch,
  });
}

/**
 * Abhaken und wieder herausnehmen — ein Aufruf, zwei Richtungen.
 *
 * Beide Richtungen räumen `vorratAb` mit ab, und das ist kein Beiwerk: Der
 * Weg Liste → Wagen → Vorrat ist eine Bahn, und wer zurückgeht, muss ganz
 * zurückgehen. Bliebe `vorratAb` stehen, läge derselbe Artikel für
 * `teileListe` im Vorrat und wäre für `istImWagen` zugleich nicht im Wagen —
 * er verschwände aus allen drei Abschnitten.
 */
export function useArtikelUmschalten() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: ({ id, imWagen }: { id: string; imWagen: boolean }) =>
      holeArtikel().aendern(id, {
        erledigtAm: imWagen ? null : new Date().toISOString(),
        vorratAb: null,
      }),
    onSuccess: frisch,
  });
}

/** Text und Menge nachbessern — „Milch" wird zu „Hafermilch, 2". */
export function useArtikelAendern() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Artikel, 'id'>> }) =>
      holeArtikel().aendern(id, patch),
    onSuccess: frisch,
  });
}

export function useArtikelLoeschen() {
  const frisch = useFrischArtikel();
  return useMutation({ mutationFn: (id: string) => holeArtikel().loeschen(id), onSuccess: frisch });
}

/**
 * Wagen einräumen: alles Gekaufte wandert in den Vorrat.
 *
 * Vorher hieß das „Wagen leeren" und LÖSCHTE. Genau daran hing der Fehler, den
 * der Vorrat behebt: Mit dem Wagen ging jedes Wissen über den Einkauf verloren,
 * und ein Gericht, dessen Zutaten am Samstag gekauft wurden, stand am Sonntag
 * wieder auf „fehlt". Der Wagen wird also nicht mehr geleert, er wird
 * ausgeräumt — dorthin, wo die Sachen auch in der Wohnung landen.
 *
 * Die Schleife läuft in der `mutationFn`, nicht in einem Callback — was nach
 * einer Mutation noch passieren muss, gehört dorthin. (In Stoa hing genau so
 * eine Nacharbeit an einem `mutate`-Callback und lief nie, weil sich der
 * Aufrufer vorher schloss.)
 */
export function useWagenEinraeumen() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: async () => {
      // EIN Zeitpunkt für alle: Was zusammen eingeräumt wurde, soll auch
      // zusammen altern. Ein `new Date()` je Durchlauf ergäbe Zeilen, die sich
      // um Millisekunden unterscheiden und in der Sortierung auseinanderlaufen.
      const jetzt = new Date().toISOString();
      const alle = await holeArtikel().alle();
      for (const a of alle) {
        if (a.erledigtAm !== null && a.vorratAb === null) {
          await holeArtikel().aendern(a.id, { vorratAb: jetzt });
        }
      }
    },
    onSuccess: frisch,
  });
}

/**
 * Aufgebraucht — und damit gleich wieder auf die Liste.
 *
 * Zwei Handlungen in einer, weil sie im Alltag eine sind: Wer merkt, dass die
 * Milch leer ist, will sie nachkaufen. Der Weg „aufbrauchen, dann neu tippen"
 * wäre zweimal dasselbe sagen. Wer etwas NICHT nachkaufen will, nimmt es über
 * den Stift ganz weg.
 */
export function useVorratAufgebraucht() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: (id: string) => holeArtikel().aendern(id, { vorratAb: null, erledigtAm: null }),
    onSuccess: frisch,
  });
}

/* -------------------------------------------------------------------- Essen */

export function useWuensche() {
  return useQuery<Wunsch[]>({ queryKey: keys.wuensche, queryFn: () => holeWuensche().alle() });
}

export function useWunschAnlegen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eingabe: NeuerWunsch) => holeWuensche().anlegen(eingabe),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.wuensche }),
  });
}

/**
 * Gekocht — oder doch wieder hervorgeholt. Ein Aufruf, zwei Richtungen, wie
 * bei Artikeln und Aufgaben auch.
 */
export function useWunschUmschalten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, gekocht }: { id: string; gekocht: boolean }) =>
      holeWuensche().aendern(id, { erledigtAm: gekocht ? null : new Date().toISOString() }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.wuensche }),
  });
}

export function useWunschLoeschen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Die Zutaten gehen mit — sie haben ohne ihr Gericht keinen Ort mehr.
      const zutaten = await holeZutaten().alle();
      for (const z of zutaten) if (z.wunschId === id) await holeZutaten().loeschen(z.id);
      await holeWuensche().loeschen(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.wuensche });
      void qc.invalidateQueries({ queryKey: keys.zutaten });
    },
  });
}

export function useZutaten() {
  return useQuery<Zutat[]>({ queryKey: keys.zutaten, queryFn: () => holeZutaten().alle() });
}

export function useZutatAnlegen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eingabe: NeueZutat) => holeZutaten().anlegen(eingabe),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.zutaten }),
  });
}

/** Text, Menge, „Haben wir" — alles, was am Editier-Stift hängt. */
export function useZutatAendern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Zutat, 'id'>> }) =>
      holeZutaten().aendern(id, patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.zutaten }),
  });
}

export function useZutatLoeschen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holeZutaten().loeschen(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.zutaten }),
  });
}

/**
 * Zutaten auf die Einkaufsliste — eine einzelne oder alle fehlenden auf einmal.
 *
 * Hier wird an der Zutat NICHTS vermerkt. Wo sie steht, leitet
 * `zutatStatus` jedes Mal frisch aus der Einkaufsliste ab; ein gespeichertes
 * „schon übernommen" würde lügen, sobald jemand den Artikel wieder von der
 * Liste nimmt.
 *
 * Ein Artikel, den es schon gibt, wird nicht verdoppelt — dieselbe Regel wie
 * beim Tippen im Einkauf. Liegt er im Wagen, kommt er wieder heraus.
 */
export function useZutatenUebernehmen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zutaten, gericht }: { zutaten: Zutat[]; gericht: string }) => {
      const vorhanden = await holeArtikel().alle();
      for (const z of zutaten) {
        const treffer = findeArtikel(vorhanden, z.text);
        if (treffer) await holeArtikel().aendern(treffer.id, { erledigtAm: null });
        else await holeArtikel().anlegen({ text: z.text, menge: z.menge, vonWem: gericht });
      }
      return zutaten.length;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.artikel }),
  });
}

/* ------------------------------------------------------------------ Wohnung */

export function useAufgaben() {
  return useQuery<Aufgabe[]>({ queryKey: keys.aufgaben, queryFn: () => holeAufgaben().alle() });
}

function useFrischAufgaben() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: keys.aufgaben });
}

export function useAufgabeAnlegen() {
  const frisch = useFrischAufgaben();
  return useMutation({
    mutationFn: (eingabe: NeueAufgabe) => holeAufgaben().anlegen(eingabe),
    onSuccess: frisch,
  });
}

/**
 * Den Haken einer Aufgabe umlegen.
 *
 * Nimmt die GANZE Aufgabe und nicht nur ihre Kennung, weil die Entscheidung an
 * ihrem Zustand hängt: Erledigtes geht wieder auf, Ruhendes wird sofort
 * fällig, Wiederkehrendes ruht bis zum nächsten Mal, alles andere ist
 * erledigt. Welcher Fall zutrifft, entscheidet `naechsterStand` — eine reine
 * Funktion, die man prüfen kann, statt vier Zweigen im Bildschirm.
 */
export function useAufgabeUmschalten() {
  const frisch = useFrischAufgaben();
  return useMutation({
    mutationFn: (a: Aufgabe) => holeAufgaben().aendern(a.id, naechsterStand(a)),
    onSuccess: frisch,
  });
}

export function useAufgabeAendern() {
  const frisch = useFrischAufgaben();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Aufgabe, 'id'>> }) =>
      holeAufgaben().aendern(id, patch),
    onSuccess: frisch,
  });
}

export function useAufgabeLoeschen() {
  const frisch = useFrischAufgaben();
  return useMutation({ mutationFn: (id: string) => holeAufgaben().loeschen(id), onSuccess: frisch });
}
