-- migration-07-vorrat.sql — der Vorrat.
--
-- Eine Spalte, mehr braucht es nicht:
--
--  · `vorrat_ab` — eingeräumt zu diesem Zeitpunkt. NULL = steht nicht im
--                  Vorrat (liegt also auf der Liste oder im Wagen).
--
-- WARUM EIN EIGENES FELD und nicht ein zweiter Sinn für `erledigt_am`: Ein
-- Artikel hat jetzt drei Orte — Liste, Wagen, Vorrat —, und drei Zustände
-- passen nicht in ein Feld mit zwei Werten. `erledigt_am` bleibt daneben
-- stehen und sagt weiter, WANN gekauft wurde; `vorrat_ab` sagt, wann
-- eingeräumt wurde. „Im Wagen" heißt damit: `erledigt_am` gesetzt UND
-- `vorrat_ab` leer.
--
-- WARUM EIN ZEITPUNKT und kein Wahrheitswert: Die Zeile trägt ein „seit 3
-- Tagen". Ein Vorrat ohne Alter wäre eine Liste von Behauptungen; mit Alter
-- sieht man ihm an, wie viel man ihm noch glauben will. Abgeleitet wird daraus
-- NICHTS — nichts verfällt von selbst. Was leer ist, weiß nur der Haushalt.
--
-- Die Spalte ist NULLBAR und ohne Vorgabewert. Alles, was schon da ist, bleibt
-- damit dort, wo es ist: Was im Wagen lag, liegt weiter im Wagen.

alter table artikel add column if not exists vorrat_ab timestamptz;

-- Eingeräumt werden kann nur, was auch gekauft wurde. Die Oberfläche kommt gar
-- nicht auf diesen Weg — sie räumt den Wagen ein —, aber ein Satz mit
-- `vorrat_ab` ohne `erledigt_am` wäre für `istImWagen` weder im Wagen noch auf
-- der Liste und verschwände aus allen drei Abschnitten. Was die Anzeige nicht
-- zeigen kann, soll die Datenbank nicht annehmen.
alter table artikel drop constraint if exists vorrat_nach_kauf;
alter table artikel add constraint vorrat_nach_kauf
  check (vorrat_ab is null or erledigt_am is not null);
