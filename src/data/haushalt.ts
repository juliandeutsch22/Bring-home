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

import { mitFrist } from '@/lib/frist';

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

export const useHaushalt = create<Laden>((setze) => ({
  id: null,
  code: null,
  stand: 'lokal',
  meldung: null,

  /**
   * Beim Start: welchen Haushalt hat sich dieses Gerät gemerkt?
   *
   * Der Code wird EINMAL eingetippt und liegt danach hier — zusammen mit der
   * anonymen Sitzung im selben Speicher. Beim nächsten Start ist beides wieder
   * da; niemand tippt seinen Code zweimal.
   */
  async laden() {
    const roh = await AsyncStorage.getItem(SCHLUESSEL);
    if (!roh) return;

    let gemerkt: Gemerkt;
    try {
      gemerkt = JSON.parse(roh) as Gemerkt;
    } catch {
      // Unlesbar gespeichert — das ist das Einzige, was den Haushalt wirklich
      // vergessen lässt.
      await merken(null);
      return;
    }
    setze({ id: gemerkt.id, code: gemerkt.code, stand: 'laedt' });

    try {
      await mitFrist(angemeldet());
      setze({ stand: 'verbunden', meldung: null });
    } catch (e) {
      // Der Haushalt bleibt GEMERKT. Kein Netz oder ein fehlender Schalter im
      // Dashboard sind vorübergehend; den Code deshalb wegzuwerfen hieße, ihn
      // beim nächsten Mal wieder abtippen zu lassen.
      setze({ stand: 'lokal', meldung: lesbar(e) });
    }
  },

  async gruenden() {
    setze({ stand: 'laedt', meldung: null });
    try {
      await mitFrist(angemeldet());
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
      await mitFrist(angemeldet());
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

/**
 * Aus einem Fehler einen Satz machen, mit dem jemand etwas anfangen kann.
 *
 * Die Regel dahinter: die Meldung muss sagen, WAS zu tun ist. „Keine Verbindung
 * zum Server" stand hier vorher für jeden Fehlschlag — auch für den, bei dem
 * die Verbindung tadellos war und nur ein Schalter im Dashboard fehlte. Eine
 * Meldung, die in die falsche Richtung zeigt, kostet mehr Zeit als gar keine.
 *
 * Deshalb wird auch der Rohtext durchgereicht, wenn nichts passt: eine fremde
 * englische Fehlermeldung ist unschön, aber sie lässt sich nachschlagen.
 */
/**
 * Den Wortlaut aus einem Fehler holen — egal, welche Gestalt er hat.
 *
 * Der Grund für diese Funktion: ein Supabase-Fehler ist ein EINFACHES OBJEKT,
 * keine `Error`-Instanz. `String(e)` ergibt darauf „[object Object]", und genau
 * das stand eine Version lang auf dem Bildschirm — die Meldung, die alles
 * erklären sollte, erklärte nichts. Ein Fehler, der sich nicht in Worte fassen
 * lässt, ist schlimmer als einer, der englisch ist.
 *
 * Deshalb werden alle Felder eingesammelt, die etwas sagen könnten, und zur Not
 * das ganze Objekt als JSON gezeigt.
 */
function wortlaut(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const o = e as Record<string, unknown>;
    const teile = ['message', 'msg', 'error_description', 'error', 'details', 'hint']
      .map((k) => o[k])
      .filter((w): w is string => typeof w === 'string' && w.length > 0);
    if (teile.length > 0) return [...new Set(teile)].join(' — ');
    try {
      return JSON.stringify(e);
    } catch {
      return 'Unbekannter Fehler.';
    }
  }
  return String(e);
}

export function lesbar(e: unknown): string {
  const roh = wortlaut(e);
  // BEIDE Kennungen, nicht die erste beste: der Auth-Endpunkt schickt `code`
  // (422) UND `error_code` (`anonymous_provider_disabled`) — wer nur `code`
  // liest, hat die Zahl und nicht den Grund.
  const code =
    typeof e === 'object' && e !== null
      ? ['code', 'error_code', 'name']
          .map((k) => (e as Record<string, unknown>)[k])
          .filter((w) => w != null)
          .map(String)
          .join(' ')
      : '';

  if (/anonymous_provider_disabled/i.test(code) || /anonymous sign-ins are disabled/i.test(roh)) {
    return 'Der Server lässt anonyme Anmeldungen nicht zu. In Supabase: Authentication → Sign In / Providers → „Anonymous sign-ins" einschalten und speichern.';
  }
  if (/unbekannter Code/i.test(roh)) return 'Diesen Code gibt es nicht. Vertippt?';
  if (/nicht angemeldet/i.test(roh)) return 'Die Anmeldung am Server hat nicht geklappt.';
  if (/antwortet nicht/i.test(roh)) return 'Der Server antwortet nicht. Die Liste bleibt so lange auf diesem Gerät.';
  if (/does not exist|schema cache|PGRST|42883|42703/i.test(roh + code)) {
    // Der Wortlaut bleibt DRAN. Er nennt genau die Funktion oder Spalte, die
    // fehlt — und ohne ihn hieße die Meldung nur „irgendwas an der Datenbank",
    // was einen ganzen Nachmittag kosten kann.
    return `Die Datenbank ist noch nicht auf dem Stand der App. Die Dateien in „supabase/" im SQL-Editor ausführen. (${roh})`;
  }
  if (/fetch|network|Failed to fetch/i.test(roh)) return 'Kein Netz. Die Liste bleibt so lange auf diesem Gerät.';
  return roh;
}
