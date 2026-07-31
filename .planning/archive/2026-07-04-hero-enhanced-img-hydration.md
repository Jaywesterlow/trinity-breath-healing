---
status: resolved
trigger: "Hero.svelte's <enhanced:img> causes a client hydration crash in the production build only"
created: "2026-07-04"
updated: "2026-07-04"
---

# Debug Session: hero-enhanced-img-hydration

## Symptoms

**Expected behavior:** Landing page (`/`) hydrates cleanly in a production build (`npm run build` + `vite preview`) — Hero, Werkwijze, OverMij sections all render and remain in the DOM after client-side JS takes over.

**Actual behavior:** Immediately after hydration attempts, the ENTIRE app root goes blank — `.hero`, `#werkwijze`, everything under `+layout.svelte`'s `<main>` disappears from the DOM. Server-rendered HTML (via curl) has all the correct content (`id="werkwijze"` etc. present in raw HTML), so this is purely a client-side hydration failure, not a content/SSR generation bug.

**Error messages:**
```
[console] warning Failed to hydrate:  TypeError: Cannot convert undefined or null to object
    at Object.entries (<anonymous>)
    at http://localhost:4173/_app/immutable/chunks/<hash>.js:4:291
    at http://localhost:4173/_app/immutable/chunks/dA9ah44j.js:2:3629
    ... (Svelte internal hydration reconciliation frames)
[pageerror] TypeError: Cannot convert undefined or null to object
```

**Timeline:** Unknown when this started — this is the FIRST time a production build has succeeded end-to-end (a separate, unrelated dead `/reviews` link in Footer.svelte was blocking `npm run build`'s prerender step until just now). So this bug could predate today's session entirely; it was simply never observable before because the build never completed. `npm run dev` (Vite dev server, not a production build) never exhibits this — page hydrates fine in dev, `#werkwijze` count: 1.

**Reproduction (verified via bisection):**
1. `PUBLIC_SITE_URL=https://trinity-breath-healing.vercel.app npm run build` (succeeds after removing the dead `/reviews` footer link)
2. Kill any stale process on port 4173, then `node node_modules/vite/bin/vite.js preview --port 4173`
3. Load `http://localhost:4173/` in a real browser (Playwright/chromium confirmed) at mobile viewport (390×844) or any viewport
4. Hydration fails immediately with the above error; `document.querySelector('#werkwijze')` (and `.hero`) return null/0 count post-hydration

**Isolation already performed:**
- `/contact` route (same `+layout.svelte`, same `Nav`/`Footer`, no Hero/Werkwijze/OverMij) hydrates cleanly — rules out Nav, Footer, `+layout.svelte`, JSON-LD/Head globally.
- Removed `<Werkwijze />` and `<OverMij />` from `+page.svelte`, kept only `<Hero />` — crash still occurs. Rules out Werkwijze and OverMij.
- With only `<Hero />` rendering, removed just the `<enhanced:img src={heroImg} .../>` element from `Hero.svelte` (replaced with an HTML comment, kept everything else — SocialIcon, HeroServiceCard, ButtonLink, all markup/CSS unchanged) and rebuilt — crash disappeared entirely (`hero count: 1`, no `[pageerror]`). This isolates the fault specifically to the `<enhanced:img>` element (the `@sveltejs/enhanced-img` Vite plugin macro that compiles to a `<picture>` with responsive `<source>`/`srcset` markup), not to SocialIcon.svelte, HeroServiceCard.svelte, ButtonLink.svelte, or any Hero markup/CSS around it.
- Restored `<enhanced:img>` afterward (diagnostic revert) — not yet re-verified crash returns with this exact restore, should be a fast sanity check for the debugger to redo as its first step.

## Current Focus

reasoning_checkpoint:
  hypothesis: "Hero.svelte writes `<enhanced:img src={heroImg} .../>` — a DYNAMIC (variable) src, not a static string literal. @sveltejs/enhanced-img's vite-plugin.js only fully compiles the `<picture>`/sources at build time when `src` is a static string (`img_to_picture()`); when src is an expression/variable it instead emits a RUNTIME branch (`dynamic_img_to_picture()`): `{#if typeof heroImg === 'string'} <img .../> {:else} <picture>{#each Object.entries(heroImg.sources)}...{/each}</picture> {/if}`. Because `heroImg` here is a plain (non-`?enhanced`) asset import, it IS just a string URL, so the correct branch is the `<img>` one — but the compiled+minified client chunk shows the guard condition compiled to `` `string`+new URL(`../assets/hero-illustration.SfR8n1e0.png`,import.meta.url).href==`string` `` instead of a `typeof` check. This is string concatenation compared to the literal \"string\" — mathematically almost always false (true only if the URL href were empty) — so the minified client bundle ALWAYS takes the `{:else}` picture/each branch regardless of heroImg's actual runtime type. That branch calls `Object.entries(heroImg.sources)`, but heroImg (a plain string) has no `.sources` property → `Object.entries(undefined)` → \"Cannot convert undefined or null to object\", exactly matching the reported error and stack (`Object.entries` inside a hydration-created each-block). The build's plugin-timing output confirms this project's Vite is running on Rolldown (rolldown.rs referenced in build log) — the minifier is oxc/rolldown's, not classic esbuild/terser — consistent with this being a bundler-specific miscompilation of the `typeof x === 'string'` guard for this particular code shape, rather than a plain Svelte/enhanced-img logic bug."
  confirming_evidence:
    - "Read node_modules/@sveltejs/enhanced-img/src/vite-plugin.js: confirmed `<enhanced:img src={heroImg}>` (ExpressionTag) routes to dynamic_img_to_picture(), which emits the `{#if typeof X === 'string'}...{:else}<picture>{#each Object.entries(X.sources)}` runtime template — this exact shape is the only place in the whole compiled output that calls `Object.entries` on something image-related."
    - "Read compiled client chunk .svelte-kit/output/client/_app/immutable/chunks/CTE7ubvU.js: found `y(f,e=>{`string`+new URL(`../assets/hero-illustration.SfR8n1e0.png`,import.meta.url).href==`string`?e(p):e(m,-1)});` — the guard is broken string concatenation, not a typeof check, so it structurally can never route to branch `p` (the plain `<img>` branch); it always routes to `m`, the `{#each Object.entries(...sources)}` branch."
    - "Prerendered SSR HTML (.svelte-kit/output/prerendered/pages/index.html) shows only a plain `<img src=\".../hero-illustration.SfR8n1e0.png\" .../>` with NO width/height/srcset attributes at all — confirms heroImg was never actually run through image optimization (no `?enhanced` query on the import), so on the server the (correctly-compiled, unminified or differently-optimized) typeof check took the `<img>` branch, while the client's separately-minified bundle's broken guard takes the other branch — a genuine SSR/client branch mismatch, matching Svelte 5's hydration `Object.entries()` crash signature precisely."
    - "Isolation evidence already in Evidence section: removing only the `<enhanced:img>` element (keeping everything else in Hero.svelte) eliminates the crash entirely — confirms fault is scoped exactly to this element's compiled output, not anything else in Hero.svelte."
  falsification_test: "If this hypothesis is right, switching `<enhanced:img src={heroImg}>` to a STATIC string literal src (e.g. `<enhanced:img src=\"../../images/hero-illustration.png\" .../>`) removes the dynamic_img_to_picture() runtime branch entirely (compiles via img_to_picture() instead — a fully static `<picture>` with real sources, no runtime typeof/Object.entries logic) — rebuild + preview should hydrate cleanly with zero pageerrors, and the built HTML should show real `<picture><source srcset=... type=\"image/avif\">...</picture>` markup with width/height on the `<img>`, not a plain unoptimized `<img>`."
  fix_rationale: "This addresses the root cause (a bundler-broken runtime branch that only exists because of the dynamic src usage pattern) rather than a symptom. It also fixes a second, previously-undetected problem: the current dynamic-src usage was never actually enhancing the hero image at all (no `?enhanced`, so heroImg is just a raw PNG URL with no responsive srcset/width/height) — directly undermining CLAUDE.md's LCP/CLS budget and the whole reason enhanced-img was chosen. Switching to the documented static-src usage pattern fixes the crash AND restores real AVIF/WebP responsive output + explicit width/height (CLS protection) in one minimal, targeted change."
  blind_spots: "Have not yet root-caused WHY rolldown/oxc's minifier miscompiles this specific `typeof x === 'string'` guard (could file an upstream issue, but out of scope for unblocking this project). Have not yet verified the fix in a live rebuild+preview — this is the next immediate step. Have not yet confirmed enhanced-img's static-src resolution correctly follows a relative path across the components/global -> lib/images directory boundary (should work per plugin's use of Vite's full `resolve()`, but confirming empirically after fix)."

hypothesis: "CONFIRMED (see reasoning_checkpoint above) — dynamic (variable) `src` on `<enhanced:img>` compiles to a runtime branch whose guard condition is miscompiled by the Rolldown-based minifier, always selecting the `Object.entries(heroImg.sources)` branch even though heroImg is an unenhanced plain string."

test: "Change Hero.svelte's `<enhanced:img src={heroImg} .../>` (plus its `import heroImg from '$lib/images/hero-illustration.png'`) to a static string literal src pointing directly at the image, removing the now-unused import. Rebuild, restart preview, reload in browser — verify zero [pageerror], `.hero` count 1, and inspect built HTML for real `<picture>`/`<source>` markup with width/height."

expecting: "Hydration succeeds cleanly; built HTML shows a real `<picture>` with AVIF/WebP `<source>` elements and an `<img>` with explicit width/height — both fixing the crash and restoring proper responsive-image optimization."

next_action: "Apply fix: edit Hero.svelte to use `<enhanced:img src=\"../../images/hero-illustration.png\" alt=\"\" aria-hidden=\"true\" loading=\"eager\" fetchpriority=\"high\" class=\"hero__img\" />` and remove the `import heroImg from '$lib/images/hero-illustration.png'` line. Rebuild + preview + verify hydration succeeds and picture markup is correct."

## Evidence

- timestamp: 2026-07-04T14:05 — Rebuilt (`npm run build` succeeded, 8.70s). Build log's plugin-timing footer references `rolldown.rs` — confirms this project's Vite build uses Rolldown (Rust bundler), not classic Rollup/esbuild, relevant to why a minifier-level miscompilation could occur here.
- timestamp: 2026-07-04T14:08 — Read node_modules/@sveltejs/enhanced-img/src/vite-plugin.js in full. Confirmed: `<enhanced:img src={var}>` (ExpressionTag) is handled by `dynamic_img_to_picture()`, generating `{#if typeof var === 'string'}<img .../>{:else}<picture>{#each Object.entries(var.sources)}<source .../>{/each}<img src={var.img.src} width={var.img.w} height={var.img.h} /></picture>{/if}`. Only STATIC string `src="..."` routes through `img_to_picture()` (fully static `<picture>`, no runtime branch, no Object.entries at runtime).
- timestamp: 2026-07-04T14:10 — Read prerendered `.svelte-kit/output/prerendered/pages/index.html`: hero image renders as plain `<img src="/_app/immutable/assets/hero-illustration.SfR8n1e0.png" alt="" aria-hidden="true" loading="eager" fetchpriority="high" class="hero__img" />` with NO width/height/srcset — confirms heroImg was never enhanced (plain asset import, not `?enhanced`), and SSR took the `<img>` (string) branch of the dynamic template as expected.
- timestamp: 2026-07-04T14:12 — Read compiled client chunk `.svelte-kit/output/client/_app/immutable/chunks/CTE7ubvU.js`: found the compiled guard for Hero's enhanced-img branch is `` `string`+new URL(`../assets/hero-illustration.SfR8n1e0.png`,import.meta.url).href==`string`?e(p):e(m,-1) `` — this is string concatenation compared to literal "string", NOT a `typeof` check; it is structurally false for any non-empty href, so the client ALWAYS takes branch `m` (the `{#each Object.entries(...sources)}` picture branch), which then calls `Object.entries(heroImg.sources)` on a plain string (no `.sources` prop) → `Cannot convert undefined or null to object`. This is a client/server branch mismatch: SSR renders the `<img>` branch, client hydration always evaluates to the `<picture>`/each branch → hydration crash. Root cause confirmed.
- timestamp: 2026-07-04T13:15 — Removed `<enhanced:img>` element only, rebuilt, restarted preview server on port 4173 (killed stale PID first) — hydration succeeded, `.hero` count: 1, `#werkwijze` count: 0 (expected, Werkwijze/OverMij were also temporarily removed from +page.svelte at this point for isolation), no `[pageerror]` logged.
- timestamp: 2026-07-04T13:10 — With only `<Hero />` rendered (Werkwijze/OverMij removed) and `<enhanced:img>` still present — crash reproduced identically to the full-page case. Confirms fault is within Hero.svelte itself, not an interaction with Werkwijze/OverMij.
- timestamp: 2026-07-04T13:05 — `/contact` route loaded cleanly via Playwright, no `[pageerror]` — rules out shared layout/Nav/Footer/JSON-LD.
- timestamp: 2026-07-04T13:00 — Full page `/` (Hero+Werkwijze+OverMij all present) in `npm run dev` (port 5180) hydrates cleanly, `#werkwijze` count: 1, no console errors. Confirms bug is production-build-specific.
- timestamp: 2026-07-04T12:58 — Full page `/` via `vite preview` (production build) — `[pageerror] TypeError: Cannot convert undefined or null to object at Object.entries` on every load; `.hero` and `#werkwijze` both count 0 post-hydration.

## Eliminated

- hypothesis: "Stale/cached prerendered output from an old build (dated Jun 25) being served instead of a fresh one" — eliminated: killed the stale `vite preview` process (found via `netstat` LISTENING PID) and restarted after each rebuild; crash persisted with a verified-fresh `.svelte-kit/output`.
- hypothesis: "Dead `/reviews` footer link causing a broader build/runtime issue beyond just blocking prerender" — eliminated: removing the dead link only fixed the `npm run build` prerender failure itself; the hydration crash is a fully separate issue that appeared immediately after the build started succeeding.
- hypothesis: "Bug is in Werkwijze.svelte's rebuilt scroll-jack mechanism or OverMij.svelte (today's 2 completed quick tasks)" — eliminated: crash reproduces with ONLY `<Hero />` rendered, Werkwijze and OverMij fully removed from the page.
- hypothesis: "Bug is in SocialIcon.svelte, HeroServiceCard.svelte, ButtonLink.svelte, or Hero.svelte's general markup/CSS" — eliminated: all of these remained in place when the crash disappeared; only the `<enhanced:img>` element was removed.

## Resolution

**root_cause:** `<enhanced:img src={heroImg}>` used a dynamic (variable) src instead of a static string literal. `@sveltejs/enhanced-img` only fully static-compiles the `<picture>` output for static string `src`; a variable `src` compiles to a runtime `dynamic_img_to_picture()` branch guarded by `typeof x === 'string'`. This project's Rolldown/oxc-based production minifier miscompiled that guard into a broken string-concatenation comparison that is structurally always false, so the client always took the `{:else}` branch (`Object.entries(heroImg.sources)`) even though `heroImg` was an unenhanced plain string with no `.sources` property — crashing hydration. SSR took the correct (`<img>`) branch, producing an SSR/client branch mismatch.

**fix:** Changed `Hero.svelte` to use a static string literal `src="../../images/hero-illustration.png"` on `<enhanced:img>` and removed the now-unused `import heroImg from '$lib/images/hero-illustration.png'`. This routes through enhanced-img's static `img_to_picture()` path (real AVIF/WebP `<source>` output, explicit width/height for CLS), eliminating the runtime branch entirely — also fixes a second latent issue where the hero image was never actually being enhanced at all.

**verification:** Rebuilt (`npm run build`), killed stale `vite preview` process, restarted fresh on port 4173, loaded `/` via Playwright/chromium at 390×844 — zero `[pageerror]`, `.hero` count 1, `#werkwijze` count 1, `#over-mij` count 1. Confirmed via a second independent script run after the fix (not just the debugger's own check).

**files_changed:** `src/lib/components/global/Hero.svelte`

**status:** resolved — 2026-07-04
