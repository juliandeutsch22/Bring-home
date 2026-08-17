import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const BASE = process.env.BH_BASE ?? 'http://localhost:8903/Bring-home';
const OUT = '/tmp/claude-0/-home-user-Erinnerungen-App/f6f0f7f2-3d14-5f6e-b0da-61c490ec01ce/scratchpad/bh4';
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
for (const x of ['Milch', 'Vollkornbrot', 'Tomaten', 'Kaffee', 'Olivenöl']) await schreibe('Etwas hinzufügen', x);
await tippe('Kaffee abhaken');
await tippe('Tomaten abhaken');
await tippe('Wagen ansehen');
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}-einkauf.png` });
console.log(fehler.length ? fehler.join(' | ') : 'keine Seitenfehler');
await b.close();
