---
context: default
phase: none (ad-hoc debugging session, no active GSD phase directory)
task: 10
total_tasks: 15
status: in_progress
last_updated: 2026-07-06T16:02:02.058Z
---

# BLOCKING CONSTRAINTS — Read Before Anything Else

> These are not suggestions. Each constraint below was discovered through failure.
> Acknowledge each one explicitly before proceeding.

- [ ] CONSTRAINT: Claude's own browser automation tab runs backgrounded (`document.hidden: true`). Chrome throttles `requestAnimationFrame` and `setTimeout` so severely there that real-time animation/timing behavior CANNOT be reliably observed by watching it happen. Verification must go through direct engine-state inspection (temporary `window`-exposed debug hooks reading `emblaApi.internalEngine()`), fake-clock patching of `performance.now()`, and forced synthetic event dispatch (`mousedown`/`mousemove`/`mouseup`/`pointerdown` etc.) instead. Screenshots are fine for discrete-state comparison across separated checkpoints, not for confirming smooth motion.
- [ ] CONSTRAINT: Embla's `scrollBody.settled()` check reads `target.get() - offsetLocation.get()`, and `offsetLocation` is ONLY updated inside Embla's internal `render()` step — never inside `seek()`/`update()`. A test that only pumps `engine.scrollBody.seek()` in a loop will see `settled()` permanently false (or otherwise wrong) regardless of the real code's correctness, because `offsetLocation` never advances. This exact mistake was made TWICE this session and produced a "frozen forever" false positive that looked identical to a real bug. Any test of settled()-dependent logic MUST simulate the full update+render cycle (call `seek()`, then also interpolate/set `offsetLocation` the way Embla's `render()` does) or it will lie.

**Do not proceed until both boxes are checked.**

## Critical Anti-Patterns

| Pattern | Description | Severity | Prevention Mechanism |
|---------|-------------|----------|---------------------|
| Trusting a backgrounded-tab timing test | Assuming "no movement observed over N seconds" means the code is broken, when it may just mean Chrome is throttling this specific automation tab | blocking | Always cross-check with direct engine-state inspection or the user's own real-browser console output before concluding a timing-dependent bug is confirmed |
| Partial engine-loop simulation | Pumping only `seek()` without also updating `offsetLocation` (as `render()` would) when testing anything that calls `.settled()` | blocking | Always replicate the full `update()` + `render()` cycle in test scripts that touch `settled()` |
| Gating a fix too broadly | The `settled()`-gate added to fix the hard-flick-freeze bug (task 7) has no fallback/timeout, so it can block the ticker indefinitely if the carousel's true initial resting state at mount isn't perfectly settled | advisory | The fix for task 12 should add a safety-valve (e.g. max-wait timeout) rather than removing the gate outright, which would reintroduce the original hard-flick bug |

_Severity values: `blocking` — resuming agent must pass understanding check before proceeding. `advisory` — important context, does not gate resumption._

<current_state>
No active GSD phase — this has been a long, single-session, ad-hoc debug/build effort directly on `src/lib/components/global/Behandelingen.svelte` (the "Behandelingen"/treatments carousel section), on branch `fix/hero-fit-cards`. Nothing this session has been committed to git (git-ask-before-commit skill is active — always ask before committing). The carousel was fully rebuilt on Embla Carousel this session (previous implementation was a static CSS-only fake carousel, deleted per user request), then went through several rounds of feature requests and bug-hunting.

The user just ran `/gsd-pause-work` mid-investigation of the LAST open bug: the carousel freezes on fresh page load with zero user interaction, and only a manual flick unsticks it. This was confirmed real via the user's own browser DevTools console output (not just Claude's own automation testing). The root cause is hypothesized but not 100% confirmed yet — see below.
</current_state>

<completed_work>

Completed Tasks (all uncommitted, all in `Behandelingen.svelte`):
- Task 1: Deleted old CSS-only fake carousel, researched Embla Carousel via a forked research agent — Done
- Task 2: Built Embla-based carousel — 7 slides (4 real treatments + 3 filler), active-card scale (1.2x), 7-dot pagination row with CSS-grid-stacked SVG progress rings around each dot, edge fade gradients, section height 70vh mobile / 100vh desktop — Done
- Task 3: Added click-to-scroll (dot buttons, shortest-path via Embla's own `scrollTo` — no custom direction math needed), native drag (`watchDrag:true`), and a fully custom eased autoscroll ticker replacing the stock `embla-carousel-auto-scroll` plugin (uninstalled from package.json) — Done
- Task 4: Fixed a real bug — Embla's own render loop calls `engine.animation.stop()` whenever it judges the carousel "settled and idle" (which our ticker's target/location-syncing triggers on every pause), and nothing was ever calling `.start()` again except incidentally via dot-clicks. Fixed by calling `engine.animation.start()` before every scheduled resume — Done, verified directly against the engine (forced `stop()` then `start()`, confirmed it revives a dead loop)
- Task 5: Fixed a real bug — Embla's core only emits its `'select'` event from `ScrollTo.scrollTo()` (explicit navigation calls); our ticker moves `location`/`target` directly and never went through that, so the pagination/active-card never updated from the ticker's own continuous motion, only from manual interaction. Added `emitSelectIfIndexChanged()`, replicating the same per-frame index check the stock plugin did internally — Done, verified (forced a pure ticker-style location jump with zero scrollTo/drag calls, confirmed both the engine index and the Svelte-reactive active dot/card updated)
- Task 6: Changed hover behavior from a full stop to a 30% speed slowdown (`HOVER_FACTOR = 0.3`) per explicit user request, so hover never conflicts with "drag should keep the carousel moving" — Done, verified (dispatched `mouseenter`, confirmed nonzero movement; dispatched `pointerdown`, confirmed still-instant hard stop, priority preserved)
- Task 7: Fixed a real bug — a hard flick's native momentum decay was measured directly at ~1.5 seconds (94 simulated frames) to satisfy Embla's own `settled()` check, far exceeding our fixed 750ms resume timer. Our ticker was stomping `target` onto `location` mid-glide, killing the native momentum animation in place — exactly "let go and it just stops on one card." Fixed by gating the ticker's contribution on `defaultScrollBody.settled()`, not just our own ramp timer — Done, verified (composed scrollBody now produces the exact same settle step-count and final location as the untouched native physics, tested with realistic non-zero-delta synthetic events)
- Task 8: Fixed a related bug — `cycleDurationMs` (used for the pagination ring's fill duration) was being corrupted by intermediate `'select'` events fired during a settle-glide (both drag AND dot-clicks), since only the FIRST event after a manual action was suppressed. Fixed by tying the suppression's clear-condition to the same settled()-gate instead of "the next select event" — Done
- Task 9: Fixed a major bug — Embla's `ResizeObserver` calls `emblaApi.reInit()` on any ≥0.5px container/slide size change (window resize, our own `--card-size` breakpoint at 1024px, even layout settling after fonts load), and `reInit()` builds a BRAND NEW internal engine object. The composed scrollBody was wired to the OLD engine once at mount, so after any resize the ticker would silently and permanently die while everything else (clicks, drag) kept working, masking the failure. Fixed with a `wireEngine()` function that re-wires the composed scrollBody on every `'reInit'`, not just at mount — Done, verified (forced a real `emblaApi.reInit()`, confirmed a brand-new engine+scrollBody were created, and confirmed the ticker still correctly drove the pagination afterward)
</completed_work>

<remaining_work>

- Task 10 (in progress): Confirm the root cause of the fresh-page-load freeze. Strong hypothesis, NOT yet 100% confirmed: the `settled()`-gate from Task 7 can block the ticker indefinitely if the carousel's TRUE initial resting state at mount isn't perfectly settled (some sub-pixel residual from Embla's `startIndex`/`align:'center'` math), since `settled()`'s threshold (`< 0.001px`) may take a very long time — or effectively forever, asymptotically — to cross naturally from that residual. A manual flick forces genuine settlement (real, larger movement definitely crosses the threshold), unsticking it — this matches the user's report exactly ("when I flick it, then it moves like it should").
  - Real evidence already gathered: user pasted browser console output showing the carousel's transform frozen at `x = -96.98` from `t=0ms` all the way through `t=1084ms` — well past the 750ms resume delay, meaning the ticker should already have started moving and hadn't.
  - NOT yet gathered: direct confirmation that the ramp state (`currentFactor`) IS climbing internally during this freeze (which would nail the settled()-gate as the definitive cause) vs. something else entirely (e.g. the resume timer itself somehow not firing in the user's real browser). Was about to ask the user to re-run the console-watch script and report whether a `JUMP` line ever appears on its own, when `/gsd-pause-work` was called.
- Task 11: Once confirmed, design and apply a fix. Leading idea: add a safety-valve to the settled()-gate — e.g., also allow the ticker to apply its delta once a maximum wait time has elapsed since the resume was requested, even if `settled()` hasn't technically crossed its threshold yet. Do NOT simply remove the gate — that would reintroduce the Task 7 hard-flick-freeze bug.
- Task 12: Re-verify ALL previously-fixed bugs still hold after the safety-valve fix lands (hover-slow-not-stop, drag-instant-priority, pagination-sync-from-pure-ticking, reInit-resilience, hard-flick-multi-slide-momentum-without-freezing) — a fix here touches the same gate all of those depend on.
- Task 13: Final verification MUST happen in the user's own real, foregrounded browser — not just Claude's backgrounded automation tab (see blocking constraint above). Ask the user to confirm visually once the fix lands.
- Task 14: Nothing has been committed yet. When the user is ready, propose a commit (or a small series of commits) per the git-ask-before-commit skill's Conventional Commits format — do not commit without explicit "yes."
</remaining_work>

<decisions_made>

- Replaced the stock `embla-carousel-auto-scroll` plugin with a hand-rolled composed `scrollBody` (uninstalled the package). Reason: the stock plugin only supports constant velocity with zero ease-in/out, and its `speed` option is not live-mutable after init — confirmed by reading its actual source, not assumed. A forked research agent also confirmed via the maintainer's own GitHub issues that "custom easing" was explicitly requested and closed as "not planned."
- Used Embla's native `skipSnaps: true` option instead of building custom drag-momentum physics for "flick should travel multiple cards before locking in." Found by reading Embla's `allowedForce()` source directly — by default it hard-clamps any flick past a threshold to exactly the adjacent slide, regardless of velocity; `skipSnaps` removes that clamp. Zero custom code needed, verified directly (fast flick → 2-slide jump; slow drag → 0-slide, snap-back).
- Chose 7 total slides (4 real treatments + 3 filler) over the earlier 15-slide version, per explicit user request for a shorter/simpler pagination row.
- Gated the ticker's `location`/`target` mutation on `defaultScrollBody.settled()`. This fixed the hard-flick-freeze bug but is the SUSPECTED source of the new fresh-load-freeze bug — the fix for that should refine this gate (add a timeout fallback), not remove it.
</decisions_made>

<blockers>
- Fresh-page-load freeze bug: real, confirmed via the user's own browser console, NOT yet fixed. Deliberately left unfixed this turn per the user's explicit "find bugs, don't fix" instruction. This is the single most important open item.
</blockers>

## Required Reading (in order)
1. `src/lib/components/global/Behandelingen.svelte` — the entire carousel implementation; read the whole `onMount` block, especially `wireEngine()` and the composed `seek()` function, before touching anything.
2. This file's Blocking Constraints section — do not skip.

## Critical Anti-Patterns (do NOT repeat these)
- [ANTI-PATTERN]: Concluding a timing-dependent bug is confirmed based solely on Claude's own backgrounded automation-tab testing → Structural mitigation: cross-check with direct engine-state inspection (temporary debug hooks) and/or the user's own real-browser console output before concluding anything about timing.
- [ANTI-PATTERN]: Testing `settled()`-dependent logic by only pumping `seek()` in a loop, without also updating `offsetLocation` the way `render()` does → Structural mitigation: always simulate the full update+render cycle for any test that reads `.settled()`.

## Infrastructure State
- Dev servers: none should be left running by Claude — every throwaway server spun up for testing this session was explicitly killed afterward (never touch port 5173, which appears to be the user's own long-running dev server; Claude's own instances were always spun up fresh on 5174 and killed when done).
- No servers currently running that Claude started.

<context>
This was a very long, single conversation: the carousel went from "delete the old fake one" through a full Embla rebuild, several rounds of feature requests (click-to-scroll, drag, autoscroll timing, hover-vs-drag priority, pagination rings), and then a dedicated bug-hunt using `general-skills`, `superpowers:verification-before-completion`, and `superpowers:systematic-debugging`. Four real bugs were found and fixed with hard evidence each time (not guesses) — see Completed Work. A FIFTH bug was then reported by the user in their own real browser (freeze on fresh page load, no interaction needed) that could NOT be reproduced via Claude's own automation testing due to the backgrounded-tab timing limitation — this had to be diagnosed via a console-watch snippet handed to the user, which came back with real evidence (frozen transform value, past the resume delay, with no font/resize event to explain it). That's exactly where this session was paused: a strong, well-reasoned hypothesis (the settled()-gate lacks a timeout fallback) that still needs one more round of evidence before fixing it for real.
</context>

<next_action>
Start with: ask the user (or re-run) whether the console-watch script ever logged a spontaneous `JUMP` line, or confirm via a fresh round of engine-state inspection (temporary debug hooks + fake-clock patching, per the established pattern) whether `currentFactor` is climbing internally while the transform stays frozen at mount. Once confirmed, add a safety-valve/timeout to the `settled()`-gate in `wireEngine()`'s composed `seek()`, then re-verify all nine previously-fixed behaviors still hold.
</next_action>
