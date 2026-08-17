// index.ts — welche Ablage gerade hängt.
//
// Eine Stelle, an der entschieden wird; die Bildschirme fragen nie danach.
// In Etappe 2 kommt hier die schreibende Variante dazu, in Etappe 3 der
// Abgleich — beides ohne Änderung an irgendeinem Bildschirm.
import { InMemoryAblage, type Ablage } from './repositories';
import type { Aufgabe, Artikel, NeueAufgabe, NeueZutat, NeuerArtikel, NeuerWunsch, Wunsch, Zutat } from './types';
import { HAUSHALT } from './types';
import { jetzt, neueId } from '@/lib/ids';

const rumpf = () => ({ id: neueId(), updatedAt: jetzt(), deletedAt: null });

/** Neueste zuletzt — eine Einkaufsliste liest man von oben nach unten. */
const nachSort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort;

function baueArtikel(): Ablage<Artikel, NeuerArtikel> {
  return new InMemoryAblage<Artikel, NeuerArtikel>(
    (e, sort) => ({
      ...rumpf(),
      listeId: HAUSHALT,
      text: e.text.trim(),
      menge: e.menge?.trim() || null,
      erledigtAm: null,
      vonWem: e.vonWem ?? null,
      sort,
    }),
    nachSort,
  );
}

function baueWuensche(): Ablage<Wunsch, NeuerWunsch> {
  return new InMemoryAblage<Wunsch, NeuerWunsch>(
    (e, sort) => ({
      ...rumpf(),
      gericht: e.gericht.trim(),
      notiz: e.notiz?.trim() || null,
      vonWem: e.vonWem ?? null,
      sort,
    }),
    nachSort,
  );
}

function baueZutaten(): Ablage<Zutat, NeueZutat> {
  return new InMemoryAblage<Zutat, NeueZutat>(
    (e, sort) => ({
      ...rumpf(),
      wunschId: e.wunschId,
      text: e.text.trim(),
      menge: e.menge?.trim() || null,
      uebernommenAm: null,
      sort,
    }),
    nachSort,
  );
}

function baueAufgaben(): Ablage<Aufgabe, NeueAufgabe> {
  return new InMemoryAblage<Aufgabe, NeueAufgabe>(
    (e, sort) => ({
      ...rumpf(),
      titel: e.titel.trim(),
      erledigtAm: null,
      person: e.person?.trim() || null,
      wartetAuf: e.wartetAuf?.trim() || null,
      sort,
    }),
    nachSort,
  );
}

let artikel = baueArtikel();
let wuensche = baueWuensche();
let zutaten = baueZutaten();
let aufgaben = baueAufgaben();

export const holeArtikel = () => artikel;
export const holeWuensche = () => wuensche;
export const holeZutaten = () => zutaten;
export const holeAufgaben = () => aufgaben;

/** Für Tests: alles auf Anfang. */
export function __ablagenZuruecksetzenFuerTests(): void {
  artikel = baueArtikel();
  wuensche = baueWuensche();
  zutaten = baueZutaten();
  aufgaben = baueAufgaben();
}
