-- migration-01-zutaten.sql — nur nötig, wenn `schema.sql` schon einmal gelaufen
-- ist. Im SQL-Editor ausführen; ein zweiter Lauf schadet nicht.
--
-- Warum eine eigene Datei: `schema.sql` legt die Tabellen mit
-- `create table if not exists` an. Steht die Tabelle schon, sieht Postgres gar
-- nicht hin, ob die Spalten stimmen — eine geänderte Spaltenliste im Schema
-- wäre für einen bestehenden Haushalt also stillschweigend wirkungslos.

-- Neu: „Haben wir da." Von Hand gesetzt, für Salz, Öl, Mehl. Alles andere an
-- einer Zutat (auf der Liste, im Wagen, fehlt) leitet die App jedes Mal frisch
-- aus `artikel` ab.
alter table zutaten add column if not exists haben_wir boolean not null default false;

-- Weg: `uebernommen_am`. Ein gespeichertes „schon übernommen" hat gelogen,
-- sobald jemand den Artikel wieder von der Einkaufsliste genommen hat — das
-- Gericht stand dann als versorgt da, obwohl nichts mehr da war.
alter table zutaten drop column if exists uebernommen_am;
