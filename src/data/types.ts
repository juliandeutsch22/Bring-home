// types.ts — das Datenmodell.
//
// Alles ist von Anfang an SYNCHRONISIERUNGSFÄHIG, obwohl in Etappe 1 noch
// nichts synchronisiert wird. Drei Felder tragen das:
//  · `id`        — auf dem Gerät erzeugt, nicht vom Server vergeben.
//  · `updatedAt` — wer zuletzt schrieb, gewinnt (pro Datensatz, nicht pro Feld;
//                  bei einer Einkaufsliste kommt man sich kaum in die Quere).
//  · `deletedAt` — Löschen ist ein GRABSTEIN, kein Verschwinden. Ohne ihn käme
//                  ein auf Gerät A gelöschter Eintrag beim nächsten Abgleich
//                  von Gerät B fröhlich zurück.
// Das nachträglich einzuziehen wäre teuer; jetzt kostet es nichts.

export type Sync = {
  id: string;
  updatedAt: string; // ISO
  /** Grabstein. Nicht null = gelöscht, aber noch bekannt. */
  deletedAt: string | null; // ISO
};

/** Ein Punkt auf der Einkaufsliste. */
export type Artikel = Sync & {
  listeId: string;
  text: string;
  /** Frei getippt („2", „500 g", „eine Packung") — bewusst kein Zahlenfeld. */
  menge: string | null;
  /** Im Wagen. Bleibt stehen, bis der Wagen geleert wird. */
  erledigtAm: string | null; // ISO
  /** Wer es hinzugefügt hat — null = ich selbst. */
  vonWem: string | null;
  sort: number;
};

/** Ein Essenswunsch. Kein Termin: kein Datum, keine Mahnung. */
export type Wunsch = Sync & {
  gericht: string;
  notiz: string | null;
  vonWem: string | null;
  sort: number;
};

/** Eine Zutat, die zu einem Wunsch gehört. */
export type Zutat = Sync & {
  wunschId: string;
  text: string;
  menge: string | null;
  /**
   * „Haben wir da." Von Hand gesetzt — Salz, Öl, Mehl stehen in jedem zweiten
   * Rezept und sollen nicht jedes Mal auf der Einkaufsliste landen.
   *
   * Das ist die EINZIGE Zutaten-Eigenschaft, die die App nicht ableiten kann:
   * ob etwas schon auf der Liste steht oder im Wagen liegt, weiß sie; was im
   * Vorratsschrank steht, weiß nur ihr.
   */
  habenWir: boolean;
  sort: number;
};

/** Eine Sache, die in der Wohnung liegen bleibt. */
export type Aufgabe = Sync & {
  titel: string;
  erledigtAm: string | null; // ISO
  /** Wer sich darum kümmert — frei getippt, kein Konto. */
  person: string | null;
  /** Liegt bei jemand anderem. Verschwindet damit aus dem Offenen. */
  wartetAuf: string | null;
  sort: number;
};

export type NeuerArtikel = { text: string; menge?: string | null; vonWem?: string | null };
export type NeuerWunsch = { gericht: string; notiz?: string | null; vonWem?: string | null };
export type NeueZutat = { wunschId: string; text: string; menge?: string | null };
export type NeueAufgabe = { titel: string; person?: string | null; wartetAuf?: string | null };

/** Die eine Liste, solange es nur eine gibt (mehrere kommen in Etappe 5). */
export const HAUSHALT = 'haushalt';
