-- migration-05-mitteilungen.sql — im SQL-Editor ausführen, nach Migration 04.
-- Ein zweiter Lauf schadet nicht.
--
-- „Bitte auf dem Heimweg mitnehmen: Milch, Brot." Damit das ankommt, muss der
-- Server wissen, WOHIN — jedes Gerät hinterlegt dafür sein Push-Abo.
--
-- Ein Abo je Gerät und Haushalt. Der Schlüssel ist der `endpoint`: derselbe
-- Nutzer kann auf Telefon UND Laptop angemeldet sein, und beide sollen die
-- Bitte bekommen. Über `nutzer_id` zu schlüsseln wäre der naheliegende Fehler —
-- dann verdrängte das zweite Gerät das erste.

create table if not exists push_abos (
  endpoint text primary key,
  nutzer_id uuid not null references auth.users (id) on delete cascade,
  haushalt_id uuid not null references haushalte (id) on delete cascade,
  -- Die beiden Schlüssel des Browsers, mit denen die Nutzlast verschlüsselt
  -- wird. Ohne sie ist ein Abo wertlos.
  p256dh text not null,
  auth text not null,
  erstellt_am timestamptz not null default now()
);

create index if not exists idx_push_abos_haushalt on push_abos (haushalt_id);

alter table push_abos enable row level security;

-- Jeder verwaltet NUR sein eigenes Abo. Die fremden Endpunkte liest niemand aus
-- der App — das tut die Edge Function mit erhöhten Rechten. Ein Endpunkt ist
-- eine Adresse, an die man Mitteilungen schicken kann; die gehört nicht in ein
-- Bundle, das im Browser offenliegt.
drop policy if exists push_abo_lesen on push_abos;
create policy push_abo_lesen on push_abos for select using (nutzer_id = auth.uid());

drop policy if exists push_abo_eintragen on push_abos;
create policy push_abo_eintragen on push_abos for insert
  with check (nutzer_id = auth.uid() and ist_mitglied(haushalt_id));

drop policy if exists push_abo_aendern on push_abos;
create policy push_abo_aendern on push_abos for update
  using (nutzer_id = auth.uid()) with check (nutzer_id = auth.uid());

-- Abmelden muss man wirklich löschen können: ein Grabstein wäre hier falsch,
-- ein totes Abo bekäme sonst ewig Zustellversuche.
drop policy if exists push_abo_loeschen on push_abos;
create policy push_abo_loeschen on push_abos for delete using (nutzer_id = auth.uid());
