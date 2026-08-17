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

// ------------------------------------------------------------ Grundfarben
//
// Sie stehen an drei Stellen im Kopf der Seite (theme-color hell, theme-color
// dunkel, und die Fläche hinter der App) und dürfen mit `skin.ts` nicht
// auseinanderlaufen. Also werden sie DORT gelesen statt hier abgeschrieben.
//
// Wenn das Auslesen scheitert, bricht der Build ab. Ein stiller Rückfall auf
// eine fest eingetragene Farbe wäre schlimmer als ein Fehlschlag: er sähe
// monatelang richtig aus und wäre es nach dem nächsten Farbwechsel nicht mehr.
function grundfarben() {
  const quelle = readFileSync('src/theme/skin.ts', 'utf8');
  const gewaehlt = quelle.match(/export const SKIN: Skin = SKINS\.(\w+)/)?.[1];
  if (!gewaehlt) throw new Error('pwa-huelle: die gewählte Haut steht nicht in skin.ts.');

  const block = quelle.slice(quelle.indexOf(`  ${gewaehlt}: {`));
  const lies = (bereich) => {
    const ab = block.indexOf(`${bereich}: {`);
    if (ab < 0) throw new Error(`pwa-huelle: „${bereich}" fehlt in der Haut „${gewaehlt}".`);
    const treffer = block.slice(ab).match(/\bbg:\s*'(#[0-9A-Fa-f]{6})'/);
    if (!treffer) throw new Error(`pwa-huelle: kein bg in „${bereich}" der Haut „${gewaehlt}".`);
    return treffer[1];
  };
  return { hell: lies('hell'), dunkel: lies('dunkel') };
}

const FARBE = grundfarben();

// ------------------------------------------------------------- manifest.json

const manifest = {
  name: 'bring-home',
  short_name: 'bring-home',
  description: 'Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben.',
  start_url: unter('./'),
  scope: unter('./'),
  display: 'standalone',
  orientation: 'portrait',
  background_color: FARBE.hell,
  theme_color: FARBE.hell,
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
    <meta name="theme-color" content="${FARBE.hell}" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="${FARBE.dunkel}" media="(prefers-color-scheme: dark)" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <!--
      „black-translucent" und NICHT „default".

      „default" heißt bei iOS nicht „normal", sondern ein WEISSER Balken über
      der Seite. Über der dunklen Fassung der App war das genau der weiße Rand
      unterhalb der Notch, und die Seite begann erst darunter — die App wirkte
      oben abgeschnitten.

      „black-translucent" legt die Seite unter die Statusleiste. Damit malen wir
      die Fläche selbst (siehe den Stil weiter unten), und
      \`env(safe-area-inset-top)\` liefert endlich einen echten Wert — den holt
      sich \`Screen\` über \`useSafeAreaInsets()\` und schiebt den Inhalt unter
      Uhr und Batterie.

      Der Preis, ehrlich benannt: iOS zeichnet Uhr und Batterie dann IMMER hell.
      In der dunklen Fassung ist das richtig, in der hellen steht Weiß auf
      Creme. Die Einstellung wird beim Start einmal gelesen und kann dem Theme
      nicht folgen — es gibt hier nur die Wahl, welche Fassung nachgibt.
    -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="bring-home" />
    <meta name="description" content="Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben." />
    <style id="grundflaeche">
      /*
        Die Fläche HINTER der App. Ohne sie ist sie weiß — und Weiß blitzt genau
        dort auf, wo niemand es erwartet: beim Start, bevor React etwas
        gezeichnet hat, und am oberen Rand, wenn eine Liste über ihr Ende
        hinausgezogen wird.

        Sie steht bewusst im HTML und nicht im Theme: zu dem Zeitpunkt, an dem
        sie gebraucht wird, läuft noch kein JavaScript.
      */
      html, body, #root { background-color: ${FARBE.hell}; }
      @media (prefers-color-scheme: dark) {
        html, body, #root { background-color: ${FARBE.dunkel}; }
      }
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
