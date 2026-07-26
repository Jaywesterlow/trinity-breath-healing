# Handoff — `polish/site-polish`

This is the only live handoff. Superseded ones are in `.planning/archive/`.

Written **2026-07-26**, at the end of a long session. Read this before touching the polish
branch. It is written for someone starting with no context.

Companion documents, all in `.planning/notes/`:

- `KNOWN-ISSUES.md` — the deferred list, with dates. Check the date before quoting it.
- `RESEARCH-werkwijze-scroll.md` — why the Werkwijze pin is built the way it is.
- `RESEARCH-werkwijze-stutter.md` — why the pan is driven from CSS, plus a section audit.

---

## ⚠️ Owner action item — check this after the site goes live

**Not a code task. Nobody can do this from here. It needs a real visitor on a real phone.**

The hero waits **2.86 seconds** — for the illustration to finish drawing — before any text
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
where first paint alone is ~13 seconds. That swamps a 2.86s animation completely, and an A/B
against a zero-delay build came back as noise. **That noise is not evidence the wait is
harmless.** Details under "Open risk: LCP" further down.

---

## Branches

| branch | state |
|---|---|
| `main` | baseline. The polish work is **not** merged into it. |
| `polish/site-polish` | **the working branch.** 18 commits ahead of main, all pushed. |
| `feat/contact-section` | landing Contact section, panels still placeholders. Untouched this session. |
| `preview/mobile-view` | identical to main. Unused. |
| `claude/trinity-breath-contact-changes-k1gax8` | dead, local only. Safe to delete. |

The owner reviews on Vercel preview deploys from a phone, so **push after every change** —
they cannot run a dev server. Small, verifiable increments, one concern at a time. They have
said explicitly: do not fix several things at once, because then a regression can't be traced.

---

## Done on this branch

**About stats** — count-up was ease-out-quint over 700ms, which put ~95% of the count in the
first third and read as an abrupt stop. Now ease-out-cubic over 1800ms.

**Werkwijze** — rebuilt. See "The Werkwijze story" below; it is the bulk of the session.

**FAQ disclosure** — open and close now animate. Covered by
`tests/integration/faq-disclosure.spec.ts`.

**Hero entrance** — staggered top-to-bottom cascade, pure CSS, waits for the illustration to
finish drawing (2.86s) before starting.

---

## Outstanding, in the owner's priority order

1. **Roll the scroll-triggered fade out to the sections below the fold.** The hero is done;
   everything below it is not. Note the hero deliberately does **not** use the reusable
   action — see "Above the fold vs below it" below. A `use:reveal` action was written this
   session and then removed, because shipping it unused was worse than rewriting it when it
   is actually needed. Its design is recorded below.
2. **Regroup the SVG traces.** The real draw-order fix. Seven files have all their paths in
   one flat group in raw trace order, so they appear to draw at random. Only
   `hero-illustration.svg` has semantic groups (4), which is why only the hero looks right.
   This also un-parks the Werkwijze card art, currently rendered as static `<img>`.
3. **Contact section** — panels are placeholders (`ContactForm.svelte`, `DatePlanner.svelte`
   render a flat box with the literal text "contact form"/"date planner"). No fields, no
   validation, no Resend endpoint, no Cal.com embed. `/contact` route is still a stub.
4. **Behandelingen** — card transitions are janky, and it still ships `[carousel-debug]`
   `console.log` calls, one firing on every seek. Owner has deferred both.

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

### The `use:reveal` action, for the below-the-fold rollout

Written and validated this session, then removed rather than shipped unused. Rebuild it as:

- Options: `delay`, `duration`, `distance`, `trigger: 'load' | 'view'`.
- Bail immediately under `prefers-reduced-motion`, before touching any style.
- Set the hidden state synchronously inside the action, so it lands before first paint.
- `trigger: 'view'` uses one IntersectionObserver, fires once, disconnects. Never fades out.
- **Remove every inline style once the fade ends.** A leftover `transform` makes the element
  the containing block for any fixed or sticky descendant, which would silently break sticky
  positioning elsewhere. Back the `transitionend` cleanup with a timeout — it does not fire
  for an element that is never painted.

Per element — a heading, a paragraph, one card. Never a whole section; that reads as the page
stalling.

---

## The hero cascade, as built

Order and delays, all offset by `--hero-draw-ends` (2.86s):

`heading 0 → body 140 → cta 280 → social 340 → cards 420 / 530 / 640`

Two separate animations, deliberately, because the fade and the movement want opposite curves.
Driving both off one expo curve made it read as a fly-in: an expo ease-out is ~80% done in its
first quarter, so the movement was what you noticed. Now the fade is long and dominant
(1300ms, gentle) and the rise is short and subordinate (10px, hard expo, settled by ~700ms).

`.hero__cards` and `.hero__social` are `display: none` on mobile — desktop only. On a phone
the cascade is heading → body → CTA.

### Open risk: LCP

**The heading is the LCP element** — confirmed with a PerformanceObserver, not assumed. An
element at `opacity: 0` does not count as painted, so the 2.86s wait for the drawing lands
directly on Largest Contentful Paint. The project budget is LCP < 2.5s.

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

### You are the orchestrator

The owner set this up deliberately: **the main agent plans and divides the work, Sonnet
subagents execute it.** Follow that.

- **Do the thinking yourself.** Read the code, find the cause, decide the approach, write the
  spec. That part does not get delegated.
- **Delegate the execution.** Spawn a Sonnet subagent per logical chunk, with a specification
  tight enough that it cannot fail: exact files, exact contract (class names, attributes, prop
  names), what to keep untouched, what to run to verify, and an instruction not to commit or
  push. You commit.
- **Check what comes back.** A subagent reported the Werkwijze rewrite as blocked on Playwright
  and it turned out to be an environment version mismatch, not a code problem — the tests ran
  fine once pointed at the browser that exists. Their results are input, not verdicts.
- **Judgement call on size.** A one-word copy change or a two-line CSS fix is not worth a
  subagent — the spin-up costs more than the work. Delicate debugging where you already hold
  the context is usually faster inline too. Everything larger: delegate.

### How to write to the owner

- **Short.** They have asked more than once, and asked again for this note.
- **Bullets, not paragraphs.** Small bits. Bold the thing that matters.
- Lead with the answer, then the reasoning, then the caveats. Never the reverse.
- Quote numbers instead of adjectives — "0 differing pixels", "23 steps", "0.8ms/frame".
- `/caveman` is active: terse, no filler, no preamble. Drop it only for genuinely complex
  explanations, and say you are dropping it.

### Standards they hold

- They will say **"it's still wrong"** rather than accept a fix that does not work. Verify in a
  real browser before claiming success. Several times a change looked right in the code and was
  wrong on the device — and once, a measurement that appeared to confirm success was simply
  measuring the wrong thing.
- **Push after every change.** They review on Vercel previews from a phone and cannot run a dev
  server.
- **One concern per change.** They have said explicitly: do not fix several things at once,
  because then a regression cannot be traced.
- When something cannot be verified in this environment, **say so plainly** rather than
  implying it was checked.
