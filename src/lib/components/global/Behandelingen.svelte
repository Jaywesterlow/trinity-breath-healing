<script lang="ts">
	import { onMount } from 'svelte';
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
		label: 'TESTKAART',
		icon: null,
		buttonLabel: 'Test',
		buttonHref: '/diensten',
		description: 'TESTKAART diagnostic — not real copy.'
	}));

	// 'Meer diensten' description is placeholder copy (260809-hov), same
	// TODO_-prefixed convention as BRAND.services' own descriptions in
	// brand.ts — not ours to invent real copy for, see that file's comment.
	const MEER_DIENSTEN_DESCRIPTION = 'TODO_ Korte omschrijving van het volledige aanbod volgt nog.';

	const items = [
		...BRAND.services.map((s) => ({
			key: s.slug,
			label: s.name,
			icon: ICONS[s.slug] as string | null,
			buttonLabel: 'Meer info',
			buttonHref: `/diensten/${s.slug}`,
			description: s.description
		})),
		{
			key: 'meer-diensten',
			label: 'Meer diensten',
			icon: null,
			buttonLabel: 'Bekijk alles',
			buttonHref: '/diensten',
			description: MEER_DIENSTEN_DESCRIPTION
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
	// real, visible overlapping and gapping mid-swipe). Multi-step motion
	// today travels through the continuous offset instead (see motionTick/
	// absorbWholeSteps and driveMotion further down) — a single frame can
	// fold more than one step, but only by calling this exactly once per
	// boundary actually crossed, so every individual step still stays
	// exactly the shape that's already proven safe.
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

	// Deliberately plain functions, not tied to how they're called — autoscroll
	// (deferred, see KNOWN-ISSUES) drops in later as a paused-on-hover
	// setInterval(next, …) here without touching anything else.
	// Both routed through driveMotion/driveBy (defined further down, next to
	// the rest of the motion state) — a button press is just the same
	// continuous offset the pointer path already drives, given a target
	// instead of a finger. See driveMotion's own comment for how it shapes
	// the curve and handles a press arriving mid-motion.
	function next(): void {
		driveBy(-1);
	}
	function prev(): void {
		driveBy(1);
	}
	// omega/kick default to the button curve (BUTTON_SPRING_OMEGA, b=0) so
	// every existing caller — Prev/Next, the dots — is byte-identical with
	// no change at the call site. jumpTo below is the one caller that passes
	// its own, faster curve (see JUMP_SPRING_OMEGA/JUMP_KICK).
	function goTo(i: number, omega = BUTTON_SPRING_OMEGA, kick = 1): void {
		// Absolute, not relative: -positions[i] is item i's own already-
		// committed position, independent of whatever an earlier press's
		// motion may still have pending (see driveMotion). Every item shares
		// the same offset, so setting the new target this way supersedes
		// any in-flight motion cleanly instead of stacking on top of it —
		// no cascading guard needed, unlike the old commitSteps.
		driveMotion(-positions[i]!, omega, kick);
	}

	// Desktop: clicking a visible side card centres it. Deliberately just
	// goTo — no new position maths, the same continuous motion the dots use.
	// The overlay button this fires from only exists at |position| === 1
	// (see the template), so the centre card's own link is never covered and
	// the off-screen ±2 cards never carry an invisible hit target.
	//
	// The one caller that does NOT take the default BUTTON_SPRING_OMEGA
	// curve: click-to-jump only gets its own, faster JUMP_SPRING_OMEGA/
	// JUMP_KICK (see their own comments) — Prev/Next/dots keep the slower
	// button feel the owner asked for twice already.
	function jumpTo(i: number): void {
		// A mouse drag ends in a click on whatever sat under the pointer, so
		// without this a desktop drag-follow would also fire a jump on release.
		if (dragMoved) return;
		goTo(i, JUMP_SPRING_OMEGA, JUMP_KICK);
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
	// like.
	//
	// Release now stays on the same continuous offset the drag already
	// drives, and runs ONE physical motion from finger-up to rest (see
	// beginMotion/motionTick) rather than two stitched-together ones. It
	// used to be two: exponential velocity decay (momentum), then a
	// fixed-300ms cubic ease onto the nearest card (settle) once momentum
	// judged itself "slow enough." Velocity was not continuous across that
	// handoff — settle's speed was fixed to (distance / 300ms) regardless
	// of how fast or slow momentum actually was the instant before, an
	// entirely separate curve grafted on at the seam, not a continuation of
	// it (see RESEARCH-carousel-physics-gsap.md's hypothesis section for
	// the measured reasoning). motionTick still has two regimes internally
	// — free deceleration while coasting, then a critically-damped spring
	// pulling onto the nearest card once slow enough — but the second only
	// ever starts from whatever position AND velocity the first regime had
	// at that exact instant (see beginLatch), never a value reset to a new
	// curve. That's the actual fix: not eliminating the regime change, but
	// making it velocity-continuous, the same way real touch platforms
	// hand a decelerating scroll off to a snap/rubber-band spring (see the
	// UIKit Dynamics source in the research note).
	//
	// offset itself is kept inside (-1, 1) at all times, during drag AND
	// coast AND latch (see absorbWholeSteps): the instant it would cross
	// ±1, positions[i] is permanently advanced by shiftOne(±1) and offset is
	// adjusted back by the same amount in the same tick, so --pos
	// (positions[i] + offset) never jumps. That's the same |delta| = 1
	// invariant shiftOne's own comment defends — this preserves it rather
	// than replacing it, because shiftOne is still only ever called at the
	// exact moment the fan has travelled one full card, so the item it
	// recycles is still off-screen exactly as it is today.
	// Steps-per-pixel geometry: how many horizontal screen pixels correspond to
	// one step (--pos moving by 1, i.e. one card advancing to the next slot).
	// Used at both call sites below (the drag follow and the release exit
	// velocity) to convert a raw pixel measurement into --pos's fractional
	// unit. This USED to be a single hardcoded constant (90, "~one mobile
	// card-width of drag"), which was a breakpoint bug: --card-width is
	// 6.27rem on mobile but 15rem on desktop, and the fan's spread
	// (--pivot-distance) is tuned per breakpoint too, so the real on-screen
	// distance between adjacent card centres is nowhere near the same number
	// at both sizes. Against a single 90px constant, desktop's actual
	// centre-to-centre distance made the cards travel roughly 3x the cursor's
	// own movement — the owner's report ("cards move about twice as fast as
	// my cursor").
	//
	// Fixed by measuring the real geometry at runtime instead of hardcoding a
	// number, using the exact technique getCardBandY (below) already uses to
	// find a pivot's TRUE unrotated rectangle from a live bounding box: a
	// rectangle is point-symmetric about its own centre, so a rotated
	// element's getBoundingClientRect() — even though inflated in width/height
	// by the rotation, and even though the rotation here pivots around a
	// point far below the row, not the element's own centre — still has its
	// bounding-box CENTRE land exactly on the card's true centre, at any
	// angle. Measuring the centre pivot (slot 0) and its slot-1 neighbour's
	// bbox centres and taking the distance between them is therefore an exact
	// measurement of centre-to-centre spacing, not an approximation, and it
	// self-corrects if --card-width/--pivot-distance/--tilt-step are ever
	// retuned again — which, per this file's own tuning history above, has
	// happened often. Measured once on mount and again on resize (breakpoint
	// changes), not per-frame inside the drag hot path, so it adds no
	// per-frame getBoundingClientRect cost (a real concern the plan for this
	// fix flagged explicitly).
	const FALLBACK_PX_PER_STEP = 90; // only in effect before the first live measurement lands
	let pxPerStep = $state(FALLBACK_PX_PER_STEP);
	let fanEl: HTMLElement | undefined;

	// Reads positions[]/offset (both $state) but is called imperatively from
	// onMount/resize below, never from inside a Svelte $effect — so it never
	// becomes a reactive dependency that would re-run on every drag-frame
	// offset write. See fanEl's own use here: bound once via bind:this on
	// .treatments__fan, so this doesn't rely on onPointerDown's
	// e.currentTarget the way getCardBandY does.
	function measurePxPerStep(el: HTMLElement): number | null {
		const pivotEls = el.querySelectorAll<HTMLElement>('.treatments__pivot');
		let centreEl: HTMLElement | null = null;
		let centreDist = Infinity;
		let neighbourEl: HTMLElement | null = null;
		let neighbourDist = Infinity;
		pivotEls.forEach((pivotEl, i) => {
			const p = positions[i]! + offset;
			const dc = Math.abs(p);
			if (dc < centreDist) {
				centreDist = dc;
				centreEl = pivotEl;
			}
			const dn = Math.abs(p - 1);
			if (dn < neighbourDist) {
				neighbourDist = dn;
				neighbourEl = pivotEl;
			}
		});
		if (!centreEl || !neighbourEl || centreEl === neighbourEl) return null;
		const centreRect = (centreEl as HTMLElement).getBoundingClientRect();
		const neighbourRect = (neighbourEl as HTMLElement).getBoundingClientRect();
		const centreX = centreRect.left + centreRect.width / 2;
		const neighbourX = neighbourRect.left + neighbourRect.width / 2;
		const distance = Math.abs(neighbourX - centreX);
		return distance > 0 ? distance : null;
	}

	function remeasurePxPerStep(): void {
		if (!fanEl) return;
		const measured = measurePxPerStep(fanEl);
		if (measured !== null) pxPerStep = measured;
	}

	onMount(() => {
		remeasurePxPerStep();
		window.addEventListener('resize', remeasurePxPerStep);
		return () => window.removeEventListener('resize', remeasurePxPerStep);
	});

	const VELOCITY_WINDOW_MS = 80; // trailing window the exit velocity is averaged over

	// Release physics, one continuous model from finger-up to rest (see
	// motionTick): a "coast" regime of exponential velocity decay, handing
	// off — without resetting position OR velocity — into a "latch" regime
	// once slow enough, a critically-damped spring pulling onto the nearest
	// card (see beginLatch's own comment for why a spring rather than
	// another fixed-duration tween).
	//
	// MOMENTUM_TAU_MS is the time for coast velocity to fall to ~37% (1/e)
	// of its starting value. Retuned from an original 180ms — measured
	// (see RESEARCH-carousel-physics-gsap.md) to decay roughly twice as
	// fast as real touch platforms, whose own momentum time constant is
	// closer to 325-500ms — up to 300ms, the low end of that range, kept
	// deliberately conservative there for one release: removing the old
	// MOMENTUM_MIN_VELOCITY gate at the same time (a slow release no
	// longer skips coasting altogether, it just crosses VELOCITY_EPSILON
	// almost immediately — see beginMotion below).
	//
	// Now moved to 500ms, the top of that same real-platform range, per a
	// direct owner request for a longer post-drag coast. The risk that
	// justified staying at the low end — a longer tau making a deliberate
	// slow drag-and-stop (behandelingen-click-to-jump.spec.ts's "a drag
	// does not also fire a jump on release") coast far enough to creep
	// onto the next card — turned out NOT to bind here: that test's own
	// exit velocity, measured directly (instrumented release, Playwright),
	// is a stable ~0.0013-0.0014 steps/ms, comfortably under
	// VELOCITY_EPSILON (0.0025) on its own, independent of tau. A slower
	// tau only stretches out how long it takes velocity to decay BELOW
	// that threshold — it can never lower a velocity that's already below
	// it going in, so that gentle release still crosses VELOCITY_EPSILON
	// on (or before) coast's very first frame exactly as before, and folds
	// zero extra coast distance. Confirmed empirically across the real
	// range: the deliberate-stop test still passes at tau all the way up
	// to 2000ms (4x this value) with zero measured coast distance for that
	// gesture — i.e. for THIS test, tau and VELOCITY_EPSILON don't
	// actually trade off against each other; only VELOCITY_EPSILON does
	// (see its own comment). 500ms was chosen as a deliberate, moderate
	// "noticeably longer, not unbounded" increase grounded in the same
	// cited real-platform range rather than the much larger tau this
	// headroom would technically allow. A hard flick's own post-release
	// coast (measured via Playwright, ~0.085 steps/ms exit velocity) went
	// from ~1.4s/~25 steps of drift at 300ms to ~2.1s/~41 steps at 500ms.
	const MOMENTUM_TAU_MS = 500;
	// Below this speed, motion is imperceptible as "still coasting" — hand
	// off to the latch spring (see beginLatch). NOT a gate on whether to
	// coast at all (every release coasts now, see endDrag) and NOT a
	// discrete step-count threshold like the deleted MOMENTUM_MIN_VELOCITY
	// was — a release that's already this slow the instant the pointer
	// lifts crosses this threshold in the very first coast frame, which is
	// what keeps a deliberate slow drag-and-stop behaving the same as
	// before (see MOMENTUM_TAU_MS's own comment).
	//
	// Left unchanged at the previously-tuned 0.0025 when MOMENTUM_TAU_MS
	// moved to 500ms above: this constant, not tau, is what actually
	// protects the deliberate-stop test, and it already carries real
	// margin — that test's own measured exit velocity is ~0.0013-0.0014
	// steps/ms, ~45% below this threshold. Lowering it further would trade
	// away exactly that margin for a change that barely matters to a hard
	// flick's own coast distance (this only shaves a near-negligible
	// EPSILON off the tail), so it wasn't worth touching.
	const VELOCITY_EPSILON = 0.0025; // steps/ms
	// Angular frequency (1/ms) of the critically-damped spring beginLatch
	// hands off into. Not a fixed duration — settling time falls out of the
	// physics (see beginLatch) — but chosen so the analytic decay-to-~10%
	// time (≈4.74 / SPRING_OMEGA) lands close to the old fixed
	// SETTLE_DURATION_MS = 300 this replaces, as a feel reference point.
	const SPRING_OMEGA = 0.016;
	// Button-driven motion's own omega — Prev/Next/dots/desktop
	// click-to-jump (goTo/driveMotion), NOT the pointer-release latch above.
	// The owner signed off on the release latch's feel already and
	// explicitly does not want it touched.
	//
	// First set to SPRING_OMEGA / 2 (a direct owner request for the BUTTON
	// motion to take twice as long — measured single-step settle ~656ms).
	// The owner then asked for "a lot more" ease-out, "still needs to be a
	// little bit longer" — halved again, to SPRING_OMEGA / 4, measured
	// single-step settle ~1221ms (roughly double the previous round, as
	// expected: halving omega doubles the analytic settling time constant,
	// see SPRING_OMEGA's own comment for the ≈4.74/omega relationship).
	//
	// Deliberately still the simple b=0 critically-damped kick (see
	// driveMotion's own comment: max speed at t=0, no ease-in, pure
	// exponential decay to the target) rather than a faster-departing,
	// separately-tuned curve — for a fixed omega, b=0 IS the fastest
	// possible departure speed (v0 = -omega*y0) that still reaches the
	// target monotonically with zero overshoot; going faster than that at
	// the same omega necessarily either overshoots or re-introduces ease-in
	// (see the closed-form in motionTick: b<0 crosses zero before decaying
	// back, b>0 moves the wrong way first). Halving omega again scales the
	// whole curve's timeline uniformly — same brisk-departure, all-ease-out
	// shape, just stretched — rather than changing that shape, which is
	// exactly "leaves promptly, decelerates over a longer distance."
	//
	// Kept as its own named/commented constant rather than overwriting
	// SPRING_OMEGA so the two stay independently tunable. See latchOmega
	// below for how motionTick's single latch implementation picks between
	// the two per gesture.
	const BUTTON_SPRING_OMEGA = SPRING_OMEGA / 4;
	// Click-to-jump only (jumpTo, desktop side-card click) — NOT Prev/Next
	// or the dots, which keep BUTTON_SPRING_OMEGA above untouched. The owner
	// asked for click-to-jump specifically to take half its current time,
	// "more ease-out, less ease-in." Settling time scales as 1/omega (see
	// SPRING_OMEGA's own ~4.74/omega note), so halving the settle time means
	// DOUBLING omega. BUTTON_SPRING_OMEGA is SPRING_OMEGA/4, measured
	// ~1221ms; this is SPRING_OMEGA/2 — the value f6ecb82 measured at
	// ~656ms, before that commit halved it again to BUTTON_SPRING_OMEGA. So
	// this is a return to an already-measured number, not a guess.
	const JUMP_SPRING_OMEGA = SPRING_OMEGA / 2;
	// Departure speed multiplier for jumpTo's spring: v0 = -JUMP_KICK *
	// omega * y0 (see driveMotion's own comment for the general form). 1 is
	// the existing b=0 critically-damped case — maximum speed at t=0, zero
	// ease-in, pure exponential ease-out, no overshoot (see
	// BUTTON_SPRING_OMEGA's own comment for why b=0 is the fastest possible
	// departure that still lands without overshoot). A value above 1 leaves
	// faster and decays longer (more ease-out, less ease-in) at the cost of
	// a small overshoot past the target — safe range 1.0-1.5 per the
	// overshoot maths in the plan this shipped from; above ~1.6 the bounce
	// becomes the feature. Left at 1 here: the owner asked for the speed
	// change, not a bounce, and this constant is named/exposed specifically
	// so it can be tuned later without touching the physics.
	const JUMP_KICK = 1;
	// How close (in steps) and how slow (in steps/ms) the latch spring has
	// to get before the gesture is declared over. Small enough that the
	// landing is visually indistinguishable from "arrived," at which point
	// motionTick snaps offset to the exact integer target rather than
	// trailing the spring's asymptotic tail indefinitely.
	const LATCH_DONE_EPSILON = 0.01;

	const DRAG_SLOP_PX = 4; // past this, the gesture is a drag and not a click

	let dragging = $state(false); // true only while the pointer is actually down and moving the fan
	// True from pointerdown through drag, coast, AND latch — the whole
	// gesture, not just the drag itself. Drives .treatments__pivot--motion
	// (transition: none) so none of that continuous, per-frame offset math
	// ever fights a CSS transition. Only goes false once the latch spring
	// actually lands on a card (see endGesture).
	let inGesture = $state(false);
	// Continuous fractional offset added to every item's integer position
	// (see positions above) to produce --pos. Live during drag, coast, and
	// latch alike — this is the one thing that never mode-switches.
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

	// Coast and latch run in the same rAF loop (see motionTick) as two
	// regimes of one motion, not two separate loops — a new pointerdown
	// cancels whichever is running (see cancelMotion).
	let motionRafId: number | null = null;
	let motionPhase: 'coast' | 'latch' = 'coast';
	let velocity = 0; // steps per ms, decays toward 0 during coast
	let lastFrameTime = 0;
	// Latch spring state, set once by beginLatch at the exact instant coast
	// hands off (see its own comment for why: y0/v0 carry over coast's real
	// position and velocity, which is what makes the handoff continuous).
	let latchTarget = 0; // nearest integer offset is latching onto
	let latchY0 = 0; // offset - latchTarget at latch start
	let latchV0 = 0; // velocity at latch start (steps/ms)
	let latchStartTime = 0;
	// Which omega the CURRENT latch spring runs at — SPRING_OMEGA for a
	// pointer-release handoff (set by beginLatch) or BUTTON_SPRING_OMEGA for
	// a button-driven one (set by driveMotion). One latch implementation
	// (motionTick) serves both; only this value differs between them, so a
	// button press that interrupts an in-flight release-latch (or vice
	// versa — see driveMotion) simply swaps which curve continues from the
	// real, current y/v, same continuity rule the coast->latch handoff
	// itself already uses.
	let latchOmega = SPRING_OMEGA;

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
	//
	// Returns exactly (offset before - offset after): how much was folded
	// out of offset, signed. Every caller except the drag path (see
	// onWindowPointerMove) can ignore this — momentum/settle only ever
	// write offset itself, so folding it in place is the whole story. The
	// drag path is different: its offset is NOT accumulated frame to frame,
	// it's recomputed from scratch every frame as `dragBaseOffset +
	// pendingDx / pxPerStep`. If a whole step gets folded into
	// positions[] but dragBaseOffset is left untouched, the very next frame
	// recomputes the same pre-fold offset from that formula and undoes the
	// fold — positions[] keeps advancing but offset snaps back out of
	// range, so nothing ever visibly recycles. Subtracting the returned
	// amount from dragBaseOffset (see the caller) keeps that absolute
	// formula consistent with the new integer positions, the same way a
	// leap-second correction moves the reference point rather than the
	// clock.
	function absorbWholeSteps(): number {
		const before = offset;
		while (offset >= 1) {
			shiftOne(1);
			offset -= 1;
		}
		while (offset <= -1) {
			shiftOne(-1);
			offset += 1;
		}
		return before - offset;
	}

	function endGesture(): void {
		inGesture = false;
		motionRafId = null;
		velocity = 0;
	}

	// A new pointerdown while coast or latch is still running must take
	// over from wherever the fan currently is, not fight it or snap it back
	// — cancel the loop, leave offset/positions exactly as they are, and let
	// onPointerDown's dragBaseOffset pick up from there.
	function cancelMotion(): void {
		if (motionRafId !== null) {
			cancelAnimationFrame(motionRafId);
			motionRafId = null;
		}
	}

	function beginMotion(): void {
		motionPhase = 'coast';
		lastFrameTime = performance.now();
		motionRafId = requestAnimationFrame(motionTick);
	}

	// Hands the coast regime off into the latch spring, carrying its real
	// position (y0) and velocity (v0) over exactly as they were the instant
	// before — never resetting either to a value a new curve picked. That
	// carry-over is the entire fix for the old seam: the old beginSettle
	// re-derived a brand new fixed-300ms curve from settleFrom/settleTarget
	// alone, with an initial speed set by (distance / 300ms) — unrelated to,
	// and often much faster than, whatever momentum's actual velocity was
	// at that instant (see this file's own release-physics comment above
	// for the measured reasoning). A critically-damped spring seeded with
	// the real v0 has no such jump: at t=0 its velocity IS v0 by
	// construction (see motionTick's closed-form evaluation).
	function beginLatch(now: number): void {
		motionPhase = 'latch';
		latchTarget = Math.round(offset);
		latchY0 = offset - latchTarget;
		latchV0 = velocity;
		latchStartTime = now;
		// The pointer-release latch always runs at SPRING_OMEGA — this is
		// the feel the owner already signed off on and explicitly does not
		// want touched (see SPRING_OMEGA's own comment; contrast
		// driveMotion, which stamps BUTTON_SPRING_OMEGA here instead for a
		// button-driven latch).
		latchOmega = SPRING_OMEGA;
	}

	// One rAF loop, two regimes of the same continuous motion — see this
	// file's release-physics comment for why it's two regimes and not one
	// formula throughout (a pure spring aimed at the nearest card from the
	// moment of release would prevent a hard flick from ever coasting past
	// its immediate neighbour, which is real, desired behaviour — see
	// behandelingen-momentum.spec.ts).
	function motionTick(now: number): void {
		// Clamped so a stalled/backgrounded frame can't integrate one huge,
		// visibly-teleporting jump — a normal frame is ~16ms.
		const dt = Math.min(now - lastFrameTime, 50);
		lastFrameTime = now;

		if (motionPhase === 'coast') {
			velocity *= Math.exp(-dt / MOMENTUM_TAU_MS);
			offset += velocity * dt;
			absorbWholeSteps();
			if (Math.abs(velocity) < VELOCITY_EPSILON) {
				// Falls through to run the latch spring's own t=0 frame
				// immediately below, in this same tick — no extra rAF wait,
				// which is exactly the "pause before it starts" bug 1 fixed
				// on the recycle side; the handoff itself must not
				// reintroduce that on the settle side.
				beginLatch(now);
			} else {
				motionRafId = requestAnimationFrame(motionTick);
				return;
			}
		}

		// Critically-damped harmonic oscillator, exact closed-form solution
		// (not a per-frame Euler integration, which would need a small-dt
		// stability check against SPRING_OMEGA and this codebase already
		// prefers exact math — see the coast regime's own Math.exp decay
		// above). Standard derivation for y'' + 2*omega*y' + omega^2*y = 0
		// with y0/v0 as initial conditions:
		//   y(t) = e^(-omega*t) * (y0 + (v0 + omega*y0) * t)
		//   v(t) = e^(-omega*t) * (v0 - omega*t*(v0 + omega*y0))
		// y0/v0 came from beginLatch or driveMotion (see their own comments),
		// so this is the same trajectory the fan was already on, just now
		// pulled toward latchTarget instead of drifting freely (coast) or
		// sitting wherever a press left it (a retarget) — never a
		// discontinuous restart.
		//
		// Clamped at 0: beginLatch always stamps latchStartTime from the
		// SAME `now` a motionTick call already received, so the next frame's
		// timestamp is guaranteed later. driveMotion (a button press) instead
		// stamps it from a performance.now() read synchronously inside a
		// click handler, off the animation-frame timeline entirely — and a
		// browser's very first rAF callback afterward can occasionally
		// report a timestamp for a frame that had already started a hair
		// before that read, i.e. `now` slightly EARLIER than
		// latchStartTime. Left unclamped, that negative t makes
		// Math.exp(-latchOmega*t) exceed 1, so y (and therefore offset)
		// transiently overshoots past y0 — a real, if small and short-lived,
		// step backward before the very next frame corrects it. Confirmed
		// under load: reliably present with Playwright's parallel workers,
		// not just a hypothetical.
		//
		// latchOmega, not a hardcoded SPRING_OMEGA: this one closed form
		// serves both the pointer-release latch (beginLatch stamps
		// SPRING_OMEGA) and button-driven motion (driveMotion stamps
		// BUTTON_SPRING_OMEGA) — only the omega differs, the physics and
		// continuity guarantees are identical either way.
		const t = Math.max(0, now - latchStartTime);
		const decay = Math.exp(-latchOmega * t);
		const b = latchV0 + latchOmega * latchY0;
		const y = decay * (latchY0 + b * t);
		const v = decay * (latchV0 - latchOmega * t * b);
		offset = latchTarget + y;
		// Kept current every latch frame, same as the coast regime already
		// keeps its own `velocity` current — this is what lets a button
		// press mid-latch (see driveMotion) read a real, live velocity to
		// retarget from instead of guessing or resetting to 0.
		velocity = v;
		// A button press can seed latchTarget arbitrarily far from offset —
		// a dot click several cards away, or several fast Next presses
		// folded into one target (see driveMotion/driveBy) — so, unlike the
		// single-card coast handoff, this can fold more than one step over
		// the life of one latch. latchTarget itself must recede by whatever
		// absorbWholeSteps just folded, or next frame's closed-form
		// re-evaluation (still a pure function of elapsed time against the
		// SAME latchY0/latchV0/latchStartTime) would recompute the same
		// not-yet-corrected distance and fold the same step again. This is
		// the same leap-second-style correction absorbWholeSteps' own
		// comment documents for dragBaseOffset, applied to this closed form
		// instead — the trajectory itself (y, v) is untouched, only the
		// bookkeeping of how much of it has already been committed moves.
		latchTarget -= absorbWholeSteps();

		if (Math.abs(y) < LATCH_DONE_EPSILON && Math.abs(v) < VELOCITY_EPSILON) {
			// Land exactly on the integer (not the spring's asymptotic-but-
			// never-quite-zero tail), then fold it into positions[i] one
			// last time so offset always ends a gesture at exactly 0.
			offset = latchTarget;
			absorbWholeSteps();
			endGesture();
			return;
		}
		motionRafId = requestAnimationFrame(motionTick);
	}

	// prefers-reduced-motion: no decaying drift, no spring latch — jump
	// straight to the nearest card the instant the pointer lifts.
	function settleInstant(): void {
		offset = Math.round(offset);
		absorbWholeSteps();
		endGesture();
	}

	// Button navigation (next/prev/goTo/jumpTo) drives the exact same
	// continuous motion the pointer path does, through this one entry
	// point — the owner's ask was "less ease-in, a lot more ease-out," and
	// that shape is the latch spring's own natural behaviour once it's
	// seeded with a real initial velocity instead of starting from rest:
	// with y0/v0 chosen so b = v0 + BUTTON_SPRING_OMEGA*y0 is exactly 0
	// (see motionTick's closed-form comment for b), the spring degenerates
	// to pure exponential decay in y — maximum speed at t=0 (no ease-in at
	// all) falling away smoothly to zero at the target (all ease-out).
	// `target` is the exact value offset should end at once folded — the
	// same coordinate latchTarget already lives in — so goTo/jumpTo can
	// hand this an absolute destination (-positions[i]) and driveBy can
	// hand it "wherever this is already headed, one more."
	//
	// Runs at BUTTON_SPRING_OMEGA by default, not SPRING_OMEGA — a direct
	// owner request for button-driven motion (Prev/Next/dots) to take twice
	// as long, without touching the pointer-release latch's own feel (see
	// BUTTON_SPRING_OMEGA's own comment). `omega`/`kick` are parameters, not
	// hardcoded, so a caller can hand this a different curve — currently
	// only jumpTo does, passing JUMP_SPRING_OMEGA/JUMP_KICK (see their own
	// comments) for a faster click-to-jump without touching this default or
	// any other caller. Every other caller (next/prev/goTo's own default)
	// omits both, so their behaviour is byte-identical to before this
	// parameterisation.
	function driveMotion(target: number, omega = BUTTON_SPRING_OMEGA, kick = 1): void {
		const now = performance.now();

		if (prefersReducedMotion()) {
			// Ensure transition:none is actually in effect before offset
			// jumps — inGesture may still be false here (a button press,
			// unlike settleInstant's drag-release, can start from fully
			// idle), and without this the base 600ms CSS transition would
			// animate the "instant" jump instead of skipping it.
			cancelMotion();
			inGesture = true;
			offset = target;
			absorbWholeSteps();
			endGesture();
			return;
		}

		// Idle (velocity is exactly 0, see endGesture) gets the synthetic
		// kick described above, scaled by `kick` (1 = the existing b=0
		// critically-damped case; see JUMP_KICK's own comment for what a
		// value above 1 does). A press that instead interrupts an
		// already-moving gesture — coast still running (the coast-interrupt
		// edge case), or a previous press's own latch not yet settled —
		// carries over whatever real velocity that motion already had, same
		// continuity rule the coast->latch handoff itself uses (see
		// beginLatch), so repeated presses accelerate through the cards
		// fluidly instead of restarting from a dead stop each time. `kick`
		// only shapes the idle-start case — a retarget mid-flight keeps
		// carrying the real, live velocity regardless of which curve it's
		// joining, same as before this parameter existed.
		//
		// "Already moving" is a velocity test, NOT the inGesture flag alone.
		// inGesture is true for any live pointer interaction including one
		// that never moved: a plain CLICK on a card lands on .treatments__fan
		// first, so onPointerDown/onWindowPointerUp run a complete
		// zero-distance "drag" and leave inGesture true with velocity 0 in
		// the same tick that the click handler then calls jumpTo. Testing
		// inGesture alone therefore took the carry-over branch with velocity
		// 0 — seeding the spring from a dead stop, which is exactly the
		// ease-in the owner asked to remove, and it silently made `kick`
		// dead code on every real click (it only ran when a press came from
		// a genuinely idle fan, which a click never is). Comparing against
		// VELOCITY_EPSILON rather than 0 reuses this file's own definition of
		// "slow enough to count as stopped" (see its comment) instead of
		// inventing a second threshold: below it the coast has already ended,
		// so the synthetic kick is both the more correct seed and the one
		// with no ease-in.
		const y0 = offset - target;
		const isMoving = inGesture && Math.abs(velocity) > VELOCITY_EPSILON;
		const v0 = isMoving ? velocity : -kick * omega * y0;

		inGesture = true;
		motionPhase = 'latch';
		latchTarget = target;
		latchY0 = y0;
		latchV0 = v0;
		latchStartTime = now;
		// Every button-driven latch — fresh or retargeted mid-flight, from
		// idle or from an in-progress release latch/coast — runs at this
		// caller-chosen omega from here on. See latchOmega's own comment for
		// why a single latchOmega value (rather than passing omega through
		// to motionTick itself) is enough to make motionTick's one
		// implementation serve every curve correctly — motionTick needs no
		// change at all for this.
		latchOmega = omega;

		// Always cancel-and-reschedule rather than trying to reuse an
		// already-queued frame — simpler to reason about than tracking
		// whether one happens to be in flight, and costs at most one extra
		// rAF (~16ms), imperceptible against a spring that runs for
		// hundreds of ms. Whatever regime the *previous* frame was in
		// (coast or latch) is irrelevant: motionTick reads motionPhase
		// fresh every call, and it's already 'latch' by the time this next
		// frame runs.
		cancelMotion();
		motionRafId = requestAnimationFrame(motionTick);
	}

	// next()/prev() move relative to wherever the fan is already headed —
	// its current latch target if one is live, or its resting position
	// (nearest integer offset) if it's idle or still coasting — so a rapid
	// double Next extends the same journey by one more step rather than
	// each press fighting over its own separate target.
	function driveBy(delta: number): void {
		const baseTarget = inGesture && motionPhase === 'latch' ? latchTarget : Math.round(offset);
		driveMotion(baseTarget + delta);
	}

	// "drag to scroll needs to be on and between the cards only... Right now
	// I can drag waaayy below the cards and the cards still respond, as if
	// there is an actual full-on draggable invisible circle. Even way under
	// the navigation buttons of the carousel." — a real bug: onPointerDown is
	// bound to .treatments__fan, which is deliberately full-bleed and very
	// tall (see its own CSS comment) purely as clipping headroom for the
	// rotated cards, not because it was meant to be a full-height drag
	// surface. .treatments__controls is then pulled up over that empty space
	// with a large negative margin-top, so the whole tall, mostly-empty fan
	// box — including the area behind and below the nav — was a live drag
	// surface.
	//
	// Shrinking the fan is not the fix: that height is the clipping safety
	// margin (see the fan's own comment), and shrinking it re-clips cards
	// mid-motion, a real bug already fixed once. An overlay on top isn't
	// either: it would block the cards' own corner links and the desktop
	// click-to-jump overlay (.treatments__jump). Instead, reject the gesture
	// right here — before any drag state is touched, so nothing else in the
	// gesture path has to change — whenever the pointer lands vertically
	// outside the actual card row.
	//
	// The band is derived from live geometry every time a pointer goes
	// down, not a hardcoded pixel range — but ONLY from the centre pivot
	// (position 0), not all three visible ones. The ±1 pivots are rotated
	// (see .treatments__pivot's transform), and a rotated rectangle's
	// axis-aligned bounding box (what getBoundingClientRect returns) is
	// taller than the card itself — including them pulled the band's
	// bottom edge down into and past .treatments__controls, which is
	// exactly the bug this was supposed to fix (measured: band bottom
	// 649.3px against a controls top of 621.6px, the nav row fully inside
	// the "safe" band). The centre card alone is unrotated (--pos ≈ 0, so
	// rotate(0deg)), so its bounding box IS its true rectangle — no
	// rotation slop to account for.
	//
	// --pos is fractional during motion, but this only ever runs from
	// onPointerDown, which fires before any drag begins (see its own
	// comment) — so at call time --pos is either settled on an integer or,
	// if a gesture starts mid-coast, close to one. Either way this picks
	// the pivot with the smallest |positions[i] + offset|, i.e. nearest to
	// slot 0, rather than assuming DOM index 0 is the centre card (it
	// isn't, once the loop has recycled — see positions' own comment) or
	// requiring an exact rounds-to-0 match (a mid-coast start may not have
	// one).
	const CARD_BAND_SAFE_MARGIN_PX = 24; // "a slight safe area under and above the cards" per the owner

	// The grab cursor must advertise the band getCardBandY actually computes,
	// not .treatments__fan's box. The fan is deliberately full-bleed and very
	// tall as clipping headroom for the rotated cards, so `cursor: grab` on it
	// promised a drag across a huge, mostly-empty region — including behind and
	// below the nav — long after fb19441/a3f798d stopped that region from
	// actually starting a drag. The owner caught exactly that mismatch: "my
	// cursor still applies the drag effect in the area that was previously
	// draggable."
	//
	// Tracked on hover rather than derived in CSS because the band is measured
	// from live bounding boxes and has no CSS expression. Same rAF throttle and
	// same reasoning as onWindowPointerMove: pointer events can outrun the
	// display, and this reads layout.
	let cursorInBand = $state(false);
	let hoverRafId: number | null = null;
	let pendingHoverY = 0;

	function onFanHoverMove(e: PointerEvent): void {
		// While dragging, --dragging already owns the cursor (grabbing) and the
		// band is irrelevant — skip the layout read entirely rather than doing
		// it every frame of a drag for a result nothing uses.
		if (dragging) return;
		pendingHoverY = e.clientY;
		if (hoverRafId !== null) return;
		hoverRafId = requestAnimationFrame(() => {
			hoverRafId = null;
			if (!fanEl) return;
			const band = getCardBandY(fanEl);
			cursorInBand = band !== null && pendingHoverY >= band.top && pendingHoverY <= band.bottom;
		});
	}

	function onFanHoverLeave(): void {
		if (hoverRafId !== null) {
			cancelAnimationFrame(hoverRafId);
			hoverRafId = null;
		}
		cursorInBand = false;
	}

	function getCardBandY(fanEl: HTMLElement): { top: number; bottom: number } | null {
		const pivotEls = fanEl.querySelectorAll<HTMLElement>('.treatments__pivot');
		let centreEl: HTMLElement | null = null;
		let centreDist = Infinity;
		pivotEls.forEach((el, i) => {
			// DOM order follows the fixed `items` array order (the keyed each
			// block never reorders its own nodes — same assumption several of
			// this component's own tests already make), so index i lines up
			// with positions[i] directly.
			const p = positions[i]! + offset;
			const dist = Math.abs(p);
			if (dist < centreDist) {
				centreDist = dist;
				centreEl = el;
			}
		});
		if (!centreEl) return null;
		const rect = (centreEl as HTMLElement).getBoundingClientRect();
		const top = rect.top - CARD_BAND_SAFE_MARGIN_PX;
		let bottom = rect.bottom + CARD_BAND_SAFE_MARGIN_PX;

		// Hard requirement: the band must never reach into
		// .treatments__controls, regardless of margin or card geometry —
		// clamp rather than trust the margin alone, since --pivot-distance/
		// card size are retuned independently of this file (see their own
		// comments) and could someday bring the two closer together again.
		// Scoped to this fan's own carousel-wrap, not a bare document
		// query, in case more than one instance of this component is ever
		// mounted on a page.
		const controlsEl = fanEl
			.closest('.treatments__carousel-wrap')
			?.querySelector<HTMLElement>('.treatments__controls');
		if (controlsEl) {
			const controlsTop = controlsEl.getBoundingClientRect().top;
			if (bottom >= controlsTop) bottom = controlsTop - 1;
		}

		return { top, bottom };
	}

	function onPointerDown(e: PointerEvent): void {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const band = getCardBandY(e.currentTarget as HTMLElement);
		if (band && (e.clientY < band.top || e.clientY > band.bottom)) return;
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
				offset = dragBaseOffset + pendingDx / pxPerStep;
				// Recycle DURING the drag, not only after release — a drag
				// spanning more than `count` cards must keep producing cards
				// the whole time it's held, not just once the pointer lifts.
				// See absorbWholeSteps' own comment for why dragBaseOffset
				// must move by the same amount: this formula is absolute
				// (recomputed from dragBaseOffset every frame), so without
				// this correction the very next frame would recompute the
				// same unfolded offset and undo the fold outright.
				dragBaseOffset -= absorbWholeSteps();
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
		// it integrates directly against offset (see motionTick's coast
		// regime).
		let velocityPxPerMs = 0;
		if (moveHistory.length >= 2) {
			const first = moveHistory[0]!;
			const last = moveHistory[moveHistory.length - 1]!;
			const dt = last.t - first.t;
			if (dt > 0) velocityPxPerMs = (last.x - first.x) / dt;
		}
		velocity = velocityPxPerMs / pxPerStep;

		if (prefersReducedMotion()) {
			settleInstant();
			return;
		}
		// Every release coasts now — no minimum-velocity gate. A gentle
		// release just coasts a very short distance before VELOCITY_EPSILON
		// hands it to the latch spring almost immediately (see
		// MOMENTUM_TAU_MS's own comment for why that still doesn't creep an
		// intentionally-uncommitted drag onto the next card).
		beginMotion();
	}

	function onWindowPointerUp(): void {
		endDrag();
	}

	function onWindowPointerCancel(): void {
		endDrag();
	}

	// The centre card's own root element is now the link (see
	// TreatmentCard.svelte, 260809-hov — the whole card is a real <a>, no
	// stretched-link pseudo-element needed any more), unlike
	// .treatments__jump's plain <button>. jumpTo already
	// guards its own JS-driven navigation with `if (dragMoved) return;`, but
	// a real link's navigation is the BROWSER's own default action on the
	// native click that follows a mouse drag's release, not something jumpTo
	// runs — so it needs the same guard at the DOM level. Capture phase, on
	// the fan itself (fires before the click reaches the link and before any
	// of the fan's own bubble-phase handlers), so a drag that ends on the
	// centre card's link is suppressed before the browser navigates, exactly
	// mirroring the guard jumpTo already applies to the side cards' JS path.
	function onFanClickCapture(e: MouseEvent): void {
		if (dragMoved) {
			e.preventDefault();
		}
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
			class:treatments__fan--grabbable={cursorInBand}
			class:treatments__fan--dragging={dragging}
			role="group"
			aria-roledescription="carrousel"
			aria-label="Behandelingen"
			bind:this={fanEl}
			onpointerdown={onPointerDown}
			onpointermove={onFanHoverMove}
			onpointerleave={onFanHoverLeave}
			onclickcapture={onFanClickCapture}
		>
			{#each items as item, i (item.key)}
				<div
					class="treatments__pivot"
					class:treatments__pivot--jump={noTransitionKeys.has(item.key)}
					class:treatments__pivot--motion={inGesture}
					style="--pos: {positions[i]! + offset}"
				>
					<TreatmentCard
						label={item.label}
						icon={item.icon}
						cardNumber={i + 1}
						buttonLabel={item.buttonLabel}
						buttonHref={item.buttonHref}
						description={item.description}
						magnetic={positions[i] === 0}
						{dragging}
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
		/* A drag over the fan was selecting the card title/number text
		   underneath the pointer instead of dragging the carousel — the
		   fan has no other user-facing text to lose, and selection isn't
		   crawled, so this costs nothing for SEO/AEO. Deliberately not
		   solved with preventDefault() in onPointerDown: that would also
		   kill the cards' own links and focus, and this component's whole
		   click model depends on the native click still firing. */
		-webkit-user-select: none; /* Safari/iOS */
		user-select: none;
		/* Drag affordance over the fan's own background (not the cards — see
		   .treatments__jump and TreatmentCard's own cursor for those). Inert
		   on touch, so no media query needed; harmless to leave in for
		   pointer/touch too. */
		/* Deliberately NOT grab. The fan's box is far taller than the region
		   that actually starts a drag (see cursorInBand in the script) — a
		   grab cursor here promised draggability across empty space behind
		   and below the nav. --grabbable below carries it instead, driven by
		   the same measured band onPointerDown gates on, so the cursor and
		   the behaviour can't disagree. */
		cursor: default;
	}

	.treatments__fan--grabbable {
		cursor: grab;
	}

	/* Bound to `dragging` specifically, not `inGesture` — inGesture stays
	   true through coast and latch after the finger/mouse lifts, so tying
	   this to it would leave the hand closed for up to a second after the
	   gesture is physically over. `dragging` goes false the instant
	   onPointerUp/onPointerCancel fires (see endDrag), which is exactly
	   when the cursor should reopen. */
	.treatments__fan--dragging {
		cursor: grabbing;
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

	/* Covers the WHOLE gesture — drag, momentum, settle, AND button-driven
	   motion (next/prev/goTo/jumpTo) — not just the drag itself (see
	   inGesture in the script). --pos is being driven directly, per frame,
	   by the pointer during drag and by the same motion rAF loop for every
	   other case (coast, latch, and a button press driving that loop
	   straight into latch — see driveMotion); a CSS transition here would
	   fight that with its own easing on top of the JS-driven easing that
	   loop already does, which is exactly the pause-then-rigid-hop
	   behaviour this whole mechanism replaced. Buttons used to be the one
	   path left on a discrete CSS transition (commitSteps' cascade) — now
	   they drive the same continuous offset everything else does, so
	   there's no second path left needing its own transition. Released
	   only once motion actually lands on a card (see endGesture). */
	.treatments__pivot--motion {
		transition: none;
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
			/* Real breathing room below the carousel, an older owner request
			   that was never actioned (see .treatments__controls' own comment:
			   past rounds grew .treatments__fan's height instead, which only
			   adds invisible internal buffer that this element's negative
			   margin-top pulls straight back over — the visible gap below the
			   nav never actually changed). The base rule's var(--space-8) (2rem)
			   bottom padding is the ENTIRE visible gap between the nav and the
			   next section on desktop; doubled here to match the top padding
			   (var(--space-16)) for a section that reads as symmetrically
			   spaced rather than bottom-heavy. Desktop only, per the owner's
			   ask — mobile's tighter 70vh section keeps its existing padding. */
			padding-bottom: var(--space-16);
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
			/* Widening this to 1450px (from the original, proportional 1010px)
			   roughly doubled the pos0/pos1 edge gap (56.77px -> 114.35px at
			   1440px) — more breathing room than the owner actually wanted once
			   seen live. Pulled back to 1340px: measured bbox gap was 87.74px at
			   both 1440px and 1280px (identical at both — the gap is purely a
			   function of rotation, not viewport width), roughly the midpoint
			   between the original and the overshoot, with cards still clearly
			   separated (no touch/overlap) and no vertical clipping introduced
			   (--pivot-baseline/height untouched: the pos ±1 bbox height and y
			   range barely move between 1340px and 1450px).

			   Brought in a further ~10% per a direct owner request ("cards 10%
			   closer together"): retuned the same way (Playwright bbox
			   measurement, not trig — see the file-level comment) to 1304px,
			   measured gap 79.03px at both 1440px and 1280px (target ~78.97px,
			   90% of 87.74px). Re-checked at this value: pos ±1/±2 bbox
			   top/bottom shift only a couple px from the 1340px baseline and
			   stay comfortably inside .treatments__fan's clip box at both
			   widths, so --pivot-baseline/height/.treatments__controls
			   margin-top below did not need retuning. Card size
			   (--card-width) is untouched — only the fan's spread changed. */
			--pivot-distance: 1304px;
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
