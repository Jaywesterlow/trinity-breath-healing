# Known Issues — deferred, not fixed yet

Last updated: **2026-07-25**

Read the date above before answering "what issues are still open?" — anything here
was true as of that date and may have been fixed since.

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

---

## In scope for the polish pass (branch `polish/site-polish`)

### 1. Draw-on order is random on non-hero art

- `Hero.svelte` / `hero-illustration.svg` is correct: 4 semantic groups, so ridges → tree →
  river → waterfall draw in a readable order.
- `card-kennismaking.svg` (teacups) and `card-verdieping-bg.svg` (tree + path) have all paths
  in **one** group with uniform micro-delays baked in path-index order. Result: everything
  appears to draw at once, in no meaningful order.
- Fix: group paths semantically and re-stagger, matching the hero's approach.

### 2. No scroll fade-in

- Content pops in with no entrance. Needs a per-element fade/rise on scroll.
- Must be applied per element (heading, paragraph, each card), **not** to whole sections —
  section-level fade looks wrong.
- Must degrade to fully visible with no JS (prerendered HTML must stay readable to crawlers)
  and must respect `prefers-reduced-motion`.
