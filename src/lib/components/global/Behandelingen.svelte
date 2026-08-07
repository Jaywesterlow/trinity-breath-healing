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

	// Items currently mid-recycle (see shiftAll) — their transition is
	// suppressed for a frame so they reposition instantly instead of
	// visibly sliding across from one edge to the other. A Set, not a
	// single value: a multi-step jump (goTo, below) can recycle more than
	// one item in the same update. SvelteSet (not a plain Set) so .add()/
	// .delete() are tracked directly — no reassignment needed to trigger
	// reactivity.
	const noTransitionKeys = new SvelteSet<string>();

	function armNoTransition(key: string): void {
		noTransitionKeys.add(key);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				noTransitionKeys.delete(key);
			});
		});
	}

	// The one place position ever changes. Only 3 cards (position -1, 0, 1)
	// are ever visible — .treatments__fan clips anything past that with
	// plenty of margin (see the CSS), so position ±2 is already fully
	// off-screen. An item only recycles once it takes ONE MORE step past
	// that (reaching ±3) — so every item spends a full click sitting
	// off-screen, invisible, before it jumps ∓5 (once around the 5-item
	// loop) to reappear on the opposite side, ready to slide back in over
	// the next couple of clicks. The jump itself is frozen (armNoTransition)
	// as a second guarantee on top of already being off-screen — belt and
	// suspenders, costs nothing.
	function shiftAll(delta: number): void {
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

	// Deliberately plain functions, not tied to how they're called — autoscroll
	// (deferred, see KNOWN-ISSUES) drops in later as a paused-on-hover
	// setInterval(next, …) here without touching anything else.
	function next(): void {
		shiftAll(-1);
	}
	function prev(): void {
		shiftAll(1);
	}
	function goTo(i: number): void {
		shiftAll(-positions[i]!);
	}

	// Swipe (mobile/tablet — Prev/Next buttons are CSS-hidden below the
	// desktop breakpoint, see .treatments__nav). Threshold-based, not a live
	// drag-follow: a swipe is just an alternate way to fire next()/prev(),
	// same as a button click. Distance-gated so a tap on a card's own link
	// (the corner button) isn't swallowed as a gesture.
	const SWIPE_THRESHOLD = 40;
	let dragging = false;
	let dragStartX = 0;
	let dragStartY = 0;

	function onPointerDown(e: PointerEvent): void {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
	}

	function onPointerUp(e: PointerEvent): void {
		if (!dragging) return;
		dragging = false;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		if (Math.abs(dx) <= SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
		if (dx > 0) {
			prev();
		} else {
			next();
		}
	}

	function onPointerCancel(): void {
		dragging = false;
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
			onpointerup={onPointerUp}
			onpointercancel={onPointerCancel}
		>
			{#each items as item, i (item.key)}
				<div
					class="treatments__pivot"
					class:treatments__pivot--jump={noTransitionKeys.has(item.key)}
					style="--pos: {positions[i]}"
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
		height: 21.85rem;
		overflow: hidden;
		/* Horizontal gestures drive next()/prev() (see onPointerDown/Up in the
		   script) — pan-y keeps vertical page scroll working through a touch
		   that starts on the carousel, since only left/right is ours to
		   claim. */
		touch-action: pan-y;
		/* Set here, not on .treatments__card: custom properties only inherit
		   DOWN the tree, and .treatments__pivot (the card's own parent) needs
		   to read this too. A child can't hand a variable up to its parent. */
		--card-width: 6.6rem;
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
		bottom: var(--pivot-baseline, 7.94rem);
		--pivot-distance: 560px; /* smaller = more overlap risk, bigger = flatter curve — verified empirically, not by trig alone */
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
		margin-top: -7.94rem;
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
