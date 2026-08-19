// bitten — verschickt die Bitte „auf dem Heimweg mitnehmen" an die anderen
// Geräte des Haushalts.
//
// WARUM ES DAS ÜBERHAUPT GIBT: eine Web-Push-Nachricht muss mit einem PRIVATEN
// VAPID-Schlüssel signiert werden. Der darf niemals in die App — die liegt als
// Bundle offen im Browser. Also braucht es genau eine Stelle, die den Schlüssel
// kennt, und das ist hier.
//
// Veröffentlichen (macht Julian, einmal):
//
//   1. Schlüsselpaar erzeugen:
//        npx web-push generate-vapid-keys
//   2. Im Supabase-Dashboard unter Edge Functions → Secrets setzen:
//        VAPID_PUBLIC_KEY   = der öffentliche
//        VAPID_PRIVATE_KEY  = der private
//        VAPID_SUBJECT      = mailto:deine@adresse.de
//   3. Diese Funktion anlegen (Dashboard → Edge Functions → Deploy) oder
//        supabase functions deploy bitten
//
//   Den ÖFFENTLICHEN Schlüssel braucht auch die App — er gehört in
//   `src/lib/mitteilungen.ts`. Der private bleibt hier und wird nirgends sonst
//   eingetragen.
//
// SICHERHEIT: die Funktion läuft mit `service_role` und umgeht damit RLS. Sie
// muss deshalb SELBST prüfen, dass der Aufrufer Mitglied des Haushalts ist —
// sonst könnte jeder Angemeldete jedem beliebigen Haushalt Mitteilungen
// schicken. Diese Prüfung ist der wichtigste Teil der Datei.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const KOPF = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (anfrage) => {
  if (anfrage.method === 'OPTIONS') return new Response('ok', { headers: KOPF });

  const fehler = (text: string, code = 400) =>
    new Response(JSON.stringify({ fehler: text }), { status: code, headers: KOPF });

  const oeffentlich = Deno.env.get('VAPID_PUBLIC_KEY');
  const privat = Deno.env.get('VAPID_PRIVATE_KEY');
  const absender = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:bring-home@example.org';
  if (!oeffentlich || !privat) return fehler('VAPID-Schlüssel fehlen in den Secrets.', 500);

  const jwt = anfrage.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!jwt) return fehler('Nicht angemeldet.', 401);

  let nutzlast: { haushaltId?: string; titel?: string; text?: string };
  try {
    nutzlast = await anfrage.json();
  } catch {
    return fehler('Unlesbare Anfrage.');
  }
  const { haushaltId, titel, text } = nutzlast;
  if (!haushaltId || !text) return fehler('haushaltId und text sind nötig.');

  const url = Deno.env.get('SUPABASE_URL')!;
  // Zwei Klienten mit Absicht: einer MIT dem Token des Aufrufers, um zu prüfen,
  // wer da fragt — einer mit `service_role`, um die fremden Abos zu lesen, die
  // der Aufrufer selbst nicht sehen darf.
  const alsNutzer = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: wer } = await alsNutzer.auth.getUser();
  const nutzerId = wer?.user?.id;
  if (!nutzerId) return fehler('Nicht angemeldet.', 401);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // DIE Prüfung: gehört der Aufrufer überhaupt zu diesem Haushalt?
  const { data: mitglied } = await admin
    .from('mitglieder')
    .select('nutzer_id')
    .eq('haushalt_id', haushaltId)
    .eq('nutzer_id', nutzerId)
    .maybeSingle();
  if (!mitglied) return fehler('Kein Mitglied dieses Haushalts.', 403);

  // Alle Abos des Haushalts AUSSER den eigenen — sich selbst zu stupsen wäre
  // bestenfalls verwirrend.
  const { data: abos } = await admin
    .from('push_abos')
    .select('endpoint, p256dh, auth')
    .eq('haushalt_id', haushaltId)
    .neq('nutzer_id', nutzerId);

  if (!abos || abos.length === 0) {
    // EHRLICH bleiben: „gesendet: 0" ist eine Auskunft, ein stilles „ok" wäre
    // eine Lüge. Die App sagt dem Absender dann, dass niemand Mitteilungen
    // eingeschaltet hat.
    return new Response(JSON.stringify({ gesendet: 0 }), { headers: KOPF });
  }

  webpush.setVapidDetails(absender, oeffentlich, privat);
  const inhalt = JSON.stringify({ titel: titel ?? 'bring-home', text });

  let gesendet = 0;
  const tot: string[] = [];
  for (const abo of abos) {
    try {
      await webpush.sendNotification(
        { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
        inhalt,
      );
      gesendet += 1;
    } catch (e) {
      // 404/410 heißt: dieses Abo gibt es nicht mehr (App gelöscht, Erlaubnis
      // entzogen). Solche Leichen wachsen sonst ewig mit und kosten bei jeder
      // Bitte einen Zustellversuch.
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) tot.push(abo.endpoint);
    }
  }
  if (tot.length > 0) await admin.from('push_abos').delete().in('endpoint', tot);

  return new Response(JSON.stringify({ gesendet, aufgeraeumt: tot.length }), { headers: KOPF });
});
