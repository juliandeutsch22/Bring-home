// listenLogik.ts — die Entscheidungen, die keine Oberfläche brauchen.
//
// Alles hier ist rein: Eingabe rein, Ergebnis raus, kein Zustand. Das ist der
// Teil, der geprüft werden kann, ohne einen Browser zu starten — und es ist der
// Teil, an dem die App wirklich hängt.
import type { Artikel, Aufgabe, Wunsch, Zutat } from '@/data/types';

/**
 * Ein Artikel hat DREI Orte, und sie liegen hintereinander:
 *
 *   Liste  →  Wagen  →  Vorrat  →  weg
 *
 * `erledigtAm` sagt, wann gekauft wurde, `vorratAb`, wann eingeräumt. Weil
 * beide stehen bleiben, muss „im Wagen" das Eingeräumte ausdrücklich
 * ausschließen — sonst stünde ein Artikel an zwei Orten zugleich.
 */
export function istImVorrat(a: Artikel): boolean {
  return a.vorratAb !== null;
}

/** Im Wagen: gekauft, aber noch nicht eingeräumt. */
export function istImWagen(a: Artikel): boolean {
  return a.erledigtAm !== null && a.vorratAb === null;
}

/**
 * Die drei Teile der Einkaufsliste. Wagen und Vorrat liegen unten und tragen
 * das zuletzt Dazugekommene obenauf — beim Einkaufen sieht man so, was gerade
 * hineinging, und kann einen Fehlgriff sofort zurücknehmen.
 */
export function teileListe(artikel: Artikel[]): {
  offen: Artikel[];
  imWagen: Artikel[];
  imVorrat: Artikel[];
} {
  const offen = artikel.filter((a) => a.erledigtAm === null && a.vorratAb === null);
  const imWagen = artikel
    .filter(istImWagen)
    .sort((a, b) => (a.erledigtAm! < b.erledigtAm! ? 1 : -1));
  const imVorrat = artikel
    .filter(istImVorrat)
    .sort((a, b) => (a.vorratAb! < b.vorratAb! ? 1 : -1));
  return { offen, imWagen, imVorrat };
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
 * ALLE Artikel dieses Namens — es kann mehr als einen geben.
 *
 * Seit es den Vorrat gibt, ist das der Normalfall und kein Sonderfall: Im
 * Schrank steht eine Packung Milch, und auf der Liste steht Milch, weil eine
 * nicht reicht. Wer nur den ersten Treffer nimmt, bekommt je nach
 * Sortierreihenfolge mal den einen, mal den anderen — und die Zutat wechselt
 * ihre Auskunft, ohne dass jemand etwas getan hätte.
 */
export function findeAlleArtikel(artikel: Artikel[], text: string): Artikel[] {
  const n = normalisiere(text);
  return artikel.filter((a) => normalisiere(a.text) === n);
}

/**
 * Wo steht eine Zutat gerade?
 *
 *  · `habenWir`     — von Hand gesetzt, gilt dauerhaft. Salz und Öl.
 *  · `imWagen`      — gerade eingekauft, noch nicht eingeräumt.
 *  · `imVorrat`     — eingeräumt und seitdem im Schrank.
 *  · `aufDerListe`  — steht offen auf der Einkaufsliste, also geplant.
 *  · `fehlt`        — muss noch besorgt werden.
 *
 * Bewusst ABGELEITET statt gespeichert (bis auf `habenWir`): ein Feld
 * „schon übernommen" würde lügen, sobald jemand den Artikel von der
 * Einkaufsliste wieder entfernt.
 *
 * Die Reihenfolge ist eine Rangfolge, und sie ist keine Willkür: DA SEIN
 * schlägt GEPLANT. Steht Milch im Vorrat und zusätzlich auf der Liste, dann
 * hat man Milch — die Zeile auf der Liste sagt nur, dass noch mehr kommt.
 * Andersherum hieße es, ein Gericht sei nicht kochbar, weil jemand Nachschub
 * eingetragen hat.
 */
export type ZutatStatus = 'habenWir' | 'imWagen' | 'imVorrat' | 'aufDerListe' | 'fehlt';

export function zutatStatus(z: Zutat, artikel: Artikel[]): ZutatStatus {
  if (z.habenWir) return 'habenWir';
  const treffer = findeAlleArtikel(artikel, z.text);
  if (treffer.length === 0) return 'fehlt';
  if (treffer.some(istImWagen)) return 'imWagen';
  if (treffer.some(istImVorrat)) return 'imVorrat';
  return 'aufDerListe';
}

/**
 * Welche Zutaten eines Gerichts müssen noch besorgt werden?
 *
 * Alles außer `fehlt` bleibt draußen: was auf der Liste steht, kommt nicht
 * doppelt darauf; was im Wagen liegt, ist gekauft; was ihr immer dahabt, war
 * nie ein Fall für die Liste.
 *
 * Dass Gekauftes hier NICHT mitzählt, ist eine bewusste Änderung gegenüber der
 * ersten Fassung. Damals war der Sammel-Knopf der einzige Weg, und ein Gericht,
 * dessen Zutaten schon im Wagen lagen, wäre unerreichbar gewesen. Jetzt trägt
 * jede Zutat ihren Status selbst und kann einzeln zurück auf die Liste —
 * der Sammel-Knopf muss also nur noch das Fehlende einsammeln, sonst würde er
 * nach jedem Einkauf wieder Arbeit anbieten, die keine ist.
 */
export function fehlendeZutaten(zutaten: Zutat[], artikel: Artikel[]): Zutat[] {
  return zutaten.filter((z) => zutatStatus(z, artikel) === 'fehlt');
}

/**
 * Kann man das Gericht HEUTE kochen?
 *
 * Der Unterschied, an dem es hängt: „steht auf der Einkaufsliste" heißt
 * geplant, nicht vorhanden. Wer vor dem Herd steht, hat von einem Eintrag auf
 * einer Liste nichts. Wirklich da ist, was im Wagen liegt (gerade gekauft),
 * was im Vorrat steht (eingeräumt) oder was ihr immer dahabt.
 *
 * Der Vorrat ist der Grund, warum es diese Funktion überhaupt noch gibt. Bevor
 * es ihn gab, warf das Leeren des Wagens jedes Wissen über einen Einkauf weg —
 * ein Gericht, dessen Zutaten am Samstag gekauft wurden, stand am Sonntag
 * wieder auf „fehlt". Nicht weil etwas fehlte, sondern weil niemand mehr
 * wusste, dass es da war.
 *
 * Ein Gericht ohne Zutaten ist NICHT kochbar, sondern ungeplant — sonst wäre
 * jeder frisch eingetragene Wunsch sofort mit einem Haken versehen, und das
 * Zeichen hieße nur noch „hat keine Zutaten".
 */
export function istKochbar(zutaten: Zutat[], artikel: Artikel[]): boolean {
  if (zutaten.length === 0) return false;
  return zutaten.every((z) => {
    const s = zutatStatus(z, artikel);
    return s === 'habenWir' || s === 'imWagen' || s === 'imVorrat';
  });
}

/** Ist der Wunsch schon gekocht? */
export function istGekocht(w: Wunsch): boolean {
  return w.erledigtAm !== null;
}

/**
 * Die zwei Hälften der Wunschliste. Gekochtes zuletzt Abgehaktes zuerst — wer
 * etwas versehentlich abhakt, findet es oben.
 */
export function teileWuensche(wuensche: Wunsch[]): { offen: Wunsch[]; gekocht: Wunsch[] } {
  return {
    offen: wuensche.filter((w) => !istGekocht(w)),
    gekocht: wuensche
      .filter(istGekocht)
      .sort((a, b) => (a.erledigtAm! < b.erledigtAm! ? 1 : -1)),
  };
}

/** Wartet die Aufgabe auf jemand anderen? */
export function wartet(a: Aufgabe): boolean {
  return a.erledigtAm === null && a.wartetAuf !== null && a.wartetAuf.length > 0;
}

// ----------------------------------------------------------- Wiederholungen
//
// Ein Haushalt braucht keinen Wiederholungs-Kalender, sondern einen Satz:
// „Nach dem Abhaken kommt sie in N Tagen wieder."

/** Die angebotenen Rhythmen. Der Wert ist die Zahl der Tage. */
export const RHYTHMEN: readonly { label: string; tage: number | null }[] = [
  { label: 'nie', tage: null },
  { label: 'täglich', tage: 1 },
  { label: 'wöchentlich', tage: 7 },
  { label: '14-tägig', tage: 14 },
  // Dreißig Tage sind nicht „ein Monat", und das ist Absicht: Ein echter
  // Kalendermonat wäre die einzige Regel, die sich nicht in Tagen ab dem
  // Abhaken ausdrücken lässt — und für Fensterputzen ist der Unterschied
  // zwischen 30 und 31 Tagen ohne Belang.
  { label: 'monatlich', tage: 30 },
];

/** Wiederkehrt sie überhaupt? Locker verglichen, weil ältere Datensätze das Feld gar nicht tragen. */
export function wiederkehrend(a: Aufgabe): boolean {
  return a.rhythmusTage != null && a.rhythmusTage > 0;
}

/**
 * Der Tagesbeginn in `tage` Tagen — der Zeitpunkt, ab dem eine abgehakte
 * wiederkehrende Aufgabe wieder dasteht.
 *
 * Auf Mitternacht gesetzt, damit der Zustand über den ganzen Tag derselbe
 * bleibt. Wäre es die Uhrzeit des Abhakens, spränge die Aufgabe eine Woche
 * später mitten am Abend ins Bild — und wer morgens hinsah, hielte sie für
 * erledigt.
 */
export function naechsteFaelligkeit(tage: number, jetzt: Date = new Date()): string {
  const d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + tage);
  return d.toISOString();
}

/** Ruht sie noch, weil sie erst später wieder dran ist? */
export function ruht(a: Aufgabe, jetzt: Date = new Date()): boolean {
  if (a.erledigtAm !== null || a.faelligAb == null) return false;
  const ab = Date.parse(a.faelligAb);
  // Ein unlesbarer Zeitstempel gilt als FÄLLIG. Im Zweifel lieber eine Zeile
  // zu viel auf der Liste als eine Aufgabe, die für immer unsichtbar ruht.
  return !Number.isNaN(ab) && ab > jetzt.getTime();
}

/** Ist sie offen und liegt bei MIR? */
export function istOffen(a: Aufgabe, jetzt: Date = new Date()): boolean {
  return a.erledigtAm === null && !wartet(a) && !ruht(a, jetzt);
}

/**
 * Was beim Antippen des Hakens passieren soll — die ganze Zustandslogik an
 * einem Ort, damit der Bildschirm nur noch anzeigt.
 *
 * Vier Fälle, in dieser Reihenfolge:
 *  1. Erledigtes wird wieder geöffnet.
 *  2. Ruhendes wird sofort wieder fällig („doch schon wieder dran").
 *  3. Wiederkehrendes wandert NICHT ins Archiv, sondern ruht bis zum nächsten
 *     Mal. Sonst stünden dort nach einem Jahr zweiundfünfzig „Müll rausbringen".
 *  4. Alles andere ist schlicht erledigt.
 */
export function naechsterStand(a: Aufgabe, jetzt: Date = new Date()): Partial<Aufgabe> {
  if (a.erledigtAm !== null) return { erledigtAm: null };
  if (ruht(a, jetzt)) return { faelligAb: null };
  if (wiederkehrend(a)) return { faelligAb: naechsteFaelligkeit(a.rhythmusTage!, jetzt) };
  return { erledigtAm: jetzt.toISOString() };
}

/**
 * Die vier Abschnitte der Wohnungs-Liste. Eine Aufgabe steht in GENAU einem —
 * in Stoa war eine Aufgabe zwischenzeitlich in zweien zugleich sichtbar, weil
 * jeder Abschnitt für sich filterte. Deshalb entscheidet hier eine
 * Reihenfolge und keine vier unabhängigen Filter.
 */
export function teileAufgaben(
  aufgaben: Aufgabe[],
  jetzt: Date = new Date(),
): {
  offen: Aufgabe[];
  wartend: Aufgabe[];
  ruhend: Aufgabe[];
  erledigt: Aufgabe[];
} {
  const offen: Aufgabe[] = [];
  const wartend: Aufgabe[] = [];
  const ruhend: Aufgabe[] = [];
  const erledigt: Aufgabe[] = [];

  for (const a of aufgaben) {
    if (a.erledigtAm !== null) erledigt.push(a);
    else if (wartet(a)) wartend.push(a);
    else if (ruht(a, jetzt)) ruhend.push(a);
    else offen.push(a);
  }

  return {
    offen,
    wartend,
    // Das Nächste zuerst — was am ehesten wieder dran ist, steht oben.
    ruhend: ruhend.sort((x, y) => (x.faelligAb! < y.faelligAb! ? -1 : 1)),
    erledigt: erledigt.sort((x, y) => (x.erledigtAm! < y.erledigtAm! ? 1 : -1)),
  };
}

/**
 * „in 3 Tagen", „morgen", „heute" — wann die ruhende Aufgabe wieder dasteht.
 * Der Abstand in TAGEN, nicht das Datum: „am 27." muss man erst nachrechnen.
 */
export function wiederIn(a: Aufgabe, jetzt: Date = new Date()): string {
  if (a.faelligAb == null) return '';
  const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate()).getTime();
  const ab = Date.parse(a.faelligAb);
  if (Number.isNaN(ab)) return '';
  const tage = Math.round((ab - heute) / 86400000);
  if (tage <= 0) return 'wieder dran';
  if (tage === 1) return 'wieder morgen';
  return `wieder in ${tage} Tagen`;
}

/**
 * „seit heute", „seit gestern", „seit 3 Tagen" — wie lange das schon im Vorrat
 * steht.
 *
 * Der Abstand in TAGEN, aus demselben Grund wie bei `wiederIn`: „seit dem 22."
 * muss man erst nachrechnen. Und bewusst ohne jede Wertung — kein „läuft bald
 * ab", keine Farbe, keine Warnung. Die App weiß nicht, was in eurem Schrank
 * verdirbt; sie sagt nur, wie alt ihre eigene Auskunft ist.
 */
export function imVorratSeit(a: Artikel, jetzt: Date = new Date()): string {
  if (a.vorratAb == null) return '';
  const ab = Date.parse(a.vorratAb);
  if (Number.isNaN(ab)) return '';
  const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate()).getTime();
  const tag = new Date(ab);
  const dann = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate()).getTime();
  const tage = Math.round((heute - dann) / 86400000);
  // Eine Uhr, die vorgeht, oder ein Gerät in einer anderen Zeitzone kann einen
  // Zeitpunkt in der Zukunft liefern. „seit in 2 Tagen" wäre Unsinn — dann
  // lieber die kleinste wahre Aussage.
  if (tage <= 0) return 'seit heute';
  if (tage === 1) return 'seit gestern';
  return `seit ${tage} Tagen`;
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
