<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	import TreatmentCard from '$lib/components/ui/TreatmentCard.svelte';

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
	// one item in the same update.
	let noTransitionKeys: Set<string> = $state(new Set());

	function armNoTransition(key: string): void {
		noTransitionKeys.add(key);
		noTransitionKeys = new Set(noTransitionKeys);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				noTransitionKeys.delete(key);
				noTransitionKeys = new Set(noTransitionKeys);
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

	/* --- Even-spaced conveyor, ONE mechanism at every breakpoint. ---
	   No rotation, no scale, no arc. All 5 cards sit on a single flat line,
	   .treatments__pivot's translateX = --pos card-widths from center — a
	   fixed, even --card-gap between every card, never overlapping. Only 3
	   positions (-1, 0, 1) land inside .treatments__fan's visible, clipped
	   window; ±2 is already fully off-screen by design (see the sizing
	   math below), so a card's exit is a normal, visible slide out past
	   the edge — never a pop, never display:none.

	   The "continuous loop" comes from script.ts's shiftAll: position keeps
	   counting past ±2 instead of wrapping back into view, so nothing ever
	   needs to jump across the screen to reach its next spot — it only
	   recycles (∓5, one lap of 5 items) once it's a further step past that,
	   fully invisible, frozen for that one frame as a second guarantee. */
	.treatments__fan {
		position: relative;
		width: 100%;
		max-width: 22rem;
		height: 11rem;
		overflow: hidden;
		/* Set here, not on .treatments__card: custom properties only inherit
		   DOWN the tree, and .treatments__pivot (the card's own parent) needs
		   to read this too. A child can't hand a variable up to its parent. */
		--card-width: 6rem;
	}

	.treatments__pivot {
		position: absolute;
		left: 50%;
		top: 50%;
		--card-gap: 1.25rem;
		transform: translate(-50%, -50%)
			translateX(calc(var(--pos) * (var(--card-width) + var(--card-gap))));
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
	}

	.treatments__nav {
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

		/* Desktop: same conveyor as mobile above, just bigger — more screen
		   room, so cards can be larger with a wider gap between them.
		   Nothing here changes the mechanism, only the numbers. */
		.treatments__fan {
			max-width: 32rem;
			height: 17rem;
			--card-width: 9rem;
		}

		.treatments__pivot {
			--card-gap: 2rem;
		}
	}
</style>
