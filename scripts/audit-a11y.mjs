// Axe-core accessibility gate for the landing page.
//
// pa11y-ci is the declared WCAG gate but cannot launch its own browser in every
// environment; this runs the same rule families through the Playwright Chromium
// the integration tests already use, so the homepage can be checked anywhere.
//
// Four states, because the contact section has three and a violation can hide in
// any of them: at rest, with the e-mail form open, with the planner open, and the
// whole thing again at 390px.
//
// usage: node scripts/audit-a11y.mjs [baseUrl]   (default http://localhost:4173)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const b = await chromium.launch({ executablePath });

async function run(width, label, prep) {
  // bypassCSP: the page's own Content-Security-Policy refuses injected inline
  // script, which is correct of it and would otherwise block axe entirely.
  const ctx = await b.newContext({ viewport: { width, height: 1000 }, bypassCSP: true });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  // Every section fades itself in when it scrolls into view, so anything never
  // scrolled to is mid-fade when axe samples it — and a half-faded colour reads
  // as a contrast failure that does not exist. Walk the whole page first, then
  // let the last reveal finish.
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(3000);
  if (prep) await prep(p);
  await p.addScriptTag({ content: axe });
  const r = await p.evaluate((t) => axe.run(document, { runOnly: { type: 'tag', values: t } }), TAGS);
  console.log(`\n=== ${label} (${width}px) — ${r.violations.length} violation type(s) ===`);
  for (const v of r.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help}  (${v.nodes.length} node(s))`);
    for (const n of v.nodes.slice(0, 5)) {
      console.log(`      ${n.target.join(' ')}`);
      const m = (n.any[0]?.message || n.all[0]?.message || '').split('\n')[0];
      if (m) console.log(`      -> ${m}`);
    }
  }
  await ctx.close();
  return r.violations.length;
}

const openForm = async (p) => {
  await p.locator('.route', { hasText: 'Stuur een bericht' }).click();
  await p.waitForTimeout(600);
};
const openPlanner = async (p) => {
  await p.locator('.route', { hasText: 'Plan een kennismaking' }).click();
  await p.waitForTimeout(600);
};

let total = 0;
total += await run(1440, 'desktop — at rest');
total += await run(390, 'mobile — at rest');
total += await run(1440, 'desktop — e-mail form open', openForm);
total += await run(1440, 'desktop — planner open', openPlanner);
await b.close();

console.log(`\nTOTAL violation types across all states: ${total}`);
if (total > 0) {
  console.error('\nA11y audit failed.');
  process.exit(1);
}
console.log('A11y audit passed.');
