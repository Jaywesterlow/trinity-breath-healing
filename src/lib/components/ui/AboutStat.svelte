<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * One row of the Over mij ledger: a large numeral, its "+" set small and brown
	 * beside it, and a short label underneath. The row's hairlines and padding belong
	 * to the list in OverMij.svelte; this is only the figure and its label.
	 *
	 * Was a circle with the number inside it (three of them, 125px, count-up). The
	 * ledger design of 2026-09-16 drops the circles and keeps the count-up.
	 */
	interface Props {
		/** "8+", "65+", "∞" — the leading digits count up; a value with none is shown as-is. */
		value: string;
		label: string;
	}

	let { value, label }: Props = $props();

	// Split "65+" into target number (65) and suffix ("+"). A value with no leading
	// digits ("∞") skips animation entirely and just renders as-is, with no suffix.
	const parsed = $derived.by(() => {
		const m = value.match(/^(\d+)(.*)$/);
		const numStr = m?.[1];
		return { target: numStr ? parseInt(numStr, 10) : null, suffix: m?.[2] ?? '' };
	});

	// SSR/initial paint renders the real final value (SEO/AEO — crawlers and no-JS
	// users must see "65+", never "0+"). Only after mount + scrolling into view does
	// this reset to 0 and count up client-side. The suffix is rendered from `parsed`
	// and never changes; only the digits move.
	// Capturing the initial `value` is the point: it is the server-rendered figure,
	// and the prop never changes after mount. Hence the ignore.
	// svelte-ignore state_referenced_locally
	let displayNum = $state(leadingDigits(value));

	function leadingDigits(v: string): string {
		return v.match(/^(\d+)/)?.[1] ?? v;
	}
	let valueEl: HTMLElement | null = $state(null);

	// Cubic, not quint. Quint front-loads so hard that ~95% of the count lands in the first
	// third of the run: the number appears to snap to its target and then sit there, which
	// reads as an abrupt stop rather than a deceleration. Cubic keeps digits visibly ticking
	// across most of the duration and spends the tail actually slowing into the final value.
	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	onMount(() => {
		const { target } = parsed;
		if (target === null || !valueEl) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// SSR renders the real final value (SEO/no-JS need "8+", never "0+" — see the
		// comment on displayNum's declaration above), but once JS has hydrated it
		// should rest at 0 immediately, not sit showing "8+" until the user happens to
		// scroll to it. The count-up itself still waits for scroll-into-view + the
		// delay below.
		displayNum = '0';

		// Same for every stat — see the comment below on why one shared duration is enough.
		// 700ms was too short for the ease to be legible at all; the count was over before
		// the eye caught it moving.
		const duration = 1800;

		function animate() {
			const start = performance.now();

			function tick(now: number) {
				// Clamped both ends, not just the top: a rAF callback's timestamp can land
				// a hair before the performance.now() captured just above on the very
				// first frame, making this briefly negative. Raising a negative number to
				// an odd power (any ease-out-cubic/quint curve) yields a negative eased
				// value — visible as "-1+"/"-4+" for a frame, worse the steeper the curve.
				const progress = Math.min(Math.max((now - start) / duration, 0), 1);
				displayNum = String(Math.round(easeOutCubic(progress) * (target as number)));
				if (progress < 1) requestAnimationFrame(tick);
			}

			requestAnimationFrame(tick);
		}

		/* One shared duration + ease-out applied to normalized time (not to the integer
		   count) is what makes both speeds happen automatically, no per-target tuning
		   needed: eased progress decelerates on the same time curve regardless of target,
		   so a small target like "8" steps through few integers and a large one like "65"
		   steps through many — both landing together, both easing into their final value. */
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
		observer.observe(valueEl);

		return () => {
			observer.disconnect();
			if (delayId !== null) clearTimeout(delayId);
		};
	});
</script>

<div class="stat">
	<!-- One text node for a crawler ("65+"), two spans for the type: the digits are
	     tabular so the count-up does not shuffle the "+" sideways, and the "+" is the
	     small brown glyph set against the numeral's top. -->
	<p class="stat__value" bind:this={valueEl}>
		<span class="stat__num">{displayNum}</span>{#if parsed.suffix}<span class="stat__plus"
				>{parsed.suffix}</span
			>{/if}
	</p>
	<p class="stat__label">{label}</p>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat__value {
		font-family: var(--font-display);
		font-weight: var(--font-weight-medium);
		font-size: 4rem; /* 64px — the ledger's one fixed size, no token at this scale */
		line-height: 1;
		color: var(--color-fg-forest);
		font-variant-numeric: tabular-nums;
	}

	/* Superscript-ish rather than a real <sup>: a 40px "+" whose top sits on the
	   numeral's cap line, in the site's brown so it reads as an accent on the figure
	   rather than as part of it. */
	.stat__plus {
		display: inline-block;
		font-size: 2.5rem; /* 40px */
		line-height: 1;
		vertical-align: top;
		margin-left: 0.04em;
		color: var(--brand-border);
	}

	.stat__label {
		font-family: var(--font-body);
		font-size: 0.875rem; /* 14px */
		letter-spacing: 0.06em;
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}
</style>
