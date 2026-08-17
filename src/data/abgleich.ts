// abgleich.ts — der Abgleich mit dem Server.
//
// Der Entwurf in vier Sätzen:
//  1. Jedes Gerät führt seinen vollständigen Bestand LOKAL. Der Server ist eine
//     Kopie zum Austauschen, nicht die Wahrheit — die App funktioniert ohne ihn
//     genauso wie mit ihm.
//  2. Geholt wird nach `server_at` (Server-Uhr, monoton), entschieden wird nach
//     `updated_at` (Geräte-Uhr, wer zuletzt schrieb). Zwei Zeiten, zwei
//     Aufgaben — die Begründung steht in `supabase/migration-02-serverzeit.sql`.
//  3. Gelöscht wird nie wirklich. Ein Grabstein (`deletedAt`) reist mit, sonst
//     käme das auf Gerät A Gestrichene von Gerät B fröhlich zurück.
//  4. Nichts davon darf laut scheitern. Kein Netz heißt: die Liste liegt eben
//     nur hier. Mitten im Supermarkt eine Fehlermeldung zu zeigen, gegen die
//     niemand etwas tun kann, wäre schlimmer als der Zustand selbst.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { holeArtikel, holeAufgaben, holeWuensche, holeZutaten } from './index';
import type { Ablage, Datensatz } from './repositories';
import type { Artikel, Aufgabe, Wunsch, Zutat } from './types';
import { HAUSHALT } from './types';
import { hole } from './zugang';

/** Wasserstand je Tabelle: bis hierher ist alles geholt. */
const standSchluessel = (tabelle: string) => `bring-home.stand.${tabelle}`;

/**
 * Ein Sicherheitssaum auf den Wasserstand. Zwei Schreibvorgänge können
 * denselben `server_at` tragen, und zwischen „gelesen" und „gemerkt" liegt eine
 * Netzwerkfahrt. Lieber ein paar Zeilen doppelt holen — das Zusammenführen ist
 * idempotent — als eine verpassen.
 */
const SAUM_MS = 2000;

type Roh = Record<string, unknown>;

/**
 * Eine Sorte: wie sie auf dem Server heißt und wie ein Satz hin- und
 * zurückübersetzt wird. Der Client schreibt camelCase, Postgres snake_case;
 * diese vier Paare sind die einzige Stelle, an der beide Welten sich berühren.
 */
type Sorte<T extends Datensatz> = {
  tabelle: string;
  ablage: () => Ablage<T, never>;
  hin: (s: T, haushaltId: string) => Roh;
  her: (r: Roh) => T;
};

const rumpfHin = (s: Datensatz, haushaltId: string): Roh => ({
  id: s.id,
  haushalt_id: haushaltId,
  sort: (s as { sort: number }).sort,
  updated_at: s.updatedAt,
  deleted_at: s.deletedAt,
});

const rumpfHer = (r: Roh) => ({
  id: String(r.id),
  sort: Number(r.sort ?? 0),
  updatedAt: iso(r.updated_at),
  deletedAt: r.deleted_at == null ? null : iso(r.deleted_at),
});

/**
 * Postgres liefert `2026-08-17T12:00:00.123456+00:00`, der Client schreibt
 * `2026-08-17T12:00:00.123Z`. Beides ist derselbe Moment, aber als Zeichenkette
 * verglichen wäre es das nicht — und verglichen wird hier ständig.
 */
export function iso(wert: unknown): string {
  const t = Date.parse(String(wert));
  return Number.isNaN(t) ? new Date(0).toISOString() : new Date(t).toISOString();
}

/**
 * Welche fremden Sätze ersetzen einen eigenen?
 *
 * Nur die, die WIRKLICH neuer sind. `einspielen` überschreibt ohne zu fragen —
 * ein blindes Einspielen würde eine gerade getippte Änderung zurücksetzen,
 * während man noch auf den Bildschirm schaut. Gleichstand zählt als „nicht
 * neuer": derselbe Zeitstempel ist derselbe Satz, den man sich zurückgeschickt
 * bekommt, weil der Wasserstand einen Sicherheitssaum hat.
 */
export function zuUebernehmende<T extends Datensatz>(fremde: T[], eigene: T[]): T[] {
  const nachId = new Map(eigene.map((e) => [e.id, e]));
  return fremde.filter((f) => {
    const meins = nachId.get(f.id);
    return !meins || Date.parse(meins.updatedAt) < Date.parse(f.updatedAt);
  });
}

const text = (w: unknown): string | null => (w == null ? null : String(w));

const artikelSorte: Sorte<Artikel> = {
  tabelle: 'artikel',
  ablage: () => holeArtikel() as Ablage<Artikel, never>,
  hin: (s, h) => ({ ...rumpfHin(s, h), text: s.text, menge: s.menge, erledigt_am: s.erledigtAm, von_wem: s.vonWem }),
  her: (r) => ({
    ...rumpfHer(r),
    // `listeId` steht nicht auf dem Server: es gibt bis Etappe 5 genau eine
    // Liste je Haushalt, und ein Feld zu übertragen, das nur einen Wert kennt,
    // wäre eine Spalte voller Wiederholung.
    listeId: HAUSHALT,
    text: String(r.text ?? ''),
    menge: text(r.menge),
    erledigtAm: r.erledigt_am == null ? null : iso(r.erledigt_am),
    vonWem: text(r.von_wem),
  }),
};

const wunschSorte: Sorte<Wunsch> = {
  tabelle: 'wuensche',
  ablage: () => holeWuensche() as Ablage<Wunsch, never>,
  hin: (s, h) => ({ ...rumpfHin(s, h), gericht: s.gericht, notiz: s.notiz, von_wem: s.vonWem }),
  her: (r) => ({
    ...rumpfHer(r),
    gericht: String(r.gericht ?? ''),
    notiz: text(r.notiz),
    vonWem: text(r.von_wem),
  }),
};

const zutatSorte: Sorte<Zutat> = {
  tabelle: 'zutaten',
  ablage: () => holeZutaten() as Ablage<Zutat, never>,
  hin: (s, h) => ({ ...rumpfHin(s, h), wunsch_id: s.wunschId, text: s.text, menge: s.menge, haben_wir: s.habenWir }),
  her: (r) => ({
    ...rumpfHer(r),
    wunschId: String(r.wunsch_id ?? ''),
    text: String(r.text ?? ''),
    menge: text(r.menge),
    habenWir: r.haben_wir === true,
  }),
};

const aufgabeSorte: Sorte<Aufgabe> = {
  tabelle: 'aufgaben',
  ablage: () => holeAufgaben() as Ablage<Aufgabe, never>,
  hin: (s, h) => ({ ...rumpfHin(s, h), titel: s.titel, erledigt_am: s.erledigtAm, person: s.person, wartet_auf: s.wartetAuf }),
  her: (r) => ({
    ...rumpfHer(r),
    titel: String(r.titel ?? ''),
    erledigtAm: r.erledigt_am == null ? null : iso(r.erledigt_am),
    person: text(r.person),
    wartetAuf: text(r.wartet_auf),
  }),
};

/**
 * Ein Durchgang für EINE Sorte. Erst holen, dann senden.
 *
 * Die Reihenfolge ist nicht beliebig: holt man zuerst, kennt der eigene Bestand
 * beim Senden schon die fremden Änderungen, und wer wirklich zuletzt geschrieben
 * hat, gewinnt. Umgekehrt schriebe man erst den eigenen (womöglich älteren)
 * Stand über den fremden und holte ihn danach wieder zurück — zwei Runden für
 * dasselbe Ergebnis, und dazwischen sieht das andere Gerät kurz den falschen.
 */
async function gleicheSorte<T extends Datensatz>(sorte: Sorte<T>, haushaltId: string): Promise<boolean> {
  const k = hole();
  const gemerkt = (await AsyncStorage.getItem(standSchluessel(sorte.tabelle))) ?? new Date(0).toISOString();
  const seit = new Date(Math.max(0, Date.parse(gemerkt) - SAUM_MS)).toISOString();

  const { data, error } = await k
    .from(sorte.tabelle)
    .select('*')
    .eq('haushalt_id', haushaltId)
    .gt('server_at', seit)
    .order('server_at', { ascending: true });
  if (error) throw error;

  const fremde = (data ?? []) as Roh[];
  const eigene = await sorte.ablage().alleRoh();
  const zuUebernehmen = zuUebernehmende(fremde.map(sorte.her), eigene);
  if (zuUebernehmen.length > 0) await sorte.ablage().einspielen(zuUebernehmen);

  // Senden: alles, was seit dem letzten Durchgang hier verändert wurde. Der
  // Vergleich läuft über `updated_at`, weil nur das an einem lokalen Satz
  // überhaupt steht — `server_at` gibt es erst, wenn er angekommen ist.
  const stand = await sorte.ablage().alleRoh();
  const zuSenden = stand.filter((e) => Date.parse(e.updatedAt) > Date.parse(seit));
  if (zuSenden.length > 0) {
    const { error: sendeFehler } = await k
      .from(sorte.tabelle)
      .upsert(zuSenden.map((e) => sorte.hin(e, haushaltId)));
    if (sendeFehler) throw sendeFehler;
  }

  // Der neue Wasserstand ist die höchste SERVER-Zeit, die wir gesehen haben.
  // Sahen wir keine, bleibt er stehen: hätten wir ihn auf „jetzt" gesetzt,
  // hätten wir eine Geräteuhr in eine Server-Zeitreihe geschrieben.
  let hoechste = Date.parse(gemerkt);
  for (const r of fremde) hoechste = Math.max(hoechste, Date.parse(String(r.server_at)));
  // Nach dem Senden noch einmal nachfassen, damit die eigenen Zeilen nicht beim
  // nächsten Durchgang erneut als „neu" gelten.
  if (zuSenden.length > 0) {
    const { data: eigenerStand } = await k
      .from(sorte.tabelle)
      .select('server_at')
      .eq('haushalt_id', haushaltId)
      .order('server_at', { ascending: false })
      .limit(1);
    const oben = (eigenerStand ?? [])[0] as { server_at?: unknown } | undefined;
    if (oben?.server_at) hoechste = Math.max(hoechste, Date.parse(String(oben.server_at)));
  }
  if (hoechste > Date.parse(gemerkt)) {
    await AsyncStorage.setItem(standSchluessel(sorte.tabelle), new Date(hoechste).toISOString());
  }

  return zuUebernehmen.length > 0;
}

/**
 * Die vier Sorten nebeneinander. Sie tragen verschiedene Typen, also wird jede
 * in ihren eigenen Aufruf eingepackt — eine gemeinsame Liste von `Sorte<…>`
 * wäre nur mit `any` zu haben, und damit wäre genau die Übersetzung ungeprüft,
 * auf die es hier ankommt.
 */
type Lauf = { tabelle: string; gleiche: (haushaltId: string) => Promise<boolean> };
const einpacken = <T extends Datensatz>(s: Sorte<T>): Lauf => ({
  tabelle: s.tabelle,
  gleiche: (h) => gleicheSorte(s, h),
});

const sorten: readonly Lauf[] = [
  einpacken(artikelSorte),
  einpacken(wunschSorte),
  einpacken(zutatSorte),
  einpacken(aufgabeSorte),
];

/** Beim Verlassen eines Haushalts: der nächste fängt bei null an. */
export async function standVergessen(): Promise<void> {
  await Promise.all(sorten.map((s) => AsyncStorage.removeItem(standSchluessel(s.tabelle))));
}

let laeuft: Promise<boolean> | null = null;

/**
 * Ein vollständiger Durchgang über alle vier Sorten.
 *
 * Gibt zurück, ob sich lokal etwas GEÄNDERT hat — nur dann muss die Oberfläche
 * neu zeichnen. Zwei Durchgänge laufen nie gleichzeitig: der zweite hängt sich
 * an den ersten, statt dieselben Zeilen ein zweites Mal zu schicken.
 */
export async function synchronisiere(haushaltId: string | null): Promise<boolean> {
  if (!haushaltId) return false;
  if (laeuft) return laeuft;
  laeuft = (async () => {
    let geaendert = false;
    for (const s of sorten) {
      try {
        if (await s.gleiche(haushaltId)) geaendert = true;
      } catch {
        // Eine Sorte kann scheitern (Netz weg mitten im Durchgang), ohne die
        // anderen mitzureißen. Beim nächsten Durchgang ist sie wieder dran.
      }
    }
    return geaendert;
  })();
  try {
    return await laeuft;
  } finally {
    laeuft = null;
  }
}

/* ------------------------------------------------------------- Anstoßen */

let melder: (() => void) | null = null;
let geplant: ReturnType<typeof setTimeout> | null = null;

/** Der Bildschirm meldet sich an, damit dieses Modul niemanden kennen muss. */
export function setzeMelder(f: (() => void) | null): void {
  melder = f;
  if (!f && geplant) {
    clearTimeout(geplant);
    geplant = null;
  }
}

/**
 * „Gleich mal abgleichen." Gesammelt, nicht sofort: wer fünf Sachen hintereinander
 * abhakt, löst sonst fünf Durchgänge aus, von denen vier überholt sind, bevor
 * sie ankommen.
 */
export function plane(verzoegerung = 400): void {
  if (geplant) clearTimeout(geplant);
  geplant = setTimeout(() => {
    geplant = null;
    melder?.();
  }, verzoegerung);
}

/**
 * Horcht auf Änderungen der anderen. Realtime meldet nur DASS sich etwas getan
 * hat — was, holt der normale Durchgang. Das ist bewusst so: eine zweite
 * Einspiel-Logik, die nur für Realtime-Nutzlasten gilt, wäre eine zweite
 * Gelegenheit, sich zu irren.
 */
export function horche(haushaltId: string, beiMeldung: () => void): () => void {
  const kanal = hole().channel(`haushalt-${haushaltId}`);
  for (const s of sorten) {
    kanal.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: s.tabelle, filter: `haushalt_id=eq.${haushaltId}` },
      beiMeldung,
    );
  }
  void kanal.subscribe();
  return () => void hole().removeChannel(kanal);
}
