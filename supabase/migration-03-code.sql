-- migration-03-code.sql — im SQL-Editor ausführen. Ein zweiter Lauf schadet nicht.
--
-- Behebt: `haushalt_gruenden` scheiterte mit
--   42883  function gen_random_bytes(integer) does not exist
--
-- Warum: `gen_random_bytes` gehört zu `pgcrypto`, und Supabase legt Erweiterungen
-- im Schema `extensions` ab — nicht in `public`. Die Funktion läuft aber mit
-- `set search_path = public`, und das ist kein Versehen, sondern Absicht: bei
-- `security definer` ist ein enger, fester Suchpfad die halbe Sicherheit. Sie
-- hat also nach etwas gegriffen, das für sie nicht sichtbar war.
--
-- Die Behebung nimmt die Abhängigkeit ganz heraus, statt den Suchpfad zu
-- weiten: `gen_random_uuid()` steckt seit Postgres 13 im Kern und braucht keine
-- Erweiterung. Damit kann diese Funktion nicht mehr daran scheitern, WO eine
-- Erweiterung installiert wurde.
--
-- Der Code bleibt, was er war: acht Zeichen zum Vorlesen. Aus dem Hex-Alphabet
-- werden 0 und 1 wegübersetzt (sie sehen aus wie O und I), es bleiben sechzehn
-- Zeichen — gut vier Milliarden Möglichkeiten für eine Handvoll Haushalte.

create or replace function haushalt_gruenden(haushalt_name text default 'Zuhause', mein_name text default null)
returns table (id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare neuer_code text;
declare neue_id uuid;
declare versuch int := 0;
begin
  if auth.uid() is null then
    raise exception 'nicht angemeldet';
  end if;

  -- Die Schleife ist keine Schwarzmalerei, sondern der Umgang mit einer
  -- `unique`-Spalte: eine Kollision ist bei vier Milliarden Möglichkeiten kaum
  -- zu erwarten, aber wenn sie käme, wäre die Meldung „duplicate key" das
  -- Letzte, womit jemand etwas anfangen könnte.
  loop
    versuch := versuch + 1;
    neuer_code := substr(upper(translate(replace(gen_random_uuid()::text, '-', ''), '01', 'xy')), 1, 8);
    exit when not exists (select 1 from haushalte h where h.code = neuer_code);
    if versuch >= 5 then
      raise exception 'Es ließ sich kein freier Code finden.';
    end if;
  end loop;

  insert into haushalte (name, code) values (haushalt_name, neuer_code)
  returning haushalte.id into neue_id;

  insert into mitglieder (haushalt_id, nutzer_id, name) values (neue_id, auth.uid(), mein_name);

  return query select neue_id, neuer_code;
end $$;
