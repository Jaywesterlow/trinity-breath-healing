<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		value?: string;
		iconSrc?: string;
		label: string;
	}

	let { value, iconSrc, label }: Props = $props();

	// Split "65+" into target number (65) and suffix ("+"). Values with no leading
	// digits (shouldn't occur for numeric stats — icon-based stats like infinity don't
	// pass `value` at all) skip animation entirely and just render as-is.
	const parsed = $derived.by(() => {
		const m = value?.match(/^(\d+)(.*)$/);
		const numStr = m?.[1];
		return { target: numStr ? parseInt(numStr, 10) : null, suffix: m?.[2] ?? '' };
	});

	// SSR/initial paint renders the real final value (SEO/AEO — crawlers and no-JS
	// users must see "65+", never "0+"). Only after mount + scrolling into view does
	// this reset to 0 and count up client-side.
	let displayValue = $state(value ?? '');
	let badgeEl: HTMLDivElement | null = $state(null);

	function easeOutQuint(t: number) {
		return 1 - Math.pow(1 - t, 5); // was cubic (power 3) — higher power = stronger deceleration near the end
	}

	onMount(() => {
		const { target, suffix } = parsed;
		if (target === null || !badgeEl) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// SSR renders the real final value (SEO/no-JS need "8+", never "0+" — see the
		// comment on displayValue's declaration above), but once JS has hydrated it
		// should rest at 0 immediately, not sit showing "8+" until the user happens to
		// scroll to it. The count-up itself still waits for scroll-into-view + the
		// delay below.
		displayValue = `0${suffix}`;

		const duration = 700; // same for every stat — see comment below on why this alone produces the "8 slows down, 65 flies then slows right at the end" feel

		function animate() {
			const start = performance.now();

			function tick(now: number) {
				// Clamped both ends, not just the top: a rAF callback's timestamp can land
				// a hair before the performance.now() captured just above on the very
				// first frame, making this briefly negative. Raising a negative number to
				// an odd power (any ease-out-cubic/quint curve) yields a negative eased
				// value — visible as "-1+"/"-4+" for a frame, worse the steeper the curve.
				const progress = Math.min(Math.max((now - start) / duration, 0), 1);
				const current = Math.round(easeOutQuint(progress) * (target as number));
				displayValue = `${current}${suffix}`;
				if (progress < 1) requestAnimationFrame(tick);
			}

			requestAnimationFrame(tick);
		}

		/* One shared duration + ease-out-quint applied to normalized time (not to the
		   integer count) is what makes both speeds happen automatically, no per-target
		   tuning needed: eased progress rockets toward 1 early then crawls the rest of
		   the way, regardless of target. For "8", that crawl covers only a handful of
		   integers, so the tail reads as sitting/settling on 8 ("slowing down"). For
		   "65", the same time-shaped crawl has to cover far more integers, so it keeps
		   visibly ticking through numbers for most of the duration and only resolves
		   to 65 right at the end ("a lot faster... slows down right before 65"). */
		let delayId: ReturnType<typeof setTimeout> | null = null;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					// Slow scrollers can drift into view gradually — starting immediately
					// on first intersection means the count-up is often already underway
					// (or finished) by the time they've actually settled on the section.
					// A short delay before it starts makes sure the animation is still
					// there to see. ~600ms — within the requested 0.5-0.75s.
					delayId = setTimeout(animate, 600);
					observer.disconnect();
				}
			},
			{ threshold: 0.4 }
		);
		observer.observe(badgeEl);

		return () => {
			observer.disconnect();
			if (delayId !== null) clearTimeout(delayId);
		};
	});
</script>

<div class="stat">
	<div class="stat__badge" bind:this={badgeEl}>
		{#if iconSrc}
			<img src={iconSrc} alt="" aria-hidden="true" class="stat__icon" />
		{:else}
			<span class="stat__value">{displayValue}</span>
		{/if}
	</div>
	<p class="stat__label">{label}</p>
</div>

<style>
	.stat {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.stat__badge {
		flex-shrink: 0;
		width: 4.813rem; /* 77px — Figma spec, no token match */
		height: 4.813rem;
		border-radius: 50%;
		background: var(--color-card-warm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat__icon {
		/* infinity.png is 69x42 (aspect ~1.64, wider than tall) — object-fit:contain on a
		   wider-than-tall image always renders at the box's own width. 100% left it
		   flush against the circle's edge with zero margin (unlike the number stats,
		   which sit at ~0.44-0.66 of the badge width) — 60% lands in that same range. */
		width: 55%;
		height: 55%;
		max-width: none; /* global.css's img reset caps all <img> at max-width:100% of their own natural size context; this keeps the percentage above authoritative */
		object-fit: contain;
	}

	.stat__value {
		font-family: var(--font-body); /* the other font token — was --font-display (Cormorant serif) */
		/* --font-weight-bold (700) is the heaviest real face hosted for DM Sans (only
		   Regular/Bold woff2 files exist) — 900 goes past that, so the browser
		   synthetically emboldens beyond the actual 700 file. No heavier weight token
		   exists to reach for instead. */
		font-weight: 900;
		font-size: var(
			--fs-h2
		); /* bumped up from --fs-h3 (22→32) to 28→40 — was too small for the circle */
		color: var(--color-fg-forest);
	}

	.stat__label {
		min-width: 0; /* flex children default to min-width:auto, which refuses to shrink below the unwrapped text width — needed now that the parent .stat is a fixed 150px box (see OverMij's .about__stats li) */
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.stat {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.stat__badge {
			width: 7.813rem; /* 125px — Figma spec */
			height: 7.813rem;
		}
	}
</style>
