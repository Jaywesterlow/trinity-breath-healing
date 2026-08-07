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
		}
	];

	const count = items.length;

	// Each item's own position on an evenly-spaced horizontal line, in units
	// of "card-widths from center." NOT derived from an index every render —
	// a real, persistent number per item that only ever moves by ±1 per
	// click. That's the whole fix: the old version recomputed every item's
	// position from scratch via a shortest-path wrap, so the one item at the
	// edge being vacated had nowhere to go but straight across the screen.
	// Here it just keeps counting past the edge, off-screen, same as
	// everything else — see next()/prev() below for where it eventually
	// loops back.
	let positions: number[] = $state([0, 1, 2, -2, -1]);

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
	// margin (see the CSS), so position ±2 is already fully off-screen. An
	// item only recycles once it takes ONE MORE step past that (reaching
	// ±3), meaning every item spends a full step sitting off-screen,
	// invisible, before it jumps ∓5 (once around the 5-item loop) to
	// reappear on the opposite side. That invariant — recycling only ever
	// touches an item that was already off-screen on both sides of the
	// jump — is only guaranteed to hold for |delta| = 1; two other
	// approaches for bigger jumps were tried and rejected: applying a
	// bigger delta directly (an item's raw target can overshoot straight
	// past a visible slot into recycle range, so folding it back
	// teleported a visible card with no animation) and giving each item
	// its own short "already folded" target for a bigger jump (fixed the
	// teleport, but items no longer stayed the same distance apart from
	// each other *during* the transition, since different-length sweeps
	// reach their targets at different rates under the same easing curve
	// — confirmed via bounding-box measurement as real, visible
	// overlapping and gapping mid-swipe). commitSteps below gets a
	// multi-step swipe's speed by calling this several times in a fast
	// cascade instead, so every individual step stays exactly the
	// shape that's already proven safe.
	function shiftOne(delta: number): void {
		positions = positions.map((p, i) => {
			let next = p + delta;
			while (next <= -3) {
				armNoTransition(items[i]!.key);
				next += count;
			}
			while (next >= 3) {
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
		commitSteps(-positions[i]!);
	}

	// Swipe (mobile/tablet — Prev/Next buttons are CSS-hidden below the
	// desktop breakpoint, see .treatments__nav). Live drag-follow, not a
	// once-per-swipe step: every pointermove adds the current drag distance,
	// in fractional "steps," directly onto --pos (see dragOffset below and
	// its use in the template), so the fan visibly tracks the finger in
	// real time instead of only moving once release fires a fixed 600ms
	// animation. On release, distance alone decides the base step count
	// (rounded to the nearest card) and a genuinely fast exit flick — judged
	// against a smoothed trailing-window velocity, not one noisy last
	// sample — adds extra steps on top (see endDrag). That split matters:
	// summing raw distance and raw velocity double-counts, since any real
	// drag covering more distance also reads a higher velocity, which made
	// ordinary drags overshoot by 2-3 cards during testing. Neither path is
	// capped at one card per swipe. shiftAll already accepts any integer
	// delta (see its while-loops above), so committing a multi-step flick
	// reuses it unchanged.
	const PX_PER_STEP = 90; // ~one mobile card-width of drag == one step
	const FLING_VELOCITY_PER_STEP = 0.35; // px/ms exit speed per extra fling step
	const MAX_FLING_STEPS = 3;
	const VELOCITY_WINDOW_MS = 80; // trailing window the exit velocity is averaged over

	let dragging = $state(false);
	let dragOffset = $state(0); // fractional steps, live only while dragging
	let dragStartX = 0;
	let dragStartY = 0;
	let moveHistory: { x: number; t: number }[] = [];
	let pendingDx = 0;
	let rafId: number | null = null;

	function onPointerDown(e: PointerEvent): void {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
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
				dragOffset = pendingDx / PX_PER_STEP;
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

		let velocity = 0;
		if (moveHistory.length >= 2) {
			const first = moveHistory[0]!;
			const last = moveHistory[moveHistory.length - 1]!;
			const dt = last.t - first.t;
			if (dt > 0) velocity = (last.x - first.x) / dt;
		}
		const baseSteps = Math.round(dragOffset);
		const flingSteps = Math.min(
			MAX_FLING_STEPS,
			Math.floor(Math.abs(velocity) / FLING_VELOCITY_PER_STEP)
		);
		const steps = baseSteps + Math.sign(velocity) * flingSteps;
		dragOffset = 0;
		commitSteps(steps);
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
					class:treatments__pivot--dragging={dragging}
					class:treatments__pivot--fast={cascading}
					style="--pos: {positions[i]! + dragOffset}"
				>
					<TreatmentCard
						label={item.label}
						icon={item.icon}
						buttonLabel={item.buttonLabel}
						buttonHref={item.buttonHref}
					/>
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
	   recycles (∓5, one lap of 5 items) once it's a further step past that,
	   fully invisible, frozen for that one frame as a second guarantee. This
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

	/* While a drag is active, --pos is being driven directly by the pointer
	   (see dragOffset in the script) on every pointermove — a transition here
	   would fight that with its own easing and make the fan visibly lag
	   behind the finger. Released the instant the drag ends (see endDrag),
	   so the final snap to the committed integer position (or back to 0, if
	   the drag didn't cross a full step) animates normally. */
	.treatments__pivot--dragging {
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
			/* Same ratio as mobile's empirically-verified numbers, scaled to
			   the bigger card (1.8x: 10.35rem vs 5.75rem) — not independently
			   re-measured at this breakpoint since desktop wasn't the
			   reported issue, but geometrically the same shape scaled.
			   tilt-step isn't overridden here on purpose — it's an angle,
			   not a length, so it doesn't scale with card size. */
			height: 39.33rem;
			--card-width: 11.9rem;
		}

		.treatments__pivot {
			--pivot-baseline: 14.28rem;
			--pivot-distance: 1010px;
		}

		.treatments__controls {
			margin-top: -14.28rem;
		}

		.treatments__nav {
			display: inline-block;
		}
	}
</style>
