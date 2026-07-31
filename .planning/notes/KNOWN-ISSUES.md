# Known Issues — deferred, not fixed yet

Last updated: **2026-07-31**

Read the date above before answering "what issues are still open?" — anything here
was true as of that date and may have been fixed since.

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

### No favicon is wired up at all

`src/app.html` has no `<link rel="icon">`, and `src/lib/assets/favicon.svg` is referenced by
nothing. Every page load 404s on `/favicon.ico` — visible in the preview server log on every
run. Small, but it is a request failing on literally every visit, and browsers and search
results both show the icon.

### FAQ route is a stub, but the footer links to it

`src/routes/faq/+page.svelte` is still a `StubLayout` stub while `Footer.svelte` links to
`/faq` — a linked stub page is an SEO liability. Either render the FAQ content there or drop
the footer link.

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

### 2 GB of stale agent worktrees on disk

`.claude/worktrees/agent-a3177405f1d39c7fa/` is a full copy of the repository left behind by a
subagent run. Untracked, so it will never reach the remote, but it is 2 GB of a session
container's fixed disk allowance and it makes repository-wide `find`/`grep` return every file
twice. Safe to delete: `rm -rf .claude/worktrees`. Worth checking for after any session that
used worktree-isolated agents.

### The `--section` draw order for the teacups lives only in a commit message

`regroup.py --section` takes stroke indices, and the six-section assignment for
card-kennismaking was passed on the command line, not stored. It is recoverable from the commit
that introduced it, but regenerating that trace means digging it out of git history. If any
trace is ever re-paced with sections again, the invocation should go into a script or a makefile
target next to the tracer rather than into a commit body.
