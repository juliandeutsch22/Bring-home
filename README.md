# bring-home

Eine geteilte Einkaufsliste. Zwei Leute, eine Liste — was der eine hinzufügt,
sieht der andere.

## Stand

**Etappe 2 — die App bleibt.** Der Bestand überlebt das Schließen, sie lässt
sich auf den Home-Bildschirm legen und startet ohne Netz. Noch NICHT: Teilen
(Etappe 3).

### Was noch offen ist, bevor Etappe 3 gebaut werden kann

Zwei Dinge kann nur der Besitzer des Supabase-Projekts tun:

1. **`supabase/schema.sql`** einmal im SQL-Editor ausführen (Tabellen,
   Zugriffsregeln, Beitritts-Funktionen). Ist das schon geschehen, kommt
   **`supabase/migration-01-zutaten.sql`** hinterher: `schema.sql` legt die
   Tabellen mit `create table if not exists` an und sieht deshalb gar nicht
   mehr hin, ob die Spalten noch stimmen.
2. **Anonyme Anmeldung einschalten:** Authentication → Sign In / Providers →
   *Anonymous sign-ins* → an. Ohne das gibt es kein `auth.uid()`, und jede
   Zugriffsregel sperrt.

Und für die Veröffentlichung: **Settings → Pages → Build and deployment →
Source: „GitHub Actions"** auswählen. Ohne das scheitert der Workflow mit
`Failed to create deployment (404) … Ensure GitHub Pages has been enabled` —
der Build läuft dabei durch, nur das Hochladen nicht. Danach den Workflow
erneut starten (Actions → „Web veröffentlichen" → Re-run).

Die App liegt danach unter **`https://juliandeutsch22.github.io/Bring-home/`**.

## Fahrplan

| Etappe | Inhalt |
|---|---|
| 0 ✅ | Grundstein: Toolchain, Design-System, eine Hülle, Verifikation |
| 1 ✅ | Die drei Listen, lokal benutzbar |
| 2 ✅ | Bleibt: Speicher, Manifest, Icons, Service Worker, offline |
| 2.1 ✅ | Bewegung und Haptik |
| 3 | Teilen: Supabase, Beitritt per Code, Sync |
| 4 | Live: Änderungen erscheinen, während beide offen haben |
| 5 | Feinschliff: Mengen, Vorschläge, Undo, mehrere Listen |
| 6 | Optional: Web-Push; native App für ein Gerät |

## Die Haut wechseln

Alles Themenbezogene steht in `src/theme/skin.ts`. Eine Variante ausprobieren
heißt: EINE Zeile umstellen (`leinen` · `emaille` · `holz`). Der Rest des
Design-Systems ist thematisch neutral.

## Verifikation

```
npx tsc --noEmit
npx jest --ci
npx eslint src --ext .ts,.tsx
npm run build:web                # Export + Manifest + Kopfzeilen + 404-Rückfall
node touren/pages-nachbau.mjs    # in einem zweiten Fenster
BH_BASE=http://localhost:8903/Bring-home node touren/rundgang.mjs
BH_BASE=http://localhost:8903/Bring-home node touren/bleibt.mjs
```

**Immer gegen `pages-nachbau.mjs` prüfen, nicht gegen `serve`.** Der Nachbau
bildet die zwei Eigenheiten von GitHub Pages ab, an denen die App sonst erst
in freier Wildbahn scheitert: den Unterpfad `/Bring-home/` und die Auslieferung
von `404.html` für unbekannte Adressen. Mit `serve -s` sieht alles gut aus und
ist es nicht.

`touren/rundgang.mjs` geht die drei Wege durch, für die es die App gibt, und
prüft jeweils die sichtbare FOLGE — nicht, ob ein Knopf existiert.
`touren/bleibt.mjs` lädt die Seite bewusst neu und prüft, was danach noch
da ist.

**Immer `npm run build:web` statt `expo export`.** Der Export allein lässt
Manifest und Icons aus der `index.html` weg — die App wäre dann lauffähig,
aber nicht installierbar.
