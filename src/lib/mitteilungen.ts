// mitteilungen.ts — „Bitte auf dem Heimweg mitnehmen."
//
// Der Weg in drei Schritten, und jeder kann scheitern:
//  1. Der Nutzer erlaubt Mitteilungen (Systemdialog, genau EINMAL fragbar).
//  2. Das Gerät meldet sich beim Push-Dienst an und legt sein Abo in Supabase.
//  3. Der andere tippt „Bitte mitnehmen" → Edge Function → Push → Service
//     Worker → Mitteilung.
//
// DIE HARTE BEDINGUNG, die alles entscheidet: auf iOS gibt es Web-Push NUR,
// wenn die App auf dem HOME-BILDSCHIRM liegt. In einem Safari-Tab ist
// `Notification` zwar teils vorhanden, aber die Anmeldung scheitert. Deshalb
// prüft `mitteilungsLage()` das ausdrücklich und sagt es im Klartext — eine App,
// die „eingeschaltet" behauptet und nichts zustellt, wäre schlimmer als eine,
// die zugibt, dass sie hier nicht kann.
//
// Der ÖFFENTLICHE VAPID-Schlüssel steht offen im Bundle, und das ist richtig so
// — er ist nur die Absenderkennung. Der private liegt ausschließlich in den
// Supabase-Secrets (siehe `supabase/functions/bitten/index.ts`).
import { hole } from '@/data/zugang';
import { mitFrist } from '@/lib/frist';

/**
 * Der öffentliche VAPID-Schlüssel. Solange er leer ist, gibt es keine
 * Mitteilungen — und die App sagt das, statt einen Knopf anzubieten, der
 * nichts tut.
 *
 * Erzeugen: `npx web-push generate-vapid-keys`. Der öffentliche kommt hierher,
 * der private in die Supabase-Secrets. NIE andersherum.
 */
/**
 * Die fette Zeile der Mitteilung auf dem Sperrbildschirm. Sie sagt, WER da
 * klopft — der Inhalt („Bitte auf dem Heimweg mitnehmen: …") steht darunter.
 */
export const APP_NAME = 'Bringe Home';

export const VAPID_OEFFENTLICH =
  'BENJXj52S3kIHX5qJJ3vRvBC1xjhM7zbZhejcK27dIdxByOVXE9-fI-Y8S9TkLvm2aZ71Td-SiwpvY7ZxflDFWQ';

export type Lage =
  | 'bereit' // erlaubt und angemeldet
  | 'fragen' // technisch möglich, aber noch nicht erlaubt
  | 'verweigert' // der Nutzer hat abgelehnt — nur noch in den Einstellungen umkehrbar
  | 'nurAufDemHomescreen' // iOS im Browser: geht grundsätzlich nicht
  | 'nichtEingerichtet' // kein VAPID-Schlüssel hinterlegt
  | 'unmoeglich'; // Browser kann kein Push

/** Läuft die App als installierte App und nicht in einem Browser-Tab? */
export function alsAppInstalliert(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return standalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** Sieht nach Apple aus? Nur dort gilt die Home-Bildschirm-Regel. */
function istApple(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && (navigator as { maxTouchPoints?: number }).maxTouchPoints! > 1);
}

export function mitteilungsLage(): Lage {
  if (typeof window === 'undefined') return 'unmoeglich';
  if (!VAPID_OEFFENTLICH) return 'nichtEingerichtet';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return istApple() && !alsAppInstalliert() ? 'nurAufDemHomescreen' : 'unmoeglich';
  }
  // Die Reihenfolge ist wichtig: auf iOS im Browser kann `Notification`
  // existieren und die Anmeldung trotzdem scheitern. Lieber vorher ehrlich sein
  // als hinterher.
  if (istApple() && !alsAppInstalliert()) return 'nurAufDemHomescreen';
  if (Notification.permission === 'granted') return 'bereit';
  if (Notification.permission === 'denied') return 'verweigert';
  return 'fragen';
}

/**
 * Base64url → Bytes. Der Push-Dienst will den Schlüssel als Puffer, nicht als
 * Text — und `base64url` ist nicht `base64`: zwei Zeichen sind vertauscht und
 * die Auffüllung fehlt.
 */
function schluesselBytes(base64: string): ArrayBuffer {
  const auffuellen = '='.repeat((4 - (base64.length % 4)) % 4);
  const roh = atob((base64 + auffuellen).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i += 1) bytes[i] = roh.charCodeAt(i);
  return bytes.buffer;
}

function alsBase64(puffer: ArrayBuffer | null): string {
  if (!puffer) return '';
  return btoa(String.fromCharCode(...new Uint8Array(puffer)));
}

/**
 * Erlaubnis holen und das Abo hinterlegen. Gibt zurück, ob es geklappt hat.
 *
 * MUSS aus einem Tipp heraus laufen — ein Erlaubnisdialog ohne erkennbaren
 * Anlass wird reflexhaft weggetippt, und danach ist die Tür für immer zu.
 */
export async function mitteilungenEinschalten(haushaltId: string): Promise<Lage> {
  const lage = mitteilungsLage();
  if (lage !== 'fragen' && lage !== 'bereit') return lage;

  if (Notification.permission !== 'granted') {
    const antwort = await Notification.requestPermission();
    if (antwort !== 'granted') return antwort === 'denied' ? 'verweigert' : 'fragen';
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    // Ein bestehendes Abo wiederverwenden: eine zweite Anmeldung erzeugt einen
    // neuen Endpunkt, und der alte bliebe als Leiche in der Tabelle stehen.
    const abo =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: schluesselBytes(VAPID_OEFFENTLICH),
      }));

    const k = hole();
    const { data } = await mitFrist(k.auth.getSession());
    const nutzerId = data.session?.user?.id;
    if (!nutzerId) return 'unmoeglich';

    // Auch hier mit Frist. Ohne sie bliebe der Schalter bei einem schweigenden
    // Netz für den Rest der Sitzung gesperrt — halb umgelegt und unbedienbar,
    // was schlimmer ist als ein Schalter, der zurückspringt.
    await mitFrist(
      Promise.resolve(
        k.from('push_abos').upsert(
          {
            endpoint: abo.endpoint,
            nutzer_id: nutzerId,
            haushalt_id: haushaltId,
            p256dh: alsBase64(abo.getKey('p256dh')),
            auth: alsBase64(abo.getKey('auth')),
          },
          { onConflict: 'endpoint' },
        ),
      ),
    );
    return 'bereit';
  } catch {
    // Der häufigste Fall hier ist iOS im Browser — dort wirft `subscribe`.
    return istApple() && !alsAppInstalliert() ? 'nurAufDemHomescreen' : 'unmoeglich';
  }
}

export async function mitteilungenAusschalten(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const abo = await reg.pushManager.getSubscription();
    if (!abo) return;
    await mitFrist(Promise.resolve(hole().from('push_abos').delete().eq('endpoint', abo.endpoint)));
    await abo.unsubscribe();
  } catch {
    /* Nichts abzumelden ist kein Fehler. */
  }
}

/**
 * Die Bitte verschicken. Gibt zurück, an wie viele Geräte sie ging — 0 ist eine
 * ANTWORT, kein Fehler: dann hat schlicht niemand sonst Mitteilungen
 * eingeschaltet, und der Absender soll das erfahren, statt ins Leere zu tippen.
 */
export async function bitteSenden(haushaltId: string, text: string): Promise<number> {
  // Mit FRIST. Ohne sie bliebe „Einen Moment …" bei einem schweigenden Netz
  // stehen, bis jemand die App wegwischt — und der Absender wüsste nicht, ob
  // seine Bitte unterwegs ist oder nie losging. Dieselbe Falle wie beim
  // Beitreten, dieselbe Antwort.
  const { data, error } = await mitFrist(
    hole().functions.invoke('bitten', {
      body: { haushaltId, titel: APP_NAME, text },
    }),
  );
  if (error) throw error;
  return (data as { gesendet?: number } | null)?.gesendet ?? 0;
}

/**
 * Der Satz, der ankommt. Die Punkte stehen DRIN, nicht „es gibt Neues" — wer
 * im Supermarkt steht, soll die App nicht erst öffnen müssen.
 *
 * Gekürzt, weil eine Mitteilung auf dem Sperrbildschirm nach zwei Zeilen
 * abgeschnitten wird: lieber drei Namen und eine Zahl als sieben Namen, von
 * denen man vier nicht sieht.
 */
export const BITTE_NAMEN = 4;

/** Woraus die Bitte stammt. Der Wagen bittet anders als die Wohnung. */
export type Bereich = 'einkauf' | 'wohnung';

/**
 * Die Einleitung, je Bereich eine.
 *
 * Beide bleiben BITTEN und werden keine Anweisungen: „Bitte übernimm, wenn du
 * Zeit hast" statt „Mach den Abwasch". Eine Mitteilung, die auf dem
 * Sperrbildschirm einer Person aufpoppt, mit der man zusammenlebt, verträgt
 * keinen Befehlston — und der Zusatz „wenn du Zeit hast" ist der Unterschied
 * zwischen einer Bitte und einer Zuweisung.
 */
export const EINLEITUNG: Record<Bereich, string> = {
  einkauf: 'Bitte auf dem Heimweg mitnehmen',
  wohnung: 'Bitte übernimm, wenn du Zeit hast',
};

export function bitteText(namen: string[], bereich: Bereich = 'einkauf'): string {
  const gezeigt = namen.slice(0, BITTE_NAMEN);
  const rest = namen.length - gezeigt.length;
  const satz = `${EINLEITUNG[bereich]}: ${gezeigt.join(', ')}`;
  return rest > 0 ? `${satz} und ${rest} mehr` : satz;
}
