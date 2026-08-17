# bring-home

Eine geteilte Einkaufsliste. Zwei Leute, eine Liste — was der eine hinzufügt,
sieht der andere.

## Stand

**Etappe 0 — Grundstein.** Das Design-System aus Stoa ist portiert und neu
eingekleidet; die Liste ist noch eine Attrappe ohne Datenschicht.

## Fahrplan

| Etappe | Inhalt |
|---|---|
| 0 ✅ | Grundstein: Toolchain, Design-System, eine Hülle, Verifikation |
| 1 | Die Liste, lokal benutzbar (Datenschicht, hinzufügen/abhaken) |
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
npx eslint src --ext .ts,.tsx
npx expo export --platform web --clear
```
