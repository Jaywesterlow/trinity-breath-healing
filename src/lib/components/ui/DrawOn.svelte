<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Inlines a centerline-traced SVG and draws its strokes when it scrolls into view.
	 *
	 * The hero can animate on load because it is above the fold; everything else needs a
	 * scroll trigger, and `animation-timeline: view()` is still Chrome-only. So this uses an
	 * IntersectionObserver — as a *progressive enhancement*, never a dependency:
	 *
	 *   - No JS / crawler / prerendered HTML → strokes have no dash offset → fully drawn art.
	 *   - JS present → `armed` hides the strokes, `drawn` releases the animation on entry.
	 *
	 * That ordering matters: if the CSS hid the strokes by default, a JS failure would leave a
	 * blank box. Arming from JS means the failure mode is "no animation", not "no image".
	 * The element is below the fold when armed, so hiding it is never visible to the reader.
	 */
	let {
		svg,
		class: klass = '',
		animate = true
	}: {
		svg: string;
		class?: string;
		/** Set false to inline the art fully drawn, with no scroll trigger and no stroke
		 *  animation. The markup and geometry are identical either way — only the reveal is
		 *  skipped — so this is safe to flip per call site while the draw order is being
		 *  reworked. */
		animate?: boolean;
	} = $props();

	// The same traced SVG can be inlined more than once in one document (e.g. the About
	// portraits render both a mobile and a desktop copy, shown/hidden by CSS media query,
	// but both exist in the DOM at once). Each copy's <mask id> must be unique, or the
	// second copy's `url(#id)` resolves to the FIRST copy's mask, cross-wiring the two.
	// $props.id() gives a per-instance id that's identical between SSR and hydration
	// (Svelte reads it back off a hydration marker), so this is safe for a prerendered site.
	const uid = $props.id();

	function uniquifyIds(markup: string, suffix: string): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive local, built and consumed inside this pure function; SvelteSet would be wrong here
		const ids = new Set<string>();
		for (const m of markup.matchAll(/\bid="([^"]+)"/g)) {
			if (m[1]) ids.add(m[1]);
		}
		let out = markup;
		for (const id of ids) {
			const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const re = new RegExp(`(id="${escaped}"|url\\(#${escaped}\\))`, 'g');
			out = out.replace(re, (match) => match.replace(id, `${id}-${suffix}`));
		}
		return out;
	}

	let uniqueSvg = $derived(uniquifyIds(svg, uid));

	let el: HTMLElement | null = $state(null);
	let armed = $state(false);
	let drawn = $state(false);

	onMount(() => {
		if (!el || !animate) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		armed = true;

		// TEMPORARY 2026-07-28 — frozen in the armed-but-undrawn state so the pre-draw frame can
		// be screenshotted at leisure. The strokes are hidden and the reveal is never released,
		// so whatever stays visible is artwork the mask is NOT covering. Set this back to false
		// (and delete this block) to restore the animation. Nothing else was changed.
		const FREEZE_UNDRAWN = true;
		if (FREEZE_UNDRAWN) return;

		// Observe the <svg>, not this wrapper: the wrapper is display:contents, so it generates
		// no box at all and an IntersectionObserver on it never reports an intersection.
		const target = el.querySelector('svg') ?? el;

		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						drawn = true;
						io.disconnect();
					}
				}
			},
			{ threshold: 0.25 }
		);
		io.observe(target);

		return () => io.disconnect();
	});
</script>

<div bind:this={el} class="drawon {klass}" class:drawon--armed={armed} class:drawon--drawn={drawn}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
	{@html uniqueSvg}
</div>

<style>
	.drawon {
		display: contents; /* the SVG inherits the slot the <img> used to occupy */
	}

	/* {@html} content carries no scoping class, so :global() under the scoped parent. */
	.drawon--armed :global(.lt-draw path) {
		stroke-dasharray: 1; /* pathLength="1" — one dash spans any path, whatever its length */
		stroke-dashoffset: 1;
	}

	/* NB: the keyframes are declared `-global-drawon`, but the animation property references
	   them WITHOUT the prefix — Svelte strips it when emitting the global @keyframes rule.
	   Writing `animation: -global-drawon` names a keyframe that does not exist, so the strokes
	   stay hidden at dashoffset 1 and nothing ever draws. */
	.drawon--drawn :global(.lt-draw path) {
		animation: drawon var(--d, 0.6s) ease-out var(--t, 0s) forwards;
	}

	@keyframes -global-drawon {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Belt and braces: the script already bails on reduced motion. */
	@media (prefers-reduced-motion: reduce) {
		.drawon :global(.lt-draw path) {
			stroke-dasharray: none;
			stroke-dashoffset: 0;
			animation: none;
		}
	}
</style>
