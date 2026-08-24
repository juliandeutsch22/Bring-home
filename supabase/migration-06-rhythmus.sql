-- migration-06-rhythmus.sql — wiederkehrende Wohnungs-Aufgaben.
--
-- Zwei Spalten, mehr braucht es nicht:
--
--  · `rhythmus_tage` — wiederkehrend, in TAGEN. NULL = einmalig.
--  · `faellig_ab`    — ruht bis zu diesem Tag; davor steht die Aufgabe nicht
--                      im Offenen.
--
-- WARUM IN TAGEN AB DEM ABHAKEN und nicht als Kalenderregel: Der Müll muss
-- eine Woche nach dem letzten Mal raus, nicht jeden Montag. Eine Kalenderregel
-- häuft überfällige Fälle an, sobald jemand im Urlaub war — die Liste bestraft
-- einen dann für die Abwesenheit, und man wischt sie am ersten Tag zu Hause
-- gesammelt weg. Genau das wollen wir nicht.
--
-- Beide Spalten sind NULLBAR und ohne Vorgabewert. Bestehende Aufgaben bleiben
-- damit unverändert einmalig; niemand muss etwas nachtragen.

alter table aufgaben add column if not exists rhythmus_tage integer;
alter table aufgaben add column if not exists faellig_ab timestamptz;

-- Ein Rhythmus von null oder weniger Tagen wäre eine Aufgabe, die sich beim
-- Abhaken sofort selbst wieder stellt — eine Endlosschleife auf dem
-- Bildschirm. Die Oberfläche bietet so etwas nicht an; die Datenbank soll es
-- auch dann nicht annehmen, wenn jemand von Hand hineinschreibt.
alter table aufgaben drop constraint if exists rhythmus_positiv;
alter table aufgaben add constraint rhythmus_positiv
  check (rhythmus_tage is null or rhythmus_tage > 0);
