// schau.mjs — Bilder statt Behauptungen. Legt einen realistischen Bestand an
// und schießt die Screens, damit man die Gestaltung ansehen kann.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const BASE = process.env.BH_BASE ?? 'http://localhost:8903/Bring-home';
const OUT = process.env.BH_OUT ?? '/tmp/claude-0/-home-user-Erinnerungen-App/f6f0f7f2-3d14-5f6e-b0da-61c490ec01ce/scratchpad/bh5';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const fehler = [];
p.on('pageerror', (e) => fehler.push(String(e)));
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1700);
const griff = async (l) => {
  const h = await p.evaluateHandle((label) => {
    const alle = [...document.querySelectorAll('[aria-label]')];
    const g = alle.filter((e) => e.getAttribute('aria-label') === label);
    const k = g.length ? g : alle.filter((e) => (e.getAttribute('aria-label') ?? '').includes(label));
    return k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight; }) ?? null;
  }, l);
  return h.asElement();
};
const schreibe = async (l, v) => { const e = await griff(l); await e.click(); await e.fill(v); await e.press('Enter'); await p.waitForTimeout(420); };
const tippe = async (l) => { const e = await griff(l); await e.click(); await p.waitForTimeout(500); };
const tab = async (n) => {
  const box = await p.evaluate((name) => {
    const k = [...document.querySelectorAll('[role="tab"]')].filter((e) => (e.getAttribute('aria-label') ?? '').includes(name));
    const el = k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, n);
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(900);
};

for (const x of ['Milch', 'Vollkornbrot', 'Tomaten', 'Kaffee', 'Olivenöl']) await schreibe('Etwas hinzufügen', x);
await tippe('Kaffee abhaken');
await tippe('Tomaten abhaken');
await tippe('Wagen ansehen');
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}-einkauf.png` });

// Der Editor hinter dem Stift: umbenennen, Menge, von der Liste nehmen.
await tippe('Milch bearbeiten');
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}-einkauf-stift.png` });
await tippe('Milch fertig bearbeiten');

await tab('Essen');
await schreibe('Essenswunsch eintragen', 'Linsen mit Spätzle');
await tippe('Linsen mit Spätzle öffnen');
for (const z of ['Linsen', 'Spätzle', 'Essig', 'Olivenöl']) await schreibe('Zutat hinzufügen', z);
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}-essen.png` });

// Eine Zutat als Vorrat markieren — der Status wandert auf „haben wir da",
// ohne dass auf der Einkaufsliste etwas passiert.
await tippe('Zutat Essig bearbeiten');
await tippe('Essig haben wir da');
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}-essen-stift.png` });
await tippe('Essig fertig bearbeiten');
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}-essen-status.png` });

await tab('Wohnung');
await schreibe('Aufgabe hinzufügen', 'Regal anbringen');
await schreibe('Aufgabe hinzufügen', 'Heizung entlüften');
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}-wohnung.png` });

console.log(fehler.length ? fehler.join(' | ') : 'keine Seitenfehler');
await b.close();
