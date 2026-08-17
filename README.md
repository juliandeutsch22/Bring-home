# bring-home

Eine geteilte Einkaufsliste. Zwei Leute, eine Liste — was der eine hinzufügt,
sieht der andere.

## Stand

**Etappe 1 — die drei Listen sind benutzbar.** Datenschicht, Einkauf, Essen
mit Zutaten-Übernahme, Wohnungs-Aufgaben mit Person und „Warten auf".
Noch NICHT: Speichern über einen Neustart hinweg (Etappe 2) und Teilen
(Etappe 3) — die Daten liegen im Speicher.

## Fahrplan

| Etappe | Inhalt |
|---|---|
| 0 ✅ | Grundstein: Toolchain, Design-System, eine Hülle, Verifikation |
| 1 ✅ | Die drei Listen, lokal benutzbar |
| 2 | Auf den Home-Bildschirm: Manifest, Icons, Service Worker, offline |
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
npx expo export --platform web --clear
npx serve dist -s -l 8901        # in einem zweiten Fenster
node touren/rundgang.mjs
```

`touren/rundgang.mjs` geht die drei Wege durch, für die es die App gibt, und
prüft jeweils die sichtbare FOLGE — nicht, ob ein Knopf existiert.
