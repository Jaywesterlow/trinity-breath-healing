<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	import TreatmentCard from '$lib/components/ui/TreatmentCard.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	const ICONS: Record<string, string> = {
		'mahatma-healing': '/images/card-mahatma-healing.svg',
		goldhealing: '/images/card-goldhealing.svg',
		'raster-energie': '/images/infinity.png',
		'spinal-touch': '/images/card-spinal-touch.svg'
	};

	// buttonLabel is placeholder copy, not final — see TreatmentCard.svelte.
	// 5th card by design (see ROADMAP.md LND-05) — never implemented on the old
	// auto-scroll version. No icon file for it; TreatmentCard renders it with
	// no image, same as every other card would if it had none.
	//
	// TEMPORARY: DIAG_ITEMS below (and cardNumber on every TreatmentCard in
	// the template) are a throwaway diagnostic aid so the carousel owner can
	// watch the fan behave with more than 5 cards and tell them apart — NOT
	// real services. They will be reverted before merge; do not build on top
	// of them. Labelled unmistakably as test content (not plausible service
	// names) so the placeholder-content audit and any reviewer can spot them
	// at a glance.
	const DIAG_ITEMS = [6, 7, 8].map((n) => ({
		key: `diag-test-card-${n}`,
		label: `TESTKAART ${n} — TIJDELIJK, GEEN ECHTE DIENST`,
		icon: null,
		buttonLabel: 'Test',
		buttonHref: '/diensten'
	}));

	const items = [
		...BRAND.services.map((s) => ({
			key: s.slug,
			label: s.name,
			icon: ICONS[s.slug] as string | null,
			buttonLabel: 'Meer info',
			buttonHref: `/diensten/${s.slug}`
		})),
		{
			key: 'meer-diensten',
			label: 'Meer diensten',
			icon: null,
			buttonLabel: 'Bekijk alles',
			buttonHref: '/diensten'
		},
		...DIAG_ITEMS
	];

	const count = items.length;

	// The distinct-slot range every item's position can occupy, sized to hold
	// exactly `count` slots and centred on 0 (0 itself is always one of the
	// slots). For an odd count this range is perfectly symmetric — e.g.
	// count=5 gives [-2, 2]. For an even count perfect symmetry around a
	// single slot (0) is impossible, so the one extra slot lands on the
	// positive side — e.g. count=8 gives [-3, 4]. Which side gets the extra
	// slot doesn't matter for correctness (see the recycle thresholds below,
	// which are derived from HIGH_SLOT/LOW_SLOT directly rather than
	// assuming symmetry) — it only has to be *some* fixed side, so the
	// initial layout below is deterministic.
	const HIGH_SLOT = Math.floor(count / 2);
	const LOW_SLOT = HIGH_SLOT - count + 1;

	// Each item's own position on an evenly-spaced horizontal line, in units
	// of "card-widths from center." NOT derived from an index every render —
	// a real, persistent number per item that only ever moves by ±1 per
	// click. That's the whole fix: the old version recomputed every item's
	// position from scratch via a shortest-path wrap, so the one item at the
	// edge being vacated had nowhere to go but straight across the screen.
	// Here it just keeps counting past the edge, off-screen, same as
	// everything else — see next()/prev() below for where it eventually
	// loops back.
	//
	// Laid out left-to-right in source order around the loop: items
	// 0..HIGH_SLOT get slots 0..HIGH_SLOT (ascending), and the remaining
	// items get the tail of the range wrapped to the negative side
	// (LOW_SLOT..-1, also ascending) — e.g. count=5 gives [0, 1, 2, -2, -1],
	// count=8 gives [0, 1, 2, 3, 4, -3, -2, -1]. Every item lands on a
	// distinct slot by construction, since HIGH_SLOT/LOW_SLOT above were
	// sized to hold exactly `count` of them.
	let positions: number[] = $state(
		Array.from({ length: count }, (_, i) => (i <= HIGH_SLOT ? i : i - count))
	);

	// Items currently mid-recycle (see onPivotTransitionEnd) — their
	// transition is suppressed for a frame so they reposition instantly
	// instead of visibly sliding across from one edge to the other. A Set,
	// not a single value: more than one item can be mid-recycle at once.
	// SvelteSet (not a plain Set) so .add()/.delete() are tracked directly
	// — no reassignment needed to trigger reactivity.
	const noTransitionKeys = new SvelteSet<string>();

	function armNoTransition(key: string): void {
		noTransitionKeys.add(key);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				noTransitionKeys.delete(key);
			});
		});
	}

	// The one place position ever changes, and deliberately restricted to
	// a single ±1 step per call. Only 3 cards (position -1, 0, 1) are ever
	// visible — .treatments__fan clips anything past that with plenty of
	// margin (see the CSS), so every slot from HIGH_SLOT down to 2 (and
	// LOW_SLOT up to -2) is already fully off-screen. An item only recycles
	// once it takes ONE MORE step past the *end* of that slot range — past
	// HIGH_SLOT going positive, or past LOW_SLOT going negative — meaning
	// every item spends a full step sitting off-screen, invisible, before it
	// jumps ∓count (once around the loop) to reappear on the opposite side.
	// That threshold isn't hardcoded: it falls straight out of HIGH_SLOT/
	// LOW_SLOT above, so it's automatically correct for whatever `count` is
	// (e.g. count=5: recycle past ±2, at ±3; count=8: recycle past 4/-3, at
	// 5/-4). That invariant — recycling only ever touches an item that was
	// already off-screen on both sides of the jump — is only guaranteed to
	// hold for |delta| = 1; two other approaches for bigger jumps were tried
	// and rejected: applying a bigger delta directly (an item's raw target
	// can overshoot straight past a visible slot into recycle range, so
	// folding it back teleported a visible card with no animation) and
	// giving each item its own short "already folded" target for a bigger
	// jump (fixed the teleport, but items no longer stayed the same
	// distance apart from each other *during* the transition, since
	// different-length sweeps reach their targets at different rates under
	// the same easing curve — confirmed via bounding-box measurement as
	// real, visible overlapping and gapping mid-swipe). commitSteps below
	// gets a multi-step swipe's speed by calling this several times in a
	// fast cascade instead, so every individual step stays exactly the
	// shape that's already proven safe.
	function shiftOne(delta: number): void {
		positions = positions.map((p, i) => {
			let next = p + delta;
			while (next <= LOW_SLOT - 1) {
				armNoTransition(items[i]!.key);
				next += count;
			}
			while (next >= HIGH_SLOT + 1) {
				armNoTransition(items[i]!.key);
				next -= count;
			}
			return next;
		});
	}

	// A multi-step commit (see endDrag/goTo below) as a rapid cascade of
	// single, already-safe steps rather than one big jump. Firing each new
	// step before the previous one's transition had actually finished —
	// redirecting it mid-flight toward the new target — was the first
	// approach here, on the assumption that's ordinary, smooth CSS
	// behavior. It measurably isn't safe for this: retargeting a
	// transition for 5 items simultaneously, with one of them also
	// recycling (see shiftOne) partway through, doesn't keep their
	// relative spacing intact for that redirect — confirmed via
	// bounding-box measurement as real overlap, independent of how long
	// the interval between steps was. Letting each step's transition
	// genuinely finish before the next one starts fixes that outright, so
	// a cascade runs with a shorter transition duration (see
	// .treatments__pivot--fast) instead of the normal one — several quick,
	// fully-settled hops reads as one fast sweep without ever redirecting
	// a transition in progress. A single step (the overwhelming majority
	// of interactions) never touches this — it keeps the normal duration.
	const FAST_STEP_MS = 220; // headroom over .treatments__pivot--fast's 180ms transition-duration
	let cascading = $state(false);

	function commitSteps(steps: number): void {
		if (steps === 0) return;
		const direction = steps > 0 ? 1 : -1;
		let remaining = Math.abs(steps);
		if (remaining === 1) {
			shiftOne(direction);
			return;
		}
		cascading = true;
		function tick(): void {
			shiftOne(direction);
			remaining--;
			if (remaining > 0) {
				setTimeout(tick, FAST_STEP_MS);
			} else {
				cascading = false;
			}
		}
		tick();
	}

	// Deliberately plain functions, not tied to how they're called — autoscroll
	// (deferred, see KNOWN-ISSUES) drops in later as a paused-on-hover
	// setInterval(next, …) here without touching anything else.
	function next(): void {
		shiftOne(-1);
	}
	function prev(): void {
		shiftOne(1);
	}
	function goTo(i: number): void {
		// A second commit entering while a cascade is still running is the
		// "redirect a transition in progress" case commitSteps documents above
		// — the one that measurably breaks relative spacing mid-sweep. The
		// dots could already trigger it on a fast double-click; the desktop
		// card overlay (see jumpTo) makes bigger targets for the same thing.
		if (cascading) return;
		commitSteps(-positions[i]!);
	}

	// Desktop: clicking a visible side card centres it. Deliberately just
	// goTo — no new position maths, the same already-proven cascade the dots
	// use. The overlay button this fires from only exists at |position| === 1
	// (see the template), so the centre card's own link is never covered and
	// the off-screen ±2 cards never carry an invisible hit target.
	function jumpTo(i: number): void {
		// A mouse drag ends in a click on whatever sat under the pointer, so
		// without this a desktop drag-follow would also fire a jump on release.
		if (dragMoved) return;
		goTo(i);
	}

	// Swipe (mobile/tablet — Prev/Next buttons are CSS-hidden below the
	// desktop breakpoint, see .treatments__nav). Live drag-follow, not a
	// once-per-swipe step: every pointermove adds the current drag distance,
	// in fractional "steps," directly onto --pos (see offset below and its
	// use in the template), so the fan visibly tracks the finger in real
	// time. Release used to hand off to a discrete step-count animation —
	// commitSteps, cascaded FAST_STEP_MS apart — computed from rounded
	// distance plus a fling bonus. That produced a measurable pause (the
	// first step waiting to start) followed by rigid, constant-speed hops
	// with nothing decaying, which is exactly what a fling shouldn't feel
	// like. Release now stays on the same continuous offset the drag
	// already drives: momentum keeps integrating it with a decaying
	// velocity (see beginMomentum/momentumTick), then a short per-frame
	// ease (see beginSettle/settleTick — never a CSS transition handoff,
	// that handoff was the pause) brings it to rest on the nearest card.
	// One continuous motion from finger-down to rest, no seam.
	//
	// offset itself is kept inside (-1, 1) at all times, during drag AND
	// momentum AND settle (see absorbWholeSteps): the instant it would cross
	// ±1, positions[i] is permanently advanced by shiftOne(±1) and offset is
	// adjusted back by the same amount in the same tick, so --pos
	// (positions[i] + offset) never jumps. That's the same |delta| = 1
	// invariant shiftOne's own comment defends — this preserves it rather
	// than replacing it, because shiftOne is still only ever called at the
	// exact moment the fan has travelled one full card, so the item it
	// recycles is still off-screen exactly as it is today.
	const PX_PER_STEP = 90; // ~one mobile card-width of drag == one step
	const VELOCITY_WINDOW_MS = 80; // trailing window the exit velocity is averaged over

	// Release physics: exponential velocity decay, then a short settle onto
	// the nearest card. Both tuned by feel against real flicks, not
	// derived — MOMENTUM_TAU_MS is the time for velocity to fall to ~37%
	// (1/e) of its starting value, so a hard flick keeps visibly drifting
	// for roughly a second before it's slow enough to settle.
	const MOMENTUM_TAU_MS = 180;
	const MOMENTUM_STOP_THRESHOLD = 0.0004; // steps/ms — below this, motion is imperceptible; switch to settling
	// Below this exit speed, treat the release as a deliberate drag stop, not
	// a flick, and skip momentum entirely (settle straight from wherever
	// offset already is). Reuses the old fling model's own 0.35 px/ms
	// threshold, converted to steps/ms — a slow, unhurried release measured
	// at ~0.12 px/ms in testing, which is real, non-zero exit velocity, but
	// integrating even that small a velocity over the full decay tail
	// (v0 * MOMENTUM_TAU_MS) still added enough distance to round an
	// intentionally-uncommitted drag onto the next card. A flick and an
	// unhurried release are physically different gestures; this is the line
	// between them, not a discrete step-count threshold like the deleted
	// FLING_VELOCITY_PER_STEP was.
	const MOMENTUM_MIN_VELOCITY = 0.35 / PX_PER_STEP; // steps/ms
	const SETTLE_DURATION_MS = 300; // ease onto the nearest card over this long, driven per-frame (see settleTick)

	const DRAG_SLOP_PX = 4; // past this, the gesture is a drag and not a click

	let dragging = $state(false); // true only while the pointer is actually down and moving the fan
	// True from pointerdown through drag, momentum, AND settle — the whole
	// gesture, not just the drag itself. Drives .treatments__pivot--motion
	// (transition: none) so none of that continuous, per-frame offset math
	// ever fights a CSS transition. Only goes false once settle actually
	// lands on a card (see endGesture).
	let inGesture = $state(false);
	// Continuous fractional offset added to every item's integer position
	// (see positions above) to produce --pos. Live during drag, momentum,
	// and settle alike — this is the one thing that never mode-switches.
	let offset = $state(0);
	let dragStartX = 0;
	let dragStartY = 0;
	// offset's value at the moment the current drag started. A drag can now
	// begin mid-momentum or mid-settle (see cancelMotion, called from
	// onPointerDown), so the drag has to add its own delta on top of
	// wherever offset already was, not replace it outright — replacing it
	// would snap the fan back toward 0 the instant a new gesture interrupts
	// a flick.
	let dragBaseOffset = 0;
	// Whether the current gesture ever moved far enough to count as a drag.
	// Read by jumpTo, not by the fan itself — plain, not $state: nothing
	// renders from it.
	let dragMoved = false;
	let moveHistory: { x: number; t: number }[] = [];
	let pendingDx = 0;
	let rafId: number | null = null;

	// Momentum and settle run in their own rAF loop, sharing one id: only
	// one of the two is ever active at a time, and a new pointerdown cancels
	// whichever is running (see cancelMotion).
	let motionRafId: number | null = null;
	let phase: 'idle' | 'momentum' | 'settle' = 'idle';
	let velocity = 0; // steps per ms, decays toward 0 during momentum
	let lastFrameTime = 0;
	let settleFrom = 0;
	let settleTarget = 0;
	let settleStartTime = 0;

	function prefersReducedMotion(): boolean {
		// matchMedia is guarded, not assumed — same reasoning as
		// src/lib/actions/reveal.ts: this runs under component unit tests
		// too, and a bare jsdom environment has no matchMedia.
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// The invariant that makes continuous release motion safe: whenever
	// offset would carry --pos a full card past its current slot, fold that
	// whole step permanently into positions[i] via shiftOne (see its own
	// comment for why |delta| = 1 is the only safe call shape) and remove
	// the same amount from offset in the same tick. positions[i] + offset
	// is unchanged at that instant — no visible jump — but the travel is
	// now committed. A while loop, not an if: a single fast frame during
	// momentum can legitimately cross more than one card boundary.
	function absorbWholeSteps(): void {
		while (offset >= 1) {
			shiftOne(1);
			offset -= 1;
		}
		while (offset <= -1) {
			shiftOne(-1);
			offset += 1;
		}
	}

	function endGesture(): void {
		phase = 'idle';
		inGesture = false;
		motionRafId = null;
		velocity = 0;
	}

	// A new pointerdown while momentum or settle is still running must take
	// over from wherever the fan currently is, not fight it or snap it back
	// — cancel the loop, leave offset/positions exactly as they are, and let
	// onPointerDown's dragBaseOffset pick up from there.
	function cancelMotion(): void {
		if (motionRafId !== null) {
			cancelAnimationFrame(motionRafId);
			motionRafId = null;
		}
		phase = 'idle';
	}

	function beginMomentum(): void {
		phase = 'momentum';
		lastFrameTime = performance.now();
		motionRafId = requestAnimationFrame(momentumTick);
	}

	function momentumTick(now: number): void {
		// Clamped so a stalled/backgrounded frame can't integrate one huge,
		// visibly-teleporting jump — a normal frame is ~16ms.
		const dt = Math.min(now - lastFrameTime, 50);
		lastFrameTime = now;
		velocity *= Math.exp(-dt / MOMENTUM_TAU_MS);
		offset += velocity * dt;
		absorbWholeSteps();
		if (Math.abs(velocity) < MOMENTUM_STOP_THRESHOLD) {
			beginSettle();
			return;
		}
		motionRafId = requestAnimationFrame(momentumTick);
	}

	function beginSettle(): void {
		phase = 'settle';
		settleFrom = offset;
		settleTarget = Math.round(offset);
		if (settleFrom === settleTarget) {
			offset = settleTarget;
			absorbWholeSteps();
			endGesture();
			return;
		}
		settleStartTime = performance.now();
		motionRafId = requestAnimationFrame(settleTick);
	}

	function settleTick(now: number): void {
		const t = Math.min(1, (now - settleStartTime) / SETTLE_DURATION_MS);
		const eased = 1 - Math.pow(1 - t, 3); // ease-out — same weight as the old CSS ease-in-out hop, no transition handoff
		offset = settleFrom + (settleTarget - settleFrom) * eased;
		if (t >= 1) {
			// Land exactly on the integer, then fold it into positions[i] one
			// last time so offset always ends a gesture at exactly 0.
			offset = settleTarget;
			absorbWholeSteps();
			endGesture();
			return;
		}
		motionRafId = requestAnimationFrame(settleTick);
	}

	// prefers-reduced-motion: no decaying drift, no eased settle — jump
	// straight to the nearest card the instant the pointer lifts.
	function settleInstant(): void {
		offset = Math.round(offset);
		absorbWholeSteps();
		endGesture();
	}

	function onPointerDown(e: PointerEvent): void {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		// Take over from wherever a running momentum/settle loop currently is
		// — see cancelMotion's own comment.
		cancelMotion();
		dragging = true;
		inGesture = true;
		dragMoved = false;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragBaseOffset = offset;
		moveHistory = [{ x: e.clientX, t: e.timeStamp }];
		window.addEventListener('pointermove', onWindowPointerMove);
		window.addEventListener('pointerup', onWindowPointerUp);
		window.addEventListener('pointercancel', onWindowPointerCancel);
	}

	// Tracked on window, not the fan element: a fast drag easily carries the
	// pointer outside the fan's own bounds mid-gesture, and window-level
	// listeners (added on pointerdown, removed on release) keep following it
	// regardless — unlike setPointerCapture, this doesn't touch how the
	// browser dispatches the eventual click to whatever was actually under
	// the finger, so a real tap on a card's corner-button link still works.
	//
	// Touch/pointer input can fire faster than the display repaints (touch
	// sampling commonly outpaces 60Hz), and writing straight to $state here
	// pushed a Svelte + DOM update on every single one of those — more
	// writes than the screen could ever show, which read as choppy rather
	// than smooth. rAF-throttling to one state write per animation frame
	// (below) fixed it: the pointermove handler itself stays cheap (just
	// records the latest dx), and only the most recent value actually
	// reaches --pos each frame.
	function onWindowPointerMove(e: PointerEvent): void {
		if (!dragging) return;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		// Set before the vertical-intent bail below, and off total travel, not
		// just dx: a gesture that wandered mostly vertically still isn't a
		// click, and the jump it would otherwise fire on release (see jumpTo)
		// would land on whichever card the pointer happened to end over.
		if (Math.hypot(dx, dy) > DRAG_SLOP_PX) dragMoved = true;
		// Undecided-intent moves (still mostly vertical) don't drive the fan
		// yet, so an in-progress vertical scroll doesn't creep sideways.
		if (Math.abs(dx) <= Math.abs(dy)) return;
		moveHistory.push({ x: e.clientX, t: e.timeStamp });
		const cutoff = e.timeStamp - VELOCITY_WINDOW_MS;
		while (moveHistory.length > 2 && moveHistory[0]!.t < cutoff) {
			moveHistory.shift();
		}
		pendingDx = dx;
		if (rafId === null) {
			rafId = requestAnimationFrame(() => {
				rafId = null;
				offset = dragBaseOffset + pendingDx / PX_PER_STEP;
			});
		}
	}

	function endDrag(): void {
		dragging = false;
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		window.removeEventListener('pointermove', onWindowPointerMove);
		window.removeEventListener('pointerup', onWindowPointerUp);
		window.removeEventListener('pointercancel', onWindowPointerCancel);

		// Exit velocity from the same smoothed trailing window as before — a
		// single last sample is noisy — converted from px/ms to steps/ms so
		// it integrates directly against offset (see momentumTick).
		let velocityPxPerMs = 0;
		if (moveHistory.length >= 2) {
			const first = moveHistory[0]!;
			const last = moveHistory[moveHistory.length - 1]!;
			const dt = last.t - first.t;
			if (dt > 0) velocityPxPerMs = (last.x - first.x) / dt;
		}
		velocity = velocityPxPerMs / PX_PER_STEP;

		if (prefersReducedMotion()) {
			settleInstant();
			return;
		}
		if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY) {
			// Not a flick — settle straight from the current offset, no coast.
			beginSettle();
			return;
		}
		beginMomentum();
	}

	function onWindowPointerUp(): void {
		endDrag();
	}

	function onWindowPointerCancel(): void {
		endDrag();
	}
</script>

<section class="treatments" aria-label="Behandelingen">
	<header class="treatments__header">
		<p class="treatments__eyebrow" use:reveal={{ delay: 0 }}>Diensten</p>
		<h2 class="treatments__heading" use:reveal={{ delay: 120 }}>
			Elke behandeling is uniek, met een centraal doel: jouw herstel.
		</h2>
	</header>

	<div class="treatments__carousel-wrap">
		<div
			class="treatments__fan"
			role="group"
			aria-roledescription="carrousel"
			aria-label="Behandelingen"
			onpointerdown={onPointerDown}
		>
			{#each items as item, i (item.key)}
				<div
					class="treatments__pivot"
					class:treatments__pivot--jump={noTransitionKeys.has(item.key)}
					class:treatments__pivot--motion={inGesture}
					class:treatments__pivot--fast={cascading}
					style="--pos: {positions[i]! + offset}"
				>
					<TreatmentCard
						label={item.label}
						icon={item.icon}
						cardNumber={i + 1}
						buttonLabel={item.buttonLabel}
						buttonHref={item.buttonHref}
					/>

					<!-- Desktop click-to-jump (CSS-hidden below 1024px). Only on the
					     two visible side cards: the centre card must keep its own
					     link clickable, and ±2 is off-screen, so covering it would
					     put a hit target over nothing. aria-hidden + tabindex="-1"
					     on purpose — this is a pointer affordance, not a second
					     control. The keyboard path is already complete and better
					     labelled via the dots below (same goTo) and Prev/Next;
					     another focusable element per card would only duplicate
					     them and sit next to that card's own link in the tab order. -->
					{#if positions[i] === 1 || positions[i] === -1}
						<button
							type="button"
							class="treatments__jump"
							tabindex="-1"
							aria-hidden="true"
							onclick={() => jumpTo(i)}
						></button>
					{/if}
				</div>
			{/each}
		</div>

		<div class="treatments__controls">
			<button type="button" class="treatments__nav" onclick={prev} aria-label="Vorige">Prev</button>

			<ul class="treatments__dots">
				{#each items as item, i (item.key)}
					<li class="treatments__dot">
						<button
							type="button"
							class="treatments__dot-visual"
							class:treatments__dot-visual--active={positions[i] === 0}
							aria-label={`Ga naar ${item.label}`}
							onclick={() => goTo(i)}
						></button>
					</li>
				{/each}
			</ul>

			<button type="button" class="treatments__nav" onclick={next} aria-label="Volgende"
				>Next</button
			>
		</div>
	</div>
</section>

<style>
	.treatments {
		background: var(--color-bg-sand);
		min-height: 70vh; /* 30% less than desktop's 100vh on mobile */
		display: flex;
		flex-direction: column;
		padding: var(--space-16) 0 var(--space-8);
	}

	.treatments__header {
		max-width: 24rem;
		margin: 0 auto var(--space-8);
		padding: 0 var(--space-6);
		text-align: center;
	}

	.treatments__carousel-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-8);
	}

	/* --- Curved fan, ONE mechanism at every breakpoint. ---
	   Cards rotate around a single shared point far below the row (see
	   .treatments__pivot) — that's what curves the path they travel, not
	   just each card's own tilt. Only 3 positions (-1, 0, 1) land inside
	   .treatments__fan's visible, clipped window; ±2 is already fully
	   off-screen by design (see the sizing math on .treatments__pivot), so
	   a card's exit is a normal, visible slide out past the edge — never a
	   pop, never display:none.

	   The "continuous loop" comes from script.ts's shiftAll: --pos keeps
	   counting past ±2 instead of wrapping back into view, so nothing ever
	   needs to jump across the screen to reach its next spot — it only
	   recycles (∓count, one lap of the loop; see HIGH_SLOT/LOW_SLOT in the
	   script for exactly where "a further step past that" lands for a given
	   item count) once it's a further step past that, fully invisible,
	   frozen for that one frame as a second guarantee. This
	   part didn't change when the transform went from independent
	   translate+rotate back to a shared pivot — it's what actually fixed
	   the overlap/pop bugs, independent of how --pos gets drawn. */
	.treatments__fan {
		position: relative;
		/* Full-bleed to the true viewport edge, not just this element's own
		   parent — .treatments has no horizontal padding, but this makes it
		   correct regardless: the clip boundary (overflow below) has to be
		   the screen edge itself, or cards visibly stop short of it with a
		   gap on either side. Standard break-out-of-container trick. */
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		/* Tall enough that no card clips top or bottom at any position from
		   -2 to 2, verified empirically (rendered bounding boxes measured
		   directly, not hand-computed — a rotated rectangle's bounding box
		   doesn't move the way simple trig on one reference point predicts,
		   see the commit message). */
		height: 20.76rem;
		overflow: hidden;
		/* Horizontal gestures drive next()/prev() (see onPointerDown/Up in the
		   script) — pan-y keeps vertical page scroll working through a touch
		   that starts on the carousel, since only left/right is ours to
		   claim. */
		touch-action: pan-y;
		/* Set here, not on .treatments__card: custom properties only inherit
		   DOWN the tree, and .treatments__pivot (the card's own parent) needs
		   to read this too. A child can't hand a variable up to its parent. */
		--card-width: 6.27rem;
	}

	/* Rotates around ONE shared point far below the row (a real fan hub) —
	   this is what makes the PATH curve, not just the card's own tilt.
	   translateX alone (independent per card) gave the right angle but a
	   flat line. --pos still drives it, still the same persistent,
	   non-wrapping value from shiftAll — only how it becomes a transform
	   changed here, not the position/recycle logic that actually fixed the
	   overlap and pop bugs. Bottom-anchored, not top: see the same
	   reasoning as the very first arc version (further up in this file's
	   history) — anchoring from the top made an unrotated, full-size card
	   hang lower than its smaller, more-rotated neighbors. */
	.treatments__pivot {
		position: absolute;
		left: 50%;
		bottom: var(--pivot-baseline, 7.54rem);
		--pivot-distance: 532px; /* smaller = more overlap risk, bigger = flatter curve — verified empirically, not by trig alone */
		--tilt-step: 14deg;
		transform-origin: 50% calc(100% + var(--pivot-distance));
		transform: translateX(-50%) rotate(calc(var(--pos) * var(--tilt-step)));
		transition: transform 600ms var(--ease-in-out);
	}

	/* Frozen for exactly the frame a recycle happens (see shiftAll in the
	   script) — repositions instantly instead of visibly crossing from one
	   edge to the other. Belt-and-suspenders: the recycle only ever fires
	   on an item that's already fully clipped and invisible, this just
	   guarantees it stays that way even if the sizing math above is ever
	   retuned and the margins get tighter. */
	.treatments__pivot--jump {
		transition: none;
	}

	/* Covers the WHOLE gesture — drag, momentum, and settle — not just the
	   drag itself (see inGesture in the script). --pos is being driven
	   directly, per frame, by the pointer during drag and by the momentum/
	   settle rAF loop after release; a CSS transition here would fight that
	   with its own easing on top of the JS-driven easing settle already
	   does, which is exactly the pause-then-rigid-hop behaviour this whole
	   mechanism replaced. Released only once settle actually lands on a
	   card (see endGesture) — the discrete goTo/commitSteps path (dots,
	   Prev/Next, desktop click-to-jump) is untouched by this and still gets
	   its normal CSS transition. */
	.treatments__pivot--motion {
		transition: none;
	}

	/* A multi-step cascade (see commitSteps in the script) runs each of its
	   individual, already-safe ±1 steps back to back at this shorter
	   duration instead of the normal 600ms — several quick, fully-settled
	   hops read as one fast sweep. Kept comfortably under the script's
	   FAST_STEP_MS (the gap between cascaded steps) by hand, since the two
	   live in separate files with no shared source of truth: the
	   transition must finish with room to spare before the next step
	   fires, or steps start redirecting each other mid-flight again —
	   confirmed via bounding-box measurement as the actual cause of real,
	   visible overlap during a cascade. */
	.treatments__pivot--fast {
		transition-duration: 180ms;
	}

	/* Desktop-only click target over a visible side card (see the {#if} in the
	   template for why only those two). Hidden here, restored in the desktop
	   media query at the bottom — mobile navigates that section by swiping the
	   fan itself, and a tap target sitting on top of a card would swallow the
	   pointerdown that starts the drag. Sized off .treatments__pivot, which is
	   already position:absolute and therefore this element's containing block,
	   so it tracks the card through the rotation without needing its own
	   transform. */
	.treatments__jump {
		display: none;
	}

	/* Card size/padding/layout itself lives in TreatmentCard.svelte — the one
	   place it's defined, used identically for all 5 cards. --card-width is
	   declared here instead, on .treatments__fan, so the carousel's own
	   breakpoint (this file's) drives the responsive size — TreatmentCard
	   doesn't need its own separate width media query to match. */

	.treatments__controls {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		/* .treatments__fan keeps a big empty buffer below the resting card on
		   purpose — that's the clipping safety margin a card's rotated corner
		   needs mid-transition at the far positions (see .treatments__pivot).
		   Shrinking that buffer directly re-clips cards during swipes; pulling
		   the controls up over the (visually empty) buffer instead gets the
		   same tight ~2rem look without touching the safety margin. Setting
		   this to exactly -1x --pivot-baseline cancels the buffer out
		   entirely, leaving just the flex gap (--space-8, 2rem) above
		   .treatments__controls as the visual distance to the card. */
		margin-top: -7.54rem;
		/* .treatments__fan is position:relative, which — regardless of DOM
		   order — paints after (on top of) non-positioned siblings. Without
		   this, the overlap from the negative margin above makes the fan's
		   own (invisible but still hit-testable) box swallow clicks meant for
		   Prev/Next/the dots. */
		position: relative;
		z-index: 1;
	}

	.treatments__nav {
		/* Mobile/tablet navigate by swiping the carousel itself (see
		   onPointerDown/Up) — Prev/Next are desktop-only, restored below. */
		display: none;
		border: none;
		border-radius: var(--radius-full);
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		font-size: var(--fs-cta);
		font-weight: var(--font-weight-medium);
		padding: var(--space-2) var(--space-5);
		cursor: pointer;
		transition: background-color var(--motion-fast);
	}

	.treatments__nav:hover {
		background: var(--brand-muted);
	}

	.treatments__dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.treatments__dot {
		display: grid;
		place-items: center;
		width: 0.7rem;
		height: 0.7rem;
	}

	.treatments__dot-visual {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-fg-forest);
		background: transparent;
		padding: 0;
		appearance: none;
		cursor: pointer;
		transition: background-color var(--motion-fast);
	}

	.treatments__dot-visual--active {
		background: var(--color-fg-forest);
	}

	.treatments__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.treatments__heading {
		max-width: 20rem;
		margin: 0 auto;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.treatments {
			min-height: 100vh;
		}

		.treatments__header {
			max-width: none;
		}

		.treatments__heading {
			max-width: 34rem;
		}

		/* Desktop: same curved mechanism as mobile above, just bigger — more
		   screen room, so cards can be larger and spread wider. Nothing here
		   changes the mechanism, only the numbers. Full-bleed stays inherited
		   from the base rule above (not undone here): a capped-width centered
		   container was tried and rejected — it clips the ±1 cards mid-body
		   at a diagonal (following their own rotation) instead of at a clean
		   edge, since the tilted card sticks out well past a narrow fixed
		   box. The viewport edge is always far enough away that a card is
		   fully past it, off-screen, before it's clipped — same reasoning as
		   the mobile full-bleed fix. */
		.treatments__fan {
			/* Card grown ~26% (11.9rem -> 15rem, within the requested 20-30%)
			   and height/baseline scaled by that same factor (39.33rem ->
			   49.5rem, 14.28rem -> 18rem) to keep the same shape, just bigger
			   — this breakpoint's own numbers, independently re-measured this
			   round via Playwright bounding-box readouts (not carried over
			   proportionally from mobile untouched, and not hand-computed:
			   see the file-level comment on why trig on one reference point
			   doesn't predict a rotated box's bbox). Confirmed at 1440x900 and
			   1280x900 with the (temporary, 8-card) TESTKAART set: every card
			   at slot -2..2 clears .treatments__fan's top and bottom edge with
			   room to spare; slots 3, 4 and -3 do clip in their raw bounding
			   box, but at both widths they sit fully past the viewport's left
			   or right edge (a plain `x`/`x+width` check against the viewport),
			   so that clip is never actually visible — same invariant the
			   original 5-card version relied on for its own ±2 cutoff.
			   tilt-step isn't overridden here on purpose — it's an angle,
			   not a length, so it doesn't scale with card size. */
			height: 49.5rem;
			--card-width: 15rem;
		}

		.treatments__pivot {
			--pivot-baseline: 18rem;
			/* Scaled past the proportional 1273px (1010px x 1.26) on purpose —
			   the owner asked for more breathing room between cards, not just
			   the same gap at a bigger size. Verified via measured bbox edge
			   gaps: the pos0/pos1 gap roughly doubled (56.77px -> 114.35px at
			   1440px) versus the ~26% a proportional-only change would give. */
			--pivot-distance: 1450px;
		}

		.treatments__controls {
			/* -1x --pivot-baseline (18rem) would cancel the fan's clipping
			   safety buffer out entirely (see the base .treatments__controls
			   rule above for why that buffer itself must never shrink) — offset
			   by +2rem off that cancel-point so the nav sits 2rem lower than
			   the tightest-possible tuck, without touching the buffer. */
			margin-top: -16rem;
		}

		.treatments__nav {
			display: inline-block;
		}

		/* inset:0 rather than a width/height pair — .treatments__pivot is sized
		   by the card inside it, and the card's own size is set in
		   TreatmentCard.svelte off --card-width. Matching the card's radius
		   keeps the hover wash from squaring off its corners. The wash is the
		   only affordance beyond the cursor: anything that moved or resized the
		   card would fight geometry (--pivot-distance, --tilt-step, the fan
		   height) that was tuned against measured bounding boxes. */
		.treatments__jump {
			display: block;
			position: absolute;
			inset: 0;
			padding: 0;
			border: none;
			border-radius: var(--radius-lg);
			background: transparent;
			cursor: pointer;
			transition: background-color var(--motion-fast);
		}

		.treatments__jump:hover {
			background: color-mix(in srgb, var(--color-bg-sand) 12%, transparent);
		}
	}
</style>
