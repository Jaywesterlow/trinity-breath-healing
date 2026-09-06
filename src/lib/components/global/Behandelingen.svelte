<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	import TreatmentCard from '$lib/components/ui/TreatmentCard.svelte';
	import ServiceModal from '$lib/components/ui/ServiceModal.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	// Only 3 of the 7 real services have art (260810-mdl) — Raster Energie's old
	// infinity.png was never the owner's artwork and is gone from this map (the
	// file itself stays under static/, just unreferenced, in case art arrives
	// under the same name). A service absent from this map renders a number in
	// the icon slot instead — see SERVICE_ITEMS' own `number` field below and
	// TreatmentCard's `number` prop. Driven by absence from this map, not a
	// flag: drop a new icon file in and add its entry here, and the number for
	// that service disappears on its own.
	const ICONS: Record<string, string> = {
		'mahatma-healing': '/images/card-mahatma-healing.svg',
		goldhealing: '/images/card-goldhealing.svg',
		'spinal-touch': '/images/card-spinal-touch.svg'
	};

	// buttonLabel is placeholder copy, not final — see TreatmentCard.svelte.

	// Slots that are actually on screen at once. Desktop shows five cards
	// (0, +/-1, +/-2) since the fan was widened. Declared up here because the
	// item list below is sized against it.
	const VISIBLE_SLOT_MAX = 2;

	function isVisibleSlot(position: number): boolean {
		return Math.abs(position) <= VISIBLE_SLOT_MAX;
	}

	// Seven real services, one card each (260810-mdl) — no "Meer diensten" nav
	// card any more; a "more services" card inside a carousel that already
	// shows every service was nonsense. `number` is set only when the service
	// has no entry in ICONS, and is the service's fixed 1-based position in
	// BRAND.services — stable regardless of where the fan has rotated it to,
	// since it's computed from the source array's own index, not from
	// `positions[]`.
	const SERVICE_ITEMS = BRAND.services.map((s, i) => ({
		key: s.slug,
		label: s.name,
		icon: ICONS[s.slug] ?? null,
		number: ICONS[s.slug] ? undefined : i + 1,
		buttonLabel: 'Meer info',
		buttonHref: `/diensten/${s.slug}`,
		teaser: s.teaser
	}));

	const BASE_COUNT = SERVICE_ITEMS.length;

	// The loop needs at least one slot hidden on EACH side of the visible
	// range, because that is where a card recycles: shiftOne wraps an item
	// once it steps past HIGH_SLOT/LOW_SLOT, and the whole design rests on
	// that wrap only ever touching an item nobody can see.
	//
	// At 7 real services and 5 visible slots there's a spare slot on each
	// side already (HIGH_SLOT/LOW_SLOT below work out to ±3), so REPEATS
	// collapses to 1 below and this list is exactly BRAND.services, no
	// duplicates. Kept general rather than hardcoded to 7, because a smaller
	// service count needs exactly this padding — at 5 services and 5 visible
	// slots there is nowhere to hide the recycle: HIGH_SLOT = floor(5/2) = 2
	// lands exactly on the visible edge, so every single step would teleport
	// a card from +2 straight to -2 in full view (the bug e3ad763 fixed once
	// TESTKAART's throwaway padding cards were removed).
	//
	// `+ 3`, not `+ 2`: an EVEN base count breaks the smaller margin. Perfect
	// symmetry around slot 0 is impossible for an even count, so the one
	// extra slot always lands on the positive side (see HIGH_SLOT/LOW_SLOT's
	// own comment below) — which means the NEGATIVE side is one slot short
	// of the positive side's margin, and `+ 2` alone doesn't cover that
	// shortfall. Concretely, at a hypothetical count=6 with the old `+ 2`,
	// REPEATS stays 1 (MIN_ITEMS=6 exactly meets BASE_COUNT), giving
	// HIGH_SLOT=3 but LOW_SLOT=-2 — a *visible* slot, so every step would
	// teleport a card in full view, the exact e3ad763 failure again. `+ 3`
	// forces one more repeat whenever the base count alone can't cover it,
	// which is harmless here (7 already clears it) and correct at any count.
	//
	// So the list is repeated until it is long enough. Duplicates are visually
	// identical and carry aria-hidden + tabindex="-1", so the accessibility
	// tree and the tab order still see each service exactly once.
	const MIN_ITEMS = 2 * VISIBLE_SLOT_MAX + 3;
	const REPEATS = Math.max(1, Math.ceil(MIN_ITEMS / BASE_COUNT));

	const items = Array.from({ length: REPEATS }, (_, r) =>
		SERVICE_ITEMS.map((item) => ({
			...item,
			key: r === 0 ? item.key : `${item.key}--dup${r}`,
			duplicate: r > 0
		}))
	).flat();

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

		// Idle auto-drift's own countdown starts here too, not only after a
		// first real interaction — a page that loads and is never touched is
		// exactly as "idle" as one that was touched once and then left
		// alone (see scheduleIdleDrift/beginDrift, and IDLE_DRIFT_DELAY_MS's
		// own comment).
		scheduleIdleDrift();

		// A backgrounded tab has no business running an indefinite rAF
		// loop — most browsers already throttle/suspend rAF there, but this
		// is the one motion in this file with no natural end, so it's worth
		// being explicit rather than relying on that. Cancel outright on
		// hide (cancelMotion also clears any pending countdown), restart the
		// countdown fresh on return rather than resuming mid-drift.
		function onVisibilityChange(): void {
			if (document.hidden) {
				cancelMotion();
			} else {
				scheduleIdleDrift();
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			window.removeEventListener('resize', remeasurePxPerStep);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			cancelMotion();
		};
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

	// Idle auto-drift — a slow, continuous, ambient advance through the
	// cards (owner request: "moving slowly, scrolling towards the right,"
	// clarified as "advance through the list in the direction of the next
	// button" — same direction driveBy(-1)/next() already moves offset in,
	// not a literal rightward pixel drift). Two directly-tunable numbers:
	// IDLE_DRIFT_DELAY_MS (how long nothing has to happen before it starts
	// or resumes) and DRIFT_SECONDS_PER_STEP (how long one full card-to-card
	// advance takes while drifting — bigger number, slower/more ambient).
	// Runs as a third motionPhase (see motionTick) so every existing
	// interruption point — onPointerDown's cancelMotion(), driveMotion's own
	// cancelMotion() before starting a fresh latch — already supersedes it
	// for free, with no special-casing added at those call sites.
	const IDLE_DRIFT_DELAY_MS = 2000; // 4000 / 2 — owner request, "halve the pause duration"
	const DRIFT_SECONDS_PER_STEP = 6.4; // 8 / 1.25 — owner request, "speed up by 1.25"
	// Negative: matches next()'s own driveBy(-1) direction (see driveBy),
	// i.e. drifting is indistinguishable from someone slowly, continuously
	// pressing "Volgende."
	const DRIFT_VELOCITY_PER_MS = -1 / (DRIFT_SECONDS_PER_STEP * 1000);

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

	// Coast, latch, AND drift run in the same rAF loop (see motionTick) as
	// three regimes of one motion, not separate loops — a new pointerdown or
	// driveMotion cancels whichever is running (see cancelMotion).
	let motionRafId: number | null = null;
	let motionPhase: 'coast' | 'latch' | 'drift' = 'coast';
	let velocity = 0; // steps per ms, decays toward 0 during coast
	let lastFrameTime = 0;
	// setTimeout handle for the idle auto-drift's own countdown (see
	// IDLE_DRIFT_DELAY_MS) — separate from motionRafId, which tracks an
	// ACTIVE rAF loop; this tracks a pending FUTURE one. Cleared by
	// cancelMotion (any real interaction/motion supersedes a pending drift
	// start the same way it supersedes a running one) and by endGesture
	// (which reschedules it fresh once whatever just happened settles).
	let idleDriftTimer: ReturnType<typeof setTimeout> | null = null;
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
		// Whatever just happened (drag settle, button-driven latch, an
		// instant reduced-motion jump) is real activity — restart the idle
		// countdown from here, not from whenever the page originally loaded.
		scheduleIdleDrift();
	}

	// A new pointerdown while coast or latch is still running must take
	// over from wherever the fan currently is, not fight it or snap it back
	// — cancel the loop, leave offset/positions exactly as they are, and let
	// onPointerDown's dragBaseOffset pick up from there. Also clears a
	// pending idle-drift countdown (see idleDriftTimer) — any real
	// interaction, or any new motion superseding drift itself, has to push
	// the next idle start back out, not let a stale timer fire mid-gesture.
	function cancelMotion(): void {
		if (motionRafId !== null) {
			cancelAnimationFrame(motionRafId);
			motionRafId = null;
		}
		if (idleDriftTimer !== null) {
			clearTimeout(idleDriftTimer);
			idleDriftTimer = null;
		}
	}

	// Starts (or restarts) the countdown to the next idle auto-drift.
	// Reduced motion is checked when the timer actually FIRES, not here at
	// schedule time — cheap, and correct even if the OS-level setting
	// changes mid-session, matching how every other motion entry point in
	// this file (driveMotion, etc.) checks it live rather than once.
	function scheduleIdleDrift(): void {
		if (idleDriftTimer !== null) clearTimeout(idleDriftTimer);
		idleDriftTimer = setTimeout(() => {
			idleDriftTimer = null;
			if (!prefersReducedMotion()) beginDrift();
		}, IDLE_DRIFT_DELAY_MS);
	}

	// Slow, indefinite advance in next()'s own direction (see
	// DRIFT_VELOCITY_PER_MS) — runs until cancelMotion() (any real
	// interaction, or a button/dot/card press driving its own motion) cuts
	// it off, same as coast/latch. inGesture=true for the same reason it's
	// true through coast/latch: .treatments__pivot--motion has to disable
	// the CSS transition for this continuous, per-frame offset write too.
	function beginDrift(): void {
		motionPhase = 'drift';
		inGesture = true;
		lastFrameTime = performance.now();
		motionRafId = requestAnimationFrame(motionTick);
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

	// One rAF loop, three regimes of the same continuous motion — see this
	// file's release-physics comment for why coast/latch are two regimes and
	// not one formula throughout (a pure spring aimed at the nearest card
	// from the moment of release would prevent a hard flick from ever
	// coasting past its immediate neighbour, which is real, desired
	// behaviour — see behandelingen-momentum.spec.ts). drift (see
	// beginDrift) is the third: constant velocity, never decays, never
	// hands off to latch — it just runs until something else cancels it.
	function motionTick(now: number): void {
		// Clamped so a stalled/backgrounded frame can't integrate one huge,
		// visibly-teleporting jump — a normal frame is ~16ms.
		const dt = Math.min(now - lastFrameTime, 50);
		lastFrameTime = now;

		if (motionPhase === 'drift') {
			offset += DRIFT_VELOCITY_PER_MS * dt;
			absorbWholeSteps();
			motionRafId = requestAnimationFrame(motionTick);
			return;
		}

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
	// click-to-jump (now onCardClick, on the card itself). Instead, reject the gesture
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
	// a plain <button>. jumpTo already
	// guards its own JS-driven navigation with `if (dragMoved) return;`, but
	// a real link's navigation is the BROWSER's own default action on the
	// native click that follows a mouse drag's release, not something jumpTo
	// runs — so it needs the same guard at the DOM level. Capture phase, on
	// the fan itself (fires before the click reaches the link and before any
	// of the fan's own bubble-phase handlers), so a drag that ends on the
	// centre card's link is suppressed before the browser navigates, exactly
	// mirroring the guard jumpTo already applies to the side cards' JS path.
	//
	// `e.detail > 0` matters and is not defensive noise. dragMoved is only
	// ever reset in onPointerDown, so after any mouse drag it stays true
	// indefinitely — nothing clears it until the next pointer press. A
	// keyboard activation (Tab to the card, press Enter) synthesises a click
	// with NO preceding pointerdown, so it used to hit this guard's stale
	// true and get preventDefault()d: the link silently refused to navigate
	// for keyboard users, and only for them, until they happened to click
	// something with a mouse first. A keyboard-generated click reports
	// detail === 0 (no click count), while every real mouse click reports at
	// least 1 — so this suppresses exactly the trailing click a drag
	// produces and nothing else.
	//
	// Deliberately NOT fixed by clearing dragMoved here: this runs in the
	// capture phase, before onCardClick's own bubble-phase handler, and
	// jumpTo reads the same flag to guard the side cards' JS path. Clearing
	// it here would re-open that path and let a drag ending on a side card
	// also centre it.
	function onFanClickCapture(e: MouseEvent): void {
		if (dragMoved && e.detail > 0) {
			e.preventDefault();
		}
	}

	// What a click on a card MEANS, decided here rather than by a separate
	// overlay element sitting on top of the card.
	//
	// There used to be a .treatments__jump <button> absolutely positioned at
	// inset:0 over every non-centre card, carrying the centring click. It had
	// to go: as a later sibling with no pointer-events routing it hit-tested
	// above the card, so :hover never reached .tcard and the entire hover
	// reveal (scale, description fade-in, title slide-up) was dead on every
	// side card — visibly so once the magnet was extended to all of them,
	// since those cards then tracked the cursor while refusing to open.
	//
	// Collapsing it into the card's own handler also deletes a whole bug
	// class rather than one bug. The overlay's existence was gated on a
	// hand-written slot test that had already been wrong twice (first "only
	// +/-1 is visible", then "positions[i] without offset", so a card
	// rendering at --pos 2.x mid-motion had no overlay and navigated). There
	// is no gate here to drift: the card asks where it is at the moment it is
	// clicked.
	//
	// Keyboard deliberately navigates instead of centring. detail === 0 is a
	// keyboard-synthesised click (see onFanClickCapture for the same
	// discriminator): centring on Enter would strand a keyboard user on a
	// card they cannot then open without a second, different key press, and
	// the dots and Prev/Next already give them centring.
	//
	// Pointer clicks always centre, on every viewport — an earlier version
	// gated this to desktop only (min-width: 1024px), on the reasoning that
	// mobile navigates the fan by swiping so tapping a card there had always
	// meant "open it." That reasoning predates the modal: once only the
	// CENTRE card opens anything (openModal, above) and every other card is
	// reachable purely by re-centring, a mobile tap on a non-centre card
	// navigating straight to its real page is a bug, not a feature — the
	// owner's own report ("clicking a card that is not centred redirects to
	// the actual page... it should never redirect; only in the modal do you
	// have a link"). There is no longer a device split to make here.

	// The item list is repeated so the loop has off-screen slots to recycle
	// through (see REPEATS), so every service exists at more than one index.
	// Dots therefore have to reason about a service, not a slot.
	function nearestCopyOf(s: number): number {
		let best = s;
		let bestDistance = Infinity;
		for (let i = s; i < count; i += BASE_COUNT) {
			const d = Math.abs(positions[i]!);
			if (d < bestDistance) {
				bestDistance = d;
				best = i;
			}
		}
		return best;
	}

	function isServiceCentred(s: number): boolean {
		for (let i = s; i < count; i += BASE_COUNT) {
			if (positions[i] === 0) return true;
		}
		return false;
	}

	// ---------------------------------------------------------------------
	// Service modal (260810-mdl) — the centre card, and only the centre
	// card, opens a near-fullscreen modal instead of navigating. Side cards
	// keep click-to-jump exactly as above; the centre card is the one card
	// the fan never rotates, which is what makes the rect maths below
	// honest (a rotated card's bounding box is not its true rectangle — see
	// getCardBandY's own comment for the same fact used elsewhere in this
	// file).
	// ---------------------------------------------------------------------

	// One entry per SERVICE (not per slot/duplicate), in BRAND.services'
	// own fixed order — this is what ServiceModal's Prev/Next index into,
	// independent of where the fan has rotated any given copy to.
	const MODAL_SERVICES = BRAND.services.map((s, i) => ({
		slug: s.slug,
		name: s.name,
		intro: s.intro,
		helpsWith: s.helpsWith,
		icon: ICONS[s.slug] ?? null,
		number: ICONS[s.slug] ? undefined : i + 1
	}));

	// Bound per pivot in the each-block below (bind:this={pivotEls[i]}) so
	// the modal can find a service's live card element without a fresh
	// click event — needed for Prev/Next inside the modal (no click ever
	// happens on those cards) and for close (which must shrink back onto
	// whichever service is active, not necessarily the one that was
	// originally clicked).
	let pivotEls: (HTMLElement | null)[] = [];

	// Same "which copy is nearest centre" reasoning nearestCopyOf already
	// uses for the dots — reused rather than assuming index === service
	// index. True 1:1 at today's REPEATS=1, but this stays correct if the
	// service count ever drops low enough to need duplicates again.
	function cardElFor(serviceIndex: number): HTMLElement | null {
		const i = nearestCopyOf(serviceIndex);
		return pivotEls[i]?.querySelector('a.tcard') ?? null;
	}

	let modalIndex = $state(0); // which SERVICE (0..BASE_COUNT-1) the modal is showing
	let modalDialogEl = $state<HTMLDialogElement | null>(null);
	let modalContentEl = $state<HTMLElement | null>(null);
	let modalBackdropEl = $state<HTMLElement | null>(null);
	let modalAnimating = false; // guards re-entrancy — plain, not $state: nothing renders from it

	// Swipe-to-navigate inside the modal (mobile only — see onModalContentPointerDown's
	// own touch-only gate). A discrete swipe-and-release, not a live drag-follow like
	// the fan's own gesture: the modal already has a JS-driven transition for stepping
	// between services (modalStep, via modalNext/modalPrev below), so a swipe just
	// decides direction and calls the same thing a button press would, rather than
	// tracking the finger continuously.
	const MODAL_SWIPE_THRESHOLD_PX = 50; // deliberately far above DRAG_SLOP_PX (4px) —
	// this has to reject an ordinary vertical scroll-with-a-little-horizontal-wobble,
	// not just a click.
	let modalSwipeStartX = 0;
	let modalSwipeStartY = 0;
	// Set true only when a swipe actually crossed the threshold and fired a step —
	// read once by onModalContentClickCapture to swallow the click a touch release
	// synthesises on whatever sat under the finger (the same problem, and the same
	// fix, onFanClickCapture's own dragMoved check addresses for the fan itself).
	let modalSwiped = false;

	const MODAL_CARD_FADE_MS = 150; // step 1 of the open animation, per the plan's contract
	const MODAL_BOX_GROW_MS = 400; // step 2
	const MODAL_CONTENT_FADE_MS = 250; // step 3 — matches --motion-base; not otherwise specified
	// Per-element stagger inside step 3: content leads (0ms extra delay), then
	// close/prev/next each start NAV_STAGGER_MS later than the one before —
	// see fadeElements' own `staggerMs` param. Small enough that the whole
	// group still reads as one movement, not four separate pops.
	const NAV_STAGGER_MS = 60;
	// WAAPI's `easing` option is parsed independently of this element's own
	// cascade, so a var() reference does not resolve here the way it would
	// in a stylesheet — MODAL_EASE_IN_OUT is a literal copy of app.css's own
	// --ease-in-out token (keep them in sync if that token ever changes).
	// Drives fadeElements (opacity): a first attempt used app.css's --ease-out
	// instead, whose steep initial velocity was exactly why the card's own
	// content used to read as "instantly vanishing" rather than fading —
	// front-loading ~80% of the opacity change into the first third of
	// MODAL_CARD_FADE_MS is technically a 150ms animation but not a visible
	// one. --ease-in-out departs from rest instead, which is what actually
	// reads as a fade.
	const MODAL_EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
	// growBox's own curve (box grow/shrink) — went through two owner rounds:
	// app.css's --ease-out first (a direct request for "a lot more ease-out"
	// over the previous --ease-in-out), then this, a second, more specific
	// request for still more, "move slowly at the end." --ease-out itself
	// already reaches y=1 within the first ~65% of its duration (the tail is
	// there but short) — this is easings.net's own "easeOutExpo"
	// (cubic-bezier(0.19, 1, 0.22, 1)), a standard, well-known curve rather
	// than a hand-tuned guess, whose smaller x2 control point (0.22 vs
	// --ease-out's 0.3) stretches that same deceleration out over noticeably
	// more of the animation's back half — the box keeps visibly slowing
	// right up to the last frame instead of arriving early and sitting
	// still. Kept as its own constant rather than overwriting app.css's
	// --ease-out token itself: this curve is stronger than that token on
	// purpose, specific to this one box-morph animation, not a change to the
	// site's shared motion language.
	const MODAL_BOX_EASE_OUT = 'cubic-bezier(0.19, 1, 0.22, 1)';

	// Close's own box-shrink timing — deliberately separate from growBox/
	// MODAL_BOX_GROW_MS above, and NOT a bezier curve. Two rounds of tuning a
	// single cubic-bezier for "more ease-out" (--ease-in-out, then --ease-out,
	// then easeOutExpo above) never read as a felt difference on this specific
	// animation — a curve's shape is a small, easy-to-miss signal at 400ms.
	// shrinkBox below instead samples a power curve into many small keyframes
	// (see MODAL_BOX_SHRINK_EASE_POWER's own comment) — a single legible knob
	// for "how drastic the slow-down is," without reasoning about what a
	// bezier curve's control points do. An earlier version tried to fake the
	// same shape with just 2 straight-line segments glued together at a fixed
	// point, which is a real velocity discontinuity, not an ease — it read as
	// a stutter rather than a slow-down.
	const MODAL_BOX_SHRINK_MS = 417; // 500 / 1.2 — a direct "speed the close up 1.2x" owner
	// request on top of the earlier 500ms (itself 400 * 1.25, "25% slower" —
	// still net slower than growBox's own 400ms open-side duration).
	// Close's own content/nav fade-out duration — separate from
	// MODAL_CONTENT_FADE_MS (open's fade-in, and modalStep's prev/next
	// transition) precisely so this 1.2x speed-up applies to the close path
	// only, not open or in-modal navigation.
	const MODAL_CLOSE_FADE_MS = 208; // 250 / 1.2
	// Tunable ease-out for the close-shrink: progress(t) = 1 - (1-t)^POWER.
	// One number — raise it for a more drastic slow-down at the tail, lower
	// it for a gentler one. This replaced an earlier 2-segment piecewise-
	// linear version (fixed % of distance in a fixed % of time) that glued
	// two different constant speeds together at one exact keyframe — a real
	// velocity discontinuity (a ~7x instantaneous speed change at the seam)
	// that read as a stutter partway through the close, not an ease.
	const MODAL_BOX_SHRINK_EASE_POWER = 3;

	// Tracks the most recent fadeElements() animation per element, so a new
	// call can cancel it before starting its own. Necessary, not defensive:
	// a fade-OUT is deliberately left in its finished fill:'forwards' state
	// (see below) rather than cancelled — so when modalStep's fade-IN later
	// runs on the SAME element, cancelling the fade-IN once IT finishes
	// only removes the top of that element's effect stack. The never-
	// cancelled fade-OUT animation is still sitting underneath it, and once
	// the fade-IN is gone, ITS finished opacity:0 effect reasserts itself —
	// the element silently snaps back to invisible (and, since opacity < 1
	// promotes a new stacking context, back to intercepting clicks meant
	// for the modal's Prev/Next/Close buttons). Confirmed exactly this way:
	// a second Prev/Next press inside the modal timed out on
	// ".service-modal__content intercepts pointer events" only after a
	// first successful fade cycle, never on the first press. Cancelling the
	// previous animation up front, every call, means at most one WAAPI
	// effect ever exists per element for this property.
	const lastFade = new WeakMap<HTMLElement, Animation>();

	// Fades one or more elements' opacity via the Web Animations API — never
	// node.style.transition, for the reason src/lib/actions/reveal.ts
	// documents (the shorthand replaces whatever the stylesheet declared;
	// TreatmentCard's own hover-reveal transition on these exact elements
	// would be silently clobbered). `instant` (prefers-reduced-motion) skips
	// the animation and writes the end state directly.
	//
	// `staggerMs` (default 0) delays each element in `els` by its own index
	// times this value — used to fade the modal's close/prev/next buttons in
	// one after another instead of all at once (see the openModal call site).
	// `fill: 'both'`, not just 'forwards': a delayed animation with only
	// 'forwards' fill has NO effect during its own delay, so a staggered
	// fade-IN element would sit at whatever opacity the cascade already gives
	// it (1, since nothing else sets a resting opacity on these elements)
	// for the length of its delay — visible immediately, stagger or not.
	// 'both' also fills backwards, holding keyframe 0 (opacity 0) for the
	// delay's duration, which is what actually makes the stagger visible.
	//
	// Fading OUT is left in its animated end state on purpose — nothing
	// clears it, so the element stays hidden for as long as the modal is
	// open with no separate inline-style bookkeeping required. Fading IN
	// cancels its own animation once finished, handing the property back to
	// the normal CSS cascade (same cleanup discipline reveal.ts uses) — and
	// also clears any leftover inline opacity from an earlier INSTANT call
	// (openModal's pre-hide, below): cancelling only removes the WAAPI
	// effect, so without this an element instant-hidden via el.style.opacity
	// = '0' would cancel back down to that stale inline value instead of the
	// cascade's true resting opacity (1), snapping invisible again right
	// after it had just finished fading in.
	function fadeElements(
		els: HTMLElement[],
		visible: boolean,
		instant: boolean,
		duration: number,
		staggerMs = 0
	): Promise<void> {
		if (els.length === 0) return Promise.resolve();
		if (instant) {
			els.forEach((el) => {
				lastFade.get(el)?.cancel();
				lastFade.delete(el);
				el.style.opacity = visible ? '' : '0';
			});
			return Promise.resolve();
		}
		const anims = els.map((el, i) => {
			lastFade.get(el)?.cancel();
			const anim = el.animate([{ opacity: visible ? 0 : 1 }, { opacity: visible ? 1 : 0 }], {
				duration,
				delay: staggerMs * i,
				easing: MODAL_EASE_IN_OUT,
				fill: 'both'
			});
			lastFade.set(el, anim);
			return anim;
		});
		return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
			if (visible) {
				anims.forEach((a) => a.cancel());
				els.forEach((el) => {
					lastFade.delete(el);
					el.style.opacity = '';
				});
			}
		});
	}

	function cardFaceEls(cardEl: HTMLElement): HTMLElement[] {
		return Array.from(cardEl.querySelectorAll<HTMLElement>('.tcard__icon-wrap, .tcard__bottom'));
	}

	// Close/Prev/Next — queried live off modalDialogEl rather than given their
	// own bindable refs, since ServiceModal already exposes the one ref
	// (dialogRef) needed to find them. Order here is the stagger order (see
	// NAV_STAGGER_MS): close leads, then prev, then next.
	function modalNavEls(): HTMLElement[] {
		if (!modalDialogEl) return [];
		return Array.from(
			modalDialogEl.querySelectorAll<HTMLElement>('.service-modal__close, .service-modal__nav')
		);
	}

	// Morphs the dialog box between two live rects — used for both the open
	// grow and the close shrink (same helper, `from`/`to` swapped), so
	// there's exactly one geometry animation to reason about. top/left/
	// width/height rather than a transform matrix: simpler to get right for
	// a one-shot, rare (open/close only) animation than compounding scale
	// and translate against a rotated-fan coordinate frame, and easy to
	// verify directly with Playwright's own boundingBox() the way this
	// file's carousel geometry already is (see the file-level tuning
	// history above).
	function growBox(dialog: HTMLDialogElement, from: DOMRect, to: DOMRect): Promise<void> {
		const anim = dialog.animate(
			[
				{
					top: `${from.top}px`,
					left: `${from.left}px`,
					width: `${from.width}px`,
					height: `${from.height}px`
				},
				{
					top: `${to.top}px`,
					left: `${to.left}px`,
					width: `${to.width}px`,
					height: `${to.height}px`
				}
			],
			{ duration: MODAL_BOX_GROW_MS, easing: MODAL_BOX_EASE_OUT, fill: 'forwards' }
		);
		// Hand control back to the stylesheet once settled — .service-modal's
		// own CSS already expresses the near-fullscreen size responsively
		// (vh/vw), which an inline WAAPI end-state would otherwise pin in
		// place across a later viewport resize.
		return anim.finished.then(
			() => {
				anim.cancel();
			},
			() => {}
		);
	}

	// Close's own box-shrink — NOT growBox run with from/to swapped. Built
	// from many small keyframes sampled off a genuine ease-out power curve
	// (see MODAL_BOX_SHRINK_EASE_POWER's own comment) rather than a bezier,
	// so the "how drastic" knob stays a single legible number — but unlike
	// the old 2-segment piecewise-linear version, consecutive samples here
	// are close enough in slope that there's no seam, so no stutter.
	function shrinkBox(dialog: HTMLDialogElement, from: DOMRect, to: DOMRect): Promise<void> {
		const SAMPLES = 24;
		const at = (t: number, a: number, b: number) => a + (b - a) * t;
		const keyframes = Array.from({ length: SAMPLES + 1 }, (_, i) => {
			const t = i / SAMPLES;
			const p = 1 - Math.pow(1 - t, MODAL_BOX_SHRINK_EASE_POWER);
			return {
				top: `${at(p, from.top, to.top)}px`,
				left: `${at(p, from.left, to.left)}px`,
				width: `${at(p, from.width, to.width)}px`,
				height: `${at(p, from.height, to.height)}px`,
				offset: t
			};
		});
		const anim = dialog.animate(keyframes, {
			duration: MODAL_BOX_SHRINK_MS,
			easing: 'linear',
			fill: 'forwards'
		});
		// dialog.close() runs immediately after this in closeModal, which
		// removes the whole dialog from layout — cancelling still happens for
		// hygiene/consistency with growBox, but nothing depends on it here.
		return anim.finished.then(
			() => {
				anim.cancel();
			},
			() => {}
		);
	}

	// Opacity fade for modalBackdropEl — a real element standing in for the
	// dialog's native ::backdrop (see its own CSS comment for why: an
	// earlier version animated ::backdrop directly via WAAPI's pseudoElement
	// option, which worked in this project's own Chromium-based testing but
	// was confirmed NOT to fade on a real device — pseudo-element animation
	// support is real but inconsistent across browsers, whereas a plain
	// el.animate() call on an actual element has no such gap).
	//
	// display is toggled here too, not left to CSS: 'none' keeps this out of
	// the hit-testing tree while the modal is closed (mirrors the dialog's
	// own native display:none-when-closed), and has to flip to 'block'
	// BEFORE the fade-in starts or there's nothing to animate. Opacity 0 is
	// this element's own CSS resting value (see its own comment) — no
	// separate pre-hide step needed the way content/nav's fade-in does,
	// since fading in from resting IS the first keyframe already.
	function fadeBackdrop(el: HTMLElement, visible: boolean, duration: number): Promise<void> {
		if (visible) el.style.display = 'block';
		// A rapid open→close→open (or the reverse) can start a new fade before
		// the previous one's .then() below has run, leaving an old, uncancelled
		// animation on the composite stack. Per WAAPI's default 'replace'
		// composite order, a still-active older effect can end up applying
		// OVER this element's own inline opacity once THIS animation later
		// cancels itself — cancel any prior one first, same as fadeElements'
		// own lastFade bookkeeping above.
		lastFade.get(el)?.cancel();
		const anim = el.animate([{ opacity: visible ? 0 : 1 }, { opacity: visible ? 1 : 0 }], {
			duration,
			easing: MODAL_EASE_IN_OUT,
			fill: visible ? 'both' : 'forwards'
		});
		lastFade.set(el, anim);
		return anim.finished.then(
			() => {
				lastFade.delete(el);
				if (visible) {
					// Cancelling only removes the WAAPI effect — with no inline
					// opacity of its own, the element falls back to the
					// stylesheet's resting `opacity: 0`, snapping the backdrop
					// invisible again right as the rest of the open sequence
					// (box grow / content fade) is still finishing. Pin the
					// inline value first so cancel() has something correct to
					// fall back to.
					el.style.opacity = '1';
					anim.cancel();
				} else {
					el.style.display = 'none';
				}
			},
			() => {}
		);
	}

	// Native showModal() makes the rest of the page inert (unclickable,
	// unfocusable) but does NOT reliably stop it scrolling underneath — the
	// backdrop blocks pointer/click but a wheel/trackpad gesture or the
	// keyboard can still move the page in some engines, since nothing about
	// [inert] or ::backdrop is a scroll gate. Explicit overflow:hidden on the
	// body is the standard fix; toggled here (not a CSS class keyed off the
	// dialog's own [open] state) because it has to be paired with the JS
	// sequence's own start/end, not the dialog's, so it locks BEFORE the open
	// animation's first frame and unlocks only once the close animation's
	// last one has actually landed.
	function setBodyScrollLocked(locked: boolean): void {
		// Guarded, not assumed: onDestroy below fires during SSR prerendering
		// too (SvelteKit mounts and destroys each component once per request
		// to render its HTML), and there is no `document` there.
		if (typeof document === 'undefined') return;
		document.body.style.overflow = locked ? 'hidden' : '';
	}

	// The modal's own CTA ("Naar de pagina") client-side-navigates away —
	// SvelteKit tears this component down on that route change without ever
	// running closeModal(), which would otherwise leave the body permanently
	// unscrollable on the destination page.
	onDestroy(() => setBodyScrollLocked(false));

	async function openModal(cardEl: HTMLElement, serviceIndex: number): Promise<void> {
		if (modalAnimating) return;
		modalAnimating = true;
		setBodyScrollLocked(true);
		// The fan itself (idle drift in particular — see beginDrift) has no
		// business still moving underneath a fullscreen modal the user is
		// reading: wasted work while hidden, and closeModal's own shrink-back
		// morph reads the origin card's LIVE rect at close time, so a fan
		// that kept drifting the whole time the modal was open would morph
		// back into a different on-screen spot than where it was opened
		// from. Idle countdown resumes once the modal actually closes (see
		// closeModal's own scheduleIdleDrift() call).
		cancelMotion();

		const reduced = prefersReducedMotion();
		// Captured before the fade below touches opacity — hiding the card's
		// inner content doesn't change the card's own outer box, but doing
		// this first keeps the intent ("where did the user click") obvious.
		const originRect = cardEl.getBoundingClientRect();

		await fadeElements(cardFaceEls(cardEl), false, reduced, MODAL_CARD_FADE_MS);

		modalIndex = serviceIndex;
		await tick(); // let the newly-active panel's `hidden` attribute update land first

		const dialog = modalDialogEl;
		if (!dialog) {
			// Pathological — the ref should always be bound by the time a
			// click can happen — but restore the card's face rather than
			// leave it stuck invisible if it somehow occurs.
			await fadeElements(cardFaceEls(cardEl), true, true, 0);
			setBodyScrollLocked(false);
			modalAnimating = false;
			return;
		}

		if (!reduced) {
			// Hide content and nav buttons BEFORE the dialog is shown at all —
			// otherwise their resting opacity (1; nothing else in the
			// cascade hides them) paints for real on showModal()'s first
			// frame, at the dialog's full stylesheet size, before growBox
			// below has a chance to even start. The box is supposed to grow
			// out of the card completely blank; without this instant
			// pre-hide it instead flashes the full panel then snaps back
			// down to card size as growBox's first keyframe takes over.
			fadeElements([...(modalContentEl ? [modalContentEl] : []), ...modalNavEls()], false, true, 0);
		}

		dialog.showModal();

		if (reduced) {
			// No WAAPI call at all under reduced motion (see fadeElements'
			// own instant path for the same reasoning) — just the end state,
			// directly, matching the dialog's own instant showModal() above.
			if (modalBackdropEl) {
				modalBackdropEl.style.display = 'block';
				modalBackdropEl.style.opacity = '1';
			}
			modalAnimating = false;
			return;
		}

		// Started here, right alongside showModal(), not inside the
		// Promise.all below — the backdrop's own resting opacity is already 0
		// (see its CSS comment), so there's no flash to guard against the way
		// content/nav's instant pre-hide above needs to; this is just so the
		// backdrop fades in over the same window the box is growing in,
		// rather than starting late.
		const backdropIn = modalBackdropEl
			? fadeBackdrop(modalBackdropEl, true, MODAL_BOX_GROW_MS)
			: Promise.resolve();

		// One rAF so the dialog's own stylesheet-driven near-fullscreen size
		// is what gets measured below — showModal() alone doesn't yet reflect
		// post-layout geometry synchronously in every engine.
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const targetRect = dialog.getBoundingClientRect();

		await Promise.all([growBox(dialog, originRect, targetRect), backdropIn]);
		// Content leads, then close/prev/next fade in one after another
		// (NAV_STAGGER_MS apart) — same fade, same easing, just staggered,
		// so the buttons read as part of the same reveal instead of popping
		// in ahead of it.
		await fadeElements(
			[...(modalContentEl ? [modalContentEl] : []), ...modalNavEls()],
			true,
			false,
			MODAL_CONTENT_FADE_MS,
			NAV_STAGGER_MS
		);
		modalAnimating = false;
	}

	async function closeModal(): Promise<void> {
		if (modalAnimating) return;
		modalAnimating = true;

		const dialog = modalDialogEl;
		const reduced = prefersReducedMotion();
		const cardEl = cardElFor(modalIndex);

		if (!dialog) {
			modalAnimating = false;
			return;
		}

		if (reduced) {
			dialog.close();
			if (modalBackdropEl) modalBackdropEl.style.display = 'none';
			if (cardEl) await fadeElements(cardFaceEls(cardEl), true, true, 0);
			setBodyScrollLocked(false);
			modalAnimating = false;
			scheduleIdleDrift();
			return;
		}

		const fromRect = dialog.getBoundingClientRect();
		// No sensible shrink target if the card has somehow vanished from the
		// DOM mid-session — shrink toward its own current box instead of
		// throwing, which is visually a plain fade-out rather than a morph.
		const toRect = cardEl ? cardEl.getBoundingClientRect() : fromRect;

		// Content and nav buttons fade out TOGETHER (no stagger — owner
		// request, replacing an earlier version that staggered the nav
		// buttons after content and let their tail run unawaited alongside
		// the shrink) — box-shrink starts immediately after, with no added
		// delay, since content shrinking along with the box crops it
		// mid-fade.
		await fadeElements(
			[...(modalContentEl ? [modalContentEl] : []), ...modalNavEls()],
			false,
			false,
			MODAL_CLOSE_FADE_MS
		);
		await Promise.all([
			shrinkBox(dialog, fromRect, toRect),
			modalBackdropEl
				? fadeBackdrop(modalBackdropEl, false, MODAL_BOX_SHRINK_MS)
				: Promise.resolve()
		]);

		dialog.close();
		if (cardEl) await fadeElements(cardFaceEls(cardEl), true, false, MODAL_CARD_FADE_MS);
		setBodyScrollLocked(false);
		modalAnimating = false;
		// Idle countdown paused for the whole time the modal was open (see
		// openModal's own cancelMotion() call) — resumes fresh from here.
		scheduleIdleDrift();
	}

	// Switches which service the modal shows AND drives the carousel
	// underneath to match (goTo — the same JS spring latch Prev/Next/dots
	// already use, BUTTON_SPRING_OMEGA and all; no new constant), so the
	// fan is already centred correctly by the time the modal closes,
	// whether or not the user ever presses the fan's own Prev/Next.
	async function modalStep(delta: number): Promise<void> {
		// Same guard openModal/closeModal use, and set for the same reason:
		// without it, a Close pressed mid-transition could run its own fade
		// concurrently against this one, both targeting modalContentEl.
		if (modalAnimating) return;
		modalAnimating = true;

		const reduced = prefersReducedMotion();
		const nextIndex = (modalIndex + delta + BASE_COUNT) % BASE_COUNT;
		const content = modalContentEl ? [modalContentEl] : [];

		if (reduced) {
			modalIndex = nextIndex;
			goTo(nearestCopyOf(nextIndex));
			modalAnimating = false;
			return;
		}

		await fadeElements(content, false, false, MODAL_CONTENT_FADE_MS);
		modalIndex = nextIndex;
		goTo(nearestCopyOf(nextIndex));
		await tick();
		await fadeElements(content, true, false, MODAL_CONTENT_FADE_MS);
		modalAnimating = false;
	}

	function modalNext(): void {
		modalStep(1);
	}
	function modalPrev(): void {
		modalStep(-1);
	}

	// Touch-only (mouse/trackpad users already have the Prev/Next buttons, and
	// a mouse-drag gesture here would fight text selection inside the
	// description/helps list, which was never a problem worth trading away for
	// a gesture nobody asked for on desktop). window-level pointerup, not a
	// listener on the content element itself, for the same reason the fan's
	// own drag uses window listeners: a real swipe can easily end with the
	// finger outside the element it started on.
	function onModalContentPointerDown(e: PointerEvent): void {
		if (e.pointerType !== 'touch') return;
		modalSwipeStartX = e.clientX;
		modalSwipeStartY = e.clientY;
		window.addEventListener('pointerup', onModalContentPointerUp);
		window.addEventListener('pointercancel', onModalContentPointerCancel);
	}

	function endModalSwipeTracking(): void {
		window.removeEventListener('pointerup', onModalContentPointerUp);
		window.removeEventListener('pointercancel', onModalContentPointerCancel);
	}

	// Direction only, decided once on release — not a live drag-follow. dx > 0
	// (finger moved right) means the PREVIOUS service; dx < 0 means NEXT,
	// matching the usual "swipe left to advance" convention image galleries
	// and card stacks already use.
	function onModalContentPointerUp(e: PointerEvent): void {
		endModalSwipeTracking();
		const dx = e.clientX - modalSwipeStartX;
		const dy = e.clientY - modalSwipeStartY;
		// Predominantly horizontal AND past the threshold — an ordinary
		// vertical scroll (reading a long description) has to pass through
		// here untouched, same as it already does for the fan's own drag.
		if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < MODAL_SWIPE_THRESHOLD_PX) return;
		modalSwiped = true;
		if (dx < 0) modalNext();
		else modalPrev();
	}

	function onModalContentPointerCancel(): void {
		endModalSwipeTracking();
	}

	// A touch release synthesises a click on whatever sat under the finger —
	// without this, a swipe ending over the CTA link or a helps-list item
	// would also fire that element's own click right after navigating.
	// Capture phase, mirroring onFanClickCapture's identical reasoning for
	// the fan's own drag-then-click problem.
	function onModalContentClickCapture(e: MouseEvent): void {
		if (modalSwiped) {
			e.preventDefault();
			modalSwiped = false;
		}
	}

	// Esc fires 'cancel' and would close the native dialog INSTANTLY —
	// prevented so the animated close above runs instead; the dialog only
	// actually closes once that sequence calls dialog.close() itself.
	function onModalCancel(e: Event): void {
		e.preventDefault();
		closeModal();
	}

	// A click that lands on the dialog element itself, not any of its
	// children, is a backdrop click — the dialog's own box IS the click
	// target in that case, since nothing inside it covers that point.
	function onModalBackdropClick(e: MouseEvent): void {
		if (e.target === modalDialogEl) closeModal();
	}

	function onCardClick(e: MouseEvent, i: number): void {
		if (positions[i] === 0) {
			// onFanClickCapture (capture phase, runs first) already calls
			// preventDefault() when a drag ended on this link — checking
			// defaultPrevented here reuses that exact signal instead of
			// re-testing dragMoved a second time, per the plan's own
			// instruction not to add a second guard. When it's already
			// true, the browser's default has been suppressed and there's
			// nothing left to do.
			if (e.defaultPrevented) return;
			e.preventDefault();
			openModal(e.currentTarget as HTMLElement, i % BASE_COUNT);
			return;
		}
		if (e.detail === 0) return; // keyboard: navigate directly
		e.preventDefault();
		jumpTo(i);
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
					bind:this={pivotEls[i]}
				>
					<TreatmentCard
						label={item.label}
						icon={item.icon}
						number={item.number}
						buttonLabel={item.buttonLabel}
						buttonHref={item.buttonHref}
						description={item.teaser}
						magnetic={isVisibleSlot(positions[i]!)}
						duplicate={item.duplicate}
						onCardClick={(e) => onCardClick(e, i)}
						{dragging}
					/>
				</div>
			{/each}
		</div>

		<div class="treatments__controls">
			<button
				type="button"
				class="treatments__nav treatments__nav--prev arrow-swap roll-host"
				data-tooltip="Vorige"
				onclick={prev}
				aria-label="Vorige"
			>
				<span class="arrow-swap__glyph arrow-swap__glyph--out">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M11 8H3M3 8L6.5 4.5M3 8L6.5 11.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span class="arrow-swap__glyph arrow-swap__glyph--in">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M11 8H3M3 8L6.5 4.5M3 8L6.5 11.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
			</button>

			<!-- One dot per SERVICE, not per slot: the item list is repeated so the
			     loop has hidden slots to recycle through (see REPEATS), and surfacing
			     that repetition in the navigation would be nonsense to a visitor.
			     Each dot targets whichever copy of its service currently sits nearest
			     the centre, so pressing it always travels the short way round rather
			     than sometimes sweeping across the whole fan. -->
			<ul class="treatments__dots">
				{#each SERVICE_ITEMS as service, s (service.key)}
					<li class="treatments__dot">
						<button
							type="button"
							class="treatments__dot-visual"
							class:treatments__dot-visual--active={isServiceCentred(s)}
							aria-label={`Ga naar ${service.label}`}
							onclick={() => goTo(nearestCopyOf(s))}
						></button>
					</li>
				{/each}
			</ul>

			<button
				type="button"
				class="treatments__nav treatments__nav--next arrow-swap roll-host"
				data-tooltip="Volgende"
				onclick={next}
				aria-label="Volgende"
			>
				<span class="arrow-swap__glyph arrow-swap__glyph--out">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M5 8H13M13 8L9.5 4.5M13 8L9.5 11.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span class="arrow-swap__glyph arrow-swap__glyph--in">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M5 8H13M13 8L9.5 4.5M13 8L9.5 11.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
			</button>
		</div>
	</div>

	<!-- Rendered once, always — every service's full body is prerendered
	     inside it (see ServiceModal.svelte), inactive ones carrying `hidden`.
	     Nothing here is built by JS at open time; showModal()/close() only
	     ever toggle visibility of what's already in the initial HTML. -->
	<ServiceModal
		services={MODAL_SERVICES}
		activeIndex={modalIndex}
		disclaimer={BRAND.disclaimer}
		bind:dialogRef={modalDialogEl}
		bind:contentRef={modalContentEl}
		bind:backdropRef={modalBackdropEl}
		onPrev={modalPrev}
		onNext={modalNext}
		onClose={closeModal}
		onCancel={onModalCancel}
		onBackdropClick={onModalBackdropClick}
		onContentPointerDown={onModalContentPointerDown}
		onContentClickCapture={onModalContentClickCapture}
	/>
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
		/* Declared here rather than on .treatments__pivot so BOTH the pivots
		   (which inherit it) and this element's own edge-fade pseudo-elements
		   can read it — see the ultra-wide block for why the fade needs the
		   card's rotation angle. */
		--tilt-step: 14deg;
		/* Geometry for the ultra-wide edge fade, both measured off the live
		   DOM — see that block for the derivation. Declared here in the base
		   rule, not inside the media query that uses them: the dead-CSS-var
		   guard resolves every var() against a real element at its own
		   viewport width, so a custom property both declared AND consumed
		   inside the same media query reads as dead whenever that query is
		   inactive. They are inert below the breakpoint regardless, since
		   nothing renders the pseudo-elements there. */
		--fade-start: 800px; /* where the fade begins, measured from the centre line */
		--fade-ramp: 90px; /* transparent -> solid, landing on slot ±3's inner edge */
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
		   TreatmentCard's own cursor for those). Inert
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

	/* Registers --pos as a typed, animatable custom property (Houdini
	   @property — Chrome/Edge 85+, Safari 16.4+, Firefox 128+; older
	   browsers just ignore this rule and fall back to the untyped
	   behaviour below, so this is pure progressive enhancement, never a
	   regression). Without it, the browser can't hand off transform:
	   rotate(calc(var(--pos) * ...)) to the compositor — every one of
	   onWindowPointerMove's per-frame writes below forces a full main-
	   thread style recalculation instead, which desktop CPUs shrug off
	   but a weaker mobile CPU can't keep up with, visibly: 6x CPU-throttled
	   Playwright profiling during a simulated swipe measured 69% of frames
	   over 20ms (avg 39ms/frame, ~25fps) unregistered, dropping to 11%
	   (avg 20ms/frame, ~50fps) with this plus will-change below — not a
	   stutter, genuinely fewer frames rendered. Owner report: "choppy...
	   looks like low FPS" on mobile specifically, never on desktop. */
	@property --pos {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
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
	   hang lower than its smaller, more-rotated neighbors. will-change:
	   transform (see @property --pos's own comment just above for the
	   measured reasoning) hints the compositor to keep this on its own
	   layer rather than recreating one every frame. */
	.treatments__pivot {
		position: absolute;
		left: 50%;
		bottom: var(--pivot-baseline, 7.54rem);
		will-change: transform;
		--pivot-distance: 532px; /* smaller = more overlap risk, bigger = flatter curve — verified empirically, not by trig alone */
		/* --tilt-step is declared on .treatments__fan, not here, and
		   inherits down: the edge fade below is a pseudo-element of the FAN
		   and has to derive its angle from the same value the cards rotate
		   by, and a child cannot hand a variable back up to its parent
		   (same reason --card-width lives up there). */
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

	/* The same circle the CTA buttons carry, pointing sideways instead of up:
	   40px, a 2px ring in --brand-border, transparent until hover and filled
	   after it. The two arrows and their clipping come from .arrow-swap in
	   app.css; this only sets the axis each one travels along. */
	.treatments__nav {
		/* Mobile/tablet navigate by swiping the carousel itself (see
		   onPointerDown/Up) — Prev/Next are desktop-only, restored below. */
		display: none;
		width: var(--space-10);
		height: var(--space-10);
		padding: 0;
		border: 2px solid var(--brand-border);
		border-radius: 50%;
		background: transparent;
		color: var(--brand-border);
		cursor: pointer;
		--swap-y: 0px;
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow);
	}

	.treatments__nav--prev {
		--swap-x: calc(-1 * var(--arrow-roll));
	}

	.treatments__nav--next {
		--swap-x: var(--arrow-roll);
	}

	.treatments__nav:focus-visible {
		background: var(--brand-border);
		color: var(--color-bg-sand);
	}

	@media (hover: hover) and (pointer: fine) {
		.treatments__nav:hover {
			background: var(--brand-border);
			color: var(--color-bg-sand);
		}
	}

	.treatments__dots {
		display: flex;
		align-items: center;
		justify-content: center;
		/* No gap: each dot's target is already 24px wide, so the targets sit edge to
		   edge and their centres land exactly 24px apart. */
		gap: 0;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.treatments__dot {
		display: grid;
		place-items: center;
	}

	/* The button is the 24x24 the WCAG 2.2 target-size minimum asks for; the dot
	   you see is drawn by ::before and stays 6.4px. Sizing the button to the dot
	   is what made these seven a 6.4px target. */
	.treatments__dot-visual {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		padding: 0;
		appearance: none;
		cursor: pointer;
	}

	.treatments__dot-visual::before {
		content: '';
		width: 0.4rem;
		height: 0.4rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-fg-forest);
		background: transparent;
		transition: background-color var(--motion-fast);
	}

	.treatments__dot-visual--active::before {
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
			display: inline-flex;
		}
	}

	/* Ultra-wide: flatten the arc so the outermost cards stop being cut off.

	   .treatments__fan is full-bleed (100vw), so the wider the screen the
	   more of the arc it reveals. There are only ever 7 cards (MIN_ITEMS =
	   2 * VISIBLE_SLOT_MAX + 3), so slots run exactly -3..3 and ±3 IS the
	   outermost pair — nothing deeper can ever appear, which is why one
	   flattened setting covers every width from here up rather than needing
	   a ladder of breakpoints.

	   Below ~1560px the ±3 pair sits fully past the viewport edge, so its
	   rotation never mattered. From ~1600px it enters the viewport still
	   carrying the steep 14deg-per-slot tilt, which drops it 127px below
	   .treatments__fan's clip box — measured, identical at 1600/1920/2560/
	   3440px, since the drop is a function of rotation alone and not of
	   viewport width. This breakpoint fires at 1536px, just before that
	   pair can appear at all, so the cut is never visible at any width.

	   Radius and angle move together on purpose. Horizontal spacing is
	   R_eff * sin(--tilt-step), where R_eff is --pivot-distance plus half
	   the card's height (the pivot sits below the card's BOTTOM edge, so
	   the radius to its centre is the longer one). Raising the radius while
	   lowering the angle by the matching amount therefore holds the cards
	   where they already were left-to-right and changes only how far they
	   dive: measured spacing stays 362px (unchanged from the 1024px
	   breakpoint) while slot ±3 gains 76px of bottom clearance instead of
	   overflowing by 127px. 76px is deliberately not a round number — it's
	   the same clearance slot ±2, the outermost card at 1440px, already
	   has, so the widest layout keeps the safety margin the design was
	   signed off with. Verified by bounding-box readout at 1600, 1920,
	   2560 and 3440px; as everywhere else in this file the numbers come
	   from measuring rendered boxes, never from trig on one reference
	   point (see the file-level comment). --pivot-baseline, the fan's
	   height and .treatments__controls' margin all stay untouched: the
	   centre card never moves, and every other card only moves UP. */
	@media (min-width: 1536px) {
		.treatments__fan {
			--tilt-step: 6.5deg;
		}

		.treatments__pivot {
			--pivot-distance: 3000px;
		}
	}

	/* Edge fade — the rule is "only ever five cards", not "fade the screen
	   edge". Slots 0/±1/±2 are the design; ±3 is the recycle slot, where a
	   card steps off one end and reappears at the other (see shiftOne). Once
	   the viewport is wide enough to show ±3, that swap happens in plain
	   sight. These two overlays cover it.

	   The breakpoint is 1776px and not a round number on purpose: slot ±3's
	   inner edge sits 888px from the centre line (measured, and identical at
	   every width — see below), so 2 * 888 is exactly the viewport width at
	   which it first crosses into view. Below that there is nothing to hide
	   and the fade does not exist at all, which is why laptops never see it.

	   Anchored to the carousel's CENTRE LINE, not to the viewport edge, and
	   that is the whole trick: measured off the live DOM, every slot sits at
	   a fixed distance from centre no matter how wide the screen is (slot ±2
	   spans 558-880px, slot ±3 spans 888-1245px, identical at 1920/2560/
	   3440). A viewport-anchored fade cannot track them — widen the screen
	   and it walks away from the cards it is meant to hide.

	   --fade-start (800px) deliberately overlaps slot ±2's outer corner.
	   There are only 8px of clear air between slot ±2 ending at 880 and slot
	   ±3 starting at 888, so a gradient that fully hides ±3 without touching
	   ±2 is not geometrically available; a ramp finishing at 890 puts ±3
	   behind full coverage from its very inner edge while costing ±2 only
	   its outermost, thinnest rotated corner.

	   The tilt is 2 * --tilt-step, NOT 3 *. The fade's visible boundary sits
	   against slot ±2 — the outermost card anyone can actually see — so that
	   is the edge it has to run parallel to. Matching slot ±3 instead (the
	   card hidden behind the fade) over-rotates it by a whole step and reads
	   as visibly off against its neighbour.

	   The strip is a ROTATED ELEMENT with an axis-aligned gradient inside it,
	   NOT an upright box with an angled gradient. The latter was tried and is
	   the obvious-looking version that does not work: a gradient's colour
	   stops run along its own axis, but the element is still a rectangle, so
	   the fade gets truncated by the box's vertical inner edge. That leaves a
	   hard vertical seam exactly where the thing is supposed to be reaching
	   transparency, and the tilt barely reads. Rotating the element instead
	   makes its edges and its gradient axis the same frame, so the
	   transparent boundary is a genuine straight line parallel to the card
	   beside it. */
	@media (min-width: 1776px) {
		.treatments__fan::before,
		.treatments__fan::after {
			content: '';
			position: absolute;
			/* Rotated about its inner edge, so the far end swings vertically
			   by width * sin(angle) — at 3440px that is ~770px. The strip has
			   to stay taller than that swing plus the fan itself, or the far
			   top corner is left uncovered. Everything past the fan's own box
			   is clipped, so the excess costs nothing. */
			top: -250%;
			height: 600%;
			width: 100vw;
			/* Above the cards (positioned, but un-z-indexed), and never a
			   hit-test target — the fan underneath is a drag surface. */
			z-index: 2;
			pointer-events: none;
		}

		/* Right: transparent at the inner edge, solid by --fade-ramp, then
		   flat sand the rest of the way out. */
		.treatments__fan::after {
			left: calc(50% + var(--fade-start));
			transform-origin: left center;
			transform: rotate(calc(2 * var(--tilt-step)));
			background: linear-gradient(to right, transparent 0, var(--color-bg-sand) var(--fade-ramp));
		}

		.treatments__fan::before {
			right: calc(50% + var(--fade-start));
			transform-origin: right center;
			transform: rotate(calc(-2 * var(--tilt-step)));
			background: linear-gradient(to left, transparent 0, var(--color-bg-sand) var(--fade-ramp));
		}
	}
</style>
