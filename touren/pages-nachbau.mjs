// pages-nachbau.mjs — liefert `dist` genau so aus wie GitHub Pages.
//
// Zwei Eigenheiten, die kein gewöhnlicher Dateiserver nachbildet und an denen
// die App sonst erst in freier Wildbahn scheitert:
//  1. Ein Projekt-Repo liegt unter „/<Repo-Name>/", nicht unter „/".
//  2. Für Unbekanntes wird `404.html` ausgeliefert — mit Status 404, aber mit
//     Inhalt. Genau daran hängt, ob ein Neuladen auf einer Unterseite die App
//     startet oder eine Fehlerseite zeigt.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const WURZEL = process.argv[2] ?? 'dist';
const BASIS = process.argv[3] ?? '/Bring-home';
const PORT = Number(process.argv[4] ?? 8903);

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

createServer((anfrage, antwort) => {
  const pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
  if (!pfad.startsWith(BASIS)) {
    antwort.writeHead(404).end('ausserhalb der Basis');
    return;
  }
  let rest = pfad.slice(BASIS.length) || '/';
  if (rest.endsWith('/')) rest += 'index.html';
  // `normalize` schneidet „../" weg — sonst wäre der Server ein Scheunentor.
  const datei = join(WURZEL, normalize(rest).replace(/^(\.\.[/\\])+/, ''));

  if (existsSync(datei) && statSync(datei).isFile()) {
    antwort.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] ?? 'application/octet-stream' });
    createReadStream(datei).pipe(antwort);
    return;
  }
  // Unbekannt → 404.html, mit Status 404. Wie bei GitHub Pages.
  const rueckfall = join(WURZEL, '404.html');
  if (existsSync(rueckfall)) {
    antwort.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(rueckfall).pipe(antwort);
    return;
  }
  antwort.writeHead(404).end('nicht gefunden');
}).listen(PORT, () => console.log(`Pages-Nachbau: http://localhost:${PORT}${BASIS}/`));
