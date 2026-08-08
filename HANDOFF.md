# Handoff — current state of `main`

The only live handoff. Superseded ones are in `.planning/archive/`.

Started **2026-07-26** as a handoff for `polish/site-polish`; that branch was merged into
`main` and deleted on **2026-07-31**, and this was rewritten to describe the merged result.
Written for someone starting with no context.

Updated **2026-08-07** after a long session rebuilding the Behandelingen carousel on
`claude/accessible-work-repos-kb67gy` (PR #10, open, not merged as of this update — 25 commits
ahead of `main`). See "The Behandelingen carousel rebuild" below; it supersedes everything this
file previously said about that section (which described the old, since-deleted Embla version).

**Read these first — they are maintained, this one is background:**

| document | what it holds |
|---|---|
| `.planning/notes/KNOWN-ISSUES.md` | **everything still open**, indexed at the top. Check its date before quoting it. |
| `Insights/owner-profile.md` | how the owner works: communication, review loop, what has and has not gone well. |
| `breadcrumbs.md` | technical lessons worth carrying to other projects, with the evidence. |

Also in `.planning/notes/`:

- `RESEARCH-werkwijze-scroll.md` — why the Werkwijze pin is built the way it is.
- `RESEARCH-werkwijze-stutter.md` — why the pan is driven from CSS, plus a section audit.
- `AUDIT-2026-07-27.md` — the full audit those open items came from.

---

## ⚠️ Owner action item — check this after the site goes live

**Not a code task. Nobody can do this from here. It needs a real visitor on a real phone.**

The hero waits **1.43 seconds** — half of the illustration's 2.86s draw — before any text
appears. Google measures how quickly a page's main text shows up (Largest Contentful Paint),
and the hero heading is the element it measures here. This wait very likely pushes that over
the target.

**What to do:** once the site is live and has had a few weeks of traffic, open Google Search
Console → Core Web Vitals → LCP.

- **If LCP is fine:** nothing to do. Leave the hero alone.
- **If LCP is flagged as slow:** the fix is to **shorten the hero drawing animation**, not to
  remove the wait. The wait is a deliberate design decision by the owner and should stay. The
  trace's timing is generated, so regenerating `hero-illustration.svg` with a shorter total
  stagger brings the number down without changing how the hero behaves. This overlaps with
  outstanding item 2 (regrouping the SVG traces) — do them together.

Why it was not settled during the session: it could not be measured in the dev container,
where first paint alone is ~13 seconds. That swamps an animation of this length completely, and an A/B
against a zero-delay build came back as noise. **That noise is not evidence the wait is
harmless.** Details under "Open risk: LCP" further down.

---

## Branches

| branch | state |
|---|---|
| `main` | The polish work is merged in. Does **not** yet have the carousel rebuild. |
| `claude/accessible-work-repos-kb67gy` | **Behandelingen carousel rebuild, PR #10, open.** 25 commits ahead of `main`. See below. |
| `feat/contact-section` | landing Contact section, panels still placeholders. Not merged. |
| `preview/mobile-view` | stale, predates the polish merge. Unused. |

The owner reviews on Vercel preview deploys from a phone, so **push after every change** —
they cannot run a dev server. Small, verifiable increments, one concern at a time. They have
said explicitly: do not fix several things at once, because then a regression can't be traced.

---

## What the polish pass delivered

**About stats** — count-up was ease-out-quint over 700ms, which put ~95% of the count in the
first third and read as an abrupt stop. Now ease-out-cubic over 1800ms.

**Werkwijze** — rebuilt. See "The Werkwijze story" below; it is the bulk of the session.

**FAQ disclosure** — open and close now animate. Covered by
`tests/integration/faq-disclosure.spec.ts`.

**Hero entrance** — staggered top-to-bottom cascade, pure CSS, waits for the illustration to
be halfway through drawing (1.43s) before starting.

**Scroll reveal** — `use:reveal` below the fold, per element, never per section.

**Draw-on animation** — card art draws stroke by stroke in a deliberate order. Parked by the
owner before it was perfect; see KNOWN-ISSUES item 9 for exactly where it stands and
`breadcrumbs.md` for why a single mask over a single bitmap can never be clean.

**`/faq`** — real page instead of a stub.

**Favicon and robots.txt** — favicon generated from the logo by `scripts/make-favicon.mjs`;
robots.txt is now a prerendered route so its Sitemap line follows `PUBLIC_SITE_URL` instead of
a hardcoded stale alias. **Do not add `static/robots.txt` back** — `static/` is served ahead of
routes, so it would silently shadow the route. There is a test asserting it does not exist.

---

## The Behandelingen carousel rebuild — read this before touching that section

Branch `claude/accessible-work-repos-kb67gy`, PR #10, **open, not merged into `main`**. This
was a from-scratch rebuild across ~15 commits in one long session (2026-08-07), replacing the
old Embla-based carousel entirely (`embla-carousel` is gone from `package.json`). If you are
reading the KNOWN-ISSUES entry about "janky transitions" or "`[carousel-debug]` logs," it is
describing the version this replaced — check the file before repeating that note forward.

**What it is now:** a curved "fan" of cards that rotate around one shared pivot point far below
the row (a real fan/circle, not each card tilting independently), full-bleed on both mobile and
desktop, swipeable via a live drag-follow on touch, click-driven on desktop with Prev/Next
buttons and clickable pagination dots. Component split: `Behandelingen.svelte` owns position
state and the fan mechanics, `TreatmentCard.svelte` is the presentational card (icon, title,
corner link button), identical for all 5 cards so nothing can drift out of sync between them.

**The mechanism, in order of what actually mattered:**

- **Position model:** each of the 5 items has a persistent integer `positions[i]`
  (`$state`), not derived fresh from an index every render. Only `positions[i]` in
  `[-2, -1, 0, 1, 2]` is ever meaningful; `.treatments__fan`'s `overflow: hidden` clips
  anything outside roughly `[-1, 1]`. This persistent-position model — as opposed to
  recomputing every item's position via shortest-path wrap on every index change — is what
  fixed the original "cards sweep across the screen" and "cards pop/disappear" bugs, and nothing
  since has needed to touch that part.
- **Rotation, not translation:** `transform: translateX(-50%) rotate(calc(var(--pos) *
  var(--tilt-step)))` with `transform-origin` set far below the row
  (`--pivot-distance`, empirically tuned — see the CSS comments for exact numbers per
  breakpoint). This is what curves the path instead of just tilting each card in place.
- **Single-step is the only safe unit.** `shiftOne(delta)` — always `delta = ±1` — is the one
  place position changes, and it is safe because recycling (wrapping an item ∓5, once around
  the 5-item loop) only ever touches an item that was already off-screen on both sides of the
  jump. **This invariant only holds for `|delta| = 1`.** Two different approaches to a bigger
  jump (needed for multi-step swipes) were tried and rejected — both are documented in the code
  comments right above `shiftOne` and in `breadcrumbs.md`, because both are exactly the kind of
  mistake that's easy to reintroduce:
  - Applying a bigger delta directly and folding the overshoot back: an item's raw target can
    sail straight past a visible slot into recycle range, so the fold-back teleported a *visible*
    card with no animation.
  - Giving each item its own already-correct short target for a bigger jump: fixed the
    teleport, but broke relative spacing *during* the transition, because a 2-step and a 3-step
    sweep reach their targets at different rates under the same easing curve — confirmed via
    bounding-box measurement as real, visible overlap, not a sampling artifact.
  - **The fix that held:** `commitSteps(n)` fires `shiftOne` `n` times in a fast, fully
    sequential cascade — each individual step is the already-proven-safe shape, and multi-step
    *speed* comes from stacking several complete, correct steps close in time rather than one
    bigger jump. Each cascaded step runs at a shorter transition duration
    (`.treatments__pivot--fast`, 180ms) than a normal single click (600ms), timed with headroom
    under the cascade interval (`FAST_STEP_MS`, 220ms) so one step's transition has genuinely
    *finished* before the next fires — redirecting an in-flight transition was also tried and
    also produced measurable overlap.
- **Swipe is a live drag-follow, not a once-per-gesture step.** Every `pointermove` adds a
  fractional offset directly onto `--pos` (rAF-throttled — see the comment on
  `onWindowPointerMove` for why: raw pointer events can fire faster than the display repaints).
  On release, drag distance sets a base step count and a genuinely fast exit flick (measured
  over a smoothed trailing-window velocity, not one noisy last sample) adds extra steps —
  capped at `MAX_FLING_STEPS`. Summing raw distance and raw velocity directly was tried first
  and rejected: any real drag covering more ground also reads a higher velocity, so it
  double-counted and every drag overshot.
- **Desktop must be full-bleed too**, same as mobile — a centered, capped-width container was
  tried and produced a real bug: it clips the ±1 side cards mid-body at a diagonal (following
  their own rotation) instead of at a clean edge, which got visibly worse as the cards grew.
  Removing the desktop override and letting it inherit the mobile full-bleed rule fixed it.
- **All the geometry numbers (`--card-width`, `--pivot-distance`, `--tilt-step`,
  `--pivot-baseline`, fan `height`, the `margin-top` that tucks the pagination row up close) were
  tuned empirically against real rendered bounding boxes**, not computed by hand — a rotated
  rectangle's bounding box does not move the way simple trig on one reference point predicts.
  Re-tune the same way if these ever need to change again: build, serve, and measure with
  Playwright (`boundingBox()` on `.treatments__pivot`), don't just do the trig.

**What is not done / worth checking on a real device:**
- Desktop's "click a non-center card to jump to it" was mentioned early in the session as a
  requirement and never implemented — only the dots and Prev/Next drive navigation on desktop.
- The exact feel of `PX_PER_STEP`, `FLING_VELOCITY_PER_STEP`, `MAX_FLING_STEPS`, `STEP_INTERVAL`-
  adjacent constants was tuned against synthetic Playwright gestures, not a real thumb. Worth a
  real-device pass before calling the swipe feel finished.
- This branch has not been merged. Whoever picks this up next should check whether PR #10 is
  still open, get it merged (or rebase past whatever landed on `main` since), before doing
  anything else with this section.

---

## Outstanding

Moved to `.planning/notes/KNOWN-ISSUES.md`, which has a numbered index at the top and is kept
current. Do not maintain a second list here.

The owner's own priority for the three that block launch: **pick the real domain → fill in the
practitioner name and phone → fix the contrast failures.**

---

## The Werkwijze story — read this before changing that section

It took many failed attempts. The failures are more instructive than the fix.

**What it does:** on mobile, scrolling into the section pins it and converts vertical scroll
into a horizontal pan across three cards, then releases.

**The original implementation** froze scroll with `preventDefault` on wheel/touch/keydown plus
`body { overflow: hidden }`, and hand-drove `scrollLeft`. That cannot work against a touch
fling: on iOS `preventDefault` only suppresses scrolling while the finger is down, and once
`touchend` fires the momentum belongs to the OS compositor with no event left to cancel.

**The replacement** is a sticky pin: the section is made taller than the viewport by the pan
distance, the inner wrapper is `position: sticky`, and scroll progress through the tall
section drives a horizontal transform. Native scroll is never blocked.

**Then it stuttered, and three "fixes" did not fix it.** Cached the forced layout read,
dropped a per-frame custom property, scoped the compositing layer. Each removed real waste.
None helped, because all three treated it as a *throughput* problem. Phase profiling showed
the pan doing 0.8ms of paint per frame against 3.5ms for ordinary scrolling elsewhere — it
was the cheapest thing on the page and still stuttered.

**The actual cause was timing, not work.** A JS `scroll` listener is janky by construction:
scrolling runs on the compositor and the event reaches the main thread a frame later, so the
track was positioned from a stale offset while the sticky frame around it was exactly right.
A constant lag is invisible; a *changing* lag is what the eye reads as stutter — hence bad on
entry, on fling, and on the run-out, smooth in the middle at steady speed.

**The fix** is a CSS `view-timeline`. The pin is the timeline subject and the track's
transform is bound to it over `contain 0% contain 100%` — which, for a subject taller than the
scrollport, is exactly the period the sticky is stuck. Compositor-driven, cannot drift.

### Traps in that file, all of which have bitten once

- **`overflow: hidden` on the section kills `position: sticky`** on every descendant, because
  it makes the element a scroll container. It must be `overflow-x: clip`. There is a comment
  saying so. Do not "simplify" it.
- **The clip must not live on the element being transformed.** An element's overflow clip is
  part of the element, so translating it drags the clip along: card 1 exits and cards 2 and 3
  stay clipped forever. The track is `overflow: visible`; the static section clips. Every
  geometry assertion passed while this was broken, because `getBoundingClientRect` knows
  nothing about ancestor clipping — there is now a structural test for it.
- **`scrollWidth - clientWidth` is the wrong measurement.** It only reports a real value while
  the track is a scroll container, which it is not once pinned. It reads 0 on any re-measure,
  collapsing the travel to nothing on resize. Measure the first-to-last card offset delta.
- **The pin gate must check height, not just width.** A landscape phone passes
  `max-width: 1023.98px` and then puts ~577px of content into a 390px sticky box. There is now
  a `min-height: 640px` condition and a test.

---

## Above the fold vs below it — the rule that matters

The site is prerendered and judged on AI-crawler readability. Entrance animations must never
leave content hidden when the script fails.

**Below the fold:** arm the hidden state *from JavaScript*, as `DrawOn.svelte` does. The
prerendered HTML then always shows finished content, and the failure mode is "no animation"
rather than "no content". Safe because the element is offscreen when armed.

**Above the fold: do the opposite.** That reasoning collapses for the hero, which is painted
long before hydration on a phone — arming it after the fact would show the hero, blank it, and
fade it back in. The hero is therefore **pure CSS**, in force from the first frame, with
`animation-fill-mode: backwards` so delayed elements start hidden rather than sitting visible
until their turn. It cascades with JavaScript disabled, which was verified.

### The `use:reveal` action, for below the fold

Shipped, at `src/lib/actions/reveal.ts`. Its contract, all of it load-bearing:

- Options: `delay`, `duration`, `distance`, `trigger: 'load' | 'view'`.
- Bail immediately under `prefers-reduced-motion`, before touching any style.
- Set the hidden state synchronously inside the action, so it lands before first paint.
- `trigger: 'view'` uses one IntersectionObserver, fires once, disconnects. Never fades out.
- **Remove every inline style once the fade ends.** A leftover `transform` makes the element
  the containing block for any fixed or sticky descendant, which would silently break sticky
  positioning elsewhere. Back the `transitionend` cleanup with a timeout — it does not fire
  for an element that is never painted.

- Bail without arming if the element is already in the viewport when the action runs — arming
  something the reader can already see would flash it.
- Drive it with the Web Animations API, **not** `node.style.transition`. `transition` is a
  single property, so setting it replaces whatever the element's own stylesheet declared —
  which silently broke the FAQ disclosure's close animation once.
- `distance: 0` skips the rise entirely rather than animating a 0px offset. Animating
  `transform` promotes the element to its own compositing layer for the duration, and on the
  FAQ's grid-rows disclosure that left it unable to run its close transition afterwards.

Per element — a heading, a paragraph, one card. Never a whole section; that reads as the page
stalling.

---

## The hero cascade, as built

Order and delays, all offset by `--hero-in-start`, which is half of `--hero-draw-total`
(2.86s) — so 1.43s:

`heading 0 → body 140 → cta 280 → social 340 → cards 420 / 530 / 640`

Two separate animations, deliberately, because the fade and the movement want opposite curves.
Driving both off one expo curve made it read as a fly-in: an expo ease-out is ~80% done in its
first quarter, so the movement was what you noticed. Now the fade is long and dominant
(1300ms, gentle) and the rise is short and subordinate (10px, hard expo, settled by ~700ms).

`.hero__cards` and `.hero__social` are `display: none` on mobile — desktop only. On a phone
the cascade is heading → body → CTA.

### Open risk: LCP

**The heading is the LCP element** — confirmed with a PerformanceObserver, not assumed. An
element at `opacity: 0` does not count as painted, so the 1.43s wait lands directly on Largest
Contentful Paint. The project budget is LCP < 2.5s.

It was 2.86s — the full draw — until the owner asked for the text to start at the halfway
point instead. That halves the cost almost exactly, since LCP is marked when opacity leaves 0
(the end of the delay), not when the fade finishes. The sequencing still reads: the drawing is
visibly still going when the text begins.

This could not be measured in the container — first contentful paint there is ~13s, which
swamps the animation and made an A/B against a zero-delay build come back as noise. **Do not
treat that as evidence it is fine.** Search Console is the source of truth, per the project's
own notes.

If it bites, the fix is to **shorten the draw, not to unpick the sequencing** — the owner
asked for the sequencing explicitly. The trace's stagger is generated, so regenerating with a
shorter total pulls the number down without changing how the hero behaves. That overlaps with
outstanding item 2 anyway.

---

## Environment gotchas

- **Playwright cannot run with the repo's own config.** `package-lock.json` pins
  `@playwright/test` 1.61.1, which wants Chromium revision 1228; the container ships 1194 at
  `/opt/pw-browsers`, with a different internal layout, so a symlink does not fix it. Run with
  an override config that sets
  `use: { launchOptions: { executablePath: '/opt/pw-browsers/chromium' } }`, `testDir` pointing
  at the repo's `tests/integration`, and `webServer.cwd` set to the repo root. Do **not** run
  `playwright install`.
- `npm run build` needs `PUBLIC_SITE_URL` set — it fails loudly without it, by design (FND-07).
  Use a gitignored `.env`, never a tracked file.
- The shell's working directory drifts between calls. Use absolute paths in scripts.
- `vite preview` dies frequently; check it is up before each browser run.
- Full-page screenshots and pixel diffs are the reliable way to prove a change is visually
  inert. Two were decisive this session: the card art `<img>` switch and the hero CTA wrapper,
  both **zero differing pixels**.

---

## Two failure modes that pass every check

Both bit this session. Neither is caught by build, type check, lint or snapshot.

1. **Svelte prunes CSS it cannot statically match.** The FAQ's `[data-closing]` rules were
   silently dropped from the build because the attribute is set imperatively — the close
   reverted to instant with nothing in the source to explain why. They are `:global()` now.
   If a rule depends on an imperatively-set attribute or class, **grep the built CSS** to
   confirm it survived.
2. **Generated SVG traces were malformed XML.** Seven of eight were missing `</mask>`. The
   HTML parser silently repairs that when the SVG is inlined, so it was invisible for months —
   but anything parsing strictly (an `<img src>`, a CSS `url()`) renders nothing at all, with
   no error beyond a zero intrinsic size. Fixed in the files and in
   `.planning/quick/20260713-hero-draw-on/trace/drawtrace.py`. Validate generated SVGs as XML.

---

## How to work on this project

Moved to `Insights/owner-profile.md` — communication style, the review loop, the orchestrator
model, what has satisfied and frustrated the owner, and the decisions they have made with the
reasoning. That file is maintained; this section was duplicating it.

The two things worth repeating here because they change what you do first:

- **Push after every change.** They review on Vercel previews from a phone. An unpushed change
  is invisible, and asking them to look at something that has not changed costs them a deploy
  cycle.
- **Take their description of a visual bug literally.** It was correct every time, and every
  wrong turn came from substituting a plausible mechanism for what was described. There is a
  table of examples in the profile.
