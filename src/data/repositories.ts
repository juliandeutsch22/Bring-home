// repositories.ts — Interface + In-Memory-Variante.
//
// Dasselbe Muster wie in Stoa: die App spricht NUR mit dem Interface. In Tests
// und im Web ohne Speicher hängt eine In-Memory-Variante daran, auf dem Gerät
// eine, die schreibt — und in Etappe 3 kommt der Abgleich mit dem Server dazu,
// ohne dass ein Bildschirm davon erfährt.
//
// Alle Leser geben GRABSTEINE nicht heraus (`deletedAt !== null`). Wer sie
// braucht — der Abgleich — holt sie über `alleRoh()`.
import type { Aufgabe, Artikel, Wunsch, Zutat } from './types';

export type Datensatz = Artikel | Wunsch | Zutat | Aufgabe;

export interface Ablage<T extends Datensatz, Neu> {
  /** Alles Lebendige, sortiert. */
  alle(): Promise<T[]>;
  /** Alles, auch Grabsteine — nur für den Abgleich. */
  alleRoh(): Promise<T[]>;
  anlegen(eingabe: Neu): Promise<T>;
  aendern(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T | null>;
  /** Setzt den Grabstein. Löscht nicht wirklich. */
  loeschen(id: string): Promise<void>;
  /** Übernimmt fertige Datensätze (Abgleich, Wiederherstellung). */
  einspielen(saetze: T[]): Promise<void>;
  leeren(): Promise<void>;
}

/**
 * Gemeinsamer Unterbau. Die vier Ablagen unterscheiden sich nur darin, wie ein
 * neuer Datensatz aus der Eingabe entsteht — der Rest ist identisch, und
 * viermal dasselbe zu schreiben wäre viermal dieselbe Gelegenheit für einen
 * Fehler.
 */
export class InMemoryAblage<T extends Datensatz, Neu> implements Ablage<T, Neu> {
  protected saetze: T[] = [];

  constructor(
    private readonly bauen: (eingabe: Neu, sort: number) => T,
    private readonly ordnen: (a: T, b: T) => number,
    /**
     * Kommt Neues nach OBEN oder nach unten?
     *
     * Oben für alles, was man nebenbei einwirft (Einkauf, Wünsche, Aufgaben):
     * der frische Eintrag erscheint direkt unter dem Eingabefeld, wo das Auge
     * ohnehin ist — er quittiert sich damit selbst. Unten stand er womöglich
     * außerhalb des Bildes, und man musste glauben, dass er angekommen ist.
     *
     * Unten für ZUTATEN: die tippt man in der Reihenfolge des Rezepts, und die
     * soll erhalten bleiben.
     */
    private readonly neueOben = false,
  ) {}

  async alle(): Promise<T[]> {
    return this.saetze.filter((s) => s.deletedAt === null).sort(this.ordnen);
  }

  async alleRoh(): Promise<T[]> {
    return [...this.saetze];
  }

  async anlegen(eingabe: Neu): Promise<T> {
    // Neben den vorhandenen setzen, nicht mitten hinein: der Rest behält seine
    // Reihenfolge, egal wo das Neue landet.
    const sortierungen = this.saetze.map((s) => (s as { sort: number }).sort);
    const sort = this.neueOben
      ? Math.min(0, ...sortierungen) - 1
      : Math.max(0, ...sortierungen) + 1;
    const satz = this.bauen(eingabe, sort);
    this.saetze.push(satz);
    return satz;
  }

  async aendern(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T | null> {
    const i = this.saetze.findIndex((s) => s.id === id);
    if (i < 0) return null;
    // `updatedAt` wird IMMER neu gesetzt — daran hängt später, wer gewinnt.
    const naechster = { ...this.saetze[i], ...patch, updatedAt: new Date().toISOString() } as T;
    this.saetze[i] = naechster;
    return naechster;
  }

  async loeschen(id: string): Promise<void> {
    await this.aendern(id, { deletedAt: new Date().toISOString() } as Partial<Omit<T, 'id'>>);
  }

  async einspielen(saetze: T[]): Promise<void> {
    for (const neu of saetze) {
      const i = this.saetze.findIndex((s) => s.id === neu.id);
      if (i < 0) this.saetze.push(neu);
      else this.saetze[i] = neu;
    }
  }

  async leeren(): Promise<void> {
    this.saetze = [];
  }
}
