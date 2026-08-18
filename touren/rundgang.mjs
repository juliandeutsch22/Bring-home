// rundgang.mjs — Etappe 1: kann man die App wirklich benutzen?
//
// Geprüft werden die drei Wege, für die es die App gibt, jeweils bis zur
// sichtbaren Folge — nicht, ob ein Knopf existiert, sondern ob danach das
// Richtige dasteht.
//
// Wichtig für den Web-Lauf: die Daten liegen im Speicher, ein `goto` löscht
// also alles. Zwischen Tabs wird deshalb NUR über die Leiste gewechselt.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BH_BASE ?? 'http://localhost:8901';

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
/** Eyebrows stehen in VERSALIEN (Inschrift) — deshalb ohne Groß/Klein prüfen. */
const enthaelt = (t, nadel) => t.toLowerCase().includes(nadel.toLowerCase());
/** Sichtbares Element mit diesem Label — expo-router lässt alle Tabs montiert. */
const griff = async (label) => {
  const el = await p.evaluateHandle((l) => {
    const alle = [...document.querySelectorAll('[aria-label]')];
    const genau = alle.filter((e) => e.getAttribute('aria-label') === l);
    const kandidaten = genau.length > 0 ? genau : alle.filter((e) => (e.getAttribute('aria-label') ?? '').includes(l));
    return kandidaten.find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
    }) ?? null;
  }, label);
  const e = el.asElement();
  if (!e) throw new Error(`nicht sichtbar: ${label}`);
  return e;
};
const tippe = async (label) => {
  const e = await griff(label);
  await e.click();
  await p.waitForTimeout(500);
};
const schreibe = async (label, wert) => {
  const e = await griff(label);
  await e.click();
  await e.fill(wert);
  await e.press('Enter');
  await p.waitForTimeout(600);
};
/**
 * Wie oft gibt es dieses Label? Am `innerText` lässt sich das NICHT ablesen:
 * expo-router hält alle Tabs montiert, „Brot" steht also auch als Zutat im
 * Essen-Tab. Gezählt werden deshalb die Bedienelemente.
 */
const zeilen = (label) =>
  p.evaluate((l) => [...document.querySelectorAll('[aria-label]')].filter((e) => e.getAttribute('aria-label') === l).length, label);
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

console.log('\n1) Einkauf: hinzufügen, abhaken, zurückholen');
await schreibe('Etwas hinzufügen', 'Milch');
await schreibe('Etwas hinzufügen', 'Brot');
let t = await text();
pruef('beide stehen auf der Liste', t.includes('Milch') && t.includes('Brot'), t.slice(0, 400));
pruef('die Zählung stimmt', t.includes('2 Sachen fehlen'), t.slice(0, 300));

// Derselbe Name ein zweites Mal darf nicht verdoppeln.
await schreibe('Etwas hinzufügen', '  milch ');
const milchZahl = await p.evaluate(() =>
  (document.body.innerText.match(/Milch/g) ?? []).length);
pruef('derselbe Name legt KEINEN zweiten Artikel an', milchZahl === 1, String(milchZahl));

await tippe('Milch abhaken');
t = await text();
pruef('abgehakt verschwindet aus dem Offenen', t.includes('1 Sache fehlt'), t.slice(0, 300));
pruef('und taucht im Wagen auf', enthaelt(t, 'Im Wagen · 1'), t.slice(0, 400));

await tippe('Wagen ansehen');
await tippe('Milch zurück auf die Liste');
t = await text();
pruef('aus dem Wagen zurück heißt wieder offen', t.includes('2 Sachen fehlen'), t.slice(0, 300));

console.log('\n2) Essen: Wunsch, Zutaten, Übernahme auf die Einkaufsliste');
await tab('Essen');
await schreibe('Essenswunsch eintragen', 'Linsen mit Spätzle');
t = await text();
pruef('der Wunsch steht da', t.includes('Linsen mit Spätzle'), t.slice(0, 400));

await tippe('Linsen mit Spätzle öffnen');
await schreibe('Zutat hinzufügen', 'Linsen');
await schreibe('Zutat hinzufügen', 'Spätzle');
await schreibe('Zutat hinzufügen', 'Brot');
t = await text();
pruef('die Zutaten hängen am Gericht', t.includes('3 Zutaten'), t.slice(0, 500));

// „Brot" steht schon offen auf der Einkaufsliste — es darf NICHT mitkommen.
pruef('nur die fehlenden werden angeboten', t.includes('2 Zutaten auf die Liste'), t.slice(0, 600));
await tippe('2 Zutaten auf die Einkaufsliste');
t = await text();
pruef('danach fehlt nichts mehr', t.includes('Alles beisammen'), t.slice(0, 600));
pruef('jede Zutat sagt jetzt, wo sie steht', t.includes('auf der Liste'), t.slice(0, 800));

await tab('Einkauf');
t = await text();
pruef('die Zutaten sind auf der Einkaufsliste', t.includes('Linsen') && t.includes('Spätzle'), t.slice(0, 500));
pruef('und sagen, woher sie kommen', t.includes('von Linsen mit Spätzle'), t.slice(0, 500));
pruef('„Brot" wurde NICHT verdoppelt', (await zeilen('Brot abhaken')) === 1);

console.log('\n3) Wohnung: anlegen, jemandem geben, warten lassen');
await tab('Wohnung');
await schreibe('Aufgabe hinzufügen', 'Regal anbringen');
await schreibe('Aufgabe hinzufügen', 'Heizung entlüften');
t = await text();
pruef('beide sind offen', t.includes('2 offen'), t.slice(0, 300));

await tippe('Heizung entlüften bearbeiten');
const wartenFeld = await griff('Worauf Heizung entlüften wartet');
await wartenFeld.click();
await wartenFeld.fill('Termin');
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
t = await text();
pruef('Wartendes zählt nicht mehr als offen', t.includes('1 offen · 1 wartet'), t.slice(0, 300));

await tippe('Wartendes anzeigen');
t = await text();
pruef('es steht im Warte-Abschnitt', t.includes('wartet auf Termin'), t.slice(0, 500));

await tippe('Regal anbringen erledigen');
t = await text();
pruef('Erledigtes verlässt das Offene', t.includes('0 offen'), t.slice(0, 300));
await tippe('Erledigtes anzeigen');
pruef('und liegt unter „Erledigt"', enthaelt(await text(), 'Erledigt · 1'), (await text()).slice(-400));

console.log('\n4) Einkauf: einen Punkt nachbessern statt neu tippen');
await tab('Einkauf');
await tippe('Brot bearbeiten');
const mengenfeld = await griff('Menge von Brot');
await mengenfeld.click();
await mengenfeld.fill('2 Laibe');
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
pruef('die Menge steht an der Zeile', (await text()).includes('2 Laibe'), (await text()).slice(0, 500));

const namensfeld = await griff('Brot umbenennen');
await namensfeld.click();
await namensfeld.fill('Vollkornbrot');
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
pruef('der Punkt heißt jetzt anders', (await zeilen('Vollkornbrot abhaken')) === 1);
pruef('und nicht mehr wie vorher', (await zeilen('Brot abhaken')) === 0);
await tippe('Vollkornbrot fertig bearbeiten');

console.log('\n5) Essen: der Status hängt an der Einkaufsliste, nicht an einem Häkchen');
await tab('Essen');
t = await text();
// „Brot" heißt auf der Einkaufsliste nun anders — die Zutat findet dort nichts
// mehr und fällt von selbst auf „fehlt" zurück. Genau das könnte ein
// gespeichertes „schon übernommen" nicht.
pruef('die umbenannte Zutat fehlt wieder', t.includes('1 Zutat auf die Liste'), t.slice(0, 800));

await tippe('Brot auf die Einkaufsliste');
t = await text();
pruef('einzeln übernehmen genügt', t.includes('Alles beisammen'), t.slice(0, 800));

// Die Kennzeichnung an der ZUGEKLAPPTEN Zeile: kochbar oder nicht, ohne das
// Gericht zu öffnen. Das ist der eigentliche Nutzen — offen sieht man es ohnehin.
await tippe('Linsen mit Spätzle zuklappen');
pruef('das versorgte Gericht trägt sein Zeichen', (await zeilen('Linsen mit Spätzle: alles da')) === 1);
await tippe('Linsen mit Spätzle öffnen');

await tippe('Zutat Spätzle bearbeiten');
await tippe('Spätzle haben wir da');
t = await text();
pruef('„Haben wir" steht an der Zutat', t.includes('haben wir da'), t.slice(0, 900));
await tippe('Zutat Spätzle entfernen');
t = await text();
pruef('eine gestrichene Zutat ist weg', t.includes('2 Zutaten'), t.slice(0, 800));

console.log('\n6) Einkauf: löschen liegt hinter dem Stift');
await tab('Einkauf');
pruef('das einzeln übernommene Brot steht auf der Liste', (await zeilen('Brot abhaken')) === 1);
await tippe('Vollkornbrot bearbeiten');
await tippe('Vollkornbrot entfernen');
pruef('und nach dem Löschen ist die Zeile fort', (await zeilen('Vollkornbrot abhaken')) === 0);

console.log('\n7) Der Haptik-Schalter hat genau die Gestalt, die gemessen wurde');
// Nicht ob es TICKT — das kann kein Browser auf einem Schreibtisch sagen. Wohl
// aber, ob der Aufbau noch der ist, der auf einem iPhone 14 Pro nachweislich
// funktioniert hat. Zwei Fehler hatten ihn schon einmal still lahmgelegt:
// ein Klick, der keiner war, und eigenes CSS, das die native Darstellung nahm.
//
// Dafür muss der iOS-Zweig erst erreichbar werden: Chromium KENNT
// `navigator.vibrate`, und solange es die gibt, ist sie die richtige Antwort
// und der Schalter kommt gar nicht vor. Also weg damit — so sieht die Seite
// aus, wie Safari sie sieht.
await p.evaluate(() => {
  // @ts-ignore — genau das ist der Punkt: auf iOS gibt es sie nicht.
  delete navigator.vibrate;
  Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
});
await tippe('Brot abhaken');

const schalter = await p.evaluate(() => {
  const l = document.querySelector('label[for="bring-home-haptik"]');
  const s = document.getElementById('bring-home-haptik');
  if (!l || !s) return null;
  return {
    imEtikett: s.parentElement === l,
    istSchalter: s.getAttribute('switch') !== null && s.getAttribute('type') === 'checkbox',
    // `all: initial` setzt appearance auf den Ausgangswert zurück; entscheidend
    // ist, dass NICHTS davon „none" ist — das wäre die gestylte Fassung.
    nativ: s.style.appearance === 'auto',
    versteckt: s.style.display === 'none' && l.style.display === 'none',
  };
});
pruef('der Schalter ist überhaupt da', schalter !== null, 'kein Element — wurde webTick je aufgerufen?');
if (schalter) {
  pruef('er sitzt in seinem Etikett', schalter.imEtikett);
  pruef('er ist ein Schalter, keine Checkbox', schalter.istSchalter);
  pruef('er wird nativ gezeichnet, nicht von uns', schalter.nativ, String(schalter.nativ));
  pruef('und ist unsichtbar', schalter.versteckt);
}

console.log(`\nSeitenfehler: ${fehler.length === 0 ? 'keine' : fehler.join(' | ')}`);
console.log(`${ok} ok, ${bad} fehlgeschlagen`);
await b.close();
process.exit(bad === 0 && fehler.length === 0 ? 0 : 1);
