// pwa-huelle.mjs — trägt die PWA-Angaben nach dem Export ein.
//
// Zwei Aufgaben, beide aus DERSELBEN Quelle (`app.json` → `experiments.baseUrl`):
//
//  1. Kopfzeilen in die `index.html`. Expo-router kennt zwar eine `+html.tsx`,
//     benutzt sie aber nur beim statischen Rendern; diese App exportiert als
//     Single-Page, und dort erzeugt Expo die Hülle aus eigener Vorlage.
//  2. Die `manifest.json`. Sie MUSS die Basis kennen: GitHub Pages liefert ein
//     Projekt-Repo unter `/<Repo-Name>/` aus. Ein Manifest mit `start_url: "/"`
//     zeigt dort auf eine fremde Seite, und die App ließe sich zwar
//     installieren, startete aber ins Nichts.
//
// Deshalb wird das Manifest hier ERZEUGT statt in `public/` gepflegt — zwei
// Dateien, die denselben Pfad kennen müssen, laufen sonst auseinander.
import { readFileSync, writeFileSync } from 'node:fs';

const app = JSON.parse(readFileSync('app.json', 'utf8'));
const BASIS = (app.expo.experiments?.baseUrl ?? '').replace(/\/$/, '');
const unter = (pfad) => `${BASIS}/${pfad.replace(/^\.?\//, '')}`;
// Der Name kommt AUS `app.json`, wie der Pfad und die Grundfarbe auch. Zweimal
// hingeschrieben liefe er beim nächsten Umbenennen auseinander — und die
// Fassung, die auf dem Home-Bildschirm steht, wäre die vergessene.
const NAME = app.expo.name;

// ------------------------------------------------------------- Grundfarbe
//
// Nur EINE, weil die App nur eine Fassung hat: „Bringe Home" ist fest hell,
// unabhängig von der Systemeinstellung (siehe `ThemeProvider.tsx`). Ein
// dunkler Wert im Seitenkopf wäre hier kein Vorrat, sondern eine Falle — er
// träfe den Rahmen um die App, während die App selbst hell bliebe. Genau
// dieser Widerspruch war der weiße Balken unter der Notch, nur andersherum.
//
// Der Wert steht in `skin.ts` und wird DORT gelesen statt hier abgeschrieben.
// Scheitert das Auslesen, bricht der Build ab: ein stiller Rückfall auf eine
// fest eingetragene Farbe sähe monatelang richtig aus und wäre es nach dem
// nächsten Farbwechsel nicht mehr.
function grundfarbe() {
  const quelle = readFileSync('src/theme/skin.ts', 'utf8');
  const gewaehlt = quelle.match(/export const SKIN: Skin = SKINS\.(\w+)/)?.[1];
  if (!gewaehlt) throw new Error('pwa-huelle: die gewählte Haut steht nicht in skin.ts.');

  const block = quelle.slice(quelle.indexOf(`  ${gewaehlt}: {`));
  const ab = block.indexOf('hell: {');
  if (ab < 0) throw new Error(`pwa-huelle: „hell" fehlt in der Haut „${gewaehlt}".`);
  const treffer = block.slice(ab).match(/\bbg:\s*'(#[0-9A-Fa-f]{6})'/);
  if (!treffer) throw new Error(`pwa-huelle: kein bg in „hell" der Haut „${gewaehlt}".`);
  return treffer[1];
}

const GRUND = grundfarbe();

// ------------------------------------------------------------- manifest.json

const manifest = {
  name: NAME,
  short_name: NAME,
  description: 'Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben.',
  start_url: unter('./'),
  scope: unter('./'),
  display: 'standalone',
  orientation: 'portrait',
  background_color: GRUND,
  theme_color: GRUND,
  icons: [
    { src: unter('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
    { src: unter('icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
    { src: unter('icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

// --------------------------------------------------------------- index.html

const DATEI = 'dist/index.html';
let html = readFileSync(DATEI, 'utf8');

if (!html.includes('rel="manifest"')) {
  const KOPF = `    <link rel="manifest" href="${unter('manifest.json')}" />
    <link rel="apple-touch-icon" href="${unter('icons/icon-180.png')}" />
    <link rel="icon" href="${unter('favicon.ico')}" sizes="32x32" />
    <meta name="theme-color" content="${GRUND}" />
    <!--
      „light" und nichts sonst. Ohne diese Angabe malt das System eigene Teile
      der Seite dunkel, sobald das Gerät auf Dunkel steht: Auswahlfelder,
      Bildlaufleisten, den Einfügecursor. Die App bliebe hell und trüge lauter
      dunkle Fremdkörper.
    -->
    <meta name="color-scheme" content="light" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <!--
      Zur Statusleiste, weil hier zwei Fehler dicht beieinander liegen.

      „default" heißt bei iOS nicht „normal", sondern: die Statusleiste ist ein
      eigener HELLER Balken, und die Seite beginnt erst darunter. Auf einem
      iPhone 14 Pro war das über der DUNKLEN Fassung der App genau der weiße
      Rand unterhalb der Notch — heller Balken, dann eine fast schwarze App.

      Die Antwort darauf ist nicht „black-translucent", sondern der Verzicht auf
      die dunkle Fassung: „Bringe Home" ist fest hell (siehe ThemeProvider.tsx).
      Über einem cremefarbenen Zettel fällt ein heller Balken nicht mehr auf,
      und die Ziffern der Uhr bleiben dunkel und damit lesbar.
      „black-translucent" gäbe uns zwar die Fläche in die Hand, zeichnete Uhr
      und Batterie aber IMMER hell — Weiß auf Creme kann man nicht lesen.

      Die Seite endet also an der Unterkante der Statusleiste, und
      env(safe-area-inset-top) meldet null. Das ist hier richtig so: der Platz
      unter der Uhr ist schon freigehalten, "Screen" legt nur noch seinen
      eigenen Abstand darauf.
    -->
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${NAME}" />
    <meta name="description" content="Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben." />
    <style id="grundflaeche">
      /*
        Die Fläche HINTER der App. Ohne sie ist sie weiß — und Weiß blitzt genau
        dort auf, wo niemand es erwartet: beim Start, bevor React etwas
        gezeichnet hat, und am oberen Rand, wenn eine Liste über ihr Ende
        hinausgezogen wird.

        Sie steht bewusst im HTML und nicht im Theme: zu dem Zeitpunkt, an dem
        sie gebraucht wird, läuft noch kein JavaScript.

        Ohne Dunkel-Abfrage — die App hat keine dunkle Fassung, und eine
        Ausnahme hier hieße, dass der Rahmen umschlägt, während der Inhalt
        hell bleibt.
      */
      html, body, #root { background-color: ${GRUND}; }
      /* Kein Gummiband am Seitenrand — die Listen scrollen selbst. */
      body { overscroll-behavior: none; }
    </style>
`;
  // Deutsch, nicht Englisch — Vorleseprogramme richten sich danach.
  html = html.replace('<html lang="en">', '<html lang="de">');
  // Die Vorlage erlaubt Zoom; eine App tut das nicht.
  html = html.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
  );
  html = html.replace('  </head>', `${KOPF}  </head>`);
  writeFileSync(DATEI, html);
}

// ----------------------------------------------------------------- 404.html
//
// GitHub Pages kennt keine Single-Page-Rückfallebene: wer `/Bring-home/einkauf`
// direkt aufruft oder dort neu lädt, bekommt einen 404 — die Datei gibt es ja
// nicht, die Adresse erfindet erst der Router im Browser.
//
// Pages liefert bei Unbekanntem aber `404.html` aus. Ist das dieselbe Hülle,
// startet die App und der Router findet die Route selbst. Ein Kunstgriff, aber
// der übliche und der einzige ohne eigenen Server.
writeFileSync('dist/404.html', html);

console.log(`PWA-Hülle: Basis „${BASIS || '/'}" — Manifest, Kopfzeilen und 404-Rückfall geschrieben.`);
