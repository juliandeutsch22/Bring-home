// gespeichert.ts — dieselbe Ablage, nur überlebt sie das Schließen der App.
//
// Bewusst EIN JSON-Blatt je Sorte statt einer Datenbank: eine Einkaufsliste hat
// Dutzende Einträge, keine Zehntausende. Der ganze Bestand passt in einen
// Schreibvorgang, und dafür eine Datenbank aufzusetzen wäre Aufwand ohne
// Gegenwert. Sollte das je knapp werden, ist der Wechsel eine Sache dieser
// Datei — die Bildschirme sprechen nur mit dem Interface.
//
// AsyncStorage, weil es beides bedient: im Browser den `localStorage`, auf dem
// Gerät den nativen Speicher. Eine Schnittstelle, zwei Welten.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { InMemoryAblage, type Datensatz } from './repositories';

/** Wie lange ein Grabstein liegen bleibt, bevor er selbst verschwindet. */
export const GRABSTEIN_TAGE = 30;

/**
 * Räumt Grabsteine ab, die alt genug sind.
 *
 * Warum überhaupt: ein Grabstein muss lange genug leben, dass ihn jedes Gerät
 * einmal gesehen hat — sonst kommt das Gelöschte zurück. Ewig darf er aber
 * nicht liegen, sonst wächst der Bestand mit jedem gestrichenen „Milch" weiter,
 * für immer. Dreißig Tage sind großzügig für zwei Geräte, die dieselbe Wohnung
 * teilen.
 */
export function ohneAlteGrabsteine<T extends Datensatz>(saetze: T[], jetzt: Date = new Date()): T[] {
  const grenze = jetzt.getTime() - GRABSTEIN_TAGE * 86400000;
  return saetze.filter((s) => {
    if (s.deletedAt === null) return true;
    const zeit = Date.parse(s.deletedAt);
    // Ein unlesbarer Zeitstempel wird BEHALTEN, nicht weggeworfen — im Zweifel
    // lieber eine Zeile zu viel als ein Löschen, das wieder auftaucht.
    return Number.isNaN(zeit) || zeit > grenze;
  });
}

export class GespeicherteAblage<T extends Datensatz, Neu> extends InMemoryAblage<T, Neu> {
  private laden: Promise<void> | null = null;

  constructor(
    bauen: (eingabe: Neu, sort: number) => T,
    ordnen: (a: T, b: T) => number,
    private readonly schluessel: string,
  ) {
    super(bauen, ordnen);
  }

  /** Einmal lesen, danach aus dem Speicher bedienen. */
  private bereit(): Promise<void> {
    if (!this.laden) {
      this.laden = (async () => {
        try {
          const roh = await AsyncStorage.getItem(this.schluessel);
          if (roh) this.saetze = ohneAlteGrabsteine(JSON.parse(roh) as T[]);
        } catch {
          // Unlesbarer Bestand: lieber leer starten als gar nicht starten.
          // Überschrieben wird er erst beim nächsten Schreiben, also bleibt
          // eine Kopie im Speicher, solange niemand etwas ändert.
          this.saetze = [];
        }
      })();
    }
    return this.laden;
  }

  private async sichern(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.schluessel, JSON.stringify(this.saetze));
    } catch {
      // Voller Speicher o. Ä. — die App läuft weiter, der Bestand liegt im
      // Arbeitsspeicher. Lauter zu scheitern hieße, mitten im Supermarkt eine
      // Fehlermeldung zu zeigen, gegen die niemand etwas tun kann.
    }
  }

  async alle() {
    await this.bereit();
    return super.alle();
  }

  async alleRoh() {
    await this.bereit();
    return super.alleRoh();
  }

  async anlegen(eingabe: Neu) {
    await this.bereit();
    const satz = await super.anlegen(eingabe);
    await this.sichern();
    return satz;
  }

  async aendern(id: string, patch: Partial<Omit<T, 'id'>>) {
    await this.bereit();
    const satz = await super.aendern(id, patch);
    await this.sichern();
    return satz;
  }

  async loeschen(id: string) {
    await this.bereit();
    await super.loeschen(id);
    await this.sichern();
  }

  async einspielen(saetze: T[]) {
    await this.bereit();
    await super.einspielen(saetze);
    await this.sichern();
  }

  async leeren() {
    await this.bereit();
    await super.leeren();
    await this.sichern();
  }
}
