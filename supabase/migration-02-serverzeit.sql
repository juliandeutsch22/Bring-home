-- migration-02-serverzeit.sql — im SQL-Editor ausführen, nach Migration 01.
-- Ein zweiter Lauf schadet nicht.
--
-- Das Problem, das diese Migration löst: der Abgleich fragt „was hat sich seit
-- meinem letzten Besuch geändert?". Fragte er das über `updated_at`, fragte er
-- über eine Uhr, die er nicht kontrolliert — `updated_at` kommt vom GERÄT, denn
-- daran hängt die Entscheidung, wer bei einem Konflikt gewinnt.
--
-- Geht die Uhr eines Geräts zwei Minuten nach, tragen seine Zeilen einen
-- Zeitstempel aus der Vergangenheit. Das andere Gerät hat seinen Wasserstand
-- längst darüber hinaus geschoben und sieht sie nie wieder. Kein Fehler, keine
-- Meldung — die Einträge kommen einfach nicht an.
--
-- Deshalb zwei Zeiten mit zwei Aufgaben:
--   · `updated_at` — vom Gerät. Entscheidet Konflikte (wer zuletzt schrieb).
--   · `server_at`  — vom Server. Entscheidet, was der Abgleich holt.
-- Nur die zweite ist monoton, und nur auf die zweite kommt es beim Holen an.

create or replace function setze_server_at()
returns trigger
language plpgsql
as $$
begin
  new.server_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['artikel', 'wuensche', 'zutaten', 'aufgaben'] loop
    execute format('alter table %I add column if not exists server_at timestamptz not null default now()', t);
    execute format('create index if not exists idx_%I_server on %I (haushalt_id, server_at)', t, t);
    execute format('drop trigger if exists %I_server_at on %I', t, t);
    execute format(
      'create trigger %I_server_at before insert or update on %I for each row execute function setze_server_at()',
      t, t);
  end loop;
end $$;
