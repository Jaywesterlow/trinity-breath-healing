# Known Issues — deferred, not fixed yet

Last updated: **2026-07-26**

Read the date above before answering "what issues are still open?" — anything here
was true as of that date and may have been fixed since.

---

## Waiting on real-world data (owner to check after launch)

### Hero entrance may be costing LCP

The hero holds its text for **2.86s** while the illustration draws itself. The heading is the
Largest Contentful Paint element, and an element at `opacity: 0` does not count as painted, so
that wait lands on LCP. The project budget is LCP < 2.5s.

Unresolved because it cannot be measured in the dev container — first paint there is ~13s,
which swamps the animation entirely.

**Owner:** after launch, check Search Console → Core Web Vitals → LCP. If it is flagged,
shorten the hero draw (regenerate the trace with a shorter stagger) rather than removing the
wait — the wait is a deliberate design choice. Pairs naturally with the SVG regrouping task.

Full reasoning in the root `HANDOFF.md`.

---

## Deferred on purpose (not touching now)

### Contact section — unfinished

- Branch: `feat/contact-section`
- Both panels are placeholders: `ContactForm.svelte` and `DatePlanner.svelte` render a
  flat dark-olive box with the literal text "contact form" / "date planner".
- No form fields, no validation, no submit action, no Resend EU endpoint.
- No Cal.com embed for the "Online meeting" option.
- `/contact` route is still the `StubLayout` stub — the section only exists on the landing page.

### Services / Behandelingen section — transition bugs

- Transitions between the service cards are janky / not right yet.
- Owner said: leave alone, fix in a later pass.
- Separately: `Behandelingen.svelte` still ships `[carousel-debug]` `console.log` calls, one
  of which fires on every seek. Noticed 2026-07-25 while profiling; not touched because this
  section is off limits for now. Should go when the transitions are fixed.
- Engineering notes from an earlier debugging pass on this carousel (Embla-based), salvaged
  before the session's handoff files were archived:
  - `engine.animation.stop()` is never restarted once Embla's own `render()` judges the
    carousel settled and idle — this is the root cause of the fresh-page-load freeze (the
    carousel does not move at all until the user manually flicks it).
  - Embla only emits `select` from `ScrollTo.scrollTo()`, so pagination and the active-card
    state never update from pure ticker motion; a custom `emitSelectIfIndexChanged()` was
    added to keep them in sync during autoscroll.
  - Hover was changed from a full stop to a 30% slowdown (`HOVER_FACTOR`) so it stops fighting
    drag.
  - The freeze bug was root-caused but not fixed, and never verified in a real browser.

---

## In scope for the polish pass (branch `polish/site-polish`)

### 1. Draw-on order is random on non-hero art

- `Hero.svelte` / `hero-illustration.svg` is correct: 4 semantic groups, so ridges → tree →
  river → waterfall draw in a readable order.
- `card-kennismaking.svg` (teacups) and `card-verdieping-bg.svg` (tree + path) have all paths
  in **one** group with uniform micro-delays baked in path-index order. Result: everything
  appears to draw at once, in no meaningful order.
- Fix: group paths semantically and re-stagger, matching the hero's approach.

### 1b. Card art is parked as `<img>`, not inline

While the draw order is being reworked, the three Werkwijze card traces are referenced by
URL (`?url`) and rendered as plain `<img>`, with `DrawOn animate={false}` left in
`WerkwijzeCard` for whenever inline comes back. Reasons, in order of weight:

- Each trace is one compound fill path gated by a `<mask>` of up to 367 stroked paths.
  Inlined, that mask is live DOM the browser re-rasterises whenever the card's layer is
  re-rastered — and Werkwijze is the only part of the page that moves during scroll.
- It removed ~129 KB from the prerendered landing page HTML.

Re-inlining is a one-line switch back to `?raw` + `artSvg`, and is required before the
per-path draw animation can be restored.

### 2. No scroll fade-in

- Content pops in with no entrance. Needs a per-element fade/rise on scroll.
- Must be applied per element (heading, paragraph, each card), **not** to whole sections —
  section-level fade looks wrong.
- Must degrade to fully visible with no JS (prerendered HTML must stay readable to crawlers)
  and must respect `prefers-reduced-motion`.

---

## Other open follow-ups

### Three overlapping asset directories

`src/lib/images/`, `src/lib/assets/images/`, and `static/images/` all exist and overlap by
name. `src/lib/assets/images/` holds five dead 1×1 70-byte stubs (`hero.png`, `card-*.png`,
`about-illustration-*.png`) that nothing imports. Worth collapsing into one location.

### FAQ route is a stub, but the footer links to it

`src/routes/faq/+page.svelte` is still a `StubLayout` stub while `Footer.svelte` links to
`/faq` — a linked stub page is an SEO liability. Either render the FAQ content there or drop
the footer link.

### `image.test.ts` flakes on timeout

Tests 5-7 in `tests/unit/image.test.ts` each spawn `node tsc` with `--ignoreconfig`; measured
cold-start times (4789ms / 4233ms / 6131ms) sit right against the 5000ms vitest timeout, so a
different one fails on each run. Fix is an explicit per-test timeout.

### Contact copy assertions still commented out

`scripts/check-copy.sh` has the Contact section's copy assertions commented out — deferred
since the Contact section itself is still placeholders (see above).
