-- schema.sql — einmal im Supabase-SQL-Editor ausführen.
--
-- Der Entwurf in einem Satz: eine Liste ist eine Kennung plus ein CODE. Wer den
-- Code hat, darf beitreten; wer beigetreten ist, darf lesen und schreiben. Es
-- gibt keine Konten, keine E-Mail-Adressen, keine Einladungs-Mails.
--
-- WICHTIG zur Sicherheit: der anon key steht im ausgelieferten Bundle und ist
-- damit öffentlich — das ist so vorgesehen. Die einzige Verteidigung ist Row
-- Level Security. Jede Tabelle unten hat sie AN, und keine Regel erlaubt etwas
-- ohne Mitgliedschaft.

-- Anonyme Anmeldung muss im Dashboard eingeschaltet sein:
--   Authentication → Sign In / Providers → Anonymous sign-ins → an.
-- Ohne das bekommt niemand ein auth.uid(), und alle Regeln unten sperren.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Haushalte

create table if not exists haushalte (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Zuhause',
  -- Der Beitritts-Code. Kurz genug zum Vorlesen, lang genug zum Nicht-Raten.
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists mitglieder (
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  nutzer_id uuid not null references auth.users (id) on delete cascade,
  name text,
  beigetreten_am timestamptz not null default now(),
  primary key (haushalt_id, nutzer_id)
);

-- ------------------------------------------------------------------- Inhalt
-- Alle vier tragen dieselben Sync-Felder wie im Client:
-- id kommt vom GERÄT, updated_at entscheidet, deleted_at ist ein Grabstein.
--
-- Dazu `server_at`, das NUR der Server setzt (Trigger weiter unten). Zwei
-- Zeiten, zwei Aufgaben: `updated_at` entscheidet Konflikte, `server_at`
-- entscheidet, was der Abgleich holt. Nur die zweite ist monoton — eine
-- nachgehende Geräteuhr könnte sonst Einträge erzeugen, die kein anderes Gerät
-- je zu sehen bekommt.

create table if not exists artikel (
  id uuid primary key,
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  text text not null,
  menge text,
  erledigt_am timestamptz,
  von_wem text,
  sort double precision not null default 0,
  updated_at timestamptz not null,
  server_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists wuensche (
  id uuid primary key,
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  gericht text not null,
  notiz text,
  von_wem text,
  sort double precision not null default 0,
  updated_at timestamptz not null,
  server_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists zutaten (
  id uuid primary key,
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  wunsch_id uuid not null,
  text text not null,
  menge text,
  -- „Haben wir da." Das Einzige an einer Zutat, was die App nicht ableiten
  -- kann; wo sie sonst steht (auf der Liste, im Wagen, fehlt), ergibt sich
  -- jedes Mal frisch aus `artikel`.
  haben_wir boolean not null default false,
  sort double precision not null default 0,
  updated_at timestamptz not null,
  server_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists aufgaben (
  id uuid primary key,
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  titel text not null,
  erledigt_am timestamptz,
  person text,
  wartet_auf text,
  sort double precision not null default 0,
  updated_at timestamptz not null,
  server_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- `server_at` setzt der Server, nie der Aufrufer — sonst wäre es wieder eine
-- Geräteuhr, nur mit anderem Namen.
create or replace function setze_server_at()
returns trigger
language plpgsql
as $$
begin
  new.server_at := now();
  return new;
end $$;

-- Der Abgleich fragt immer „was hat sich seit X geändert" — dafür ein Index.
do $$
declare t text;
begin
  foreach t in array array['artikel', 'wuensche', 'zutaten', 'aufgaben'] loop
    execute format('create index if not exists idx_%I_server on %I (haushalt_id, server_at)', t, t);
    execute format('drop trigger if exists %I_server_at on %I', t, t);
    execute format(
      'create trigger %I_server_at before insert or update on %I for each row execute function setze_server_at()',
      t, t);
  end loop;
end $$;

-- ------------------------------------------------------- Row Level Security

alter table haushalte enable row level security;
alter table mitglieder enable row level security;
alter table artikel enable row level security;
alter table wuensche enable row level security;
alter table zutaten enable row level security;
alter table aufgaben enable row level security;

-- Bin ich Mitglied dieses Haushalts?
--
-- `security definer` ist hier kein Bequemlichkeits-Trick, sondern nötig: die
-- Funktion liest `mitglieder`, und würde sie das mit den Rechten des Aufrufers
-- tun, griffe wieder die Regel auf `mitglieder` — die ihrerseits diese Funktion
-- benutzt. Eine Regel, die sich selbst prüft, endet in einer Endlosschleife.
create or replace function ist_mitglied(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mitglieder m
    where m.haushalt_id = h and m.nutzer_id = auth.uid()
  );
$$;

-- Haushalte: sehen darf man nur den eigenen. Anlegen darf jeder Angemeldete
-- (er wird gleich danach selbst Mitglied); der Code bleibt dabei sein Geheimnis.
drop policy if exists haushalt_lesen on haushalte;
create policy haushalt_lesen on haushalte for select using (ist_mitglied(id));
drop policy if exists haushalt_anlegen on haushalte;
create policy haushalt_anlegen on haushalte for insert with check (auth.uid() is not null);

-- Mitglieder: die eigenen Zeilen und die des eigenen Haushalts.
drop policy if exists mitglied_lesen on mitglieder;
create policy mitglied_lesen on mitglieder for select using (ist_mitglied(haushalt_id));
drop policy if exists mitglied_eintragen on mitglieder;
create policy mitglied_eintragen on mitglieder for insert with check (nutzer_id = auth.uid());

-- Inhalt: alles nur für Mitglieder. Vier Tabellen, dieselbe Regel.
do $$
declare t text;
begin
  foreach t in array array['artikel', 'wuensche', 'zutaten', 'aufgaben'] loop
    execute format('drop policy if exists %I_lesen on %I', t, t);
    execute format('create policy %I_lesen on %I for select using (ist_mitglied(haushalt_id))', t, t);
    execute format('drop policy if exists %I_schreiben on %I', t, t);
    execute format('create policy %I_schreiben on %I for insert with check (ist_mitglied(haushalt_id))', t, t);
    execute format('drop policy if exists %I_aendern on %I', t, t);
    execute format('create policy %I_aendern on %I for update using (ist_mitglied(haushalt_id)) with check (ist_mitglied(haushalt_id))', t, t);
  end loop;
end $$;

-- Kein DELETE. Gelöscht wird über den Grabstein (`deleted_at`) — echtes Löschen
-- ließe den Eintrag beim nächsten Abgleich vom anderen Gerät zurückkommen.

-- -------------------------------------------------------------- Beitreten

-- Der einzige Weg, Mitglied zu werden. Läuft mit erhöhten Rechten, weil er den
-- Haushalt anhand des CODES finden muss — den man ohne Mitgliedschaft nicht
-- lesen dürfte. Genau deshalb gibt die Funktion auch nur die Kennung zurück
-- und nie den Code selbst: sie ist eine Tür, kein Fenster.
create or replace function haushalt_beitreten(beitritts_code text, mein_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare h uuid;
begin
  if auth.uid() is null then
    raise exception 'nicht angemeldet';
  end if;

  select id into h from haushalte where code = beitritts_code;
  if h is null then
    raise exception 'unbekannter Code';
  end if;

  insert into mitglieder (haushalt_id, nutzer_id, name)
  values (h, auth.uid(), mein_name)
  on conflict (haushalt_id, nutzer_id) do update set name = coalesce(excluded.name, mitglieder.name);

  return h;
end $$;

-- Einen neuen Haushalt anlegen und gleich beitreten — in EINEM Schritt, damit
-- kein Haushalt ohne Mitglied entstehen kann (den könnte danach niemand mehr
-- sehen, nicht einmal der, der ihn angelegt hat).
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

  -- Acht Zeichen zum Vorlesen. Bewusst aus `gen_random_uuid()` (Postgres-Kern)
  -- und NICHT aus `gen_random_bytes` (pgcrypto): Supabase legt Erweiterungen im
  -- Schema `extensions` ab, diese Funktion läuft aber mit engem
  -- `search_path = public` — und ein enger Suchpfad ist bei `security definer`
  -- die halbe Sicherheit. Die Abhängigkeit herauszunehmen ist billiger, als den
  -- Pfad zu weiten.
  --
  -- Aus dem Hex-Alphabet fallen 0 und 1 heraus (sie sehen aus wie O und I);
  -- sechzehn Zeichen bleiben, also gut vier Milliarden Möglichkeiten.
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

-- Realtime: die vier Inhalts-Tabellen senden Änderungen an offene Geräte.
alter publication supabase_realtime add table artikel;
alter publication supabase_realtime add table wuensche;
alter publication supabase_realtime add table zutaten;
alter publication supabase_realtime add table aufgaben;
