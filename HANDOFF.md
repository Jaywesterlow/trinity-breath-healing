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

Updated **2026-08-17**. The sentence immediately above is **no longer true.** A long run of
sessions between 2026-08-10 and 2026-08-17 built the seven real services, the service modal,
two extracted standalone library components, carousel idle-drift, and two desktop bug fixes —
all on `feat/behandelingen-service-modal`, **open as PR #14 and not merged**. Read
**"Session 2026-08-10/17 — PR #14"** below before touching the carousel, the cards or the
modal; it supersedes the geometry, the card markup and the item-count arithmetic described in
the two older carousel sections.

**Start here if you are picking this up cold:** the "Owner action items" block directly below
is the only part that needs a human. Everything else in this file is background.

---

## ⚠️ Owner action items — things only you can do

Nothing in this list can be done from inside a session. Two of them are actively blocking work.

| # | What | Why it needs you | Blocking? |
|---|---|---|---|
| 1 | ~~Enable the Figma connector for the chat.~~ **Resolved 2026-08-19** — the exported frames in `Figma/Landingpage/` carry the design; `Desktop _ Home 5.png` and `Mobile _ Home 5.png` were enough to build the Contact form and the date planner without the connector. | — | No longer blocking. |
| 2 | **Sort the treatment images**, then say so. | The owner asked to animate the images as they load into the modal, and deliberately deferred it until the real art exists. | **Yes** — blocks the modal image animation. |
| 3 | **Review / merge PR #14** (or say to keep stacking on it). It is ~95 commits ahead of `main` and carries everything below. **`claude/trinity-contact-hover-t7xsrf` now contains all of it** — merging that branch merges PR #14's work too. | Merge decisions are the owner's. | No, but it is a large unmerged surface. |
| 4 | **Decide on PR #13** (`docs/consolidate`), open since 2026-08-10. | Same. | No. |
| 5 | **Check LCP in Search Console** once the site is live and has a few weeks of traffic. | Cannot be measured in the container. Full detail in the section further down — the fix, if needed, is to shorten the hero draw, not to remove the wait. | No — post-launch. |
| 6 | **Set the mail env vars in Vercel**: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (verified sender on the Resend EU domain), optionally `CONTACT_TO_EMAIL`. Both the contact form and the booking flow use them. | Only the owner has the accounts. Unset, both still render and tell the visitor to mail `info@trinitybnh.nl` instead of failing silently. | **Yes** — neither form can deliver until these exist. |
| 6b | **Paste a permanent Google Meet room link** somewhere the confirmation e-mail can use it (a constant for now, the CMS later). | Cal.com was dropped, so nothing generates a Meet link automatically. A permanent personal room is the one-off that keeps her off any other site. | Blocks sending a link with the confirmation. |
| 7 | **Regenerate the visual-regression baselines on Windows** (`npm run test:visual -- --update-snapshots`). The committed baselines are `*-win32.png` and the landing page now renders a real contact form where a placeholder used to be. | The spec skips on Linux, so CI cannot do it. | No. |
| 8 | **Decide on the sitewide colour contrast.** pa11y reports contrast errors on `/`; `--brand-muted` and `--brand-border` were already darkened for AA, but the tan CTA pills (nav "Maak een afspraak", the form's "Verstuur email") still fail at ~2.1-2.7:1. Fixing them changes the brand look. | A design decision, not a component one. | No. |
| 9 | **Provide the real phone number.** `brand.ts` still ships `TODO_PHONE`, and the Phase 5 launch gate blocks on residual `TODO_` values in that file. | Only the practitioner has it. | Blocks launch, not current work. |

Item 6 is the one to do first — everything else about the contact form is finished and waiting on it.

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

## Session 2026-08-19 — second review pass: the planner is a framed wizard

The card is now a fixed frame — a header/footer that never move, and a stage
between them that swaps one step for the next. This replaced the previous model,
where picking a date appended the slots underneath and everything below shifted.

- **Steps slide, they do not stack.** The outgoing panel leaves to one side and
  fades; the incoming one arrives from the other **after** it has gone (`out`
  160ms, `in` 300ms delayed by 160ms). Nothing is ever obscured. `direction`
  flips the axis so going back genuinely looks like going back, and
  `prefers-reduced-motion` collapses both to zero.
- **The footer never moves.** Step 1 puts the legend there, steps 2-3 put a bare
  chevron and one pill. Both controls share a height, a radius and a type size —
  the labelled back link was the odd one out.
- **Six week rows are always rendered.** A five-row month used to pull the header
  and footer up by a row on every page. Pinned by a test.
- **Labels:** `Verder` on the times step, `Verzenden` on the details step.
  Not "Volgende" — the carousel already owns that accessible name, and two
  buttons called the same thing is a genuine ambiguity, not just a test problem.
- **Legend is Beschikbaar / Niet beschikbaar**, the second swatch drawn exactly
  as an unavailable tile.
- **Desktop fills the card:** `--pl-measure` becomes 100%, day type is a flat
  1rem, and tiles fill their cell (70x84 at 1440x900) rather than being squares
  sized by row height — a square at that row height is wider than its column and
  pushes the seventh day out through the side, which is the bug that produced the
  clipped grid twice.
- **Times are four columns only above 1200px.** Below that the card is too narrow
  for four labels and forcing them overflows sideways.

Nothing scrolls, verified at ten viewports from 1920x1080 to 360x640 across all
three steps, both axes.

**Still open, and deliberately not guessed at:** the times and details steps hold
much less than the calendar, so they centre in a card sized for the calendar and
leave visible room. Filling it either means inflating twelve slots into
billboards or letting the card change height between steps. The owner asked for
neither, so it stands as-is pending a decision.

---

## Session 2026-08-19 — first review pass on the contact section

Owner review of the built section. What changed, and the reasoning worth keeping:

- **The planner never scrolls.** It used to give the calendar a scroll container
  with a fade mask; the real problem was that everything inside was drawn at
  Figma's absolute sizes. Month type 40→30, day numbers 20→16, weekday letters
  24→16, tiles, gaps and buttons all down to match. Verified at nine viewports
  from 1920x1080 to 360x640, all three steps: nothing overflows. `overflow: hidden`
  on the card is a guard, not the mechanism — if content ever exceeds it, that is
  a sizing bug to fix rather than a scrollbar to add.
- **`--pl-measure` caps the inner column at 23rem.** Without it the seven day
  columns stretch across the whole card, which is what made the tiles large and
  the gaps wide at the same time. The grid is additionally capped at `42vh`, so on
  a short viewport it narrows and the tiles shrink with it.
- **The details step hides the calendar** rather than fading it. Nothing is being
  picked from it any more, and it was the only thing that could not be made to fit.
- **Tile fills were re-ranked.** Unavailable now uses the fill that used to mean
  available (`0.6` alpha at 35%); available is undimmed at `0.65`; selected is
  unchanged. The old available state was a 35%-opacity control that read as
  disabled and failed contrast twice over.
- **The phone prefix is a country picker** (`PhonePrefix.svelte`, list in
  `src/lib/forms/countries.ts`). Not a native `<select>`: browsers draw the open
  option list with OS chrome, which would put a white menu in a dark green card.
  Flags are inline SVG, not emoji, because Windows ships no flag glyphs and would
  render 🇳🇱 as the letters "NL". `landcode` now travels with the submission.
- **The message field cannot be dragged.** `resize: none` plus internal scroll —
  dragging it grew the textarea past the card and took the send button with it.
- **Toggle type is 16px**, down from 20px, in line with every other control.

**Open, for the owner:** a site-wide button pass. The contact section is now
internally consistent, but the nav and hero CTAs still speak at 20px in the display
face while form controls speak at 16px in the body face. Proposal recorded in the
session: tan pill = primary action only, dark green = surfaces not buttons,
everything else a quiet text control; one 16px control scale throughout. That
touches nav, hero and carousel, so it was not done unasked.

---

## Session 2026-08-19 (later still) — the three-step booking flow

Cal.com is gone. It could not meet the owner's condition — using it means an account,
a connected Google Calendar and an event type, all created by her on their site — and
the whole point is that the site is one station she never has to leave. The booking is
ours now, which also removes the two-sources-of-truth problem: the CMS will own her
availability *and* the requests.

The planner is a three-step machine, `datum → tijd → gegevens → klaar`:

- The **back control is labelled with the step it returns to** (`Kies datum`, `Kies tijd`),
  left chevron, so from the details step it takes two presses to reach the calendar.
  That is the owner's explicit design, not an accident.
- The **proceed button changes with the step**: `Gegevens invullen` on the times step,
  `Boek een gesprek` on the details step. Each is disabled until its own step is
  satisfied — a time picked, or voornaam/achternaam/e-mail filled.
- The calendar stays faded under its mask for every step past the first, so the card
  never changes shape between steps.
- Confirming turns the card into a confirmation in place, with a control to plan
  another moment. No `/bedankt` route.

`POST /api/booking` re-validates the details **and re-derives the slot from the
schedule** — a well-formed payload naming a time the schedule does not offer is
refused with 409. `src/lib/server/email.ts` now delivers both forms through one
`deliver()`, so the contact and booking mails cannot drift apart.

**Still open:** nothing generates a Google Meet link now that Cal.com is gone (owner
action item 6b), and the confirmation e-mail to the visitor is not written yet — only
the notification to the practitioner is.

---

## Session 2026-08-19 (later) — the planner's two booking states

Figma frame `441-48` draws the planner in two states; both are built.

**State 1** is the month grid plus the Beschikbaar/Geselecteerd legend.
**State 2** — a date is picked — compresses the calendar under a bottom fade mask
(the design draws that fade; it is what makes the state fit), and reveals the chosen
date, its time slots, a back control, and the confirm button **disabled**. Picking a
time enables it. That flow is the one the owner described, and it is what the tests
in `contact-section.spec.ts` pin.

**Availability lives in `src/lib/booking/schedule.ts`, not in the component.** This is
deliberate and it matters: a CMS is the end goal — the practitioner logging in at some
URL to set the hours she is free. That module is the seam. It exports a `Schedule`
shape, a `DEFAULT_SCHEDULE` (weekdays 10:00-16:00, 30-minute slots — the twelve slots
Figma draws), and pure functions `slotsFor()` / `isBookable()`. `<DatePlanner>` takes
`schedule` as a prop defaulting to `DEFAULT_SCHEDULE`. When the CMS exists, a `load()`
fetches the same shape and passes it in; the component does not change. Do **not**
reintroduce hardcoded times in the component — that is the thing this design avoids.

**Sizing follows Figma's proportions, not its pixels.** Reference frame `424-113` puts
an 800px card in 1024px of viewport — 78% — so the 80vh cap *is* the design's own
proportion rather than a limit imposed on it. Tile size comes from the column width,
and the 2.26% column gap reproduces Figma's 60px-tile-in-486px-grid exactly at any
card width. The 542px card on the states board is an artefact of laying two panels
side by side; the real section is 588.

**Known gaps, deliberately not invented:**

- Figma draws no disabled state for "Boek een gesprek". It reuses the enabled pill at
  the 0.35 opacity the design already uses for not-yet-active tiles.
- Confirming hands off to Cal.com with the date and time prefilled, because **nothing
  in the design captures who is booking**. An own-endpoint booking (the owner's
  preference) needs a name and e-mail somewhere — a third state, or a step after
  confirm. That decision is open; `/api/booking` was deliberately not written until
  it is made, rather than shipping an endpoint nothing can call.
- The design shows every day as available, including weekends. `DEFAULT_SCHEDULE` is
  weekdays only, so Saturdays and Sundays render unavailable. Give them opening hours
  if she works them.
- The available-day and time tiles carry Figma's `opacity: 0.35`, which makes
  interactive controls look disabled and fails contrast. Kept as drawn; it belongs
  with the palette decision in owner action item 8.

---

## Session 2026-08-19 — the Contact section is real

Both panels were dark-green placeholders reading "contact form" and "date planner". They now
render what Figma specifies, and the section is finished apart from the env vars in item 6.

**`ContactForm.svelte`** — Figma `Desktop _ Home 5`: Voornaam/Achternaam, Email, Telefoon with
the static `+31` segment fused to the input, Bericht, tan "Verstuur email" pill. One zod schema
(`src/lib/forms/contact.ts`) backs both the browser and the endpoint, so a Dutch message can
only be wrong in one place. Errors bind to their field with `aria-describedby`, the result goes
to an `aria-live` region, and the `<form>` keeps a real method/action pair so a no-JS submit
still reaches the endpoint.

**`POST /api/contact`** — the only route that opts out of prerendering, so the marketing pages
keep their static HTML for crawlers while the form has somewhere to post. Re-validates
independently, throttles per IP, sends through Resend over `fetch` (no SDK in the bundle), and
answers HTML to a browser navigation but JSON to `fetch`. Every env var is optional.

**`DatePlanner.svelte`** — Figma spells the planner out as a custom calendar (`Mobile _ Home 5`),
not a Cal.com embed, so that is what it is: Dutch month/weekday labels, past days disabled,
roving-tabindex arrow keys, Beschikbaar/Geselecteerd legend. Cal.com owns the slots — picking a
day hands off to the booking link rather than putting an iframe on the landing page, which the
LCP budget could not absorb.

**The mode toggle is a radio group.** Figma draws radio dots; native radios bring the keyboard
behaviour a pair of `aria-pressed` buttons would have to fake.

**Hover, sitewide.** Four tokens in `app.css` — `--motion-hover`, `--ease-hover`,
`--lift-hover`, `--shadow-hover`. Buttons and cards lift with a shadow; plain text links wipe an
underline in. The reduced-motion block flattens `--lift-hover` to zero rather than merely making
the teleport instant.

**Desktop height.** Figma draws the card 800px tall inside a 1440x1024 frame. Taken literally it
overflows every real laptop, so the card is capped at `min(80vh, 50rem)` and everything inside
it is sized off `vh` with the same clamp shape — the card scales as a whole instead of
overflowing. The section's block padding scales the same way, so the whole section clears the
viewport (94vh at 1440x800). Both panels share the cap, or the page would jump on toggle.

**Tests.** `tests/unit/contact-form.test.ts` (schema boundaries) and
`tests/integration/contact-section.spec.ts` (validation, the endpoint contract, the planner's
keyboard and hand-off). `html-audit.spec.ts`'s A11Y-02 label test, skipped since Phase 0 waiting
on this form, is enabled.

**One deliberate a11y report entry.** HTML_CodeSniffer flags `autocomplete="tel-national"` (H98).
The token is valid per the HTML spec for `type="tel"`; it is kept because the field holds the
national part only, next to the static `+31`.

---

## Branches

As of **2026-08-09** the repo has exactly **two** branches. Ten were deleted on 2026-08-08 —
see "Branch cleanup" below before looking for one that is missing.

As of **2026-08-09, after the PR #10 merge**, `main` is the only branch. It carries the polish
work, the Contact section (PR #11), and the full carousel rebuild including the hover/magnet
work. There is no unmerged work anywhere.

> **Superseded 2026-08-17.** There is unmerged work again, and `origin` still lists several
> branches this file previously recorded as deleted. Current picture:

| branch | state as of 2026-08-17 |
|---|---|
| `main` | Everything up to the PR #10 merge. **Does not have** the services/modal/library work. |
| `feat/behandelingen-service-modal` | **The live branch. PR #14, open, ~95 commits ahead of `main`.** Everything in the "Session 2026-08-10/17" section below. Push here. |
| `claude/accessible-work-repos-kb67gy` | Merged via PR #10. Still present on `origin` despite the deletion note above, and it is also the branch name some tooling defaults to — **do not develop on it**, it is 76 commits behind the live branch. |
| `feat/contact-section`, `polish/site-polish`, `preview/mobile-view` | Merged long ago; still listed on `origin`. Nobody has cleaned them up. |

> **Superseded again 2026-08-19.** `claude/trinity-contact-hover-t7xsrf` is now the live
> branch. It carries the contact-section work below **and** all of PR #14, merged in on
> 2026-08-19. `feat/behandelingen-service-modal` is no longer ahead of it. Push here.
> `docs/consolidate` (PR #13) is still open and deliberately **not** merged — it is a
> docs-only reorganisation, unrelated to this feature work.

The SHAs cited throughout this file remain valid — PR #10 was merged with a merge commit
rather than squashed, on purpose.

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

## Carousel session 2026-08-08/09 — background, superseded in part

> **Superseded 2026-08-17.** This was "the current state of that component" until the PR #14
> work below. The motion model, the tuning constants and the `|delta| = 1` rule described here
> are all still accurate and still load-bearing — read them. What changed underneath it: the
> item count and therefore the slot arithmetic, the card's internal markup, and the desktop
> geometry above 1536px. See **"Session 2026-08-10/17 — PR #14"**.

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

- ~~**Description copy is still `TODO_` placeholder** on all five cards~~ — **RESOLVED
  2026-08-10.** There are seven services now, with the practitioner's own owner-approved copy in
  `brand.ts`. The `TODO_` that remains in that file is `TODO_PHONE`, which is a different item
  (owner action 6).
- Swipe feel has still never been checked by a real thumb on a real phone — every measurement
  above is a synthetic Playwright gesture. The owner has reviewed the *result* on their phone
  via Vercel previews, which is not the same as the gesture having been tuned there.

---

## Session 2026-08-10/17 — PR #14, the current state of the carousel

Branch `feat/behandelingen-service-modal`, **open as PR #14**. This supersedes the geometry,
the card markup and the item-count arithmetic in both older carousel sections. All four CI
checks (`build-and-audit`, `playwright-integration`, `lighthouse-and-a11y`, Vercel) are green
on `396e707`.

### Seven real services, and what that broke

`D-08` was superseded (`260810-mdl`): the owner approved **7 real services** with
practitioner-written, owner-approved copy, living in `brand.ts`. Cards with no art yet render a
**number** instead of an icon, driven by absence from the `ICONS` map rather than a flag, so
dropping art in later makes the number disappear on its own.

Two consequences that matter:

- **The hover description copy is no longer placeholder.** The "Still open" note in the older
  section saying all five cards ship `TODO_` description text is **resolved** — the copy is
  real, and it is what the hover reveal shows.
- **`MIN_ITEMS` is now `2 * VISIBLE_SLOT_MAX + 3`, not `+ 2`.** With 7 services this yields
  `REPEATS = 1` and `count = 7`, so slots run **exactly −3..3** and ±3 is always the outermost
  pair. Re-read the "recycle slot bug" section before changing the service count — that
  arithmetic is still the thing that fails silently and looks like a rendering glitch.

### The service modal

Clicking the **centre** card opens a near-fullscreen modal that grows out of the card itself
and shrinks back into it on close (box morph, content fade, backdrop fade, staggered nav
reveal, all Web Animations API). Prev/Next inside the modal drive the carousel underneath so it
is already centred correctly by the time the modal closes. Touch swipe navigates. Esc and
backdrop click both close.

Clicking a **non-centre** card centres it instead of navigating — on mobile too (`487ce47`),
which was a real reported bug: a tap used to follow the card's `href` and leave the page.

### Two extracted, standalone library components

`src/lib/components/library/morph-modal/` and `src/lib/components/library/carousel/`, each with
its own `README.md`. These exist because the owner wanted to reuse the carousel and modal in
other projects. **Every global design-token `var()` is resolved to a literal value**, each
annotated with a `/* was var(--token) */` comment, so the folder can be pasted into any
Svelte 5 project without silently breaking on a token that does not exist there.

Structure in both: a plain class holding all behaviour (`carousel-engine.svelte.ts`,
`morph-modal-engine.svelte.ts`) and a deliberately dumb `.svelte` file owning only markup and
layout. The carousel library composes the modal library rather than duplicating it.

**These are copies, not the live site's components.** The live site still uses
`Behandelingen.svelte` + `TreatmentCard.svelte`. Any carousel or card change has to be made in
both places or they drift — that has been the practice so far and the owner has asked for it
explicitly ("fully up to date with all the latest changes").

One API detail worth knowing: `MorphModalEngineOptions.onClosed` exists because `onCancel`
(Esc) and `onBackdropClick` call the engine's own `close()` directly, bypassing whatever
function is passed to the `onClose` prop. Anything that must run on *every* close path — the
carousel resuming idle-drift, for instance — has to hang off `onClosed`, not off an `onClose`
wrapper.

### Idle auto-drift

The fan slowly advances on its own once nothing has happened for a while, as a third
`motionPhase` alongside coast and latch — so every existing interruption point (a drag, a
button press) already cancels it for free. Opening the modal cancels it; closing the modal
(any path, via `onClosed`) reschedules it.

| constant | value | why |
|---|---|---|
| `IDLE_DRIFT_DELAY_MS` | 2000 | Started at 4000; owner asked to halve the pause before drift resumes after an interaction. |
| `DRIFT_SECONDS_PER_STEP` | 6.4 | Started at 10, sped up ×1.75, then ×1.25. Bigger = slower. |

Three existing specs had to be retimed when the delay was halved — their own margins had been
written assuming a 4000ms pause and started colliding with the drift.

### Mobile swipe smoothness

`@property --pos` (registered as `<number>`) plus `will-change: transform` on the pivot. Without
the registration the browser cannot hand `transform: rotate(calc(var(--pos) * …))` to the
compositor, so every per-frame drag write forced a full main-thread style recalculation — which
reads as choppy on weaker mobile CPUs while looking perfect on desktop. Documented in
`.planning/quick/` under the smoothness-fix task.

### 2026-08-16/17 — two desktop bugs, both owner-reported

**Ultra-wide cutoff.** `.treatments__fan` is full-bleed (100vw), so a wider screen reveals more
of the arc. Below ~1560px the ±3 pair sits fully past the viewport edge — which is why 1440px
always looked fine. From ~1600px it enters the viewport still carrying the steep 14°-per-slot
tilt and drops **127px** below the fan's own `overflow: hidden` box, shearing its bottom off.
The overflow is a function of rotation alone, not viewport width: measured at exactly 127px at
1600, 1920, 2560 and 3440px alike.

Fixed with one `@media (min-width: 1536px)` block — placed just before that pair can appear at
all — flattening the arc to `--pivot-distance: 3000px` / `--tilt-step: 6.5deg`. Because there
are only ever 7 cards, ±3 is permanently the outermost slot, so **one flattened setting covers
every width from there up**; no ladder of breakpoints is needed.

The two numbers move **together**, and that is the part to preserve if they are ever retuned:
horizontal spacing is `R_eff * sin(--tilt-step)`, where `R_eff` is `--pivot-distance` plus half
the card's height (the pivot sits below the card's *bottom* edge, so the radius to its centre is
the longer one). Raising the radius while lowering the angle to match holds the cards exactly
where they were left-to-right and changes only how far they dive — measured spacing stays 362px,
unchanged from the 1024px breakpoint. Slot ±3 gains **76px** of bottom clearance, which is not
an arbitrary number: it is the clearance slot ±2, the outermost card at 1440px, already had, so
the widest layout keeps the margin the design was signed off with. `--pivot-baseline`, the fan's
height and the controls' margin are untouched, so the centre card never moves and every other
card only moves up. Verified 1440–3440px: zero clipped cards, 1440px byte-identical.

**Hover reveal overlapping its own copy.** The title row translated up by a fixed
`--tcard-desc-shift` (3.5rem desktop) while the description was `position: absolute` — so the
shift was a guess that never knew how tall the description actually was. Every card's copy
currently wraps to 4 lines (72px) and needs 80px including the gap, so the title landed 24px
short and sat on top of the text.

The description now lives in a collapsible grid row inside a shared bottom-anchored column
(`.tcard__footer` → `.tcard__bottom` + `.tcard__desc-wrap`), animating `grid-template-rows`
from `0fr` to `1fr` — and `1fr` resolves to exactly the content height, so **the copy itself
lifts the title** and it always lands directly above, one line or ten, with nothing to re-tune
per card or per breakpoint. `--tcard-desc-shift` is deleted. Verified under real hover across
content heights from 17px to 202px: the gap stays exactly 8px at every height, nothing
overflows.

Three traps in that mechanism, all of which cost a round:

- **The gap cannot be `padding-top` on the description.** Padding cannot collapse below its own
  size (border-box floors the element at 8px even with `min-height: 0`), so it left the row 8px
  tall at rest and lifted the *resting* title off the card's bottom edge. It lives on the
  wrapper's `margin-top`, which is 0 until hover. Resting layout was then confirmed identical
  to the pre-change build by measuring both.
- **`min-height: 0` is required in two places** — on the description (or the grid row refuses to
  shrink below the text) and on `.tcard__icon-wrap` (or the icon row refuses to give up the
  height the description is expanding into, and the card overflows instead).
- **Collapse with `grid-template-rows`, never `display: none`.** The copy has to stay real,
  crawlable DOM content at rest; this project is judged first on AEO.

### Measuring this component, if you have to

Both fixes above were tuned by reading rendered boxes, never by trig — same rule the older
sections give, and it held again. Two specific gotchas that produced garbage readings first:

- **`getBoundingClientRect()` is useless for comparing elements inside different cards.** The
  cards are rotated, so each rect is an inflated axis-aligned box; comparing a title's rect to a
  description's rect across two cards produced negative "gaps" that meant nothing. Use
  `offsetTop` / `offsetHeight`, which are untransformed layout values in the card's own space
  (`.tcard` is `position: relative`, so it is the `offsetParent`).
- **Svelte re-renders over `textContent` writes.** Trying to vary description length by writing
  text into the DOM silently reverted. Vary the *rendered* height with an injected stylesheet
  (`font-size`) instead — Svelte does not own that.

---

## Outstanding

Moved to `.planning/notes/KNOWN-ISSUES.md`, which has a numbered index at the top and is kept
current. Do not maintain a second list here. **Its header still reads 2026-08-09** — everything
in the session section above post-dates it, so check both before answering "what is open?"

### Carried forward, not yet done

Code tasks, in the order they would sensibly be picked up. None of these are blocked on anything
except where noted.

1. **Contact section accuracy** — make it match Figma Frame `424-113` (desktop) and `519-15`
   (mobile), using the real dev-mode values rather than eyeballing, and responsive between the
   two. The form itself stays as-is. **Blocked on owner action item 1 (Figma connector).**
2. **Animate the images loading into the modal.** **Blocked on owner action item 2 (images).**
   The existing draw-on machinery is the obvious starting point — `DrawOn.svelte` plus
   `.planning/quick/20260713-hero-draw-on/DRAW-ON-PLAYBOOK.md`, which documents how
   `drawtrace.py` traces a PNG into a self-drawing SVG (the `--animate` flag is what emits the
   mask). It is currently wired into Hero, OverMij, AboutFeature and WerkwijzeCard — **not**
   into the treatment cards or the modal.
3. **Keep the two library copies in sync** with any further carousel/card change. See the
   library section above.
4. **Swipe feel has still never been checked by a real thumb**, only synthetic Playwright
   gestures. Reviewing the result on a phone via Vercel is not the same thing.
5. **Branch cleanup on `origin`** — four merged branches are still listed. Needs an owner
   decision, not a code change.

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

  **The exact working path as of 2026-08-17 is
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.** This matters more than it looks:
  without the override, `npx playwright test` does not fail loudly — it reports **69 failures
  that are purely "Executable doesn't exist"**, and **34 of those are the carousel specs**, i.e.
  exactly the tests that would catch a regression in the component most likely to be under
  edit. A run that looks like "208 passed, 69 pre-existing failures" is a run that never tested
  the thing being changed. With the override: **277 passed, 6 skipped, 0 failed.** Always patch
  the config, run, then restore it before committing — the path is container-specific and must
  not be committed.
- **The container resets mid-session, silently.** It happened three times on 2026-08-16/17: the
  working tree reverts to an older commit, files written earlier in the session are simply gone,
  and nothing announces it. Pushed work is safe; unpushed work is not. **Begin every work
  segment with `git fetch origin <branch>` and `git merge --ff-only origin/<branch>`**, and
  treat "a file I know I wrote is missing" as a reset rather than as a mystery. This is the
  strongest practical argument for the existing push-after-every-change rule.
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
