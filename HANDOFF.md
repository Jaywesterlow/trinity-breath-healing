# Handoff — current state of `main`

The only live handoff. Superseded ones are in `.planning/archive/`.

Started **2026-07-26** as a handoff for `polish/site-polish`; that branch was merged into
`main` and deleted on **2026-07-31**, and this was rewritten to describe the merged result.
Written for someone starting with no context.

Updated **2026-08-07** after a long session rebuilding the Behandelingen carousel on
`claude/accessible-work-repos-kb67gy` (PR #10, open, not merged as of this update — 25 commits
ahead of `main`). See "The Behandelingen carousel rebuild" below; it supersedes everything this
file previously said about that section (which described the old, since-deleted Embla version).

Updated again **2026-08-09**. Same branch, same PR #10, ~20 further commits: the carousel's
motion was rewritten from stepped animation to continuous physics, and the desktop geometry
was retuned repeatedly against live measurement. **Read "Carousel session 2026-08-08/09"
below before touching that component** — it supersedes the "What is not done" list in the
older section.

**PR #10 was merged into `main` on 2026-08-09** (merge commit `58466c5`, 73 commits), after a
further session that added the card hover reveal and the magnetic cursor-follow, removed the
TESTKAART diagnostic, and fixed the recycle-slot bug that removal exposed. The carousel now
lives on `main`; there is no unmerged carousel work.

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
- `RESEARCH-carousel-physics-gsap.md` — whether GSAP would have made the carousel physics
  easy (no), what real touch platforms use for momentum, and the numbers the current
  constants were tuned against. Findings only; nothing in it was implemented as written.

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

As of **2026-08-09** the repo has exactly **two** branches. Ten were deleted on 2026-08-08 —
see "Branch cleanup" below before looking for one that is missing.

As of **2026-08-09, after the PR #10 merge**, `main` is the only branch. It carries the polish
work, the Contact section (PR #11), and the full carousel rebuild including the hover/magnet
work. There is no unmerged work anywhere.

| branch | state |
|---|---|
| `main` | Everything. |
| ~~`claude/accessible-work-repos-kb67gy`~~ | Merged via PR #10 and deleted. Its commits live on `main` — the SHAs cited throughout this file and in KNOWN-ISSUES.md are still valid, which is why this was merged with a merge commit rather than squashed. |

### Branch cleanup, 2026-08-08

- `feat/contact-section` — **merged** via PR #11, then deleted. `main` previously had only an
  empty `src/lib/components/sections/contact/.gitkeep`; the landing page rendered no contact
  block at all. It does now.
- `polish/site-polish`, `preview/mobile-view` — merged/stale, deleted local and origin.
- `master`, `phase-0-foundation`, `phase-1-landing-sections`, `fix/hero-fit-cards`, three
  `worktree-agent-*` — deleted, local only. These sat on the **pre-fork history**: `main`'s
  root is `e934f8c` ("clean baseline"), theirs was `79d0c9a`. No common ancestor, so they
  could never be merged. Everything in them was already reproduced on `main` except the
  original raster artwork on `fix/hero-fit-cards` (~4.1 MB of source PNG/JPG that `main` has
  only as SVG traces). **The owner was shown that and chose to let it go.** Archive tags were
  created and then deleted at their request. It is gone; do not go looking for it.
- Two stale git worktrees under `.claude/worktrees/` were removed with `git worktree remove`.
- One stash survives: `stash@{0}` "plain-css-wip-2026-07-24", from the deleted
  `hero-fit-cards` branch. Nobody has decided what to do with it.

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

## The Behandelingen carousel rebuild — background, superseded in part

> **This section describes the state on 2026-08-07.** The next session rewrote the motion
> model. Read **"Carousel session 2026-08-08/09"** immediately below for what the component
> does *now*; the paragraphs here are kept because the position model, the rotation geometry
> and the `|delta| = 1` recycle invariant all survived unchanged and the reasoning still
> matters. Superseded paragraphs are marked inline.

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
  - **The fix that held at the time — since deleted.** `commitSteps(n)` fired `shiftOne` `n`
    times in a fast sequential cascade, each step on a shorter CSS transition
    (`.treatments__pivot--fast`, 180ms) than a normal click (600ms), spaced `FAST_STEP_MS`
    (220ms) apart so one transition genuinely *finished* before the next fired — redirecting
    an in-flight transition was tried and also produced measurable overlap.
    **`commitSteps`, `FAST_STEP_MS`, `.treatments__pivot--fast` and the `cascading` guard no
    longer exist** (`8e0e582`). Nothing drives a discrete CSS-transition cascade any more.
    The bullets above it still hold: they are why *any* multi-step motion has to fold one
    step at a time, which is exactly what the continuous path does per frame.
- **Swipe is a live drag-follow, not a once-per-gesture step.** Every `pointermove` adds a
  fractional offset directly onto `--pos` (rAF-throttled — see the comment on
  `onWindowPointerMove` for why: raw pointer events can fire faster than the display repaints).
  *Still true, and now the mechanism for everything.* **The release half of this bullet is
  superseded:** drag distance no longer sets a step count, and `FLING_VELOCITY_PER_STEP` /
  `MAX_FLING_STEPS` are gone (`b4d69b7`). Release is now a continuous coast — see the next
  section. The reason the old model summed distance and velocity *separately* rather than
  adding them still stands as a lesson: any real drag covering more ground also reads a higher
  velocity, so adding them double-counted and every drag overshot.
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

**What was open at the end of that session** — resolved since, do not act on this list:
- Desktop "click a non-center card to jump to it" — **implemented** the next day (`92fa716`,
  quick task `260808-ctj`), 6 Playwright tests. It is a transparent overlay button on the two
  visible side cards only.
- Tuning constants tuned against synthetic gestures, not a real thumb — **largely superseded.**
  Most of them no longer exist, and the ones that replaced them were retuned repeatedly against
  the owner's own device feedback. Current list is in the next section.
- PR #10 unmerged — **still true.** Check its state before doing anything else here.

---

## Carousel session 2026-08-08/09 — the current state of that component

Same branch, same PR #10, ~20 commits after the section above. Two things happened: the
release motion was rewritten from stepped animation to continuous physics, and the desktop
geometry was retuned over and over against the owner's live review. **What survived
untouched:** the persistent `positions[i]` model, rotation around the shared pivot, and the
rule that `shiftOne` is only ever called with `|delta| = 1`. Everything else about how the
fan moves is different.

### ~~⚠️ First: the carousel currently renders 8 fake cards, not 5 real ones~~ — RESOLVED 2026-08-09

**Removed in `e3ad763`, before the merge.** Kept below because removing it turned out to be
coupled to a real bug, and the coupling is the part worth carrying forward. See "The recycle
slot bug the diagnostic was hiding" at the end of this section.


`aa9522d` added three **TESTKAART** diagnostic items on top of the real 5, and a `cardNumber`
prop that draws a big number in place of each card's icon, so the owner could tell cards apart
while reviewing the motion. **It is still in the working tree** — `DIAG_ITEMS` in
`Behandelingen.svelte`, `cardNumber` in `TreatmentCard.svelte`, both flagged `TEMPORARY` in
comments at the top of their blocks.

**This must be reverted before PR #10 merges.** It was deliberately labelled as unmistakable
test copy ("TESTKAART", not a plausible fake service name) precisely so it could not slip past
`npm run audit:placeholders` or a reviewer. Do not treat it as content.

One real consequence to keep in mind while removing it: **all the desktop geometry below was
tuned while 8 cards were on screen.** `f8927b9` says so explicitly and flags the honest
caveat — 8 only fits because slots 3/4/-3 are pushed past the viewport edge rather than
actually fitted. At the shipped count of 5 the visible range is only ±2 and the same geometry
has margin to spare, so removing the test cards is safe. But if the owner ever wants to ship
more than ~7 treatments, the outer slots need real room, not a walk off the edge.

### The bug that came first, and made the physics look worse than it was

The owner reported: *"when I drag and hold it moves naturally, but when I let go it pauses
slightly and then continues very rigidly."* Two symptoms, and it was tempting to read both as
a physics problem. One of them was not.

`absorbWholeSteps()` — the function that folds whole steps of `offset` into `positions[i]` and
keeps `offset` inside `(-1, 1)` so cards recycle — **was never called from the drag path**
(`c4a98f2`). During a pointer-down drag, `offset` grew unbounded and nothing recycled, so a
long flick simply ran out of cards. Then on release the first `absorbWholeSteps()` call folded
every accumulated step *in one frame* — N `shiftOne` calls at once. That is the "pause then
robotic jump."

The fix has one subtlety worth knowing: the drag recomputes `offset` **absolutely** each frame
(`dragBaseOffset + pendingDx / PX_PER_STEP`), so folding a step without also subtracting that
amount from `dragBaseOffset` in the same tick means the next frame recomputes the unfolded
value and undoes the fold. `absorbWholeSteps()` therefore returns how much it folded, instead
of folding silently. Covered by `behandelingen-drag-recycle.spec.ts`, which was verified to
fail against the pre-fix code.

**Lesson worth carrying:** the release feel was re-measured *after* this fix, before touching
any physics. Half the reported symptom was already gone.

### The motion model now: one coast, one latch, one rAF loop

Release used to be a discrete step counter handing off to a CSS cascade. It is now
`motionTick`, a single rAF loop with two regimes and no seam between them:

- **Coast.** Exit velocity (steps/ms, from the existing smoothed trailing window) decays
  exponentially with time constant `MOMENTUM_TAU_MS`, integrating into `offset` every frame
  and calling `absorbWholeSteps()` as it goes.
- **Latch.** Once `|velocity|` drops below `VELOCITY_EPSILON`, `beginLatch()` captures the
  **current** offset and the **current** velocity as `y0`/`v0` of a critically-damped harmonic
  oscillator targeting the nearest integer, evaluated by its exact closed form
  `y(t) = e^(-ωt)(y0 + (v0 + ω·y0)·t)` rather than a per-frame Euler step.

The closed form is doing real work, not showing off. It is stable for any `dt`, and — the
point — **its velocity at `t = 0` is exactly `v0`**, so the coast→latch handoff has no jump in
it. The previous design decayed to near-zero and then handed into a fixed-300ms cubic ease
whose starting speed was `distance / 300ms`, unrelated to whatever the velocity actually was
a frame earlier. That discontinuity was measured directly, not inferred: per-frame speed
jumped from ~0.00016 steps/ms onto a new distance-determined curve at the handoff.

**Why hand-rolled and not Svelte 5's `Spring` with `preserveMomentum`,** which the research
note tentatively recommended: the note itself flags real uncertainty about whether a live
`instant: true` drag-follow correctly feeds `preserveMomentum`'s velocity tracking on release,
and no worked example was found. Hand-rolling keeps `offset`, `absorbWholeSteps`, `positions[]`
and the `|delta| = 1` guarantee untouched and adds no second rAF-driven system to reconcile.

### Buttons went down the same path

Prev/Next, the dots and the desktop click-to-jump overlay were the last thing still on
`commitSteps`, guarded by `if (cascading) return;` — a second press mid-cascade was simply
dropped. That guard existed because retargeting an **in-flight CSS transition** broke relative
spacing between cards; it was never true of the rAF-driven offset. So `8e0e582` routed
everything through `driveMotion(target)` / `driveBy(delta)`, and `commitSteps`, `FAST_STEP_MS`,
`cascading` and `.treatments__pivot--fast` were deleted.

Two details in there that are easy to break again:

- **A press from rest gets a synthetic initial velocity sized so the spring's `b = v0 + ω·y0`
  term is exactly 0.** That is the critically-damped boundary case, which degenerates to pure
  exponential decay: full speed at `t = 0` (no ease-in), smooth decay to a stop (all ease-out)
  — which is precisely what the owner asked for. `b < 0` overshoots, `b > 0` eases in.
- **A press landing on an already-moving gesture carries over the live velocity** instead of
  restarting, so repeated Next presses accelerate through the cards and a press during an
  active coast takes over cleanly. `behandelingen-button-retarget.spec.ts` asserts the
  *physical signature* of this rather than an implementation detail: no stall around the second
  press, no motion back toward the start, both presses counted, and every pair of cards' `--pos`
  differing by exactly 1 at every sampled frame including across the retarget instant.
- One latent bug this surfaced: `latchStartTime` for a button press is stamped from
  `performance.now()` inside a click handler, off the rAF timeline, and the next animation
  frame can report a timestamp a hair *earlier*. Without a clamp, `decay` briefly exceeded 1
  and overshot backward for one frame. `t` is clamped at 0. It only ever failed under load —
  the test passed in isolation and failed consistently alongside the other three specs.

### The tuning constants, and which owner complaint moved each one

Every one of these came from a specific piece of feedback, and each was measured rather than
guessed. If one needs changing again, re-measure the same way.

| constant | value | why |
|---|---|---|
| `MOMENTUM_TAU_MS` | 500ms | *"I want the snap to happen later."* Top of the real touch-platform range (325–500ms) cited in the research note, up from 300. Hard flick coast went ~1.4s/~25 cards → ~2.1s/~41 cards. |
| `VELOCITY_EPSILON` | 0.0025 steps/ms | The coast→latch threshold, sized empirically. An order-of-magnitude smaller value (0.00025) reintroduced the exact failure the old `MOMENTUM_MIN_VELOCITY` prevented: a small deliberate drag-and-stop coasted ~0.9 extra steps onto the next card. Caught by an existing test failing. |
| `SPRING_OMEGA` | 0.016 /ms | Latch spring for **pointer release**. Tuned so decay-to-~10% (~4.74/ω ≈ 300ms) matches the old settle duration as a feel reference, then verified by per-frame `--pos` sampling that nothing jumps. Owner has signed off on this feel — don't move it for a button-speed request. |
| `BUTTON_SPRING_OMEGA` | `SPRING_OMEGA / 4` | Latch spring for **Prev/Next/dots only** (`260809-kcf` split click-to-jump off onto its own constant below), halved twice on two separate *"needs to be a lot more ease out"* rounds. Single-step settle ~426ms → ~686ms → ~1221ms. Halving ω doubles the settling time constant and scales the whole curve uniformly — same shape, longer distance, no second phase and no overshoot. |
| `JUMP_SPRING_OMEGA` | `SPRING_OMEGA / 2` | Latch spring for **click-to-jump only** (`jumpTo` — desktop side-card click), added `260809-kcf` per *"click-to-jump only should take half its current time, more ease-out less ease-in."* Half the settle time means double ω, so this reuses the exact value `f6ecb82` already measured at ~656ms (before that commit halved it again to `BUTTON_SPRING_OMEGA`) rather than guessing a new number. Measured against a built preview: single-jump settle ~1695ms (old, at `BUTTON_SPRING_OMEGA` via a real click through `.treatments__fan`) → ~853ms (new) — 50.3% of the original. Threaded through as parameters (`driveMotion(target, omega, kick)` / `goTo(i, omega?, kick?)`), not a second hardcoded path — Prev/Next/dots call with no extra args and are byte-identical to before. |
| `JUMP_KICK` | `1` | Departure-speed multiplier for `jumpTo`'s spring (`v0 = -JUMP_KICK * omega * y0`), added alongside `JUMP_SPRING_OMEGA`. `1` is the existing b=0 critically-damped case (max speed at t=0, no ease-in, no overshoot) — named/exposed so the owner can raise it later (safe range 1.0–1.5 per the overshoot maths in `.planning/quick/260809-kcf-carousel-cursor-selection-jump-speed/PLAN.md`; above ~1.6 the bounce becomes the feature) without touching the physics. |
| `PX_PER_STEP` | 90 | Unchanged. ~one mobile card-width of drag per step. |

`motionTick` reads a live `latchOmega`; `beginLatch` stamps `SPRING_OMEGA`, `driveMotion`
stamps whichever `omega` its caller passed (`BUTTON_SPRING_OMEGA` by default for Prev/Next/dots,
`JUMP_SPRING_OMEGA` for `jumpTo`). **All three are independent on purpose** — that is the whole reason
these extra constants exist instead of one shared value.

Note the reach: **the dots exist at every breakpoint**, so the slower button timing applies on
mobile too, not just desktop. That was known and accepted, not an oversight.

One investigation worth not repeating: raising `MOMENTUM_TAU_MS` and lowering
`VELOCITY_EPSILON` look like they trade off against each other. They do not. The test that
guards against a deliberate drag creeping onto the next card has a measured exit velocity of
~0.0013–0.0014 steps/ms — already ~45% *below* `VELOCITY_EPSILON` on its own. A slower tau only
stretches how long a decaying velocity takes to cross the threshold; it cannot lower one that
starts below it. That test still passes at tau = 2000ms. **`VELOCITY_EPSILON` is what protects
it, not tau.**

### The drag band — and why the first fix was wrong

`.treatments__fan` is full-bleed and very tall (49.5rem desktop) purely as clipping headroom
for the rotated cards, and `.treatments__controls` is pulled up over that empty space with a
large negative `margin-top`. `onPointerDown` was bound to the fan, so **the area behind and
below Prev/Next was a live drag surface.** The owner could drag the carousel by the nav row.

`fb19441` rejected gestures outside a band derived from the union of the three visible pivots'
bounding boxes. It did not work, and the reason is worth remembering: **the ±1 pivots are
rotated, so `getBoundingClientRect()` on them returns an axis-aligned box far taller than the
actual card** — measured 142.9–649.3px against a controls top of 621.6px, putting the nav row
back inside the "safe" band.

`a3f798d` derives the band from **the centre pivot alone** (found by nearest-to-slot-0, since
DOM index 0 is not always the centre card once the loop has recycled). Unrotated, so its bbox
is its true rectangle. It also clamps the band's bottom edge above `.treatments__controls`'
live top edge, computed from geometry rather than hardcoded, so retuning spacing cannot
regress it. Result: desktop band 142.9–581.6px vs controls at 621.6px.

The test for this is the good kind — it starts a drag *at the nav row's vertical position but
off to the side*, so it cannot pass merely because z-index stacking blocked the click. It was
verified to fail against the pre-fix code before the fix landed.

### Desktop geometry — churn, and the one number that was blamed wrongly

`--pivot-distance` moved four times in two days: 1010 → 1450 (owner asked for wider) → 1340
(saw it live, too wide) → 1304 (10% tighter again). Card width 11.9rem → 15rem, fan height
39.33rem → 49.5rem, `--pivot-baseline` 14.28rem → 18rem, controls `margin-top` tracking it at
`-1× baseline + 2rem`. All measured with Playwright `getBoundingClientRect()` at 1440×900 and
1280×900 against a built preview — **not trigonometry**, for the reason the older section
already gives.

Worth knowing: the pos-0/pos-1 edge gap is **identical at 1440px and 1280px**, because it is
purely a function of rotation angle, not viewport width.

Then the owner said the section had been "lowered." The obvious suspect was the most recent
`--pivot-distance` retune. It was measured and **it was not the cause** — the card row's
bottom edge moved ~1px between 1304 and 1340. The real cause was what the owner had actually
pointed at: `.treatments`' desktop `padding-bottom` was only 2rem, and every past round that
grew the fan's height only added *invisible internal buffer*, because the controls' negative
`margin-top` pulls straight back over it. The visible gap never changed no matter how tall the
fan got. Fixed with a desktop-only `padding-bottom` matching the top padding; visible gap
47px → 64px.

**Do not "fix" vertical spacing in this section by changing the fan height.** It will do
nothing visible and will eat the clipping margin the rotated cards need.

### Housekeeping from that session

- `prefers-reduced-motion` is honoured on every path — release (`settleInstant`) and buttons
  (`driveMotion`'s own branch) both land instantly. Tested, not assumed.
- Four Playwright specs now cover this component: `behandelingen-click-to-jump`,
  `-momentum`, `-drag-recycle`, `-button-retarget`, plus `-drag-band`.
- **Three separate "Fix CI" commits on this branch were all the same mistake:** a fresh test
  file committed without running Prettier. Run the formatter on new test files.
- A `phase` state machine was added with the momentum loop, written in four places and read in
  none. It was first renamed `_phase` to quiet the linter, then deleted. Write-only state reads
  as meaningful to whoever maintains this next.

### The recycle slot bug the diagnostic was hiding

Worth understanding before changing the number of treatments or how many cards are visible.

A card recycles — wraps once around the loop — when it steps past
`HIGH_SLOT = floor(count / 2)`. The whole design rests on that wrap only ever touching an item
nobody can see. At `count = 8` (5 real + 3 TESTKAART) it held: slots 3 and 4 are off-screen. At
the real `count = 5` it does not, because desktop shows slots −2..2, so `HIGH_SLOT = 2` lands
**exactly on the visible edge** — every single step would have teleported a card from +2 to −2
in full view.

The diagnostic cards were accidentally holding the carousel together. The component's own
comment still asserted "Only 3 cards (position −1, 0, 1) are ever visible", which was true when
written and stopped being true when the desktop fan was widened.

**The fix:** the item list repeats until it is long enough
(`MIN_ITEMS = 2 * VISIBLE_SLOT_MAX + 2`) — 5 services × 2 = 10 slots, three hidden per side.
Duplicates carry `aria-hidden="true"` and `tabindex="-1"`; dots iterate services, not slots, and
target whichever copy is nearest the centre.

**If you ever change the treatment count or how many cards are visible, re-check this.** It is
the one piece of arithmetic in the component that fails silently and looks like a rendering
glitch rather than a maths error.

### Still open here

- **Description copy is still `TODO_` placeholder** on all five cards — it is live in the
  prerendered HTML. It is the hover text, and it needs the practitioner's own words; not ours to
  invent for a health practice whose primary metric is E-E-A-T trust.
- Swipe feel has still never been checked by a real thumb on a real phone — every measurement
  above is a synthetic Playwright gesture. The owner has reviewed the *result* on their phone
  via Vercel previews, which is not the same as the gesture having been tuned there.

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
- **Playwright serves whatever build is on disk.** `vite preview` does not rebuild, so a stale
  `.svelte-kit/output` silently invalidates a whole run — one comparison in July reported 48
  failures purely because two checkouts had been built against different `PUBLIC_SITE_URL`
  values. Always `npm run build` first, and build both sides the same way before comparing.
- **An isolated worktree does not inherit uncommitted changes.** Work sitting unstaged in the
  primary checkout is simply absent there, which shows up as `Cannot find module` on files that
  plainly exist, or a build that fails app-wide for no visible reason. Commit before spawning
  worktree-isolated work.
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
