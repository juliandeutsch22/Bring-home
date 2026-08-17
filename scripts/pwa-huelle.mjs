// pwa-huelle.mjs — trägt die PWA-Angaben in die erzeugte index.html nach.
//
// Warum überhaupt ein Nachtrag: expo-router kennt eine Datei `+html.tsx`, mit
// der man die HTML-Hülle selbst schreibt — sie wird aber nur beim STATISCHEN
// Rendern benutzt. Diese App exportiert als Single-Page (`web.output: "single"`),
// und dort erzeugt Expo die Hülle aus seiner eigenen Vorlage. Eine `+html.tsx`
// lag deshalb im Projekt herum und tat nichts: genau die Sorte Datei, die beim
// nächsten Lesen jemanden in die Irre führt.
//
// Alternative wäre gewesen, auf statisches Rendern umzustellen — das hieße
// aber, dass jede Route beim Bauen einmal serverseitig durchlaufen muss, mit
// Reanimated und SVG im Rücken. Viel Risiko für eine Handvoll Kopfzeilen.
import { readFileSync, writeFileSync } from 'node:fs';

const DATEI = 'dist/index.html';

const KOPF = `    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/icon-180.png" />
    <meta name="theme-color" content="#F4F1E8" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0B0E13" media="(prefers-color-scheme: dark)" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="bring-home" />
    <meta name="description" content="Eine geteilte Einkaufsliste — plus Essenswünsche und Wohnungs-Aufgaben." />
`;

let html = readFileSync(DATEI, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('PWA-Hülle: schon vorhanden, nichts zu tun.');
  process.exit(0);
}

// Deutsch, nicht Englisch — Vorleseprogramme richten sich danach.
html = html.replace('<html lang="en">', '<html lang="de">');
// Die Vorlage erlaubt Zoom; eine App tut das nicht.
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
);
html = html.replace('  </head>', `${KOPF}  </head>`);

writeFileSync(DATEI, html);
console.log('PWA-Hülle: Manifest, Icons und Farben eingetragen.');
