# bring-home

Eine geteilte Einkaufsliste. Zwei Leute, eine Liste — was der eine hinzufügt,
sieht der andere.

## Stand

**Etappe 3 — die Liste wird geteilt.** Wer den Code hat, sieht dieselbe Liste;
Änderungen erscheinen, während beide offen haben. Ohne Netz läuft alles weiter
und gleicht sich ab, sobald es wieder da ist.

### Was NUR Julian tun kann (drei Handgriffe im Supabase-Dashboard)

Ohne diese drei bleibt die App genau so nutzbar wie vorher — nur eben je Gerät
für sich. Sie sagt das auf dem Teilen-Bildschirm auch, statt still zu scheitern.

1. **SQL-Editor:** die Migrationen der Reihe nach ausführen —
   `migration-01-zutaten.sql`, `migration-02-serverzeit.sql`,
   `migration-03-code.sql`. (Bei einem frischen Projekt genügt
   `supabase/schema.sql` allein — dort ist alles schon enthalten. `schema.sql`
   legt die Tabellen mit `create table if not exists` an und sieht deshalb bei
   einem bestehenden Projekt gar nicht mehr hin, ob die Spalten noch stimmen.)
2. **Anonyme Anmeldung einschalten:** Authentication → Sign In / Providers →
   *Anonymous sign-ins* → an. Ohne das gibt es kein `auth.uid()`, und jede
   Zugriffsregel sperrt.
3. **Realtime:** Database → Replication → die vier Inhalts-Tabellen freigeben,
   falls `alter publication` in `schema.sql` nicht gegriffen hat.

Warum es drei Migrationen sind und nicht eine: sie sind aus echten Fehlschlägen
gegen das laufende Projekt entstanden, jeder mit seiner Begründung in der Datei.
Migration 03 ist die lehrreichste — `gen_random_bytes` gehört zu `pgcrypto`, und
Supabase legt Erweiterungen im Schema `extensions` ab, während die Funktion mit
engem `search_path = public` läuft. Sie griff also nach etwas, das für sie nicht
sichtbar war. Behoben nicht durch einen weiteren Suchpfad, sondern indem die
Abhängigkeit entfällt.

Und für die Veröffentlichung: **Settings → Pages → Build and deployment →
Source: „GitHub Actions"** auswählen. Ohne das scheitert der Workflow mit
`Failed to create deployment (404) … Ensure GitHub Pages has been enabled` —
der Build läuft dabei durch, nur das Hochladen nicht.

Die App liegt unter **`https://juliandeutsch22.github.io/Bring-home/`**.

### Wie das Teilen gedacht ist

Eine Liste ist eine Kennung plus einen CODE. Einer legt die geteilte Liste an
(Einkauf → Kettenglied oben rechts → „Geteilte Liste anlegen"), gibt den Code
weiter, der andere tippt ihn ein. Keine Konten, keine E-Mail-Einladungen.

Beitreten VEREINIGT: was auf dem eigenen Gerät liegt, kommt mit, und was dort
liegt, kommt herüber. Es geht dabei nichts verloren.

Der Abgleich trägt zwei Zeiten, und das ist die Stelle, an der die meisten
Sync-Entwürfe brechen: `updated_at` kommt vom Gerät und entscheidet, wer bei
einem Konflikt gewinnt; `server_at` kommt vom Server und entscheidet, was beim
nächsten Durchgang geholt wird. Liefe das Holen über die Geräteuhr, würden die
Einträge eines nachgehenden Geräts stumm verschwinden — die Begründung steht
ausführlich in `supabase/migration-02-serverzeit.sql`.

## Fahrplan

| Etappe | Inhalt |
|---|---|
| 0 ✅ | Grundstein: Toolchain, Design-System, eine Hülle, Verifikation |
| 1 ✅ | Die drei Listen, lokal benutzbar |
| 2 ✅ | Bleibt: Speicher, Manifest, Icons, Service Worker, offline |
| 2.1 ✅ | Bewegung; Haptik auf Android (auf iOS unmöglich, siehe unten) |
| 3 ✅ | Teilen: Supabase, Beitritt per Code, Sync |
| 4 ✅ | Live: Änderungen erscheinen, während beide offen haben |
| 5 | Feinschliff: Mengen, Vorschläge, Undo, mehrere Listen |
| 6 | Optional: Web-Push; native App für ein Gerät |

## Was nicht geht, und warum nicht mehr daran gearbeitet wird

**Haptik auf iOS im Browser.** Nicht „schwierig", sondern nicht vorhanden.
Safari kennt `navigator.vibrate` nicht, und der viel zitierte Kunstgriff mit
dem nativen Schalter-Bedienelement (`<input type="checkbox" switch>`, seit
iOS 17.4) trägt ebenfalls nicht: am 17.08.2026 auf dem echten Gerät gemessen —
vier Varianten nebeneinander, darunter ein sichtbarer Schalter direkt unter dem
Finger — hat keine einzige getickt.

Auf iOS trägt deshalb der sichtbare Kanal die Bestätigung allein, wofür er
ohnehin gebaut ist: das Häkchen federt, die Zeile darunter rutscht nach. Haptik
war hier nie das Signal, nur seine Verstärkung.

Echte Haptik gäbe es allein mit einer nativen App — also mit genau dem
Apple-Developer-Account, um den herum diese App entworfen wurde. Das ist eine
Produktentscheidung, keine offene Aufgabe.

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
BH_BASE=http://localhost:8903/Bring-home node touren/teilen.mjs
```

**Immer gegen `pages-nachbau.mjs` prüfen, nicht gegen `serve`.** Der Nachbau
bildet die zwei Eigenheiten von GitHub Pages ab, an denen die App sonst erst
in freier Wildbahn scheitert: den Unterpfad `/Bring-home/` und die Auslieferung
von `404.html` für unbekannte Adressen. Mit `serve -s` sieht alles gut aus und
ist es nicht.

`touren/rundgang.mjs` geht die drei Wege durch, für die es die App gibt, und
prüft jeweils die sichtbare FOLGE — nicht, ob ein Knopf existiert.
`touren/bleibt.mjs` lädt die Seite bewusst neu und prüft, was danach noch
da ist. `touren/teilen.mjs` geht den Weg zum Teilen und prüft vor allem den
Fehlschlag: dass ein nicht erreichbarer Server eine lesbare Meldung ergibt und
nicht ein ewiges „Einen Moment …" — das ist der Teil, der auch dann stimmen
muss, wenn gerade nichts geht.

Was die Touren NICHT prüfen können: dass zwei Geräte sich wirklich abgleichen.
Das braucht einen erreichbaren Server mit eingeschaltetem anonymem Anmelden und
beiden Migrationen, und geht deshalb nur auf Julians Projekt. Die Umrechnung
der Zeitstempel und die Frage, wer bei einem Konflikt gewinnt, liegen dafür als
reine Funktionen in `src/data/abgleich.ts` und sind in
`src/data/abgleich.test.ts` abgedeckt.

**Immer `npm run build:web` statt `expo export`.** Der Export allein lässt
Manifest und Icons aus der `index.html` weg — die App wäre dann lauffähig,
aber nicht installierbar.
