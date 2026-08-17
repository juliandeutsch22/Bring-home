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

// ------------------------------------------------------------- manifest.json

const manifest = {
  name: 'bring-home',
  short_name: 'bring-home',
  description: 'Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben.',
  start_url: unter('./'),
  scope: unter('./'),
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#F4F1E8',
  theme_color: '#F4F1E8',
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
    <meta name="theme-color" content="#F4F1E8" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0B0E13" media="(prefers-color-scheme: dark)" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="bring-home" />
    <meta name="description" content="Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben." />
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
