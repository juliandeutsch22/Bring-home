// schau.mjs — Aufnahmen mit echten Daten (nicht mit Attrappen).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = '/tmp/claude-0/-home-user-Erinnerungen-App/f6f0f7f2-3d14-5f6e-b0da-61c490ec01ce/scratchpad/bh3';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const fehler = [];
p.on('pageerror', (e) => fehler.push(String(e)));
await p.goto('http://localhost:8901/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
const griff = async (l) => {
  const h = await p.evaluateHandle((label) => {
    const alle = [...document.querySelectorAll('[aria-label]')];
    const g = alle.filter((e) => e.getAttribute('aria-label') === label);
    const k = g.length ? g : alle.filter((e) => (e.getAttribute('aria-label') ?? '').includes(label));
    return k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight; }) ?? null;
  }, l);
  return h.asElement();
};
const schreibe = async (l, v) => { const e = await griff(l); await e.click(); await e.fill(v); await e.press('Enter'); await p.waitForTimeout(450); };
const tippe = async (l) => { const e = await griff(l); await e.click(); await p.waitForTimeout(450); };
const tab = async (n) => {
  const box = await p.evaluate((name) => {
    const k = [...document.querySelectorAll('[role="tab"]')].filter((e) => (e.getAttribute('aria-label') ?? '').includes(name));
    const el = k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, n);
  await p.mouse.click(box.x, box.y); await p.waitForTimeout(900);
};

for (const x of ['Milch', 'Vollkornbrot', 'Tomaten', 'Kaffee']) await schreibe('Etwas hinzufügen', x);
await tippe('Kaffee abhaken');
await tippe('Wagen ansehen');
await p.screenshot({ path: `${OUT}-einkauf.png` });

await tab('Essen');
await schreibe('Essenswunsch eintragen', 'Linsen mit Spätzle');
await schreibe('Essenswunsch eintragen', 'Ofengemüse mit Feta');
await tippe('Linsen mit Spätzle öffnen');
for (const z of ['Linsen', 'Spätzle', 'Essig', 'Zwiebeln']) await schreibe('Zutat hinzufügen', z);
await p.screenshot({ path: `${OUT}-essen.png` });

await tab('Wohnung');
for (const a of ['Regal im Flur anbringen', 'Fahrräder aus dem Keller holen', 'Heizung entlüften']) await schreibe('Aufgabe hinzufügen', a);
await tippe('Heizung entlüften bearbeiten');
const w = await griff('Worauf Heizung entlüften wartet');
await w.click(); await w.fill('Hausverwaltung'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
await tippe('Wartendes anzeigen');
await p.screenshot({ path: `${OUT}-wohnung.png` });

console.log(fehler.length ? fehler.join(' | ') : 'keine Seitenfehler');
await b.close();
