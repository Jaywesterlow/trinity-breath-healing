// Bakes the draw-on SVGs for Hero.svelte from the traced strokes (trace.cjs): the mask strokes
// with their delay (--t) and duration (--d) baked in, as the old main-branch hero did, so the
// drawing runs from SSR HTML with CSS only. %LINES% is replaced by the line layer's URL.
// Timing = the prototype's: draw 2.6s, spread 0.65, distance from the tree's base.
const fs = require('fs');
const D = 2.6, SPREAD = 0.65;
const OUT = 'P:/AI/trinity-breath-healing/src/lib/images/redesign/';
for (const [name, file, vb, fit, pen, w, h] of [
  ['landscape', 'strokes.json', '0 0 2000 848', 'xMidYMid slice', 6, 2000, 848],
  ['portrait', 'strokes-p.json', '0 0 750 1004.5', 'none', 4.5, 750, 1004.5]
]) {
  const S = JSON.parse(fs.readFileSync(file, 'utf8'));
  const maxDist = Math.max(...S.map((s) => s.dist)), maxLen = Math.max(...S.map((s) => s.len));
  const paths = S.map((s) => {
    const t = (s.dist / maxDist) * SPREAD * D, d = Math.max(0.25, (D - t) * (0.35 + 0.65 * Math.sqrt(s.len / maxLen)));
    return `<path pathLength="1" style="--t:${t.toFixed(2)}s;--d:${d.toFixed(2)}s" d="${s.d}"/>`;
  }).join('\n');
  const svg = `<svg class="hero__draw hero__draw--${name}" viewBox="${vb}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="hero-draw-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><g fill="none" stroke="#fff" stroke-width="${pen}" stroke-linecap="round" stroke-linejoin="round">
${paths}
</g></mask></defs>
<image href="%LINES%" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" mask="url(#hero-draw-${name})"/>
</svg>
`;
  fs.writeFileSync(OUT + `hero-draw-${name}.svg`, svg);
  console.log(name, S.length, 'paths', (svg.length / 1024).toFixed(1) + 'KB');
}
for (const [a, b] of [['lines.webp', 'hero-lines-landscape.webp'], ['lines-p.webp', 'hero-lines-portrait.webp'], ['lit-warm.webp', 'hero-lit-landscape.webp'], ['lit-warm-p.webp', 'hero-lit-portrait.webp'], ['paper-p.webp', 'hero-paper-portrait.webp']]) fs.copyFileSync(a, OUT + b);
