// hell.mjs — bleibt die App hell, auch wenn das Gerät auf Dunkel steht?
//
// Das ist der eigentliche Prüffall: „sieht hell aus" beweist nichts, solange
// der prüfende Browser selbst hell steht.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = process.env.BH_BASE ?? "http://localhost:8903/Bring-home";
const OUT = process.env.BH_OUT ?? "/tmp";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let schlecht = 0;
for (const schema of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, colorScheme: schema });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1900);
  const f = await p.evaluate(() => {
    // Die Farbe der Panel-Fläche verrät das Theme eindeutig: hell ist cremig,
    // dunkel wäre fast schwarz.
    const grund = getComputedStyle(document.body).backgroundColor;
    const zahl = grund.match(/\d+/g).map(Number);
    return { grund, hell: zahl[0] > 200 && zahl[1] > 200 && zahl[2] > 200 };
  });
  const ok = f.hell;
  if (!ok) schlecht++;
  console.log(`  ${ok ? "OK" : "XX"}  System auf ${schema}: Grundfläche ${f.grund}`);
  await p.screenshot({ path: `${OUT}/hell-${schema}.png` });
  await ctx.close();
}
await b.close();
console.log(schlecht === 0 ? "Beide Male hell." : "Es ist umgeschlagen.");
process.exit(schlecht === 0 ? 0 : 1);
