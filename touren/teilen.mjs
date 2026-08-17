// teilen.mjs — der Weg zum Teilen, und was passiert, wenn der Server nicht da ist.
//
// Was hier NICHT geprüft wird: dass zwei Geräte sich wirklich abgleichen. Das
// braucht einen erreichbaren Server, ein eingeschaltetes anonymes Anmelden und
// die beiden Migrationen — und geht deshalb nur auf Julians Projekt.
//
// Was hier geprüft WIRD, ist der Teil, der auch dann stimmen muss: der Weg
// hinein und zurück, und dass ein Fehlschlag die App nicht anhält. Eine
// Einkaufsliste, die sich verschluckt, weil das WLAN weg ist, wäre schlimmer
// als eine, die nicht teilt.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BH_BASE ?? 'http://localhost:8903/Bring-home';

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
p.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);

const text = () => p.evaluate(() => document.body.innerText);
const enthaelt = (t, n) => t.toLowerCase().includes(n.toLowerCase());
const griff = async (label) => {
  const el = await p.evaluateHandle((l) => {
    const alle = [...document.querySelectorAll('[aria-label]')];
    const genau = alle.filter((e) => e.getAttribute('aria-label') === l);
    const k = genau.length > 0 ? genau : alle.filter((e) => (e.getAttribute('aria-label') ?? '').includes(l));
    return k.find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
    }) ?? null;
  }, label);
  const e = el.asElement();
  if (!e) throw new Error(`nicht sichtbar: ${label}`);
  return e;
};
const tippe = async (l) => { const e = await griff(l); await e.click(); await p.waitForTimeout(600); };
const schreibe = async (l, v) => { const e = await griff(l); await e.click(); await e.fill(v); await e.press('Enter'); await p.waitForTimeout(900); };

console.log('\n1) Erst etwas auf die Liste, damit man sieht, ob es überlebt');
await schreibe('Etwas hinzufügen', 'Milch');
pruef('die Liste steht', (await text()).includes('Milch'));

console.log('\n2) Der Weg zum Teilen');
await tippe('Liste teilen');
let t = await text();
pruef('der Bildschirm ist da', enthaelt(t, 'Teilen'), t.slice(0, 300));
pruef('und sagt, dass noch nichts geteilt ist', enthaelt(t, 'nur auf diesem Gerät'), t.slice(0, 400));
pruef('er bietet an, eine geteilte Liste anzulegen', enthaelt(t, 'Geteilte Liste anlegen'), t.slice(0, 500));
pruef('und ein Feld für einen fremden Code', enthaelt(t, 'Code'), t.slice(0, 500));

console.log('\n3) Ein Code, den es nicht gibt (oder kein Netz)');
await schreibe('Code eintippen', 'XXXXXXXX');
// Länger als die Frist in `haushalt.ts`: der interessante Fall ist ein Netz,
// das nicht ablehnt, sondern schweigt.
await p.waitForTimeout(11_000);
t = await text();
// Welche Meldung kommt, hängt davon ab, warum es nicht ging. Alle sind ganze
// deutsche Sätze — und keine darf die App anhalten.
pruef(
  'es kommt eine lesbare Meldung',
  enthaelt(t, 'Code gibt es nicht') ||
    enthaelt(t, 'Kein Netz') ||
    enthaelt(t, 'antwortet nicht') ||
    enthaelt(t, 'anonyme Anmeldung'),
  t.slice(0, 700),
);
pruef('und „Einen Moment" steht nicht mehr da', !enthaelt(t, 'Einen Moment'), t.slice(0, 500));
pruef('und der Bildschirm steht noch', enthaelt(t, 'Teilen'), t.slice(0, 300));

console.log('\n4) Zurück — und die Liste ist unversehrt');
await tippe('Zurück');
await p.waitForTimeout(900);
t = await text();
pruef('die Einkaufsliste ist wieder da', t.includes('Einkauf'), t.slice(0, 300));
pruef('und der Bestand ist unangetastet', t.includes('Milch') && t.includes('1 Sache fehlt'), t.slice(0, 400));

console.log(`\nSeitenfehler: ${fehler.length === 0 ? 'keine' : fehler.join(' | ')}`);
console.log(`${ok} ok, ${bad} fehlgeschlagen`);
await b.close();
process.exit(bad === 0 && fehler.length === 0 ? 0 : 1);
