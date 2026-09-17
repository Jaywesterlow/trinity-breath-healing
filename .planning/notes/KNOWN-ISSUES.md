# Known Issues — deferred, not fixed yet

Last updated: **2026-09-16**

Read the date above before answering "what issues are still open?" — anything here
was true as of that date and may have been fixed since.

**Every item in the at-a-glance list below was re-checked against the working tree on
2026-09-09, not carried forward on trust.** The list had drifted a month: it still
claimed the phone number was missing (it is in `brand.ts`), that the contact section
was placeholders (the form, the planner and three API routes all exist), and that the
carousel rebuild was an unmerged PR (it is on main and has been rewritten twice since).
If you are reading this more than a few weeks later, re-check before repeating it.

---

## Open, at a glance

Detail for the older items is further down. Anything marked **closed** stays listed
only so a future reader does not re-open it.

**Shipped 2026-09-09 — eleven routes graduated from stub to real content**

The seven modality pages under `/diensten/`, their `/diensten` index, plus
`/behandelingen`, `/werkwijze` and `/contact`. The sitemap went from 5 URLs to 16.
Copy for the seven comes from `BRAND.services`, which is the practitioner's own;
`/behandelingen` is organised by complaint rather than by modality (see
`src/lib/content/klachten.ts`) so it is not a duplicate of `/diensten`.

Four routes stayed stubs on purpose: `/over-mij` is waiting on her words, and
`/blog`, `/artikelen` and `/reviews` have no posts and no reviews. They are
`noindex` and out of the sitemap until they carry something. Writing filler for
them would be the thin-content problem the exclusion exists to avoid.

**Shipped 2026-09-09 — one grid line for every page**

Every subpage used to pick one of two boxes: the container width (`/`, `/diensten`,
`/contact`, `/faq`) or a centred reading measure (everything else). At 1440px the two
disagreed by 256px, so on half the site the breadcrumb and the `<h1>` started a quarter
of the screen right of the logo in the footer directly below them. Now every page sits
in the container box and the reading measure is applied to the children instead, so
crumb, heading and footer share one left edge on all fourteen routes. `Breadcrumbs`
lost its `wide` prop — with one box there is nothing to choose.

The section eyebrow came off `/diensten`, `/werkwijze`, `/behandelingen` and
`/over-mij` in the same pass: it repeated, in smaller type, the exact word the
breadcrumb directly above it already said. `ServicePage` keeps its "Behandeling"
eyebrow, which names the kind of page rather than echoing the crumb.

**Shipped 2026-09-09 — page titles stopped shipping the brand twice**

`Head.svelte` appended " | TRINITY Breath & Healing" unconditionally, and eleven
routes had already put the practice name in their own TITLE, so they rendered it
twice: "Spinal Touch in Amsterdam – Trinity Breath & Healing | TRINITY Breath &
Healing", 79 characters where Google shows about 60. Three more spellings were in
use elsewhere — "Trinity Healing BnH", a bare "| Trinity", "TRINITY Breath &
Healing NL". All twenty routes now render 48–62 characters with the brand once, in
one spelling; `routes.spec.ts` asserts both. The stub-title rule that caused it —
"the base title must be 50–60" — was itself the bug, since the only way to pad a
two-word page name to 50 is to append the brand; it now measures the rendered
title instead.

`/reviews` also stopped claiming the practice is in Almere, and the four stub
descriptions stopped addressing the reader as "u" while the rest of the site says
"je".

**~~Flaky, not broken — carousel momentum~~ — closed 2026-09-14**

`behandelingen-momentum.spec.ts:79` failed once in a full parallel run on
2026-09-09 and passed on its own immediately after, twice. It measures deceleration
against wall-clock timings, so it loses under load. Nothing in that run touched the
carousel. Worth a real fix (assert on the physics rather than on elapsed time)
before it wastes someone's afternoon.

**Closed 2026-09-14.** The spec now marks release from inside the page at the pointerup
event and slices everything by animation frame; the failing run's "early" window had
been stationary frames taken before the pointer had actually lifted.

**Shipped 2026-09-14 — the scroll reveal stopped blinking, and the band is symmetric**

The owner's "blink": scroll fast, stop, and a moment later a block that had already
left through the top popped from invisible to two-thirds lit in one frame. Traced
per frame in `src/lib/actions/reveal.ts`: an element that entered the band and left
it again inside its 1300ms entrance had `driftTo(0)` read its start value off the
inline style, which the still-running entrance had not written yet, so the exit
animated 0 -> 0 on top of the entrance instead of replacing it. When that no-op
finished 450ms later the entrance underneath was uncovered mid-flight. Now the
entrance is ended the moment the band is crossed, and every drift starts from the
rendered opacity. `reveal.spec.ts` scrolls ten screens in ten frames, freezes, and
samples every revealed element per frame for three seconds: nothing may move by
more than half its range between two frames.

The band itself moved in the same pass. The fade-out line sat 28% of the viewport
below the top edge against a fade-in line 12% above the bottom, so a block was
leaving a quarter-screen before it clipped while arriving almost at the edge.
Both lines are now 12% in. The history of the earlier pairs stays in the comment
above the constants.

**Shipped 2026-09-15 — the scroll reveal fades fewer things, faster, and has an off switch**

The owner's verdict on the effect was "iffy", and the diagnosis was three things at
once. Too much faded: 93 `use:reveal` call sites, and on `/` at 1440x900 that was 82
independently fading elements after a full scroll — every heading, paragraph, list row,
icon and hairline on its own. The entrance was slow, at 1300ms. And tall blocks
lingered: the rule is top-in, bottom-out, so the 608px carousel box stayed lit while
its top half was off screen, right next to a 30px heading that had already gone —
consistent by the rule, inconsistent to the eye.

The audit, applied everywhere: one reveal per section header (eyebrow, heading and
lead together), one per list or grid where the container fits in a third of the
viewport and one per row where it does not, body copy and buttons with the block they
belong to, nothing on hairlines or icons alone, three in the whole footer. Nothing
taller than a third of the viewport at 390x844 or 1440x900 carries the action any
more: the carousel wrap, the two about cards and the contact form card lost theirs.
Measured, not guessed — a Playwright walk lists every revealed element with its
height at both widths, and `reveal-audit.spec.ts` now holds that line per route.
Counts after a full scroll, before -> after (mobile / desktop): `/` 71/82 -> 33/37,
`/werkwijze` 43 -> 16, `/behandelingen` 40 -> 13, `/diensten` 39 -> 13,
`/diensten/spinal-touch` 54 -> 25, `/contact` 36/42 -> 8/9, `/faq` 37 -> 14. The
tallest revealed element on `/` went from 608px to 279px.

The target for `/` was 25. What keeps it above that is the ten FAQ rows and the seven
text lines inside the Werkwijze cards, seventeen between them, both kept on purpose:
the FAQ list is 650px and more at either width, so the rows are the smallest thing
that can carry the fade, and the card lines own the `exit: false` mechanism the row
above them depends on. On the subpages it is the same story — every list is over the
line at both widths, so each row keeps its own reveal. Relaxing either is the owner's
call after he has seen it, not a bug.

Speeds in `reveal.ts`: entrance 1300 -> 600ms, rise 1100 -> 800, exit 450 -> 300,
return 600 -> 400. The leaving/arriving asymmetry stays. And a kill switch:
`export const EXIT_FADE = true` at the top of `reveal.ts` — set it to `false` and every
element keeps its entrance but never fades out. One line, nothing else to touch; the
reveal spec passes in both positions, its exit test skipping itself when the switch
is off.

**Shipped 2026-09-16 — the site widens with the screen, Over mij is a ledger, the note closes the carousel; then the hero's type back to size, the Werkwijze staircase, more curve on the fan**

Six approved design changes to the landing page over the day, six commits.

The container was a fixed 1200px, and the owner measured what that meant on his
three screens: on the 1600x770 laptop the hero ends 6px above the fold and feels
right; on 1920x960 there is a 196px band of empty sand under it; on the 2560x1080
ultrawide 316px under and 1360px beside. `--container-max` is now
`clamp(1200px, 72vw, 1840px)` — 1200 / 1382 / 1840 on those three — and every
box that read it follows. Beside it `--site-scale` is the same growth as a plain
number (1 / 1.152 / 1.533, via `tan(atan2(72vw, 1200px))`, the one way CSS can
divide two lengths). The hero is at least the viewport minus the nav, with the
drawing on its bottom edge, so the river meets the fold on every screen.

The first build of that also multiplied the hero's title, body, measures and
spacing, the nav's wordmark and links, and the two buttons (through `zoom`) by
`--site-scale`. The owner's verdict on the ultrawide: "too big, revert"; on 1920:
"same as before, just grow hero image". So the scale is off everything but the
drawing. Title 48px, body 16px, links 20px, button 234x40 at every width again,
`ButtonLink` untouched in both directions. The drawing is the one thing that
grows with the container, and it is capped: `--hero-img-max-w: 950px`, written
into the height it is sized from at the artwork's own ratio (a `max-width` on the
svg would letterbox the art inside its box). Measured: 721 / 831 / 950px wide on
1600 / 1920 / 2560, where the uncapped version was 1106 on the ultrawide. Against
a build of f7a7384 at 1600x770, 3.3% of pixels differ, all inside the drawing's
column (it sits on the fold, 6px lower); title lines, measure, body, nav, button
are pixel-identical.

Werkwijze on desktop (≥ 1024px) is a staircase, from a mockup the owner approved.
As the section's top reaches the bottom of the viewport the cards stand at rest /
+306px / +612px; the lower ones move up faster than the page (1 + 306/vh, 1 +
612/vh) and land on one line when the section has scrolled through one viewport.
Then the row keeps rising 240px more than the page over the next 0.4 viewport,
overtaking the heading, and fades to 0 over the same range; fully faded it is
`visibility: hidden`, which is what keeps the Verdieping button out of the tab
order. Scroll-linked and damped (~95% of a jump in 0.25s), reversible, transforms
and a non-inherited `@property --stair-fade` only, `will-change` while the section
is near, no library. Reduced motion: aligned, opacity 1, nothing moves. The
section drops its bottom padding in this mode, so the gap from the aligned row to
Over mij's portrait is one `--section-pad` (96px at 1440). The mobile pin is as it
was. `werkwijze-staircase.spec.ts` covers the five states at 1440x900; the reveal
audit's count is unchanged because nothing writes an inline `opacity`.

The fan's desktop breakpoint (≥ 1536px, the one all three of the owner's screens
use) goes from 6.5deg per slot to 8deg, a quarter more, "a little more" curve. The
radius stays at 3000px, as asked, and on a fixed radius the angle also sets the
spread — measured, identical at 1600/1920/2560: slot ±1 362 → 445px from the
centre line, slot ±2 719 → 881px (its span 712..1050px, so at 1600 only 88px of
it is on screen, against 242 before), slot ±3 1067 → 1300px, and slot ±3's bottom
clearance 76 → -20px (it clips the fan box, entirely behind the edge fade). The
edge fade is still anchored at 800px from the centre line, which slot ±2 now
crosses, so from 1776px up the outer part of that card sits under the ramp.
**To watch on the owner's screens.** If it is the dive he wants and not the
spread, the radius is the other number: ~2420px at 8deg holds the 362px spacing.
The momentum, drag, recycle and click specs all pass unchanged. (Watched, and
seen: the edge, not the recycle — see 2026-09-17 below.)

Over mij is design "A, grootboek": on desktop a `4fr 5fr 3fr` grid — the portrait
drawn straight onto the sand in forest ink (no card, second portrait gone), the
words with a secondary "Lees meer over mij" button, and a ledger of three figures
(8+, 65+, ∞) between hairlines, the count-up kept from the circles it replaces.
The two feature bullets are parked in a comment in `OverMij.svelte` with what they
need to come back. Reveals: header, body-and-button, and one per ledger row — the
three rows are 391px, over the audit's third-of-the-viewport line, so the list
fades by row as the audit's own rule says. `/` is 35 (mobile) / 37 (desktop) after
a full scroll, against 33 / 37 before; the ceiling in `reveal-audit.spec.ts` holds
and its comment records the new figures.

The sentence under the carousel is no longer a section of its own. It is the
closing block of the treatments section, an h2 at 42px with a hand break after
"nodig" from 1024px up, the shared disclaimer under it with the brown left rule
the service pages use, and no button. 112px from the pagination to the heading,
64px from the disclaimer to the section's end — more above than below, the owner's
ask. The section's bottom padding went from `--section-pad` to a flat 64px for
that; on a phone the two were already equal.

**Shipped 2026-09-17 — the fan's edge fade follows the screen, the note held to its break, the staircase past the heading, tablets are mobile**

Four fixes from the owner's review of the live preview, four commits.

The fan. "The last card doesn't disappear, the first card visibly appears, every
time" and "the blur isn't visible on some cards, it's just a cut-off". Measured,
the recycle itself was never in view: one pivot forced to slots ±2.5, ±3, ±3.5 and
±4 and pixel-diffed against the same frame with it hidden gives zero differing
pixels at 1536, 1600, 1920, 2560 and 3440. What he saw is the edge: the fade only
existed from 1776px, so on the 1600 laptop the outer cards were cut by the
viewport with no fade at all, and at 1920 its solid part was a 70px strip. The
fade's inner edge is now `min(1040px from the centre line, 50vw - 180px)`, with a
100px ramp, from 1536px up — the first rule puts a fade under every card that
reaches the screen edge at any width, the second holds the edge between slot
±2's outermost corner (1050px) and slot ±3's innermost (1111px) on screens wide
enough to show the recycle slot. Measured inner edge / solid from, at the fan's
mid-height: 588 / 692 at 1536, 620 / 724 at 1600, 780 / 884 at 1920, 1040 / 1144
at 2560 and 3440. The 180 and 100 come from the strip's 16deg lean, which puts
the edge 66px further out at the top corner of the cards that reach the screen
edge on the narrowest screens. **The cost is on the laptop**: at 1600 the 88px of
slot ±2 that were cut off by the screen are now inside the ramp, so that screen
shows three cards and two fades where it showed three cards and two slivers. At
1920 the inner edge is 780 against the old 800. The fan box is 3rem taller from
1536px, with the pivot baseline and the controls' tuck moving by the same 3rem,
so slot ±3's bottom clearance is +28px instead of -20 and nothing else moves;
the transient ±3.5 / ±4 positions still cross the box edge, behind the solid
fade. Checked by dragging through two recycles at each width while sampling the
viewport's outermost columns and the box's bottom row: sand only. Every
`behandelingen-*` spec passes unchanged. Below 1536px (the 14deg geometry) the
viewport still cuts the outer cards as it always did; none of the owner's
screens is there.

The note under the carousel: 42px to 38px on desktop, same clamp shape, and a
max-width of 44ch. Not the 30-odd it looks like it should be: line 1 ("Je hoeft
... je nodig") is 40.0ch of this display face and line 2 42.4ch, measured off
the rendered line boxes, so anything narrower wraps line 2 into a third line
or moves the break off "nodig". Verified at 1024/1440/1920/2560: line 1 ends
"nodig", line 2 starts "hebt.", box 798px. 112 above / 64 below untouched.

The staircase. "Card 1 is already in place, not animating at all" and "I want
it to slide past the title; now it all stops at the title". At entry the cards
now stand 200 / 506 / 812px below rest (card 1 too), and they align when the
row's rest top reaches the middle of the viewport, not a viewport after the
section's top enters. Progress is `(rowTop - vh/2) / (vh/2 + rowOffset)` with
rowOffset the row's 214px below the section's top, so the drop is spent over
664px of scroll at 1440x900 and 694 at 1920x960; speeds 1.30 / 1.76 / 2.22 times
the page at 1440x900 (1.29 / 1.73 / 2.17 at 1920x960). After alignment the row
rises past the page by the header block + the gap + half a card, measured live
(86 + 32 + 229.5 = 348px at 1440), over 0.4 viewport, fading to 0; the cards
clear the heading's bottom after ~30px of scroll and its top after ~120, and end
229px above it. Damping, `visibility: hidden` and the reduced-motion static row
unchanged. Compensation padding re-measured with the row aligned on the centre
line: 96px to the Over mij portrait, one `--section-pad`. The spec carries the
new numbers, the ±80px-of-centre assertion and the past-the-header assertion.

Tablets. The two-column hero started at 768px, so every iPad in portrait got it,
and at 1024 (iPad Pro 12.9 portrait) the fold rule stretched the hero to 1266px
with 460px of sand between the text and the drawing. The hero's desktop layout
now starts at **1100px**; below it the stacked mobile hero, with the phone's
fold-fill margin switched off from 768 (it is calibrated to a ~333px drawing and
would add 582px of sand at 1024x1366) and the intro capped at 40rem. Werkwijze's
pin moves to the same 1100px, since at 1024 the desktop row of three was 14px
from the screen's edges and the owner's rule is tablets = mobile; the
`werkwijze-scrolljack` spec pins 1024x1366 down as "pinned". Checked and left
alone at 1024: the nav (links fit), the carousel, Over mij's ledger and the FAQ's
two columns — none of them break. 1180x820 landscape is a laptop and stays
desktop. `--fs-title-sm`, which only the 768-1023 hero used, is gone.

**Blocked on the owner — cannot ship without these**
1. **Domain.** TransIP domain is linked to Vercel; the login is still needed from her.
   `PUBLIC_SITE_URL` is read from the environment (`src/lib/seo/defaults.ts`) and the
   build throws without it, so this is a Vercel env var, not a code change.
2. **E-mail provider.** Left off at contacting their customer support. Blocks the
   `<Todo>e-mailprovider</Todo>` / `<Todo>land</Todo>` rows in the privacy statement.
3. **Terms content.** Rate per session, payment moment and method, VAT yes/no,
   cancellation window, late-cancellation fee, complaints body. All `<Todo>` in
   `/algemene-voorwaarden`.
4. **Her own words for `/over-mij`** — two paragraphs plus whether she is a member of
   a professional association. `<Todo>` markers in `src/routes/over-mij/+page.svelte`.
5. **Disclaimer list** — the conditions she does not treat, to be confirmed by her.

Run `npm run audit:placeholders` for the live list; it greps every `<Todo>` in the tree.

**Closed since the last edit of this file**
- ~~Phone number~~ — **closed.** `BRAND.phone` is `+31624244585`, displayed as
  `06 24 24 45 85`. It renders in the footer and the contact section.
- ~~Contact section is placeholders~~ — **closed.** There is a real e-mail form, a
  date planner with its own booking flow, and three API routes under `src/routes/api/`
  (`contact`, `booking`, `availability`).
- ~~Behandelingen carousel PR #10 unmerged~~ — **closed.** On the mainline and rebuilt
  since; the fan, the drag band, the momentum and the modal are all covered by their own
  Playwright specs.
- ~~128 contrast failures~~ — **closed** 2026-08-01, and the axe gate
  (`npm run audit:a11y`) has reported zero violations across six states on every run
  since.

**Small but real, mine to do**
6. PRF-03 lazy loading unimplemented — needs an exclusion list first (the pinned pan
   would pop in). Detail below.
7. Hero waits 1.43s before text — check Search Console LCP after launch. Detail below.
8. Favicon soft at a true 16px — needs a simplified small-size mark from the designer.
9. Draw-on parked — ~0.2% edge-pixel difference remains.
10. Scroll fade skips a block during a fast flick. Detail at the bottom of this file.

**Housekeeping**
11. Contact copy assertions commented out in `check-copy.sh`.
12. Six `behandelingen-*` Playwright specs fail on the owner's Windows machine — a local
    browser mismatch, not a component bug. Detail below.

---

## Waiting on real-world data (owner to check after launch)

### Hero entrance may be costing LCP

The hero holds its text until the illustration is **halfway** through drawing — 1.43s, half of
the 2.86s draw. The heading is the Largest Contentful Paint element, and an element at
`opacity: 0` does not count as painted, so that wait lands on LCP. The project budget is
LCP < 2.5s.

Originally the text waited for the *whole* draw (2.86s), which was over budget on its own.
Halving it halves the cost almost exactly, because LCP is marked when opacity leaves 0 — the end
of the delay — not when the fade completes. 1.43s leaves real headroom, but only if the page
itself paints quickly, so this still needs confirming with field data.

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

### Services / Behandelingen section — transition bugs — SUPERSEDED 2026-08-07

Everything in this entry describes the **old Embla-based carousel**, which no longer exists.
It was rebuilt from scratch on `claude/accessible-work-repos-kb67gy` (PR #10, open) — see root
`HANDOFF.md` for the current mechanism. Kept below only as history in case the same class of
bug (freeze-until-flicked, pagination not tracking motion) resurfaces in a different form.

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

### 1. Draw-on pacing — FIXED 2026-07-27

Was recorded here as "paths draw in no meaningful order". That was wrong: `drawtrace.py`
already sorts strokes top-to-bottom. The real cause was **overlap** — 367 strokes staggered
across 1.21s while each took ~1s, so hundreds were mid-draw at any instant and the image
appeared to resolve all at once rather than be drawn.

Fixed by re-pacing all seven mask-based traces with
`.planning/quick/20260713-hero-draw-on/trace/regroup.py`: stagger spread across the full
2.6s, each stroke 0.26s, so ~10% are in flight at any moment. Geometry untouched.

`hero-illustration.svg` is a different technique entirely — 4 hand-named groups, no mask —
and was deliberately left alone.

### 1b. Card art parked as `<img>` — RESOLVED 2026-07-28

All three Werkwijze traces are inlined again (`?raw` + `artSvg`) and animate per stroke. The
frame-cost worry that caused the parking was real but has a different answer than avoiding
inlining: Verdieping and De sessie were converted from `<mask>` to `clipPath`, and the teacups
to stacked layers. See item 3 below for where that landed and what it cost.

### 2. Scroll fade-in — DONE 2026-07-27

`src/lib/actions/reveal.ts` (`use:reveal`) handles below-the-fold elements; the hero has its own
pure-CSS cascade in `Hero.svelte` because an action cannot arm an element that has already
painted. Both bail on `prefers-reduced-motion`, and neither touches the prerendered HTML, so
crawlers see full content. Applied per element, never per section. The reasoning for the
two-mechanism split is in the root `HANDOFF.md` under "Above the fold vs below it".

---

### 3. Werkwijze card draw-on — PARKED 2026-07-31, by the owner

Stop here unless the owner reopens it. This ran for many rounds, each fix was real, and the
owner called it: *"Nevermind, leave as is and move on."* It is optional polish on a site whose
success metric is SEO/AEO. **Do not pick this up unprompted.**

**Where it ended.** All three cards draw in a sensible order at a sensible speed. Teacups are
split into three stacked artwork layers (front cup / back cup / smoke), each with its own mask,
so a stroke can only ever reveal its own layer's ink. Verdieping and De sessie use `clipPath`
instead of a mask and have no bleed to begin with. Frame cost is *better* than before any of
this: 327ms of raster over a 2.4s draw against 506ms for the version that had the bug.

**What is still not right**, and why it was parked rather than finished:

- The layered composite differs from a single-mask render on ~0.22% of pixels (2,412 of
  1,084,000), all on antialiased stroke edges. An SVG mask multiplies by a continuous alpha:
  where two strokes overlapped under one mask the alpha saturated to 1, but split across two
  layers each reveals that pixel at its own partial alpha and they composite slightly
  differently. Shows as one-pixel dotting along contours and a few specks at crossings. Not
  visible at the size the card renders. The owner asked for pixel-perfect, and this is not that.
- Only the teacups are layered. Verdieping and De sessie were never split, because they do not
  need it — but that means the technique is proven on one asset, not three.

**If it is reopened**, the thing to understand first is in `breadcrumbs.md` under *"The brush is
wider than the line"*: mask strokes are 5.8–24 units wide over lines of 3–5, so a single mask
over a single bitmap can never be clean, and no draw order fixes it. Four rounds were spent on
draw order before that was measured. The tooling is
`.planning/quick/20260713-hero-draw-on/trace/` — `regroup.py` for order and pacing,
`layerize.mjs` for splitting artwork into layers. Both are heavily commented with what was tried
and rejected.

**The honest alternative if pixel-exactness is the priority:** drop the mask entirely and do what
the hero does — render the strokes *as* the artwork, at the artwork's line weight and colour. No
mask, no bleed, no layers, ~4.5x cheaper again, and none of the fragment bookkeeping. It is a
redraw rather than the original bitmap, so it is not pixel-identical either, but it is
*structurally* clean instead of nearly-clean. Compared side by side at stroke-width 5 it is very
close to the original. This was offered and not chosen; it remains the simplest way out.

---

## Other open follow-ups

### Three overlapping asset directories — RESOLVED 2026-07-27

The five dead 1×1 stubs in `src/lib/assets/images/` are gone and the directory with them.

The remaining two directories are justified, not duplication, so they stay: `src/lib/images/`
holds artwork imported through Vite (hashed and bundled), `static/images/` holds files
referenced by a literal `/images/...` URL. They are not interchangeable — moving a
literal-URL file into `src/lib/` would change its served path to a hashed one and break the
reference. Verified by pixel diff at two viewports, zero differing pixels.

### No favicon — RESOLVED 2026-07-31

Generated from `static/trinity-logo.svg` by `scripts/make-favicon.mjs`: `favicon.svg` (primary),
`favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png`. Declared in `app.html`. The Svelte
template's orange logo at `src/lib/assets/favicon.svg` was deleted. No failed requests on load.

One residual, design not code: the mark is fine line art and goes soft at a true 16px. Hi-DPI
screens request 32 for a 16 slot and that reads cleanly, so it only affects low-DPI displays.
A crisp 16px would need a simplified small-size mark from the designer.

### FAQ route was a stub — RESOLVED 2026-07-27

`/faq` renders real content, reusing the `<Faq>` section with `showHeading={false}` so the
page's own `<h1>` introduces it. `FAQPage` JSON-LD stayed on the landing page as well — that
was deliberate and the reasoning is in the route's `+page.ts`.

### robots.txt hardcoded the wrong domain — RESOLVED 2026-07-31

Now a prerendered route (`src/routes/robots.txt/+server.ts`) whose Sitemap line follows
`PUBLIC_SITE_URL`, matching what `sitemap.xml` already did. A static file could not interpolate,
which is why it went stale — that was an FND-07 violation, not just untidiness.

**Do not add `static/robots.txt` back.** `static/` is served ahead of routes, so a file there
silently shadows the route and reinstates a hardcoded domain. There is a unit test asserting it
does not exist.

Note the wider issue is not closed: three conflicting domains still appear across the repo
(`vercel.json` sets `PUBLIC_SITE_URL` to `trinity-breath-healing.vercel.app`, the `.env` used
locally says `trinitybreathhealing.nl`). robots.txt now follows whichever is configured rather
than contradicting it, but the configuration itself still needs settling. See
`AUDIT-2026-07-27.md` item 3.

### PRF-03 is marked done in REQUIREMENTS.md and is not implemented

`REQUIREMENTS.md` line 83 states **"PRF-03: All non-hero images lazy-loaded"** with the box
ticked. Of the twelve `<img>` elements on the landing page, **none carries a `loading`
attribute at all** — every one is eager.

It went unnoticed because the test guarding it counted occurrences of `loading="eager"`, a
proxy that reads zero whether the requirement is perfectly met or completely unimplemented.
That test is skipped and has been rewritten to assert the real contract, still skipped, with
the unskip conditions written into it (`tests/integration/html-audit.spec.ts`).

**This needs a decision, not a sweep.** Blanket-lazying is wrong: the nav logo is above the
fold, the hero service cards are at it, and the Werkwijze card art pans horizontally while
pinned — those sit vertically inside the viewport but horizontally outside it, and lazy
loading keys off viewport intersection, so they would very likely pop in mid-pan.
Behandelingen's carousel icons have the same problem.

So the requirement needs rewording to "every image outside a named, justified allowlist is
lazy". Write the allowlist, apply `loading="lazy"` to the rest, set the constant in the test,
unskip it — then check the pan and the carousel on a real device, because pop-in is the
failure mode and no static audit will show it.

### `image.test.ts` flakes on timeout — FIXED 2026-07-27

Tests 5-7 now carry an explicit 20000ms timeout. They spawn a cold `tsc` measured at
4233-6131ms against vitest's 5000ms default, so whichever landed on the slow end failed and a
different one failed each run. Ran three times consecutively to confirm.

### Contact copy assertions still commented out

`scripts/check-copy.sh` has the Contact section's copy assertions commented out — deferred
since the Contact section itself is still placeholders (see above).

### 2 GB of stale agent worktrees on disk — RESOLVED 2026-08-01

`.claude/worktrees/agent-a3177405f1d39c7fa/` was a full copy of the repository left behind by a
subagent run in an earlier container. Checked in this session's checkout: `.claude/` doesn't
exist at all, so there was nothing to delete. That earlier container is gone; this note stays
in case a future session hits the same thing. Worth checking for after any session that used
worktree-isolated agents: `rm -rf .claude/worktrees` if it reappears.

### The `--section` draw order for the teacups — CLARIFIED 2026-08-01, harness added

Checked: it is **not** recoverable from git history. Searched every commit touching
`.planning/quick/20260713-hero-draw-on/trace/` (`git log --all -p`) for the literal `--section`
and `--anchor` values used for card-kennismaking and the other traces — none exist as text
anywhere, in a commit body or otherwise. Only prose describing the technique was ever
committed; the actual argv was typed once in a terminal and lost when the session ended. This
entry's original framing ("recoverable... but means digging it out of git history") was wrong —
there is nothing to dig out.

Added `.planning/quick/20260713-hero-draw-on/trace/regen.sh`: one guarded case per traced asset.
`verdieping` and `sessie` document the known mode flags (`--order nn --pace wave --total 2.2`)
with the anchor coordinate left as an explicit gap. `kennismaking` documents the four-step
from-scratch re-derivation (recover the source PNG, re-trace, re-derive the six section index
lists by eye and verify with `--dump-sections`, then paste the finished command in) and refuses
to run until that's done, rather than fabricating indices. If any trace is ever re-paced again,
the invocation goes in this file, not a commit body or a terminal.

---

## Six `behandelingen-*` Playwright specs fail on the owner's Windows machine (2026-08-09)

**Not a component bug. Do not "fix" the carousel because of these.**

Running the carousel specs locally on Windows gives 6 failures, the sharpest being
`behandelingen-drag-band.spec.ts` → *"a drag starting on the card row must still move the fan"*
with positions completely unchanged, which reads exactly like the primary gesture being broken.

It is not. Established by bisect, checking out only the two component files at each commit and
rebuilding between runs:

| commit | `behandelingen-drag-band` |
|---|---|
| `a482f4e` — before **any** of the 2026-08-09 code changes | 4 failed / 2 passed |
| `66a4696` — after `user-select: none` | 4 failed / 2 passed |
| `b14cc27` — after the cursor affordance | 4 failed / 2 passed |
| `7c557ae` — after the stretched centre-card link | **2 failed / 4 passed** |
| `e361ffb` — after `draggable="false"` on the anchor | 2 failed / 4 passed |

So the failures **predate** that session's work, and that session's work halved them. The same
holds for `-momentum`, `-click-to-jump` and `-button-retarget`: identical 4-failed/5-passed at
three different commits including the pre-session baseline.

**The real browser is fine.** The owner drove the carousel by drag throughout that session —
they reported its speed and its text-selection behaviour from live use, which is only possible
if dragging works.

**Most likely cause:** the Chromium these specs run against locally is not the one they were
written and verified against. `HANDOFF.md` → "Environment gotchas" already documents a version
mismatch (`package-lock.json` pins `@playwright/test` 1.61.1 wanting Chromium 1228; the dev
container ships 1194) and says to run with an override config. Synthetic `pointermove`
sequences are precisely the thing that behaves differently across Chromium builds — a real
finger and a `page.mouse` script do not take the same code path.

**What to actually do about it:** treat local carousel spec runs as unreliable until the browser
situation is pinned down. Before spending time on a "failing" carousel test, first run the same
spec at `a482f4e` — if it fails there too, it is this, not your change. Worth fixing properly by
pinning a known-good browser in a committed Playwright config so the suite means the same thing
on every machine, but nobody has done that yet.

## Scroll fade skips a block during a fast flick

Reported by the owner, seen most often in the FAQ list. Scrolling slowly, every
item fades out on the line as it should. Flicking fast, a block can cross the
fade-out line without fading; if the scroll then stops abruptly, that block
finally fades — so one item is left blank in the middle of a list that is
otherwise fully drawn.

Cause: IntersectionObserver delivers on the main thread and coalesces, while
the scroll itself runs on the compositor. Under a fast flick several crossings
land in one delivery and the observer reports only the final state, so a block
that crossed the line and came back never hears about it; one that crossed and
stopped hears about it late.

Not fixed on purpose — the owner asked for it to be recorded rather than
chased, and it is hard to reproduce deliberately. If it is picked up: the fix
is not a scroll handler (see the note at the top of $lib/actions/reveal.ts).
The candidates are a scroll-driven CSS animation with `animation-timeline:
view()`, which is compositor-resident and cannot desync, or a `scrollend`
reconciliation pass that re-reads every revealed element's rect once the scroll
settles.
