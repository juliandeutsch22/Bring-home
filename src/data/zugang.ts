// zugang.ts — der Draht zum Server.
//
// ZUM ANON KEY, damit später niemand erschrickt: er steht hier im Klartext und
// gehört auch hierher. Bei Supabase ist er dafür gemacht, im ausgelieferten
// Bundle zu stehen — jede Browser-App, die ohne eigenen Server auskommt, zeigt
// ihn her. Er sagt nur „ich bin diese App", nicht „ich darf etwas". Was jemand
// wirklich darf, entscheidet ausschließlich Row Level Security in
// `supabase/schema.sql`: ohne Mitgliedschaft im Haushalt gibt jede Abfrage
// null Zeilen zurück, egal wer fragt.
//
// Der `service_role`-Schlüssel ist das genaue Gegenteil — er hebelt RLS aus.
// Der gehört nie in dieses Repo, in keinen Test und in keine Nachricht.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = 'https://fiyhnkyzbvmyjmnicqqa.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeWhua3l6YnZteWptbmljcXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTU2MjAsImV4cCI6MjEwMjUzMTYyMH0.X6gDEq1zVlBjBkCGkDTmYDiAO_vFJDLZU94pQWbgiE4';

let klient: SupabaseClient | null = null;

/**
 * Der Klient wird beim ERSTEN Zugriff gebaut, nicht beim Import.
 *
 * Grund: `createClient` startet sofort die Sitzungs-Wiederherstellung und
 * hängt sich an Speicher und Fenster. In Tests (und beim Export der Web-Seite,
 * wo der Bundler das Modul einmal ausführt) will davon niemand etwas wissen.
 */
export function hole(): SupabaseClient {
  if (!klient) {
    klient = createClient(URL, ANON, {
      auth: {
        // AsyncStorage bedient beide Welten: im Browser `localStorage`, auf dem
        // Gerät den nativen Speicher. Ohne das wäre man nach jedem Start ein
        // anderer Anonymer — und damit kein Mitglied mehr.
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Es gibt keinen Anmelde-Umweg über eine fremde Seite, also braucht
        // auch niemand die Adresszeile nach einem Token abzusuchen.
        detectSessionInUrl: false,
      },
    });
  }
  return klient;
}

/**
 * Anonym anmelden — einmal je Gerät. Es gibt keine Konten, keine E-Mail, kein
 * Passwort; die Anmeldung dient nur dazu, dass RLS ein `auth.uid()` hat, an dem
 * die Mitgliedschaft hängen kann.
 *
 * Muss im Dashboard eingeschaltet sein (Authentication → Sign In / Providers →
 * Anonymous sign-ins). Ist sie es nicht, scheitert das hier — und der Aufrufer
 * bleibt einfach im lokalen Betrieb, statt die App anzuhalten.
 */
export async function angemeldet(): Promise<string | null> {
  const k = hole();
  const { data } = await k.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: neu, error } = await k.auth.signInAnonymously();
  if (error) return null;
  return neu.user?.id ?? null;
}
