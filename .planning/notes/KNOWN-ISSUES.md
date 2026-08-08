# Known Issues — deferred, not fixed yet

Last updated: **2026-08-07**

Read the date above before answering "what issues are still open?" — anything here
was true as of that date and may have been fixed since.

---

## Open, at a glance

Everything still outstanding. Detail for each is further down.

**Before launch**
1. Pick the real domain — three conflicting ones; set `PUBLIC_SITE_URL` in Vercel. Owner decision.
2. ~~Fill in `TODO_PRACTITIONER_NAME`, `TODO_PHONE`, `TODO_INSTAGRAM_HANDLE`~~ — **name and
   Instagram done 2026-08-01** (Brigitte Grohe, @trinitybreath.and.healing — commit `4cd9b08`).
   `TODO_PHONE` still open, still needed from the owner.
3. ~~Fix 128 contrast failures~~ — **done 2026-08-01** (commit `4cd9b08`): darkened
   `--brand-muted` and `--brand-border` tokens plus two hardcoded `NavLogo.svelte` colors, all
   now ≥4.9:1 against their background. See "Site-wide WCAG 2.2 AA color-contrast failures"
   below, updated with the fix.

**Deferred by the owner**
4. Contact section is placeholders — no form, no send, no Cal.com.
5. ~~Behandelingen transitions are janky~~ — **rebuilt from scratch 2026-08-07** on
   `claude/accessible-work-repos-kb67gy` (PR #10, **open, not merged**). Old Embla version and
   its `[carousel-debug]` logs are gone entirely. See root `HANDOFF.md` → "The Behandelingen
   carousel rebuild" for the mechanism and what's still open on it (desktop click-to-index
   never implemented; swipe feel untested on a real device). Detail below has been updated to
   match — do not trust anything under "Services / Behandelingen section" further down that
   isn't marked superseded.

**Small but real**
6. PRF-03 lazy loading unimplemented — needs an exclusion list first (the pinned pan would pop in).
7. Hero waits 1.43s before text — check Search Console LCP after launch.
8. Favicon soft at a true 16px — needs a simplified small-size mark from the designer.
9. Draw-on parked — ~0.2% edge-pixel difference remains.

**Housekeeping**
10. ~~2 GB stale worktrees in `.claude/worktrees/`~~ — checked 2026-08-01, does not exist in this
    checkout. Nothing to delete.
11. Contact copy assertions commented out in `check-copy.sh`.
12. ~~The teacup `--section` invocation lives only in a commit message.~~ Clarified 2026-08-01:
    it was never recorded anywhere, not just in a commit — see detail below. A guarded script
    now exists so future invocations get saved.

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
