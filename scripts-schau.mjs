// Schaubild-Skript: eine Aufnahme je Haut, hell und dunkel.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [, , skin] = process.argv;
const OUT = `/tmp/claude-0/-home-user-Erinnerungen-App/f6f0f7f2-3d14-5f6e-b0da-61c490ec01ce/scratchpad/bh-${skin}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const schema of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: schema });
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(String(e)));
  await p.goto('http://localhost:8901/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${OUT}-${schema}.png` });
  if (schema === 'dark') {
    // Einmal aufgeklappt, damit man das Erledigte auch sieht.
    const k = p.getByLabel('Erledigtes anzeigen').first();
    if (await k.count()) { await k.click(); await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}-dark-offen.png` }); }
  }
  console.log(`  ${skin}/${schema}: ${fehler.length ? fehler.join(' | ') : 'keine Fehler'}`);
  await p.close();
}
await b.close();
