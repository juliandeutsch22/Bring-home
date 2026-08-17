// queries.ts — TanStack-Query-Hooks über die Ablagen.
//
// Eine Quelle je Sorte; alles Weitere (offen/im Wagen, wartend/erledigt) ist
// ein reiner Filter darüber (`lib/listenLogik.ts`) — nie eine zweite Abfrage.
// So kann es gar nicht passieren, dass zwei Abschnitte verschiedener Meinung
// darüber sind, was auf der Liste steht.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

/** Abhaken und wieder herausnehmen — ein Aufruf, zwei Richtungen. */
export function useArtikelUmschalten() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: ({ id, imWagen }: { id: string; imWagen: boolean }) =>
      holeArtikel().aendern(id, { erledigtAm: imWagen ? null : new Date().toISOString() }),
    onSuccess: frisch,
  });
}

export function useArtikelLoeschen() {
  const frisch = useFrischArtikel();
  return useMutation({ mutationFn: (id: string) => holeArtikel().loeschen(id), onSuccess: frisch });
}

/**
 * Wagen leeren: alles Abgehakte auf einmal weg.
 *
 * Die Schleife läuft in der `mutationFn`, nicht in einem Callback — was nach
 * einer Mutation noch passieren muss, gehört dorthin. (In Stoa hing genau so
 * eine Nacharbeit an einem `mutate`-Callback und lief nie, weil sich der
 * Aufrufer vorher schloss.)
 */
export function useWagenLeeren() {
  const frisch = useFrischArtikel();
  return useMutation({
    mutationFn: async () => {
      const alle = await holeArtikel().alle();
      for (const a of alle) if (a.erledigtAm !== null) await holeArtikel().loeschen(a.id);
    },
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

export function useZutatLoeschen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holeZutaten().loeschen(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.zutaten }),
  });
}

/**
 * Zutaten auf die Einkaufsliste. Was schon offen dort steht, wird übersprungen
 * — der Aufrufer entscheidet vorher mit `fehlendeZutaten`, was übrig bleibt.
 */
export function useZutatenUebernehmen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zutaten, gericht }: { zutaten: Zutat[]; gericht: string }) => {
      for (const z of zutaten) {
        await holeArtikel().anlegen({ text: z.text, menge: z.menge, vonWem: gericht });
        await holeZutaten().aendern(z.id, { uebernommenAm: new Date().toISOString() });
      }
      return zutaten.length;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.artikel });
      void qc.invalidateQueries({ queryKey: keys.zutaten });
    },
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

export function useAufgabeUmschalten() {
  const frisch = useFrischAufgaben();
  return useMutation({
    mutationFn: ({ id, erledigt }: { id: string; erledigt: boolean }) =>
      holeAufgaben().aendern(id, { erledigtAm: erledigt ? null : new Date().toISOString() }),
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
