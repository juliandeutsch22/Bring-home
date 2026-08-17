// listenLogik.ts — die Entscheidungen, die keine Oberfläche brauchen.
//
// Alles hier ist rein: Eingabe rein, Ergebnis raus, kein Zustand. Das ist der
// Teil, der geprüft werden kann, ohne einen Browser zu starten — und es ist der
// Teil, an dem die App wirklich hängt.
import type { Artikel, Aufgabe, Zutat } from '@/data/types';

/** Im Wagen oder noch zu holen? */
export function istImWagen(a: Artikel): boolean {
  return a.erledigtAm !== null;
}

/**
 * Die zwei Hälften der Einkaufsliste. Im Wagen liegt unten und zuletzt
 * Abgehaktes obenauf — beim Einkaufen sieht man so, was gerade hineinging,
 * und kann einen Fehlgriff sofort zurücknehmen.
 */
export function teileListe(artikel: Artikel[]): { offen: Artikel[]; imWagen: Artikel[] } {
  const offen = artikel.filter((a) => !istImWagen(a));
  const imWagen = artikel
    .filter(istImWagen)
    .sort((a, b) => (a.erledigtAm! < b.erledigtAm! ? 1 : -1));
  return { offen, imWagen };
}

/**
 * Steht das schon auf der Liste? Vergleicht großzügig — „Milch", „milch" und
 * „  Milch " sind dasselbe.
 *
 * Wird an zwei Stellen gebraucht: beim Tippen (nicht zweimal anlegen) und beim
 * Übernehmen von Zutaten (ein Gericht bringt oft mit, was schon da ist).
 */
export function normalisiere(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function findeArtikel(artikel: Artikel[], text: string): Artikel | undefined {
  const n = normalisiere(text);
  return artikel.find((a) => normalisiere(a.text) === n);
}

/**
 * Welche Zutaten eines Gerichts fehlen noch auf der Einkaufsliste?
 *
 * Was schon OFFEN auf der Liste steht, wird nicht doppelt übernommen. Was im
 * Wagen liegt, zählt bewusst NICHT als vorhanden: es ist gekauft, nicht
 * eingeplant — wer morgen dasselbe Gericht kocht, braucht es wieder.
 */
export function fehlendeZutaten(zutaten: Zutat[], artikel: Artikel[]): Zutat[] {
  const offen = artikel.filter((a) => !istImWagen(a));
  return zutaten.filter((z) => !findeArtikel(offen, z.text));
}

/** Wartet die Aufgabe auf jemand anderen? */
export function wartet(a: Aufgabe): boolean {
  return a.erledigtAm === null && a.wartetAuf !== null && a.wartetAuf.length > 0;
}

/** Ist sie offen und liegt bei MIR? */
export function istOffen(a: Aufgabe): boolean {
  return a.erledigtAm === null && !wartet(a);
}

/**
 * Die drei Abschnitte der Wohnungs-Liste. Eine Aufgabe steht in GENAU einem —
 * in Stoa war eine Aufgabe zwischenzeitlich in zweien zugleich sichtbar, weil
 * jeder Abschnitt für sich filterte.
 */
export function teileAufgaben(aufgaben: Aufgabe[]): {
  offen: Aufgabe[];
  wartend: Aufgabe[];
  erledigt: Aufgabe[];
} {
  return {
    offen: aufgaben.filter(istOffen),
    wartend: aufgaben.filter(wartet),
    erledigt: aufgaben
      .filter((a) => a.erledigtAm !== null)
      .sort((a, b) => (a.erledigtAm! < b.erledigtAm! ? 1 : -1)),
  };
}

/** So viele Erledigte werden gezeigt; der Rest wird beziffert. */
export const ERLEDIGT_KURZ = 12;

/**
 * Kürzt eine Liste auf ein überblickbares Maß und sagt, wie viel fehlt.
 * Aus Stoa übernommen: verstecken ohne es zu sagen wäre ein Funktionsverlust.
 */
export function kuerze<T>(saetze: T[], grenze: number = ERLEDIGT_KURZ): [T[], number] {
  if (saetze.length <= grenze) return [saetze, 0];
  return [saetze.slice(0, grenze), saetze.length - grenze];
}
