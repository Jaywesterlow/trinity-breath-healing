# Research — would GSAP make the Behandelingen carousel physics an easy fix?

Date: **2026-08-08**
Status: **findings only, nothing implemented.** No code touched.

---

## Answer in one paragraph

No — not "easy," and probably not the right move at all. GSAP's licensing is no longer a
blocker (Draggable + InertiaPlugin are genuinely free now, see below), and InertiaPlugin's
throw-with-snap is a real, better-tuned version of what we hand-rolled. But wiring it into this
component means adopting the "hidden proxy" pattern — Draggable dragging an invisible element
that isn't `--pos` itself, with our own `onUpdate`/`onDragEnd` callback translating its `x` into
`offset` and still running `absorbWholeSteps()`/`shiftOne()` ourselves — plus a ~44KB gzip
client-only dependency, a dynamic-import/SSR guard, and a rewrite of the release path. That is a
half-day-plus job, not a find-and-replace, and it does not touch the two things most likely to
actually be wrong with the current feel (see the hypothesis section). **What I'd do instead:**
rebuild the release path on Svelte 5's built-in `Spring` class (`svelte/motion`, already in the
project via Svelte 5, zero new bytes) using its `preserveMomentum` option, which exists
specifically for "fling" gestures and replaces our two-phase decay-then-cubic-ease hack with one
continuous critically-damped-spring motion — the same physical model real touch interfaces
actually use. That is a smaller change than adopting GSAP, costs nothing, and directly targets
the seam in the current code.

---

## GSAP licensing status

Confirmed by fetching the primary sources directly (not from memory, not from blog posts):

- **[gsap.com/pricing](https://gsap.com/pricing/)** — page headline is "Pricing: Now Free!" and
  explicitly lists **Draggable** and **Inertia** among the plugins included, alongside
  ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, and the rest of what used to be Club
  GreenSock-only.
- **[gsap.com/community/standard-license](https://gsap.com/community/standard-license/)** — the
  actual license text ("Standard 'No Charge' GSAP License"). Key points, quoted directly:
  - **Effective date: April 30, 2025. Last modified: May 30, 2025. Copyright © 2025, Webflow.**
  - "Permitted Uses" = implementation/use of GSAP Products on any website, web app, or digital
    interface by any person or entity — explicitly including companies that compete with
    Webflow in other areas of business.
  - The only restriction ("Prohibited Uses") is building **no-code visual animation-builder
    tools that compete with Webflow's own visual animation building capabilities** — not
    relevant to a marketing site consuming GSAP as code.
  - FAQ, quoted: *"Can I really use GSAP in commercial projects without paying anything? Yes,
    really! Commercial usage is covered under the standard license. All of GSAP including the
    plugins that were formerly 'members-only' like SplitText and MorphSVG can be used in
    commercial projects at no charge."*
- Context (via search, not independently fetched — `webflow.com/blog/gsap-becomes-free` returned
  a fetch error, `HeadersOverflowError`, so this paragraph is corroboration, not a primary read):
  Webflow acquired GreenSock in October 2024 and made the whole library free April 30, 2025.

**Conclusion: licensing is not a blocker.** Draggable and InertiaPlugin (formerly ThrowProps /
Club GreenSock-only) are free for this commercial project, no license key, no auth token.

---

## Would it work here — the proxy/scalar question, answered concretely

Our animation is not a DOM element's `x`/`y` — it's one shared fractional number (`offset`)
combined with per-item integers (`positions[i]`) feeding a CSS custom property that drives
`rotate()`. Three sub-questions, each checked against the docs directly
([gsap.com/docs/v3/Plugins/InertiaPlugin](https://gsap.com/docs/v3/Plugins/InertiaPlugin/),
[gsap.com/docs/v3/Plugins/Draggable](https://gsap.com/docs/v3/Plugins/Draggable/)):

**1. Can InertiaPlugin drive an arbitrary scalar, not just x/y?** Yes, confirmed directly in the
docs: *"InertiaPlugin isn't just for tweening x and y coordinates. It works with any numeric
property, so you could use it for spinning the `rotation` of an object as well."* There's even a
first-class worked example for `type: 'rotation'` with `inertia: true` and a `snap` function that
rounds to 90° increments — structurally the closest thing to our per-card angle step.

**2. Does snapping to an array/increment of values work after a throw?** Yes. The `end` config
property (inside `inertia: {}`) accepts a **Number** (land exactly there), an **Array** (treated
as notches — closest one wins), or a **Function** (receives the natural landing value, returns
where to actually land — arbitrary logic, e.g. `Math.round(value / step) * step`). This is a
strict superset of what our `beginSettle()`'s `Math.round(offset)` does today.

**3. Can it drive our exact "shared distant pivot" scalar via a proxy, not a real DOM x/y?** This
is the load-bearing question, and the honest answer is: **yes, but not out of the box, and not
via an official docs example built for this exact shape.** The mechanism is Draggable's
`trigger` option — you create a `Draggable` on a plain, undragged, possibly never-appended `<div>`
proxy, but set `trigger:` to the *visible* element the user actually touches. Draggable moves the
proxy's own `x` (or `rotation`, etc.) in response to drags on the trigger, and your own
`onDrag`/`onThrowUpdate`/`onDragEnd` callbacks read `this.x` off the proxy and do whatever you
want with it — including writing it into Svelte state that drives `--pos`. This is a **real,
established community pattern**, not something I'm inferring: a CodePen titled exactly "GSAP -
Draggable Proxy" exists (https://codepen.io/sallf/pen/JjooNrd), and multiple GreenSock forum
threads discuss it by name, e.g.
https://gsap.com/community/forums/topic/28209-horizontal-scroll-with-draggable-proxy-draggable-box-not-working-independently/
and
https://gsap.com/community/forums/topic/22993-draggable-proxy-and-clickable-children/.
**I could not find GreenSock's own docs demonstrating proxy + inertia + snap combined in one
example** — the docs cover proxy dragging, and separately cover inertia+snap on a real element,
but not the specific three-way combination this component needs. Treat "it works" as
high-confidence-from-primary-source-capability-docs, not verified-against-a-working-demo.

**4. Can `absorbWholeSteps()`/the `|delta|=1` recycle invariant survive, with GSAP owning the
tween?** Yes, and this is the part I'm most confident about: GSAP would only ever own the *proxy's
own* internal scalar (raw drag distance, or a step-space value). It has no idea our
`positions[]`/recycling model exists. Our `onDrag`/`onThrowUpdate`/`onUpdate` callback would read
the proxy's current value each frame, derive `offset` from it exactly as `onWindowPointerMove`
does today, and call `absorbWholeSteps()` (which still calls `shiftOne(±1)`, still one card at a
time) — GSAP never touches `positions[]` or the DOM directly, so there's no fight. The invariant
is a derived-state invariant, not a tweened-property invariant, so preserving it is a matter of
keeping the same "derive from a continuously-driven scalar" shape we already have — just with
GSAP supplying that scalar's motion instead of our own rAF loop.

**Net:** technically sound, not "wire it up in 20 minutes." It's a rewrite of the release-path
plumbing (proxy setup, `onDragEnd` building the `inertia` config with a computed `end` function,
`onUpdate` translating proxy state into `offset`) with the position/recycle model kept exactly as
is.

---

## Cost — real numbers

Measured directly (not from a size chart) by downloading `gsap@3.15.0`'s actual dist files from
unpkg and gzipping them at level 9 — the same compression Vercel/Brotli-adjacent CDNs use as a
floor:

| file | raw | gzip |
|---|---|---|
| `gsap.min.js` (core) | 72,927 B | **27.7 KB** |
| `Draggable.min.js` | 35,762 B | **13.2 KB** |
| `InertiaPlugin.min.js` | 7,335 B | **3.2 KB** |
| **Total, minimum viable set** | | **≈ 44.1 KB gzip** |

For comparison, Bundlephobia's own figure for the bare `gsap` core package (no plugins) is
27,350 B gzip — matches the number above within rounding
(https://bundlephobia.com/package/gsap, queried via the Bundlephobia API directly).

Context: this project's entire current `dependencies` block is `clsx` (~0.3KB), `tailwind-merge`
(~2-3KB), and `zod` (~formsschema, tree-shaken small) — nothing animation-related exists today;
all motion on the site is hand-rolled CSS/JS. **44KB gzip would be, by a wide margin, the single
largest dependency this project has ever added**, for one carousel's release physics.

**Tree-shaking:** imperfect. GSAP's plugin files are separate ES modules
(`gsap/Draggable`, `gsap/InertiaPlugin`), so importing only what's needed is possible at the
import-statement level, but the community's own experience (GreenSock forum,
https://gsap.com/community/forums/topic/28599-gsap-imports-tree-shaking-reduce-bundle-size/)
is that plugin registration side effects (`gsap.registerPlugin(...)`) commonly defeat
bundler-level dead-code elimination beyond "import only the files you use" — i.e. the 44KB
above is close to the realistic floor, not a worst case.

**SSR / SvelteKit:** GSAP (and Draggable especially) touch `window`/`document` at
setup/registration time, which is fatal during SvelteKit's SSR/prerender pass unless it's kept
strictly client-side — `import()` inside `onMount`, or gated behind `browser` from
`$app/environment`, same pattern this codebase already uses elsewhere (e.g.
`prefersReducedMotion()`'s own `matchMedia` guard in `Behandelingen.svelte`, and the reasoning
documented in `HANDOFF.md` under "Above the fold vs below it"). **I did not find a GSAP-specific
SvelteKit SSR guide to cite directly** — this is a well-established general SvelteKit pattern
(confirmed via search across multiple independent "window is not defined in SvelteKit" writeups)
applied to GSAP by inference, not a GSAP+Svelte primary source. Given this project is fully
prerendered SSG and the carousel's markup/links must exist in the initial HTML regardless (AI
crawler requirement), a dynamic import gated to client-side interaction would keep GSAP off the
critical rendering/LCP path — but it still has to parse and execute before the carousel is
interactive, which is a real INP/TBT cost on the JS budget the CI gates check
(`lighthouserc.json`: `categories:performance` min score 0.85, LCP hard-gated at 2500ms).

---

## Alternatives, compared

| Option | Effort | Dependency cost | Feel quality | Risk |
|---|---|---|---|---|
| **GSAP Draggable + InertiaPlugin (proxy pattern)** | High — proxy setup, SSR-guarded dynamic import, rewrite release path, keep recycle invariant manually | ~44KB gzip, client-only | Very good (real momentum + snap engine, tunable resistance/duration) | Biggest dependency the project has ever taken on for one component; proxy+inertia+snap combo not directly documented, only inferred from separate doc sections + community examples |
| **Fix the hand-rolled loop (critically-damped spring, one continuous motion)** | Low-medium — replace `momentumTick`/`beginSettle` two-phase logic with one spring update | Zero | Should be very good if tuned right — this is structurally what native touch UIs do | Requires correctly implementing spring math (stiffness/damping) by hand if not using `Spring` |
| **Svelte 5 `svelte/motion` `Spring`** | Low-medium — same rewrite as above, but the spring math and the velocity-preserving handoff (`preserveMomentum`) are supplied by the framework | **Zero** (already ships with Svelte 5, which this project already uses) | Should be very good — critically-damped-spring is the documented native-feel model (see hypothesis section) and `preserveMomentum` exists *specifically* for fling handoff | No worked example combining live drag-follow + `preserveMomentum` release found in official docs; the `instant`/`preserveMomentum` interaction during a live drag needs empirical verification, not just a docs read |
| **CSS `scroll-snap` with a real scroll container** | High — would mean abandoning or heavily reworking the shared-pivot fan geometry | Zero, browser-native | Excellent momentum, but likely wrong *shape* — see below | Native scroll containers move children by linear `scrollLeft`; this component's per-card angle is a nonlinear function of distance from a shared off-screen pivot, which is not something `scroll-snap` computes for you. You'd still need JS (or per-card `scroll()`-timeline CSS, itself a bigger rewrite) to turn scroll position into each card's own rotation — and per this repo's own prior research (`RESEARCH-werkwijze-stutter.md`), driving *any* per-frame transform from a JS `scroll` listener reintroduces the exact main-thread-lag stutter that file diagnosed and fixed for the Werkwijze section. Recycling (infinite loop of >3 visible cards) is also awkward under native scroll-snap without DOM duplication. **Likely geometry-incompatible without a redesign**, not a drop-in fix. |
| **`motion` (motion.dev, formerly Motion One)** | Medium | Smaller than GSAP — Framer/Motion's own published numbers for the comparable "mini" animate path are ~2.3KB gzip, full component ~34KB, `LazyMotion`+`m` ~4.6KB (React-specific figures, https://motion.dev/docs/react-reduce-bundle-size — **motion.dev's drag+inertia combo is primarily exposed through their React/Vue component APIs**, not a simple framework-agnostic `animate()` call, so I could not confirm an equivalent Draggable-proxy-style scalar-driving pattern exists for vanilla/Svelte use without further investigation) | Likely good, unverified for this exact use | Smaller than GSAP but the drag+inertia surface may not map cleanly to a non-React setup — needs its own investigation before recommending, not fully researched here |
| **Embla Carousel (bring it back)** | N/A — rejected already | N/A | N/A | **Do not.** Embla was removed from this exact component on 2026-08-06 (commit `9195dee`, "Rebuild Behandelingen carousel as a click-driven fanned-card layout") specifically because it was buggy here: `engine.animation.stop()` never restarted after Embla judged the carousel idle (fresh-page-load freeze until manually flicked), pagination dots didn't track autoscroll motion without a custom patch, and the whole thing needed `[carousel-debug]` console logging to diagnose. See `KNOWN-ISSUES.md` ("Services / Behandelingen section — SUPERSEDED") and `HANDOFF.md` ("The Behandelingen carousel rebuild"). This was a deliberate, documented rejection, not an oversight. |

---

## Hypothesis: what actually feels wrong right now

Read `src/lib/components/global/Behandelingen.svelte` end to end. The two most likely causes,
in order of confidence:

**1. The settle phase is a second motion with its own, distance-independent duration — the exact
"grafted-on second phase" the task flagged as a leading candidate.** `beginSettle()`
(lines 373-384) always runs `SETTLE_DURATION_MS = 300` regardless of how far `offset` actually is
from the nearest integer. Whether momentum decayed to a stop 0.02 steps from a card or 0.48 steps
from one, the ease-out phase takes the same 300ms. A momentum phase that's still visibly moving
gets handed off into a fixed-time cubic ease (`1 - (1-t)^3`, line 388) with **no continuity
requirement between the two curves' velocities at the handoff instant** — `momentumTick` just
stops calling itself and `settleTick` starts from whatever `offset`/direction happened to be true
at that exact frame, on its own clock. Two different easing functions, two different timing
models, stitched at a boundary neither one is aware of. That reads as "the motion changes
character partway through" — plausibly exactly what "not fixed" means.

**2. Most releases get *no* coast at all, and the ones that do coast less than a phone does.**
`MOMENTUM_MIN_VELOCITY = 0.35 / PX_PER_STEP` ≈ 0.0039 steps/ms, i.e. **350 px/s** — a genuinely
brisk flick. Anything gentler skips `beginMomentum()` entirely and jumps straight into the
300ms-fixed `beginSettle()` from wherever the drag ended. Combined with #1, a moderate, deliberate
swipe — not a hard fling, not a light tap — gets the *least* physically satisfying treatment: no
decay, an arbitrary fixed-time ease, and (per the code's own comment on line ~258) any real drag
under half a step lands back on the **same card**, which reads as "the carousel refused to move."
Separately, for the flicks that *do* clear the threshold and get real momentum,
`MOMENTUM_TAU_MS = 180` decays roughly **twice as fast** as the time constant real touch
interfaces use: independent research (not code-reading — see Sources) puts iOS's own momentum
decay time constant at **~325-500ms**, not 180ms. A shorter tau makes even a "successful" flick
coast for a noticeably shorter, stubbier distance than the phone gestures a mobile user's muscle
memory expects.

**Less likely but worth ruling out:** "settle target is always nearest card" (candidate #4 in the
task prompt) is real but probably secondary to #1/#2 above — it's a symptom of the same threshold
problem (a gentle flick that doesn't clear `MOMENTUM_MIN_VELOCITY` has nothing pushing it past the
halfway point to the next card, so it rounds back home), not an independent bug.

---

## Recommendation, with reasoning

**Do not add GSAP for this.** Licensing is fine and the capability is real, but the actual fix
this component needs is a *shape* change (one continuous physical model instead of two stitched
phases, and a lower bar for "this counts as a flick"), not a *library* change — and GSAP's own
mechanism for that shape (proxy + InertiaPlugin) still requires us to hand-write exactly the same
"read a driven scalar every frame, fold it into `positions[]`" plumbing this file already has, on
top of a 44KB dependency, an SSR guard, and a pattern that isn't documented for our specific
combination (proxy + inertia + snap together).

**Instead:** rebuild the release path (`beginMomentum`/`momentumTick`/`beginSettle`/`settleTick`,
roughly lines 353-399) on Svelte 5's `Spring` class from `svelte/motion`
(https://svelte.dev/docs/svelte/svelte-motion, available since 5.8.0 — already satisfied by this
project's `svelte: ^5.56.1`, zero new bytes). Concretely: wrap `offset` (or the full continuous
`positions[i] + offset` scalar) in a `Spring`, drive it 1:1 during drag with
`spring.set(value, {instant: true})` the way `offset` is written today, and on release call
`spring.set(nearestStepTarget, {preserveMomentum: <some ms>})` — an option that exists
specifically for "fling gestures" per the docs, meaning the spring continues on its current
trajectory rather than starting a disconnected new curve. That directly removes the exact seam
identified in the hypothesis (one continuous critically-damped-spring motion, not
decay-then-cubic-ease), matches the physical model real touch UIs actually use for the settle
(spring-envelope resolution, not a fixed-duration tween — see the UIKit Dynamics reconstruction
cited below), and costs nothing. It still needs real tuning (`stiffness`/`damping` by feel, and
verifying `preserveMomentum` genuinely picks up velocity from a stream of `instant: true` sets
during drag — I did not find a worked example proving that interaction, so budget time to verify
it empirically before committing to it) and the `MOMENTUM_MIN_VELOCITY` threshold should almost
certainly come down regardless of which physics engine ends up under it. If the `Spring`-based
rewrite is tried and the feel is still wrong for reasons unrelated to the two-phase seam, GSAP's
InertiaPlugin remains the documented fallback — but it should be a second move, not the first.

---

## Sources

- [Pricing | GSAP](https://gsap.com/pricing/) — fetched directly, "Now Free!", Draggable/Inertia listed
- [Standard License - GSAP](https://gsap.com/community/standard-license/) — fetched directly, full license text, effective 2025-04-30
- [Inertia | GSAP | Docs & Learning](https://gsap.com/docs/v3/Plugins/InertiaPlugin/) — fetched directly
- [Draggable | GSAP | Docs & Learning](https://gsap.com/docs/v3/Plugins/Draggable/) — fetched directly
- [GSAP - Draggable Proxy (CodePen)](https://codepen.io/sallf/pen/JjooNrd) — found via search, community proxy-pattern example
- [Horizontal scroll with draggable proxy — GSAP forum](https://gsap.com/community/forums/topic/28209-horizontal-scroll-with-draggable-proxy-draggable-box-not-working-independently/)
- [Draggable Proxy and clickable children — GSAP forum](https://gsap.com/community/forums/topic/22993-draggable-proxy-and-clickable-children/)
- [Gsap imports tree shaking — GSAP forum](https://gsap.com/community/forums/topic/28599-gsap-imports-tree-shaking-reduce-bundle-size/)
- [bundlephobia.com/package/gsap](https://bundlephobia.com/package/gsap) — queried via Bundlephobia's own API
- `gsap@3.15.0` dist files fetched directly from unpkg and gzipped at level 9 to produce the size table above (methodology, not a citation)
- [svelte/motion • Svelte Docs](https://svelte.dev/docs/svelte/svelte-motion) — fetched directly, `Spring`/`Tween`/`preserveMomentum` API
- [Flick List with its Momentum Scrolling and Deceleration — ariya.io](https://ariya.io/2011/10/flick-list-with-its-momentum-scrolling-and-deceleration) — fetched directly, exponential-decay time-constant analysis, 325ms figure
- [UIScrollView's Inertia, Bouncing and Rubber-Banding with UIKit Dynamics — Arkadiusz Holko](https://holko.pl/2014/07/06/inertia-bouncing-rubber-banding-uikit-dynamics/) — fetched directly, spring-based boundary settle reconstruction
- [Mastering Carousels with GSAP — Codrops](https://tympanus.net/codrops/2025/04/21/mastering-carousels-with-gsap-from-basics-to-advanced-animation/) — fetched directly, general GSAP carousel patterns (`horizontalLoop()`, function-based values), no direct fan/pivot example found
- [Reduce bundle size of Framer Motion — motion.dev](https://motion.dev/docs/react-reduce-bundle-size) — found via search, React-specific bundle figures for `motion`/Motion One comparison
- Not independently verified (search-only, flagged in text above): `webflow.com/blog/gsap-becomes-free` (fetch failed — `HeadersOverflowError`); a GSAP-specific SvelteKit SSR guide (none found; general SvelteKit `window is not defined` pattern applied by inference); a worked example combining Svelte `Spring`'s `instant` drag-follow with `preserveMomentum` release
- Repo history: `git log --all --oneline -- package.json`, `git show 9195dee --stat`, `KNOWN-ISSUES.md`, `HANDOFF.md` — Embla removal reasoning
