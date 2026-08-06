<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';

	const ICONS: Record<string, string> = {
		'mahatma-healing': '/images/card-mahatma-healing.svg',
		goldhealing: '/images/card-goldhealing.svg',
		'raster-energie': '/images/infinity.png',
		'spinal-touch': '/images/card-spinal-touch.svg'
	};

	// 5th card by design (see ROADMAP.md LND-05) — never implemented on the old
	// auto-scroll version. No icon file for it; reuses TextLink's arrow glyph.
	const items = [
		...BRAND.services.map((s) => ({ key: s.slug, label: s.name, icon: ICONS[s.slug] as string | null, href: null as string | null })),
		{ key: 'meer-diensten', label: 'Meer diensten', icon: null, href: '/diensten' }
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
		<div class="treatments__fan" role="group" aria-roledescription="carrousel" aria-label="Behandelingen">
			{#each items as item, i (item.key)}
				{@const offset = offsetOf(i)}
				{@const slot = SLOTS[offset]!}
				<div
					class="treatments__pivot"
					class:treatments__pivot--hidden={Math.abs(offset) > 1}
					class:treatments__pivot--jump={item.key === noTransitionKey}
					style="--rot: {slot.rot}deg"
				>
					{#if item.href}
						<a
							href={item.href}
							class="treatments__card"
							aria-label={item.label}
							style="--scale: {slot.scale}; --z: {slot.z}"
						>
							<svg
								class="treatments__more-icon"
								width="32"
								height="32"
								viewBox="0 0 22 22"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M5 17L17 5M17 5H9M17 5V13"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</a>
					{:else}
						<div
							class="treatments__card"
							aria-label={item.label}
							style="--scale: {slot.scale}; --z: {slot.z}"
						>
							{#if item.icon}
								<img src={item.icon} alt="" aria-hidden="true" class="treatments__icon" />
							{/if}
						</div>
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
							class:treatments__dot-visual--active={i === selectedIndex}
							aria-label={`Ga naar ${item.label}`}
							onclick={() => goTo(i)}
						></button>
					</li>
				{/each}
			</ul>

			<button type="button" class="treatments__nav" onclick={next} aria-label="Volgende">Next</button
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

	/* --- Fan: 5 fixed slots, cards rotate between them on index change. ---
	   Two nested elements per card on purpose: .treatments__pivot rotates
	   around ONE shared point far below the whole row (a real fan hub, not
	   each card tilting around its own base); .treatments__card scales around
	   its own center for the depth cue. Combining both in one transform would
	   make scale drag the card sideways too, since it'd share the same distant
	   origin. */
	.treatments__fan {
		position: relative;
		width: 100%;
		max-width: 26rem;
		height: 12.5rem;
	}

	/* Anchored by BOTTOM, not top. Every card's bottom-center starts at the
	   exact same point (--pivot-baseline above the fan's own bottom edge)
	   before any transform runs. transform-origin sits further below that —
	   a shared point acting as the fan's hinge — so rotating swings each
	   card's bottom edge along one real arc. If this anchored from the top
	   instead, the tallest (center, unscaled) card's bottom would hang lower
	   than every smaller, more-rotated side card — which is exactly the bug
	   this replaced. */
	.treatments__pivot {
		position: absolute;
		left: 50%;
		bottom: var(--pivot-baseline, 1.5rem);
		--pivot-distance: 650px; /* tune by eye: smaller = tighter/more dramatic arc */
		transform-origin: 50% calc(100% + var(--pivot-distance));
		transform: translateX(-50%) rotate(var(--rot));
		transition: transform 600ms var(--ease-in-out);
	}

	/* Mobile: only the center + immediate neighbors render — 5 fanned cards
	   don't fit a narrow viewport. Logic still tracks all 5 (dots, offsets);
	   this only hides the outer two visually. */
	.treatments__pivot--hidden {
		display: none;
	}

	/* Armed for exactly one frame on whichever card is wrapping from one edge
	   to the other (see armNoTransition in the script) — repositions instantly
	   instead of sweeping its rotation across the whole fan. */
	.treatments__pivot--jump {
		transition: none;
	}

	.treatments__card {
		/* Rectangular, not square — same proportions as the Werkwijze card
		   (17.625rem × 28.688rem, WerkwijzeCard.svelte), scaled down for a
		   5-up fan. aspect-ratio (not two literals) keeps them locked without
		   duplicating Werkwijze's numbers or importing its component. */
		--card-width: 6.5rem;
		width: var(--card-width);
		aspect-ratio: 282 / 459;
		border-radius: var(--radius-lg);
		background: red; /* TEMP diagnostic — confirming the preview deploy actually updates. Revert after. */
		padding: var(--space-4);
		display: flex;
		align-items: center;
		justify-content: center;
		transform-origin: center bottom; /* shrinks upward, keeps its bottom edge on the arc */
		transform: scale(var(--scale));
		z-index: var(--z);
		transition: transform 600ms var(--ease-in-out);
		color: var(--color-bg-sand); /* for the "meer diensten" arrow's currentColor */
	}

	.treatments__icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

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

		.treatments__fan {
			max-width: 44rem;
			height: 20rem;
		}

		.treatments__pivot--hidden {
			display: block;
		}

		.treatments__pivot {
			--pivot-distance: 950px;
			--pivot-baseline: 5rem;
		}

		.treatments__card {
			--card-width: 9rem;
		}
	}
</style>
