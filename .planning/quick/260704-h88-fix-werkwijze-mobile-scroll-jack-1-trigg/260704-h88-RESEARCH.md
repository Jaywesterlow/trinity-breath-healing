# Quick Task 260704-h88: Fix Werkwijze mobile scroll-jack - Research

**Researched:** 2026-07-04
**Domain:** Pinned horizontal-scroll ("scroll-jacking") interaction pattern, vanilla JS/CSS
**Confidence:** MEDIUM-HIGH (mechanics are well-documented and cross-verified across multiple sources; no single canonical "reference implementation" exists for the *exact* combination requested — true wheel/touch lock + IO-based mid-viewport trigger — because most production examples use the *non-locking* GSAP ScrollTrigger pin model instead. See Pattern A vs Pattern B below.)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Trigger point:** horizontal-scroll phase starts only once the section/first card reaches the **vertical middle of the viewport** — not top/bottom edge.
2. **True scroll-lock during horizontal phase:** vertical page scroll must be **fully disabled** while horizontal card-scroll is active — not a sticky/transform illusion. This supersedes the prior quick task's "no preventDefault, no scroll lock" decision. Must intercept wheel/touchmove, and likely keyboard scroll keys (Space/PageDown/Arrow) while locked.
3. **Re-enable on completion:** once horizontal scroll reaches the last card, vertical scroll resumes normally, continuing past the section.
4. Research first — well-known pattern, don't reinvent from scratch.

### Non-negotiable carryovers (still apply)
- `prefers-reduced-motion: reduce` → scroll-jack fully disabled, plain vertical scroll + native horizontal swipe/snap on the card track.
- Desktop (≥1024px) completely unaffected.
- All 3 cards remain in server-rendered initial HTML, unconditionally, in document order (SSG/AEO requirement).
- No keyboard focus trapping — Tab must still move focus through card CTAs normally, distinct from the scroll-key interception in decision #2.

### Claude's Discretion
- Exact scroll-lock mechanism (body `overflow:hidden` vs `overscroll-behavior` vs wheel/touch `preventDefault` + delta accumulation vs IO-driven state machine) — resolved below.
- Whether "vertical middle" is measured against section top, first card center, or pin-wrapper center — default to pin-wrapper/section center if no stronger signal emerges. **Resolved: use the pin wrapper element as the IO target (see Trigger Mechanism), since it represents "the whole pinned unit," not an individual card.**
- Handling fast/flung scroll gestures that could skip the trigger point — **Resolved: IntersectionObserver crossing detection, not continuous position sampling (see below).**

### Deferred Ideas (OUT OF SCOPE)
None recorded in CONTEXT.md for this quick task.
</user_constraints>

## Summary

The current implementation (`Werkwijze.svelte`) is what the industry calls a **Pattern A / "scroll-driven pin"**: it grows the pin wrapper's height by `maxOffset`, uses `position: sticky`, and derives `translateX` from `getBoundingClientRect()` sampled on the native `scroll` event. This is exactly how GSAP ScrollTrigger's pin + horizontal-scroll recipe and CSS `animation-timeline: view()`/`scroll()` work under the hood — **native vertical scroll is never stopped**; it's continuously converted into horizontal progress. That model is correct for "cards slide as you scroll" but it structurally cannot produce a true lock, and it is also why the current build "reaches the point where horizontal takeover should begin" as soon as any part of the sticky element's top crosses 0 (top-edge trigger, not mid-viewport), and why the trigger/offset math is fragile.

The user has explicitly asked for **Pattern B / "true scroll-lock" (wheel/touch hijack)**, the older, more invasive pattern seen on early-2010s Apple product pages and interactive story sites, and still used today by libraries like `fullpage.js`. In this pattern, vertical scroll is genuinely frozen (via `wheel`/`touchmove` `preventDefault()` + manual delta accumulation, not via native scroll position), the section is pinned at a fixed viewport position (no extra scroll-distance padding needed), and control is handed back to native scroll only when the horizontal sequence completes. This is a materially different mechanism from what's in the file today — it is not a bug fix to the existing code, it is a swap of the underlying model.

**Primary recommendation:** Rebuild the mobile behavior as a 3-state machine (`idle-before → locked → idle-after`) driven by (1) an `IntersectionObserver` with `rootMargin: "-50% 0px -50% 0px"` on the pin wrapper to detect the mid-viewport crossing and engage the lock, and (2) `wheel`/`touchmove`/`keydown` interception with `{ passive: false }` + `preventDefault()` while locked, manually accumulating delta into a clamped `offset` (0..maxOffset) that drives `translateX`. Release the lock (remove listeners, let native scroll resume) when `offset` reaches `maxOffset` going forward. No new dependency required — this is achievable in the existing Svelte 5 + plain CSS + vanilla JS stack.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mid-viewport trigger detection | Browser / Client | — | Pure client-side viewport geometry; no SSR/API involvement |
| Scroll-lock (wheel/touch/key interception) | Browser / Client | — | Must run on main thread, client-only; SSG output is unaffected (initial HTML unchanged, cards still all present) |
| Horizontal card transform | Browser / Client | — | CSS transform driven by JS state, scoped Svelte styles |
| Reduced-motion bypass | Browser / Client | — | `matchMedia` read at mount; no server involvement |
| SSR/initial HTML (card markup, order) | N/A — unaffected | — | This task only changes client-side interaction JS/CSS; no server-rendered output changes |

## Pattern A vs Pattern B (the core research finding)

| | Pattern A: "Scroll-driven pin" (current code, GSAP ScrollTrigger, CSS `animation-timeline`) | Pattern B: "True scroll-lock" (what user wants) |
|---|---|---|
| Native vertical scroll | Continues the whole time; horizontal motion is a *function of* scroll position | Frozen; scroll events are cancelled via `preventDefault()` |
| Pin wrapper height | Padded by `maxOffset` extra pixels so scrolling through that padding drives progress [CITED: gsap.com/docs/v3/Plugins/ScrollTrigger] | No extra height needed — pin wrapper stays viewport-sized; nothing scrolls during the lock |
| Trigger detection | Any position sampling works (top-edge, sticky auto-engages) | Must be edge-triggered at a precise geometric moment (mid-viewport) since engaging is a discrete state transition, not a continuous function |
| Robustness to fast/flung scroll | Naturally robust (progress = position, can't be "skipped," just jumps ahead) | Requires `IntersectionObserver` (see below) — continuous `rAF`+`getBoundingClientRect` sampling on the native `scroll` event range can, in principle, have its per-frame sample land past the trigger point on a hard fling, same as the current file's `onScroll` handler |
| Prior art | GSAP ScrollTrigger `pin: true` + `horizontal: true` [CITED: gsap.com/docs/v3/Plugins/ScrollTrigger]; CSS `animation-timeline: view()` [CITED: developer.chrome.com/docs/css-ui/scroll-driven-animations, joshwcomeau.com/animation/scroll-driven-animations] | Older Apple marketing pages (pre-2017), `fullpage.js`-style paginated scroll, "wheel-hijack" carousels [CITED: css-tricks.com/snippets/jquery/horz-scroll-with-mouse-wheel, multiple CodePen wheel-delta examples] |
| Accessibility reputation | Neutral-to-good if `prefers-reduced-motion` respected — page position and native scroll semantics stay intact | Explicitly the pattern accessibility guides warn about [CITED: dontfuckwithscroll.com; webflow.com/accessibility/checklist/task/avoid-scrolljacking] — must be implemented carefully (keyboard escape, reduced-motion bypass, no trapping) to avoid the well-known "scrolljacking is bad" failure mode |

**Conclusion:** The user's decision #2 is a deliberate, informed choice to move from A to B. Do not try to patch Pattern A's math (trigger + offset clamping) — the fragility isn't a bug in the arithmetic, it's a structural mismatch between "continuous scroll-driven" and "discrete locked phase." Rebuild per Pattern B below.

## Trigger Mechanism (Decision area 1)

**Recommendation: `IntersectionObserver` with a mid-viewport rootMargin, not continuous `getBoundingClientRect()` polling.**

```js
// Shrinks the observer's effective viewport to a 0-height horizontal line
// at the vertical center of the screen. Firing on isIntersecting === true
// (crossing that line) is the "reached vertical middle" signal.
const trigger = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting && !locked && !completed) engageLock();
  },
  { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
);
trigger.observe(pinEl);
```
`rootMargin: "-50% 0px"` shrinking the root to a horizontal center line is a documented, commonly cited IO recipe for "detect when element crosses viewport middle" [CITED: MDN Intersection Observer API — rootMargin semantics; corroborated by multiple scrollspy/viewport-center write-ups found via WebSearch, e.g. Yash Mahalwal's Medium scrollspy piece and web.dev-style IO guides]. Use the **pin wrapper** (`pinEl`, the whole pinned unit) as the observed target, not an individual card — matches the discretion-area default in CONTEXT.md.

**Why this beats continuous polling for the "fast/flung scroll" requirement:**
- The current file's `onScroll` handler sacrifices no information about *when* the threshold was crossed — it's a continuous function, fine for Pattern A, but for Pattern B you need a **discrete, edge-triggered "engage now" event**. Driving that off a `rAF`-throttled `scroll` handler risks the classic problem: a fast fling can produce two consecutive samples that straddle the trigger point with no sample landing near it, and if your logic is "engage when `rect.top <= vh/2` AND `rect.top was > vh/2` last frame," you still catch it correctly (edge-detection on any two-sample pair still detects a crossing) — so in fairness, either approach *can* be made robust with correct edge-detection logic. **The real advantage of IO here is architectural, not purely robustness**: IO decouples "detect the crossing" from "the main-thread scroll/rAF loop," runs off dedicated browser bookkeeping rather than a listener you must remember to throttle correctly, and is the idiomatic/recommended replacement for scroll-position polling for exactly this class of problem [CITED: MDN Intersection Observer API intro — "avoid the need for scroll event listeners and constant DOM geometry recalculation"]. Given the current bug is precisely in a hand-rolled scroll/rAF sampling loop, switching to IO for the trigger removes an entire class of "when exactly did we cross" edge-case bugs, even though a purely mathematical fix to the old loop was theoretically possible.
- Practical implementation note: IO callbacks fire asynchronously, generally aligned to a rendering step [CITED: MDN Intersection Observer API]. For a hard, deliberate scroll-lock **engage**, this granularity (one paint frame) is imperceptible to users and is the standard tradeoff accepted by every scrollspy/pinned-section implementation found in research.

**Un-trigger / re-engage:** once the lock later releases forward (last card reached), do not re-observe/re-engage on the same crossing again — track a `completed` flag (reset only if the section fully exits view upward, i.e., user scrolls back above it, matching natural bidirectional expectations) so scrolling back up into the section re-engages the lock in reverse, and scrolling back down past a completed section does not re-trigger it.

## True Scroll-Lock Mechanism (Decision area 2)

**Recommendation: `wheel` + `touchmove` interception with `{ passive: false }` and manual delta accumulation driving `translateX`, backed by `overscroll-behavior` and a conditional `body`/section `overflow` guard as a defense-in-depth backstop — not a replacement for `preventDefault()`.**

### Why CSS-only approaches cannot satisfy decision #2
CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`) are **presentational only** — the animation's progress is *read from* the native scroll position; the browser's actual scroll never pauses. Chrome's own docs and Josh Comeau's write-up both frame this as "the animation reacts to scroll you don't control," not "scroll is paused" [CITED: developer.chrome.com/docs/css-ui/scroll-driven-animations; joshwcomeau.com/animation/scroll-driven-animations]. This is Pattern A's model. It structurally **cannot** produce decision #2's "fully disabled vertical scroll" — confirmed negative finding, not an assumption. Do not consider `animation-timeline` for this phase.

### The actual lock, concretely

1. **`wheel` event, `{ passive: false }`:**
   - Passive listeners cannot call `preventDefault()` — Chrome makes `wheel`/`mousewheel` on `window`/`document`/`body` passive **by default** since Chrome 73, so the listener must explicitly declare `{ passive: false }` or `preventDefault()` silently no-ops [CITED: developer.chrome.com/blog/scrolling-intervention-2; MDN Element: wheel_event].
   - `deltaY`/`deltaX` are in `deltaMode`-dependent units (pixel / line / page) — normalize before accumulating [CITED: MDN wheel event docs, W3C UI Events wheel spec].
   - On each event while `locked`: `e.preventDefault()`, accumulate `offset += normalizedDeltaY * SENSITIVITY`, clamp `0..maxOffset`, set `translateX(-offset)`.

2. **`touchmove`, `{ passive: false }`:**
   - Same requirement — `{ passive: false }` or `preventDefault()` is ignored [CITED: developer.chrome.com/blog/scrolling-intervention (touch variant); corroborated by multiple carousel-lock write-ups found in WebSearch].
   - Track `touchstart` Y, compute delta per `touchmove`, `preventDefault()`, accumulate into the same `offset` state as wheel (unify the two input channels into one accumulator).
   - `touch-action: pan-y` (or none, given full lock) on the pinned wrapper should be set as declarative reinforcement, but is not a substitute for `preventDefault()` since `touch-action` only controls default touch gestures, not JS-level cancellation — treat it as belt-and-suspenders, not the mechanism itself [CITED: developer.chrome.com/blog/scrolling-intervention; Medium "prevent scroll on mobile web parent elements" write-up].

3. **`keydown` (Space, PageDown/PageUp, Arrow keys, Home/End):**
   - While locked, intercept these keys **only if `document.activeElement` is not an interactive control that needs them** (input, textarea, select, `[contenteditable]`, elements with a scroll-relevant role). This is the standard separation cited in the ACT accessibility rule for scrollable-region keyboard access: "ensure there is some element from which arrow keys can be used to control the scroll position" — the rule is about *not removing* keyboard scroll ability entirely, not about never intercepting it for an alternate purpose [CITED: W3C ACT-Rules 0ssw9k — "Scrollable content can be reached with sequential focus navigation"]. Map intercepted keys to a fixed-step offset change (e.g., ± one card width) instead of letting them scroll the page.
   - **Tab and Shift+Tab must never be intercepted** — they are not in the list above, so this falls out naturally if the keydown handler only checks for the specific scroll-triggering keys.

4. **Backstop, not primary mechanism — `overscroll-behavor` / `overflow`:**
   - Setting `overscroll-behavior: none` on `html`/`body` while locked prevents scroll-chaining/rubber-banding on iOS/Android during the brief windows where a touch gesture might slip past interception (e.g., a fast multi-touch gesture) [CITED: MDN overscroll-behavior; corroborated by `body-scroll-lock` library's documented rationale, github.com/willmcpo/body-scroll-lock — "Body scroll locking that just works with everything," a well-known small utility for exactly this iOS/Android edge-case hardening, cited here for technique reference only, **not** proposed as a new dependency per CLAUDE.md's no-new-dependency rule].
   - Toggling `body { overflow: hidden }` is a reasonable *additional* backstop for scrollbar-drag/trackpad-drag edge cases but must not be relied on alone — it does not intercept wheel/touch, only scrollbar interaction and some keyboard defaults, so it is complementary to, not a substitute for, `preventDefault()` on wheel/touchmove/keydown.

### Structural implication: no extra pin-wrapper height needed
Because native scroll position never advances during the lock (every wheel/touch tick is cancelled), you do **not** need Pattern A's `pinHeight = innerHeight + maxOffset` padding trick. The pin wrapper can simply be pinned at a fixed viewport position (`position: sticky; top: 0` while locked is sufficient, or `position: fixed` with a same-height spacer element to prevent layout collapse — GSAP's own pin implementation inserts exactly such a spacer div for this reason [CITED: gsap.com/docs/v3/Plugins/ScrollTrigger — pin-spacer]). Simplify the existing `pinHeight`/offset-from-scroll-position code out entirely; it belongs to Pattern A.

### Double-drive pitfall (found in current code, must fix)
The current CSS keeps `.werkwijze__cards { overflow-x: auto; scroll-snap-type: x mandatory }` unconditionally (for the reduced-motion/no-JS fallback), with no rule neutralizing it when `.werkwijze--scrolljack` is active. If the JS lock drives `translateX` while the native horizontal scroll container can *also* still be scrolled by touch, both mechanisms fight over the same visual position — a likely contributor to "not working properly at all." **Fix:** when locked, set `overflow-x: hidden` on `.werkwijze__cards` (only while scrolljack is engaged) so the only horizontal motion source is the JS-driven transform; restore `overflow-x: auto` for the reduced-motion/no-JS fallback path and after the lock fully disengages if you want native-swipe touch-up available again (optional — decide at implementation time, not blocking).

## Re-engaging Vertical Scroll at Completion (Decision area 3)

- When `offset` reaches `maxOffset` and further forward wheel/touch delta is received, **do not call `preventDefault()`** on that (or subsequent) event — let it fall through to native scroll. Set `locked = false`, mark `completed = true`.
- Because native `scrollY` was never moved during the lock, releasing is just "stop intercepting" — the very next native scroll tick continues the page exactly where it would have gone had no lock ever existed. No synthetic `scrollTo()` or position reconciliation is needed, which is a structural simplification vs. Pattern A (which must carefully reconcile `pinHeight` consumption against the natural document flow).
- Symmetric behavior for scrolling back up: if the user reverses at `offset === 0` and continues pulling up, release the lock going backward too (`completed` reset to allow re-engage on next forward pass) so backing out of the section feels natural. This wasn't explicitly requested but is the naturally expected complement and is cheap to add with the same accumulator — flag as **recommended, not mandatory** addition for the planner to decide on.

## Accessibility: Separating Scroll-Lock Input from Focus Movement (Decision area 4)

- **These are genuinely different input channels and the separation is native, not something you need to engineer:** `Tab`/`Shift+Tab` focus movement is handled by the browser's default focus-navigation algorithm and does not dispatch `wheel` or `touchmove` events, and it is not one of the keys your `keydown` handler intercepts (Space/PageUp/PageDown/Arrow/Home/End) — so as long as the keydown handler's key-list is scoped exactly to scroll-triggering keys, Tab navigation is unaffected by construction. No special-casing required beyond correctly scoping the intercepted key set. [Corroborated across MDN's `HTMLElement.focus()` docs and the W3C ACT rule 0ssw9k, both of which discuss focus-driven scrolling and keyboard-driven scrolling as separate mechanisms.]
- **Focus entering the pinned cards (e.g., the "Verdieping" card's CTA link) while locked:** default `element.focus()` (invoked implicitly by Tab) will call the browser's internal scroll-into-view behavior only if the element is *not already* visible within its nearest scrollable/clipped ancestor. Since the cards are horizontally offscreen via `transform: translateX`, not via native `overflow` scroll position, the browser's focus-scroll logic operates against whatever the nearest actual scrollable ancestor's scroll position is — it will not try to "undo" your transform, so focusing an offscreen-via-transform card typically does not fight your lock. If in testing a focused-but-transformed-offscreen card causes any unwanted native scroll jump, the documented fix is `element.focus({ preventScroll: true })` on any focus you programmatically manage — but note this option only suppresses *programmatic* scroll-into-view, not the one triggered by the user's own Tab press, which the browser will still perform outside your control on some engines [CITED: MDN HTMLElement.focus() — preventScroll option and its documented limitation vs. user-driven tabbing/typing]. **Recommendation: do not attempt to manage focus-scroll at all** — leave it to the browser; only intercept the wheel/touch/keydown channels explicitly named in decision #2. If a card CTA is reachable by Tab while its card is transformed offscreen, that is an acceptable, common tradeoff in this pattern (matches how off-canvas / carousel components generally behave) and is out of scope for this task unless testing surfaces an actual jump/trap.
- **No focus trap:** confirm the implementation never sets `tabindex="-1"` on out-of-view cards or calls `.focus()` programmatically to redirect focus — carryover decision from 260704-fj7 CONTEXT.md remains correct and unaffected by the scroll-lock rework.

## Reduced Motion (Decision area 5)

Confirmed as the correct, expected industry escape hatch — not an assumption specific to this project. Every general accessibility source found treats `prefers-reduced-motion: reduce` as the standard bypass for scrolljacking-style patterns specifically:
- WCAG technique C39 (using `prefers-reduced-motion` to prevent motion) is the formal reference technique [CITED: w3.org/WAI/WCAG22/Techniques/css/C39].
- Webflow's accessibility checklist item "Avoid scrolljacking" and the "Don't Fuck With Scroll" critique site both frame scrolljacking as inherently risky and call for respecting native scroll preferences / providing an escape hatch [CITED: webflow.com/accessibility/checklist/task/avoid-scrolljacking; dontfuckwithscroll.com].
- No source found recommends any escape hatch other than `prefers-reduced-motion` gating for this specific pattern class. The existing `onMount` `matchMedia('(prefers-reduced-motion: reduce)')` gate in the current file is structurally correct and should be preserved as-is in the rebuild — it must gate Pattern B's IO trigger + lock exactly as it gated Pattern A's `scroll` listener + transform today.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Detecting "element crossed viewport line X" | Manual `getBoundingClientRect()` polling on scroll/rAF | `IntersectionObserver` with `rootMargin` shrink trick | Browser-native, avoids main-thread scroll-loop coupling and reduces one class of "missed the exact frame" bugs [CITED: MDN IO API] |
| Cross-browser wheel delta normalization | Assuming `deltaY` is always pixels | Check `event.deltaMode` (0=pixel, 1=line, 2=page) before using the raw value | Documented cross-browser inconsistency [CITED: MDN wheel event; W3C UI Events wheel spec] |
| iOS rubber-band/overscroll bounce during lock | Custom touch-bounce suppression logic | `overscroll-behavior: none` (CSS, already broadly supported) as a backstop alongside `preventDefault()` | Native CSS property exists precisely for this; no JS needed for the bounce-suppression layer |

**Key insight:** No new npm dependency is justified for this task — this is a well-scoped, small state machine (IO trigger + wheel/touch/key accumulator + CSS transform) fully expressible in the existing Svelte 5 + vanilla JS + plain CSS stack, consistent with CLAUDE.md's no-new-dependency default and "plain CSS, no Tailwind/PostCSS" constraint. GSAP/ScrollTrigger and `body-scroll-lock` are cited above purely as reference implementations to model the technique on, not as packages to install.

## Package Legitimacy Audit

Not applicable — no new package is being installed for this task. All recommended techniques (IntersectionObserver, wheel/touchmove/keydown listeners, CSS `overscroll-behavior`/`touch-action`) are native browser APIs already available in the project's target browser matrix.

## Common Pitfalls

### Pitfall 1: Passive listeners silently swallowing `preventDefault()`
**What goes wrong:** `wheel`/`touchmove` handlers added without `{ passive: false }` will have `preventDefault()` silently ignored by the browser — the lock appears to do nothing, or scroll "leaks" through intermittently.
**Why it happens:** Chrome makes `wheel`/`mousewheel` listeners on `window`/`document`/`body` passive by default since Chrome 73 for scroll-performance reasons [CITED: developer.chrome.com/blog/scrolling-intervention-2].
**How to avoid:** Always explicitly pass `{ passive: false }` on every wheel/touchmove listener used for the lock.
**Warning signs:** Lock "mostly" works but occasionally a scroll tick sneaks through, especially on Chrome/Android.

### Pitfall 2: Double-driven horizontal motion (native scroll container + JS transform)
**What goes wrong:** Leaving `.werkwijze__cards { overflow-x: auto }` active while the JS lock is also driving `translateX` on the same element causes the two mechanisms to fight, producing jitter/misalignment — a strong candidate for why the current build "is not working properly at all."
**Why it happens:** The overflow-x:auto rule is needed for the reduced-motion/no-JS fallback but was left unconditional instead of gated off during the JS-driven lock phase.
**How to avoid:** Toggle `overflow-x: hidden` on the cards track specifically while `scrolljack`/`locked` state is active; restore `auto` only for the reduced-motion path and (optionally) after the section fully completes.
**Warning signs:** Cards appear to "double move" or overshoot on touch devices specifically (mouse wheel unaffected, since it never drives native horizontal scrollLeft).

### Pitfall 3: Treating IO's mid-viewport crossing as retriggerable on every intersection change
**What goes wrong:** Without a `completed`/direction guard, IO will fire again every time the pin wrapper straddles the mid-viewport line, potentially re-engaging the lock after the sequence already finished, trapping the user.
**Why it happens:** IO reports both entering and leaving intersection; a naive `if (entry.isIntersecting) engageLock()` fires on every crossing, not just the first forward one.
**How to avoid:** Track explicit `locked`/`completed` state and only call `engageLock()` when `!locked && !completed` (and only reset `completed` when the section scrolls back out of view above the viewport, for the optional bidirectional behavior).
**Warning signs:** Section "re-locks" unexpectedly when the user scrolls slowly back and forth near the trigger boundary.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manual `scroll` event + `getBoundingClientRect()` polling for trigger detection (current file's `onScroll`) | `IntersectionObserver` for crossing/edge detection | IO shipped broadly ~2019+, now the standard recommendation over scroll-event polling for "did element cross point X" questions [CITED: MDN IO API] | Removes an entire bug class (missed-frame edge detection) from the trigger logic |
| CSS scroll-driven animations (`animation-timeline: scroll()/view()`) as a "modern, no-JS" alternative | Confirmed **not applicable** to this task's true-lock requirement | Chrome 115+/Firefox 2024+ shipped these as presentational-only primitives [CITED: developer.chrome.com/docs/css-ui/scroll-driven-animations] | Ruled out explicitly rather than left ambiguous — saves the planner from investigating a dead end |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A wheel-delta "sensitivity" multiplier will need tuning by feel/testing (no universal constant found in any source) | True Scroll-Lock Mechanism | Low — purely a UX-feel tuning parameter, easily adjusted post-implementation, does not affect correctness |
| A2 | Symmetric backward-release behavior (re-enable native scroll when pulling back up past offset 0) is a reasonable UX default, not something explicitly requested by the user | Re-engaging Vertical Scroll at Completion | Low — flagged as optional/discretionary, planner should confirm with user or treat as safe default since it only adds naturalness, doesn't change forward behavior |

**If this table is empty:** N/A — see above, both entries are low-risk implementation-feel details, not compliance/security/data-retention concerns.

## Open Questions

1. **Exact wheel-delta-to-pixel sensitivity ratio**
   - What we know: normalize by `deltaMode`, then scale by some constant.
   - What's unclear: no source gives a "standard" constant — it's tuned per-project by feel (card width, typical trackpad/mouse deltaY magnitude).
   - Recommendation: pick a starting multiplier (e.g., 1:1 for pixel mode) and have the planner include a manual-testing/tuning task rather than hard-coding a guessed value as if authoritative.

2. **Whether to keep any pin-spacer / height reservation at all**
   - What we know: Pattern B doesn't need Pattern A's `pinHeight = vh + maxOffset` padding since scroll position never advances during lock.
   - What's unclear: whether `position: sticky` alone (current CSS already has `.werkwijze--scrolljack .werkwijze__sticky { position: sticky; top: 0 }`) is sufficient to keep the section pinned at a fixed viewport position for the lock's duration, or whether `position: fixed` + explicit spacer div is needed to avoid any sticky-recalculation edge cases (e.g., sticky elements can behave inconsistently if the containing block's height is exactly the viewport height with no scroll happening at all — untested for this specific case).
   - Recommendation: planner/implementer should try keeping the existing `position: sticky; top: 0` first (simplest, least invasive relative to current CSS) since no scroll position changes during lock, and fall back to `position: fixed` + spacer only if sticky proves unreliable in manual testing.

## Environment Availability

Skipped — no external tools/services/runtimes required for this task; it is a pure client-side browser API change (IntersectionObserver, wheel/touchmove/keydown, CSS) already supported by the project's existing browser targets and build tooling.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (`test:integration`) |
| Config file | `vitest.config.ts` / `playwright.config.ts` (not modified by this research) |
| Quick run command | `npm run test:unit -- --run` |
| Full suite command | `npm test && npm run test:integration` |

### Phase Requirements → Test Map
No formal REQ-IDs are attached to this quick task (no REQUIREMENTS.md entries reference Werkwijze scroll-jack specifically). Given the interaction is fundamentally about **real input events (wheel/touch/scroll position) and viewport geometry**, it is a poor fit for jsdom-based unit tests (jsdom does not implement scroll geometry, `IntersectionObserver` observation timing, or real wheel/touch dispatch fidelity) and a reasonable fit for a Playwright integration test that can drive `page.mouse.wheel()` and assert `window.scrollY` does not change while the section is mid-sequence, then does change after the last card. This is manual-only or Playwright-only by nature, not unit-testable — call this out explicitly to the planner rather than forcing a unit test that would only assert implementation details.

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Lock engages only at mid-viewport crossing, not top-edge | integration (Playwright, mobile viewport emulation) | `npx playwright test tests/integration/werkwijze-scrolljack.spec.ts` | Wave 0 |
| `window.scrollY` frozen while locked, wheel deltas move cards instead | integration (Playwright) | same file | Wave 0 |
| Vertical scroll resumes after last card reached | integration (Playwright) | same file | Wave 0 |
| `prefers-reduced-motion: reduce` fully bypasses lock (native scroll, no IO/lock listeners attached) | integration (Playwright, `emulateMedia`) | same file | Wave 0 |
| Tab still moves focus through card CTAs regardless of lock state | integration (Playwright, keyboard nav) | same file | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit -- --run` (fast unit regressions elsewhere in the codebase)
- **Per wave merge:** `npm test && npm run test:integration` (full suite incl. new Playwright scroll-jack spec)
- **Phase gate:** Full suite green before closing out this quick task

### Wave 0 Gaps
- [ ] `tests/integration/werkwijze-scrolljack.spec.ts` — new file, covers all 5 behaviors in the table above. None of this currently exists (`find` for `*werkwijze*`/`*scroll*` under `tests/` returned nothing).
- [ ] No shared fixture changes needed — existing Playwright `test.describe` convention (per STATE.md decisions log) applies directly.

## Sources

### Primary (HIGH confidence)
- MDN: Intersection Observer API — `rootMargin` semantics, async delivery model — https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- MDN: Element `wheel` event — deltaMode, passive listener requirement — https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
- MDN: `HTMLElement.focus()` — `preventScroll` option and its documented limitation — https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
- Chrome for Developers: "Making wheel scrolling fast by default" — passive-by-default behavior on window/document/body — https://developer.chrome.com/blog/scrolling-intervention-2
- Chrome for Developers: "Making touch scrolling fast by default" — touch passive defaults — https://developer.chrome.com/blog/scrolling-intervention
- Chrome for Developers: CSS scroll-driven animations — presentational nature of `animation-timeline` — https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Josh W. Comeau: "Scroll-Driven Animations" — confirms native-scroll-reactive, non-blocking model — https://www.joshwcomeau.com/animation/scroll-driven-animations/
- GSAP ScrollTrigger docs — pin-spacer mechanism, `containerAnimation` caveats — https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- W3C WAI: WCAG Technique C39 — `prefers-reduced-motion` to prevent motion — https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- W3C ACT Rule 0ssw9k — scrollable content reachable via sequential focus navigation — https://www.w3.org/WAI/standards-guidelines/act/rules/0ssw9k/

### Secondary (MEDIUM confidence)
- Webflow Accessibility Checklist: "Avoid scrolljacking" — https://webflow.com/accessibility/checklist/task/avoid-scrolljacking
- "Don't Fuck With Scroll" — scrolljacking critique/precedent for escape-hatch expectations — https://dontfuckwithscroll.com/
- `body-scroll-lock` (willmcpo) — cited for technique rationale only (iOS/Android overscroll edge cases), not proposed as a dependency — https://github.com/willmcpo/body-scroll-lock
- CSS-Tricks: "Scroll Page Horizontally With Mouse Wheel" — wheel-to-horizontal-scroll mechanics — https://css-tricks.com/snippets/jquery/horz-scroll-with-mouse-wheel/
- Medium: "How to Prevent Scroll (& Touch Move) On Mobile Web Parent Elements — while allowing it on children" — touch-action + preventDefault interplay — https://medium.com/@yev-/how-to-prevent-scroll-touch-move-on-mobile-web-parent-elements-while-allowing-it-on-children-f7acb793c621

### Tertiary (LOW confidence)
- Various CodePen wheel-delta horizontal scroll examples surfaced via WebSearch (chillside/RJjpjK, vasiluca/xWEQdQ, lemmin/xRyXMZ) — corroborate the general wheel-delta-accumulation technique but are unverified/uncredited demo code, used only as pattern corroboration, not cited for any specific claim above.

## Metadata

**Confidence breakdown:**
- Trigger mechanism (IO mid-viewport): HIGH — MDN-documented API behavior, cross-verified by multiple independent write-ups
- Scroll-lock mechanism (wheel/touch/key + preventDefault): HIGH — MDN + Chrome engineering blog are authoritative on passive-listener semantics; the overall "true lock via preventDefault + delta accumulation" pattern is corroborated by multiple independent sources but has no single canonical "here is exactly how to build this" tutorial matching this project's precise requirements — hence MEDIUM-HIGH overall for the pattern, HIGH for each individual API-behavior claim
- Pattern A vs B distinction: HIGH — directly confirmed by official GSAP docs and Chrome/Josh Comeau's scroll-driven-animation write-ups describing the non-blocking nature of that model
- Accessibility separation (focus vs scroll-key interception): MEDIUM — grounded in MDN/W3C ACT rule content but the specific "will Tab into a transform-offscreen card cause unwanted scroll" behavior was not independently verified against a live browser test in this research session; flagged for manual verification during implementation
- Reduced-motion escape hatch: HIGH — universal agreement across every accessibility source found

**Research date:** 2026-07-04
**Valid until:** ~30 days (stable browser APIs; unlikely to change, but CSS scroll-driven animation support matrix is still evolving across browsers and worth a freshness check if this task slips significantly)
