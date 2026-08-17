// bleibt.mjs — Etappe 2: überlebt der Bestand das Schließen, und ist die App
// installierbar?
//
// Das ist die Tour, die den Unterschied zwischen „hübscher Prototyp" und
// „benutzbar" prüft. Sie lädt die Seite bewusst NEU — anders als der Rundgang,
// der genau das vermeiden muss.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BH_BASE ?? 'http://localhost:8901';
// Der Pfad-Anteil der Basis. Auf GitHub Pages liegt die App unter
// „/<Repo-Name>/", lokal unter „/" — die Kopfzeilen müssen beides treffen,
// und eine Tour mit fest verdrahtetem „/manifest.json" prüft nur den einen Fall.
const BASIS = new URL(BASE).pathname.replace(/\/$/, '');

let ok = 0;
let bad = 0;
const pruef = (name, wahr, extra = '') => {
  if (wahr) { ok += 1; console.log(`  ✓ ${name}`); }
  else { bad += 1; console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`); }
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
const fehler = [];
p.on('pageerror', (e) => fehler.push(String(e)));

const text = () => p.evaluate(() => document.body.innerText);
const griff = async (l) => {
  const h = await p.evaluateHandle((label) => {
    const alle = [...document.querySelectorAll('[aria-label]')];
    const g = alle.filter((e) => e.getAttribute('aria-label') === label);
    const k = g.length ? g : alle.filter((e) => (e.getAttribute('aria-label') ?? '').includes(label));
    return k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight; }) ?? null;
  }, l);
  const e = h.asElement();
  if (!e) throw new Error(`nicht sichtbar: ${l}`);
  return e;
};
const schreibe = async (l, v) => { const e = await griff(l); await e.click(); await e.fill(v); await e.press('Enter'); await p.waitForTimeout(500); };
const tippe = async (l) => { const e = await griff(l); await e.click(); await p.waitForTimeout(450); };

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);

console.log('\n1) Die Hülle sagt, dass sie eine App ist');
const manifestPfad = await p.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? null);
pruef('ein Manifest ist verlinkt', manifestPfad === `${BASIS}/manifest.json`, String(manifestPfad));
const manifest = await (await p.request.get(`${BASE}/manifest.json`)).json();
pruef('es steht auf „standalone"', manifest.display === 'standalone', manifest.display);
pruef('es startet unter der richtigen Basis', manifest.start_url === `${BASIS}/`, manifest.start_url);
pruef('und bringt ein maskierbares Icon mit', manifest.icons.some((i) => i.purpose === 'maskable'));
const appleIcon = await p.evaluate(() => document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? null);
pruef('iOS findet sein Icon', appleIcon === `${BASIS}/icons/icon-180.png`, String(appleIcon));
pruef('das Icon gibt es wirklich', (await p.request.get(`${BASE}/icons/icon-180.png`)).ok());

console.log('\n2) Der Service Worker meldet sich an');
const angemeldet = await p.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'kein Support';
  const r = await navigator.serviceWorker.getRegistration();
  return r ? 'angemeldet' : 'nicht angemeldet';
});
pruef('er ist da', angemeldet === 'angemeldet', angemeldet);

console.log('\n3) Der Bestand überlebt einen Neustart');
await schreibe('Etwas hinzufügen', 'Olivenöl');
await schreibe('Etwas hinzufügen', 'Zitronen');
await tippe('Zitronen abhaken');
let t = await text();
pruef('vorher: eins offen, eins im Wagen', t.includes('1 Sache fehlt') && t.toLowerCase().includes('im wagen · 1'), t.slice(0, 400));

await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
t = await text();
pruef('nach dem Neuladen ist das Offene noch da', t.includes('Olivenöl'), t.slice(0, 400));
pruef('die Zählung stimmt weiterhin', t.includes('1 Sache fehlt'), t.slice(0, 300));
pruef('und der Wagen auch', t.toLowerCase().includes('im wagen · 1'), t.slice(0, 400));

console.log('\n4) Auch Gelöschtes bleibt gelöscht');
// Löschen liegt seit dem Stift eine Ebene tiefer — neben dem Abhaken soll im
// Supermarkt kein Mülleimer stehen.
await tippe('Olivenöl bearbeiten');
await tippe('Olivenöl entfernen');
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
t = await text();
pruef('das Gelöschte kommt NICHT zurück', !t.includes('Olivenöl'), t.slice(0, 400));

console.log('\n5) Was in der Wohnung steht, bleibt ebenfalls');
const tab = async (n) => {
  const box = await p.evaluate((name) => {
    const k = [...document.querySelectorAll('[role="tab"]')].filter((e) => (e.getAttribute('aria-label') ?? '').includes(name));
    const el = k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, n);
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(900);
};
await tab('Wohnung');
await schreibe('Aufgabe hinzufügen', 'Rauchmelder prüfen');
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await tab('Wohnung');
pruef('die Aufgabe steht noch da', (await text()).includes('Rauchmelder prüfen'), (await text()).slice(0, 400));

console.log(`\nSeitenfehler: ${fehler.length === 0 ? 'keine' : fehler.join(' | ')}`);
console.log(`${ok} ok, ${bad} fehlgeschlagen`);
await b.close();
process.exit(bad === 0 && fehler.length === 0 ? 0 : 1);
