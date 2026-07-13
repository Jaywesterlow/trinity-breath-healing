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
	let { svg, class: klass = '' }: { svg: string; class?: string } = $props();

	let el: HTMLElement | null = $state(null);
	let armed = $state(false);
	let drawn = $state(false);

	onMount(() => {
		if (!el) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		armed = true;

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

<div
	bind:this={el}
	class="drawon {klass}"
	class:drawon--armed={armed}
	class:drawon--drawn={drawn}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
	{@html svg}
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
