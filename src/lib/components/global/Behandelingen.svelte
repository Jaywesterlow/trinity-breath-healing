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

	// Fixed visual slots, keyed by offset from the selected card. Rotation is
	// shared around one pivot far below the row (see .treatments__pivot) — this
	// table only carries what varies per card: angle, depth scale, stacking.
	// Assumes exactly 5 items (offsetOf only ever returns -2..2 for count=5).
	const SLOTS: Record<number, { rot: number; scale: number; z: number }> = {
		[-2]: { rot: -18, scale: 0.78, z: 1 },
		[-1]: { rot: -9, scale: 0.9, z: 2 },
		[0]: { rot: 0, scale: 1, z: 3 },
		[1]: { rot: 9, scale: 0.9, z: 2 },
		[2]: { rot: 18, scale: 0.78, z: 1 }
	};

	let selectedIndex = $state(0);

	// The one item mid-wrap on the current click — its rotation transition is
	// suppressed for a frame so it repositions instantly instead of sweeping
	// across the fan. See the comment on armNoTransition below.
	let noTransitionKey: string | null = $state(null);

	// Shortest-path offset, wraps both directions — e.g. with 5 items, index 4
	// relative to selected index 0 is offset -1 (one step back), not +4.
	function offsetOf(i: number): number {
		let d = i - selectedIndex;
		if (d > count / 2) d -= count;
		if (d < -count / 2) d += count;
		return d;
	}

	// For 4 of 5 items, moving to the next/prev index is a normal one-slot hop
	// and the CSS transition looks right. The 5th — whichever item currently
	// sits at the edge being vacated — has no "one slot further" to go to; its
	// shortest-path offset jumps straight across, from -18deg to +18deg (or the
	// reverse), and the transition animates that as one continuous sweep
	// through dead center, in front of/behind every other card. Freezing its
	// transition for exactly the frame the jump happens makes it reposition
	// instantly instead — indistinguishable from "it was already there."
	// Re-armed on the item's OWN key so a rapid second click (new item mid-jump)
	// can't have its freeze cleared early by the first click's timer.
	function armNoTransition(key: string): void {
		noTransitionKey = key;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (noTransitionKey === key) noTransitionKey = null;
			});
		});
	}

	// Deliberately plain functions, not tied to how they're called — autoscroll
	// (deferred, see KNOWN-ISSUES) drops in later as a paused-on-hover
	// setInterval(next, …) here without touching anything else.
	function next(): void {
		const wrapping = items.find((_, i) => offsetOf(i) === -2);
		if (wrapping) armNoTransition(wrapping.key);
		selectedIndex = (selectedIndex + 1) % count;
	}
	function prev(): void {
		const wrapping = items.find((_, i) => offsetOf(i) === 2);
		if (wrapping) armNoTransition(wrapping.key);
		selectedIndex = (selectedIndex - 1 + count) % count;
	}
	function goTo(i: number): void {
		selectedIndex = i;
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
				{@const offset = offsetOf(i)}
				{@const slot = SLOTS[offset]!}
				<div
					class="treatments__pivot"
					class:treatments__pivot--jump={item.key === noTransitionKey}
					style="--offset: {offset}; --rot: {slot.rot}deg; --scale: {slot.scale}; --z: {slot.z}"
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
							class:treatments__dot-visual--active={i === selectedIndex}
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

	/* --- Mobile/tablet (default): plain horizontal slide, not the arc. ---
	   Every card stays in the DOM and keeps its own transition the whole
	   time — nothing is ever display:none. Cards past the visible 3 (offset
	   ±2) sit off-canvas via translateX and are clipped by .treatments__fan's
	   overflow, so they can still transition smoothly into view instead of
	   popping. Each pivot's transform depends only on --offset (a plain
	   number, not degrees) — CSS owns the actual px math (--card-width +
	   --card-gap), so the same --offset value drives a completely different
	   desktop treatment below without the script knowing which one is
	   active. */
	.treatments__fan {
		position: relative;
		width: 100%;
		max-width: 26rem;
		height: 12.5rem;
		overflow: hidden;
		/* Set here, not on .treatments__card: custom properties only inherit
		   DOWN the tree, and .treatments__pivot (the card's own parent) needs
		   to read this too for its slide math below. A child can't hand a
		   variable up to its parent. */
		--card-width: 6.5rem;
	}

	.treatments__pivot {
		position: absolute;
		left: 50%;
		top: 50%;
		--card-gap: 2rem;
		transform: translate(-50%, -50%)
			translateX(calc(var(--offset) * (var(--card-width) + var(--card-gap))));
		transition: transform 600ms var(--ease-in-out);
	}

	/* Armed for exactly one frame on whichever card is wrapping from one edge
	   to the other (see armNoTransition in the script) — repositions instantly
	   instead of sliding all the way across the visible row. */
	.treatments__pivot--jump {
		transition: none;
	}

	/* Card size/padding/layout itself lives in TreatmentCard.svelte — the one
	   place it's defined, used identically for all 5 cards. --card-width is
	   still declared on .treatments__fan above because .treatments__pivot's
	   own slide math (mobile) needs it too, and a custom property can't be
	   read by its own parent if it were declared only on the card. */

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

		/* --- Desktop: the arc, replacing the mobile slide entirely. ---
		   Two nested elements per card on purpose: .treatments__pivot rotates
		   around ONE shared point far below the whole row (a real fan hub,
		   not each card tilting around its own base); .treatments__card
		   scales around its own center for the depth cue. Combining both in
		   one transform would make scale drag the card sideways too, since
		   it'd share the same distant origin. */
		.treatments__fan {
			max-width: 44rem;
			height: 20rem;
			overflow: visible; /* the arc's edge cards intentionally sit outside this box */
			--card-width: 9rem;
		}

		/* Anchored by BOTTOM, not top. Every card's bottom-center starts at
		   the exact same point (--pivot-baseline above the fan's own bottom
		   edge) before any transform runs. transform-origin sits further
		   below that — a shared point acting as the fan's hinge — so
		   rotating swings each card's bottom edge along one real arc. If
		   this anchored from the top instead, the tallest (center,
		   unscaled) card's bottom would hang lower than every smaller,
		   more-rotated side card. */
		.treatments__pivot {
			top: auto;
			bottom: 5rem;
			--pivot-distance: 950px; /* tune by eye: smaller = tighter/more dramatic arc */
			transform-origin: 50% calc(100% + var(--pivot-distance));
			transform: translateX(-50%) rotate(var(--rot));
		}
	}
</style>
