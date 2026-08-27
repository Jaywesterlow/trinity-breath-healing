---
id: 260814-smf
type: quick
status: shipped-pending-desktop-check
date: 2026-08-14
branch: feat/behandelingen-service-modal
---

# "The smoothness fix" — mobile carousel swipe choppiness

Owner asked whether there was a reliable way to track down a "choppy... looks like low FPS"
feel on the Behandelingen carousel's mobile swipe. Investigated, found a real, measurable
cause, and shipped it directly (owner's framing afterward: they'd only asked whether it was
*findable*, not necessarily for it to be committed immediately — this doc exists so the fix is
easy to identify and revert in isolation if it turns out to cause a problem, rather than
tangled into unrelated history).

**Not yet confirmed on desktop.** Owner will check later; if desktop is fine as-is, this stays
shipped. If desktop shows a smoothness problem too, it needs its own look — this fix only
targeted the mobile-specific symptom (weak-CPU main-thread cost), not a desktop one.

## What shipped

**Commit:** [`cdf4e06`](../../../../commit/cdf4e0645671d3ce89cf22402cb064f670dda80d) — `perf(behandelingen): fix choppy mobile carousel swipe via @property + will-change`

Files: `src/lib/components/global/Behandelingen.svelte`, `tests/integration/behandelingen-button-retarget.spec.ts`.

### The root cause

`--pos` is a CSS custom property, written once per `requestAnimationFrame` during drag/coast/
latch, driving `.treatments__pivot`'s `transform: translateX(-50%) rotate(calc(var(--pos) *
var(--tilt-step)))`. Left **unregistered**, the browser can't hand that derived transform off
to the compositor thread — every one of those per-frame writes forced a full main-thread style
recalculation instead. A desktop CPU absorbs that cost invisibly; a weaker mobile CPU can't
keep up, which reads as "looks like low FPS" even though nothing is actually stuttering (no
single bad frame — just genuinely fewer frames rendered overall).

### The fix — two standard, additive CSS techniques, no JS/behaviour changes

```css
@property --pos {
	syntax: '<number>';
	inherits: false;
	initial-value: 0;
}

.treatments__pivot {
	/* ...existing rules... */
	will-change: transform;
}
```

- `@property` types `--pos` as an animatable number (Houdini — Chrome/Edge 85+, Safari 16.4+,
  Firefox 128+; unsupported browsers just ignore the rule, so this is pure progressive
  enhancement with no fallback branch needed).
- `will-change: transform` hints the compositor to keep the element on its own layer.

### Measured, not eyeballed

Playwright script under Chrome DevTools Protocol `Emulation.setCPUThrottlingRate: 6` (DevTools'
own "weaker mobile CPU" simulation), replaying an identical synthetic swipe (25 pointer-move
steps over ~350ms) against the pre-fix and post-fix build, sampling real paint cadence via an
independent `requestAnimationFrame` loop (not the app's own state) for 1.4s per run:

| | avg frame time | frames >20ms (janky) | frames rendered in 1.4s |
|---|---|---|---|
| Before | 39.4ms (~25fps) | 69.4% | 36 |
| After | 19.4–19.7ms (~50fps) | 9.6–11.1% | 73–74 |

Roughly double the frame throughput, confirmed on the real patched build (not just an isolated
style-injection experiment).

### A real side effect, isolated and fixed correctly (not papered over)

Registering `--pos` as compositor/GPU-interpolatable routes it through float32 internally.
`tests/integration/behandelingen-button-retarget.spec.ts`'s spacing-invariant check (adjacent
cards must stay exactly 1 apart, read via `getComputedStyle().getPropertyValue('--pos')`)
started failing **deterministically** (same ~5e-6 value, 3/3 repeated runs — not flaky) at its
original `1e-6` tolerance.

Isolated by temporarily disabling just the `@property` block (keeping `will-change`): the test
passed 3/3. Confirms the discrepancy is a `getComputedStyle` readback artifact from the typed
CSS OM's float32 precision — **not an actual positional drift**. The underlying JS state
(`positions[]`/`offset`) is untouched, still exact double precision throughout; only this
test's own instrumentation sees the rounding. Tolerance loosened to `1e-4` — still five orders
of magnitude below anything visually perceptible, and still a hard fail on any real drift bug
(which would read in whole fractions of a step, not millionths). Comment added in the test
explaining why, so this isn't mysterious to a future reader.

Confirmed no other spec has a comparably tight `--pos`-precision tolerance that this same
mechanism could affect (`behandelingen-momentum.spec.ts`'s own `1e-6` check is under
`prefers-reduced-motion`, where `--pos` is never actively animated — no float32 interpolation
path is exercised, and it passed unmodified).

**Full suite:** 273 passed, 6 skipped (pre-existing baseline, unaffected by this change).

## How to revert if this turns out to be a problem

Single, isolated commit — `git revert cdf4e0645671d3ce89cf22402cb064f670dda80d` cleanly undoes
both the CSS addition and the paired test-tolerance change together (they must move as a pair —
reverting only the CSS half without also tightening the test tolerance back would leave the
test correct again automatically, since the float32 artifact only exists with `@property`
registered; reverting only the test half without the CSS would just loosen a check for no
reason). Nothing else in the branch's history depends on this commit.

## Not done / left for the owner

- **Desktop verification** — explicitly deferred to the owner's own check. This fix targeted a
  measured mobile-CPU cost; if desktop *also* shows a smoothness problem, treat it as a
  separate investigation (the mechanism here — main-thread style recalc from an unregistered
  custom property — is real, but a desktop-visible symptom would need its own confirmation
  before assuming the same root cause, or a different one entirely).
