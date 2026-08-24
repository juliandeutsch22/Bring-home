// index.ts — welche Ablage gerade hängt.
//
// Eine Stelle, an der entschieden wird; die Bildschirme fragen nie danach.
// Seit Etappe 2 ist es die SCHREIBENDE Variante; in Tests hängt weiterhin die
// flüchtige daran, damit kein Test den Bestand eines anderen sieht. In
// Etappe 3 kommt der Abgleich dazu — wieder ohne Änderung an einem Bildschirm.
import { GespeicherteAblage } from './gespeichert';
import { InMemoryAblage, type Ablage, type Datensatz } from './repositories';
import type { Aufgabe, Artikel, NeueAufgabe, NeueZutat, NeuerArtikel, NeuerWunsch, Wunsch, Zutat } from './types';
import { HAUSHALT } from './types';
import { jetzt, neueId } from '@/lib/ids';

const rumpf = () => ({ id: neueId(), updatedAt: jetzt(), deletedAt: null });

/** Neueste zuletzt — eine Einkaufsliste liest man von oben nach unten. */
const nachSort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort;

/**
 * In Tests flüchtig, sonst schreibend. Ein Test, der auf den echten Speicher
 * ginge, sähe den Bestand des vorherigen — und das ist die Sorte Fehler, die
 * man erst nach Stunden findet.
 */
const fluechtig = process.env.NODE_ENV === 'test';

function neu<T extends Datensatz, Neu>(
  schluessel: string,
  bauen: (eingabe: Neu, sort: number) => T,
  ordnen: (a: T, b: T) => number,
  neueOben = false,
): Ablage<T, Neu> {
  return fluechtig
    ? new InMemoryAblage<T, Neu>(bauen, ordnen, neueOben)
    : new GespeicherteAblage<T, Neu>(bauen, ordnen, schluessel, neueOben);
}

function baueArtikel(): Ablage<Artikel, NeuerArtikel> {
  return neu<Artikel, NeuerArtikel>(
    'bring-home.artikel',
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
    true,
  );
}

function baueWuensche(): Ablage<Wunsch, NeuerWunsch> {
  return neu<Wunsch, NeuerWunsch>(
    'bring-home.wuensche',
    (e, sort) => ({
      ...rumpf(),
      gericht: e.gericht.trim(),
      notiz: e.notiz?.trim() || null,
      vonWem: e.vonWem ?? null,
      erledigtAm: null,
      sort,
    }),
    nachSort,
    true,
  );
}

function baueZutaten(): Ablage<Zutat, NeueZutat> {
  return neu<Zutat, NeueZutat>(
    'bring-home.zutaten',
    (e, sort) => ({
      ...rumpf(),
      wunschId: e.wunschId,
      text: e.text.trim(),
      menge: e.menge?.trim() || null,
      habenWir: false,
      sort,
    }),
    nachSort,
  );
}

function baueAufgaben(): Ablage<Aufgabe, NeueAufgabe> {
  return neu<Aufgabe, NeueAufgabe>(
    'bring-home.aufgaben',
    (e, sort) => ({
      ...rumpf(),
      titel: e.titel.trim(),
      erledigtAm: null,
      person: e.person?.trim() || null,
      wartetAuf: e.wartetAuf?.trim() || null,
      rhythmusTage: e.rhythmusTage ?? null,
      // Eine frische Aufgabe ist SOFORT fällig, auch eine wiederkehrende: der
      // Rhythmus beginnt beim ersten Abhaken, nicht beim Anlegen.
      faelligAb: null,
      sort,
    }),
    nachSort,
    true,
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
