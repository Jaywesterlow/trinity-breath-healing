# Owner profile — how Jay works

A note about the person, not the code. Everything else in this repo describes the project;
this describes how decisions get made and how to work with the person making them.

Written 2026-07-31 from observed behaviour across the `polish/site-polish` sessions. Self-
contained on purpose — drop it into an Obsidian vault as-is. Update it when something here
stops being true rather than adding a second copy.

Updated 2026-08-01 with observations from the first session after the `polish/site-polish`
merge — brand-info fill-in, WCAG contrast fixes, and setting up this documentation habit itself.

Updated 2026-08-07 with observations from a long, iterative session rebuilding the
Behandelingen carousel (branch `claude/accessible-work-repos-kb67gy`, PR #10, not yet merged).

**Everything below is an observation with evidence, not a rule.** If a session contradicts it,
the session wins.

---

## Context

- Building **Trinity Breath & Healing**, a Dutch marketing site for an aunt's breathwork and
  healing practice. Not a personal portfolio — someone else's livelihood is the deliverable.
- The site's job is to turn a visitor into a 30-minute booking, an email, or a phone call.
- **SEO and AEO are the stated primary success metric**, and explicitly override aesthetics
  when the two conflict. Visual fidelity to Figma matters, but "if SEO/AEO underperforms the
  project has failed."
- Not running a dev server locally. **Reviews everything on Vercel preview builds, from a
  phone.** This shapes almost everything below.

---

## Communication

- **Short. Bullets. Simple language.** Asked for this at least four separate times, including
  "you're answering with way too much text" and "short sentences, concise, simple, and bullet
  points". Uses the `/caveman` skill to enforce it.
- Long explanatory prose is read as noise, even when accurate. A three-line answer with the
  number in it beats a paragraph that justifies the number.
- Comfortable with technical depth — the problem is length, not difficulty. Precise terms are
  fine; padding is not.
- Wants to be told **what to do next**, not given a survey of options. When options genuinely
  matter, a short list with a recommendation works; an exhaustive comparison does not.
- Tasks arrive as a numbered list of short, unrelated items in one message (e.g. "11. thanks,
  12. turn into script" alongside three other asks). Answer each on its own — don't merge them
  into one narrative.

## How work should be delivered

- **Push after every change.** Nothing can be reviewed until it's on a preview URL. An
  unpushed change is invisible.
- **One concern per change.** Stated directly: *"What I don't want to do is fix everything all
  at once, and then something's broken and I don't know what caused it."* Bundling unrelated
  fixes destroys their ability to attribute a regression.
- **Diagnose before fixing.** *"Identify the problem and let me know before fix."* Wants the
  cause named first, and will often spot a wrong diagnosis before any code is written — which
  saves a wasted round.
- **Research is welcome when the problem is hard.** *"Do some extensive research on what could
  cause this, and try to identify first before you change anything. I don't care how long it
  takes."* Time spent on the right diagnosis is not the thing they're impatient about.
- Prefers an **orchestrator model**: main agent plans and reviews, subagents do the volume work
  with instructions specific enough that they can't fail. Their words: *"They shouldn't be able
  to fail because you give the instructions to them."*
- Wants durable documentation. Asked for `breadcrumbs.md` explicitly, to feed a *"second AI
  brain"*, with the standard: *"as much information as possible, but it does have to be the
  right information, not worthless information."*
- **Checks understanding before a large or ambiguous task starts**, not just after. Asked "let
  me know if you understand what I mean" before a documentation-recording task, rather than
  waiting to see what got produced. Confirming interpretation up front (which file, what
  convention) was the right response — cheaper than redoing a write across several files.
- **Wants to know the mechanism behind a fix, not just that it's fixed.** After a color/contrast
  fix, asked specifically whether the underlying tokens changed, or an overlay, or something
  else — wants the *how*, not a confidence claim. Fits the existing "measure, then state, not
  reason, then assert" pattern.
- **Explicitly asks for a change-impact summary** so they can anticipate side effects before
  reviewing — not only after something breaks. Give this even when not asked a second time.

## Reading their feedback

**Their descriptions of visual bugs are precise and were correct every time.** Taking them
literally was consistently faster than translating them into a theory:

| What they said | What it actually was |
|---|---|
| "it looks like a printer" | strokes sorted top-to-bottom — a scanline |
| "the path just has a normal animation" | duration ignoring stroke length |
| "half of the smoke, then later the other half" | one line drawn in two instalments 1.17s apart |
| "it stops exactly at the rim" | a region boundary sitting on the rim |
| "the lines are intersecting" | the mask brush was wider than the line it revealed |
| "cards appear weirdly, although cards dont dissappear anymore" (carousel, 2026-08-07) | precisely correct on both counts — a real teleport bug had just been fixed, and a *different*, subtler mid-transition spacing bug remained. Taking "dont disappear anymore, but still weird" literally, rather than assuming the same bug was back, pointed straight at the right layer. |
| "swiping past more than 1 card same persistent bug" | not a new bug — the same class as a prior single-step fix, now surfacing at |delta| > 1, which the fix had never actually covered |

Every wrong turn in that thread came from substituting a plausible mechanism for what was
described. **Two of those cost a commit each.** Same pattern held again in the 2026-08-07
carousel session, on a different feature — see the row above and "do you not look at the
screenshots" below.

They also **verify claims independently and push back when wrong**: *"See I knew that was
wrong. That's why I wanted to test it myself."* They will reject a confident diagnosis on
evidence. Being corrected by them is normal and useful, not a failure state.

## What has satisfied them

- Fixes that land first try and are visibly better: *"Works like a charm"*, *"Run smoothly,
  perfect"*, *"A lot smoother"*.
- Being shown evidence rather than told. Filmstrips, before/after renders, measured numbers.
- Honest reporting of what is *not* done, including corrections to earlier overstated claims.
- Their own ideas being taken seriously and tested. The layered-SVG fix was theirs, and it was
  right on both correctness and performance.

## What frustrates them

- **Repeated partial fixes to the same bug.** The draw-on animation took many rounds because
  each fix addressed a real symptom without reaching the cause. Their words near the end: *"I'm
  kind of getting disheartened by the fact that this, what should be a simple change, is taking
  so long."*
- **Being asked to look at something that hasn't visibly changed.** Especially painful given
  the phone-only review loop — a wasted look costs them a deploy cycle.
- Long messages. Consistently.
- Inference presented as certainty. The pattern that worked was: measure, then state; not
  reason, then assert.
- **A verification claim that doesn't hold up.** During the 2026-08-07 carousel session, a
  desktop layout was reported fixed after checking vertical clipping and card overlap — but not
  the specific way cards were actually broken (diagonal mid-card clipping from a narrow
  container). Their response: *"Desktop the cards are cut off, do you not look at the
  screenshots you take?"* The screenshot had in fact been taken and was sitting right there;
  the gap was in what was checked against it, not whether one was taken. Read as the same
  "measure, then state" lesson one level deeper: **taking a screenshot is not the same as
  looking at it for the specific thing that could be wrong.**

**The lesson from the longest thread:** when a fix doesn't hold twice, stop fixing and go
measure the mechanism. Four rounds of draw-order work were ruled out by one measurement that
should have come first. The carousel session repeated this almost exactly: a "fix" for cards
popping into view held up under one gesture shape and broke under another (fast flicks vs.
slow drags) three separate times before the actual root cause — see `breadcrumbs.md`,
"Redirecting an in-flight CSS transition" and "A custom property's computed value is not what
transitions" — was found by measuring bounding boxes instead of trusting a plausible story.

## Decisions they've made, and the reasoning

- **Hero text waits until the illustration is halfway drawn (1.43s).** A deliberate design
  choice. If Search Console flags LCP after launch, the fix is to shorten the drawing, *not*
  remove the wait.
- **Reveal the original artwork through a mask** rather than a redrawn trace, when the two were
  offered side by side — fidelity to the source art over implementation simplicity.
- **"This has to be pixel perfect."** Said about the card artwork. Worth weighing against a
  cleaner-but-approximate alternative before proposing one.
- **Parked the draw-on work** once it stopped converging: *"Nevermind, leave as is and move on."*
  Knows when to stop, and expects that call to be respected — not quietly reopened.
- Deferred the Contact section and the Behandelingen carousel to later passes, on purpose. The
  Behandelingen carousel was that later pass: fully rebuilt 2026-08-07, see root `HANDOFF.md`.
  Contact is still deferred as of that date.

## Standing constraints worth remembering

- Dutch is the primary language; the architecture must stay hreflang-ready even though v1 ships
  Dutch-only.
- No client-only rendering, no cookie banners, no US-hosted form services — all three would
  undermine the SEO/AEO goal or GDPR posture.
- Every SEO technique adopted has to be cross-referenced against the project's own checklist
  and fresh evidence. No speculative tactics.
- Health and wellness category, so practitioner identity and credentials are non-negotiable
  trust signals — which is why the `TODO_PRACTITIONER_NAME` placeholder is a launch blocker
  rather than a tidy-up.
