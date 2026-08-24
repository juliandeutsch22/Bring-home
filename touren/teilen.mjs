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
/**
 * Ein fehlgeschlagener Netzabruf ist hier KEIN Fehler, sondern der Prüffall:
 * diese Tour läuft ohne erreichbaren Server, und dass der Browser das meldet,
 * ist der Beweis, dass die App es überhaupt versucht hat. Was zählt, ist, was
 * die App daraus macht — und das steht weiter unten.
 */
const netz = (t) => /ERR_|Failed to load resource|Failed to fetch|NetworkError|supabase/i.test(t);
p.on('pageerror', (e) => { if (!netz(String(e))) fehler.push(String(e)); });
p.on('console', (m) => { if (m.type() === 'error' && !netz(m.text())) fehler.push(m.text()); });

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
/** Wie oft gibt es dieses Label? Am `innerText` wäre das nicht ablesbar. */
const zeilen = (label) =>
  p.evaluate((l) => [...document.querySelectorAll('[aria-label]')].filter((e) => e.getAttribute('aria-label') === l).length, label);
const schreibe = async (l, v) => { const e = await griff(l); await e.click(); await e.fill(v); await e.press('Enter'); await p.waitForTimeout(900); };
/** In einen anderen Tab wechseln — über die Mitte der Schaltfläche, weil die
 *  Leiste über dem Inhalt liegt und ein Klick auf das Element sonst abgefangen
 *  werden kann. */
const tab = async (name) => {
  const box = await p.evaluate((n) => {
    const k = [...document.querySelectorAll('[role="tab"]')].filter((e) => (e.getAttribute('aria-label') ?? '').includes(n));
    const el = k.find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, name);
  if (!box) throw new Error(`Tab fehlt: ${name}`);
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(1000);
};

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

console.log('\n5) Bitte mitnehmen — der Weg und die ehrlichen Absagen');
// Ohne geteilte Liste hat die Bitte kein Ziel; der Einstieg gehört dann NICHT
// auf den Bildschirm. Hier ist noch nichts geteilt.
pruef('ohne geteilte Liste kein Einstieg', (await zeilen('Jemanden bitten, etwas mitzunehmen')) === 0);

// Haushalt vortäuschen (ohne Server) und nachsehen, ob der Weg erscheint.
await p.evaluate(() => {
  window.localStorage.setItem('bring-home.haushalt', JSON.stringify({ id: 'test-haushalt', code: 'K7MP2QRS' }));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await schreibe('Etwas hinzufügen', 'Milch');
pruef('mit geteilter Liste steht der Einstieg da', (await zeilen('Jemanden bitten, etwas mitzunehmen')) === 1);

// Der Mitteilungs-Schalter steht auf dem Teilen-Bildschirm, weil die Erlaubnis
// pro GERÄT gilt und der Empfänger sie braucht.
await tippe('Geteilte Liste');
const schalter = await p.evaluate(() => {
  const e = [...document.querySelectorAll('[aria-label]')].find((x) =>
    (x.getAttribute('aria-label') ?? '').startsWith('Mitteilungen '));
  if (!e) return null;
  const bahn = e.firstElementChild;
  const traeger = bahn?.firstElementChild;
  return {
    rolle: e.getAttribute('role'),
    an: e.getAttribute('aria-checked'),
    bahnFarbe: bahn ? getComputedStyle(bahn).backgroundColor : null,
    knopf: traeger ? getComputedStyle(traeger).transform : null,
  };
});
pruef('es ist ein Schalter, kein Textknopf', schalter?.rolle === 'switch', JSON.stringify(schalter));
// Ohne die Angabe liest ein Screenreader „Schalter" vor und verschweigt genau
// das, wofür es ihn gibt.
pruef('und er sagt vorlesbar, dass er aus ist', schalter?.an === 'false', JSON.stringify(schalter));
// Aus heißt: vertiefte Steinfläche, Knopf links. Getönt hieße in dieser App
// „an" — und das wäre hier gelogen.
pruef('aus liegt der Knopf links auf ungetönter Bahn',
  schalter?.knopf === 'matrix(1, 0, 0, 1, 0, 0)' && schalter?.bahnFarbe === 'rgb(232, 230, 224)',
  JSON.stringify(schalter));
await tippe('Zurück');

await tippe('Jemanden bitten, etwas mitzunehmen');
t = await text();
pruef('der Bitten-Bildschirm ist da', enthaelt(t, 'Bitte mitnehmen'), t.slice(0, 400));
pruef('und sagt, dass noch nichts gewählt ist', enthaelt(t, 'Wähle aus'), t.slice(0, 400));

await tippe('Milch auswählen');
t = await text();
pruef('das Ausgewählte wird gezählt', enthaelt(t, '1 Sache ausgewählt'), t.slice(0, 400));
// Der Satz, der ankommt, steht schon VOR dem Senden da — man schickt nichts,
// was man nicht gelesen hat.
pruef('die Vorschau nennt die Sache beim Namen',
  enthaelt(t, 'Bitte auf dem Heimweg mitnehmen: Milch'), t.slice(0, 600));

await tippe('Bitte verschicken');
// Länger als die Frist in `frist.ts` — auch hier ist der interessante Fall das
// Netz, das nicht ablehnt, sondern schweigt.
await p.waitForTimeout(9500);
t = await text();
// Ohne erreichbaren Server MUSS eine lesbare Absage kommen — und keine, die
// „verschickt" behauptet.
pruef('ein Fehlschlag wird zugegeben',
  enthaelt(t, 'nicht geklappt') || enthaelt(t, 'noch nicht eingerichtet') || enthaelt(t, 'Niemand hat Mitteilungen'),
  t.slice(0, 700));
pruef('und behauptet NICHT, verschickt zu haben', !enthaelt(t, 'Verschickt.'), t.slice(0, 500));
// Der Knopf muss wieder ansprechbar sein — ein „Einen Moment …", das stehen
// bleibt, ist eine App, die hängt.
pruef('der Knopf steht wieder bereit', !enthaelt(t, 'Einen Moment'), t.slice(0, 500));

await tippe('Zurück');
await p.waitForTimeout(800);
pruef('die Einkaufsliste ist danach unversehrt', (await text()).includes('Milch'));

console.log('\n6) Dieselbe Bitte aus der Wohnung — anderer Satz, gleicher Weg');
await tab('Wohnung');
// Ohne Offenes gibt es nichts zu bitten; der Einstieg darf dann nicht dastehen.
pruef('ohne offene Aufgabe kein Einstieg', (await zeilen('Jemanden bitten, etwas zu übernehmen')) === 0);

await schreibe('Aufgabe hinzufügen', 'Müll rausbringen');
pruef('mit offener Aufgabe steht der Einstieg da',
  (await zeilen('Jemanden bitten, etwas zu übernehmen')) === 1);

await tippe('Jemanden bitten, etwas zu übernehmen');
t = await text();
pruef('der Bitten-Bildschirm kennt die Wohnung', enthaelt(t, 'Bitte übernehmen'), t.slice(0, 400));
// Die Einkaufsliste darf hier NICHT auftauchen. Beide Bereiche teilen sich
// einen Bildschirm — genau das ist die Stelle, an der sie verrutschen könnten.
pruef('und zeigt Aufgaben statt Einkäufe',
  enthaelt(t, 'Müll rausbringen') && !enthaelt(t, 'Milch'), t.slice(0, 600));

await tippe('Müll rausbringen auswählen');
t = await text();
pruef('gezählt wird in Aufgaben, nicht in Sachen', enthaelt(t, '1 Aufgabe ausgewählt'), t.slice(0, 400));
// Der zweite Satz. Er bittet, er befiehlt nicht.
pruef('die Vorschau bittet, statt zu befehlen',
  enthaelt(t, 'Bitte übernimm, wenn du Zeit hast: Müll rausbringen'), t.slice(0, 700));

await tippe('Bitte verschicken');
await p.waitForTimeout(9500);
t = await text();
pruef('auch hier wird ein Fehlschlag zugegeben',
  enthaelt(t, 'nicht geklappt') || enthaelt(t, 'noch nicht eingerichtet') || enthaelt(t, 'Niemand hat Mitteilungen'),
  t.slice(0, 700));

await tippe('Zurück');
await p.waitForTimeout(800);
pruef('die Wohnung ist danach unversehrt', (await text()).includes('Müll rausbringen'));

console.log(`\nSeitenfehler: ${fehler.length === 0 ? 'keine' : fehler.join(' | ')}`);
console.log(`${ok} ok, ${bad} fehlgeschlagen`);
await b.close();
process.exit(bad === 0 && fehler.length === 0 ? 0 : 1);
