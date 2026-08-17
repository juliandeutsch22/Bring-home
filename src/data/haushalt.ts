// haushalt.ts — zu wem gehört diese Liste?
//
// Der ganze Teilen-Entwurf in einem Satz: eine Liste ist eine Kennung plus
// einen CODE. Wer den Code hat, darf beitreten. Es gibt keine Konten, keine
// E-Mail-Einladungen, kein „Freund hinzufügen".
//
// Solange kein Haushalt gewählt ist, läuft die App genau wie vorher — alles
// liegt auf dem Gerät. Das ist kein Notbetrieb, sondern der gültige Zustand
// für jemanden, der allein einkauft.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { standVergessen } from './abgleich';
import { angemeldet, hole } from './zugang';

const SCHLUESSEL = 'bring-home.haushalt';

export type Stand = 'lokal' | 'laedt' | 'verbunden' | 'fehler';

type Gemerkt = { id: string; code: string };

type Laden = {
  id: string | null;
  code: string | null;
  stand: Stand;
  /** Was schiefging, in einem Satz und auf Deutsch. */
  meldung: string | null;
  laden: () => Promise<void>;
  gruenden: () => Promise<void>;
  beitreten: (code: string) => Promise<void>;
  verlassen: () => Promise<void>;
};

async function merken(g: Gemerkt | null): Promise<void> {
  if (g) await AsyncStorage.setItem(SCHLUESSEL, JSON.stringify(g));
  else await AsyncStorage.removeItem(SCHLUESSEL);
}

/**
 * Der Code wird vorgelesen und abgetippt. Deshalb wird er großzügig gelesen:
 * Kleinschreibung, Leerzeichen und Bindestriche sind egal.
 */
export function normalisiereCode(roh: string): string {
  return roh.trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Nach so vielen Millisekunden gilt der Server als nicht erreichbar. */
export const FRIST_MS = 8000;

/**
 * Ein Versprechen mit Frist.
 *
 * Ohne das gibt es einen Zustand, aus dem man nicht mehr herauskommt: ein
 * Netzwerk, das nicht ablehnt, sondern SCHWEIGT (Hotelportal, Funkloch mit
 * Balken, blockierender Zwischenserver). `fetch` wartet dann minutenlang, und
 * auf dem Bildschirm steht „Einen Moment …", bis jemand die App wegwischt.
 * Eine abgelaufene Frist ist eine Antwort; keine Antwort ist keine.
 */
export function mitFrist<T>(versprechen: Promise<T>, frist = FRIST_MS): Promise<T> {
  return new Promise<T>((erfuellen, ablehnen) => {
    const uhr = setTimeout(() => ablehnen(new Error('Der Server antwortet nicht.')), frist);
    versprechen.then(
      (w) => { clearTimeout(uhr); erfuellen(w); },
      (e) => { clearTimeout(uhr); ablehnen(e); },
    );
  });
}

export const useHaushalt = create<Laden>((setze) => ({
  id: null,
  code: null,
  stand: 'lokal',
  meldung: null,

  async laden() {
    const roh = await AsyncStorage.getItem(SCHLUESSEL);
    if (!roh) return;
    try {
      const g = JSON.parse(roh) as Gemerkt;
      setze({ id: g.id, code: g.code, stand: 'laedt' });
      // Die Anmeldung ist anonym und liegt im selben Speicher. Fällt sie aus
      // (kein Netz, Anbieter aus), bleibt der Haushalt gemerkt — die App
      // arbeitet lokal weiter und versucht es beim nächsten Start erneut.
      const wer = await mitFrist(angemeldet()).catch(() => null);
      setze({ stand: wer ? 'verbunden' : 'lokal' });
    } catch {
      await merken(null);
    }
  },

  async gruenden() {
    setze({ stand: 'laedt', meldung: null });
    try {
      if (!(await mitFrist(angemeldet()))) throw new Error('Keine Verbindung zum Server.');
      // Bei null anfangen, damit der Bestand, der schon auf diesem Gerät liegt,
      // beim ersten Durchgang vollständig hochgeht.
      await standVergessen();
      // `Promise.resolve`, weil ein Postgrest-Aufruf nur `then` kennt und kein
      // echtes Versprechen ist — die Frist braucht aber eins.
      const { data, error } = await mitFrist(Promise.resolve(hole().rpc('haushalt_gruenden', {})));
      if (error) throw error;
      // Die Funktion gibt eine TABELLE zurück, also kommt eine Liste an.
      const satz = (Array.isArray(data) ? data[0] : data) as { id: string; code: string } | undefined;
      if (!satz) throw new Error('Der Server hat keinen Haushalt zurückgegeben.');
      await merken({ id: satz.id, code: satz.code });
      setze({ id: satz.id, code: satz.code, stand: 'verbunden', meldung: null });
    } catch (e) {
      setze({ stand: 'fehler', meldung: lesbar(e) });
    }
  },

  async beitreten(roherCode: string) {
    const code = normalisiereCode(roherCode);
    if (!code) return;
    setze({ stand: 'laedt', meldung: null });
    try {
      if (!(await mitFrist(angemeldet()))) throw new Error('Keine Verbindung zum Server.');
      // Beitreten VEREINIGT: was auf diesem Gerät liegt, kommt mit, und was
      // dort liegt, kommt herüber. Nichts wird dabei weggeworfen — ein Beitritt,
      // der die eigene Liste löscht, wäre eine böse Überraschung.
      await standVergessen();
      const { data, error } = await mitFrist(
        Promise.resolve(hole().rpc('haushalt_beitreten', { beitritts_code: code })),
      );
      if (error) throw error;
      const id = (Array.isArray(data) ? data[0] : data) as string | undefined;
      if (!id) throw new Error('Diesen Code kennt der Server nicht.');
      await merken({ id, code });
      setze({ id, code, stand: 'verbunden', meldung: null });
    } catch (e) {
      setze({ stand: 'fehler', meldung: lesbar(e) });
    }
  },

  /**
   * Verlassen heißt: diese Liste nicht mehr abgleichen. Der eigene Bestand
   * bleibt liegen — er ist ja auch der eigene. Auf dem Server wird nichts
   * gelöscht; wer den Code noch hat, kann jederzeit zurück.
   */
  async verlassen() {
    // Der Wasserstand gehört zum verlassenen Haushalt. Bliebe er stehen, sähe
    // der nächste Beitritt nur, was sich SEITHER getan hat — und der Bestand,
    // der schon dalag, käme nie an.
    await standVergessen();
    await merken(null);
    setze({ id: null, code: null, stand: 'lokal', meldung: null });
  },
}));

function lesbar(e: unknown): string {
  const roh = e instanceof Error ? e.message : String(e);
  if (/unbekannter Code/i.test(roh)) return 'Diesen Code gibt es nicht. Vertippt?';
  if (/nicht angemeldet/i.test(roh)) return 'Die anonyme Anmeldung ist im Projekt noch nicht eingeschaltet.';
  if (/antwortet nicht/i.test(roh)) return 'Der Server antwortet nicht. Die Liste bleibt so lange auf diesem Gerät.';
  if (/fetch|network|Failed to fetch/i.test(roh)) return 'Kein Netz. Die Liste bleibt so lange auf diesem Gerät.';
  return roh;
}
