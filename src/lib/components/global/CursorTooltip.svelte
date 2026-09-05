<script lang="ts">
	/**
	 * The site's cursor.
	 *
	 * A small dot follows the pointer everywhere. Over anything clickable it
	 * widens; over anything carrying `data-tooltip="…"` it grows into a card
	 * with that text, whose square top-left corner sits where the cursor's tip
	 * was. Icon-only controls — the socials, the carousel's Vorige/Volgende, a
	 * treatment card's corner arrow — get to say what they do without a caption
	 * underneath them.
	 *
	 * It is deliberately one shape and two sizes rather than anything cleverer.
	 * The card is always laid out at its natural size and scaled down out of the
	 * dot, so nothing has to be measured, and the growth is one transform.
	 *
	 * Three limits that are not negotiable:
	 *
	 * - Nothing renders, and `cursor: none` never applies, until JavaScript has
	 *   run AND confirmed a real pointer AND found no reduced-motion preference
	 *   (the gate is a class on <html> — see app.css). A failed bundle, a touch
	 *   screen or that preference leaves the ordinary cursor exactly where it
	 *   was, rather than a page with no cursor and nothing in its place.
	 * - Text fields keep their caret regardless. A form is the one place where
	 *   losing the native cursor costs you something real.
	 * - It never eases toward the pointer. A follower lagging behind the cursor
	 *   is what makes people report their cursor as broken, so this writes the
	 *   real coordinates once per frame and nothing else. Only the dot-to-card
	 *   growth is animated, and that happens in place.
	 */
	import { onMount } from 'svelte';

	const CLICKABLE =
		'a, button, [role="button"], input, select, textarea, label, summary, [tabindex]:not([tabindex="-1"])';

	let enabled = $state(false);
	let label = $state('');
	let clickable = $state(false);
	let visible = $state(false);
	let root: HTMLDivElement | null = $state(null);

	/* Written straight to the node rather than through state: this runs on every
	   frame the pointer moves, and a reactive round-trip per frame is exactly
	   the overhead this has to stay clear of. */
	let x = 0;
	let y = 0;
	let frame = 0;

	function place() {
		frame = 0;
		if (root) root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	function schedule() {
		if (frame) return;
		frame = requestAnimationFrame(place);
	}

	function clear() {
		visible = false;
		label = '';
		clickable = false;
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		x = event.clientX;
		y = event.clientY;
		visible = true;
		const target = event.target as Element | null;
		const next = target?.closest?.('[data-tooltip]')?.getAttribute('data-tooltip') ?? '';
		if (next !== label) label = next;
		const isClickable = !!target?.closest?.(CLICKABLE);
		if (isClickable !== clickable) clickable = isClickable;
		schedule();
	}

	onMount(() => {
		/* A coarse pointer has nothing to replace, and someone who has asked for
		   less movement has not asked for a second thing following their cursor. */
		if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		enabled = true;
		document.documentElement.classList.add('has-cursor-tooltip');

		window.addEventListener('pointermove', onPointerMove, { passive: true });
		/* Leaving the document, tabbing away, or switching to another tab all end
		   with the pointer somewhere this page will never hear about again. */
		document.addEventListener('pointerleave', clear);
		window.addEventListener('blur', clear);
		document.addEventListener('visibilitychange', clear);

		return () => {
			if (frame) cancelAnimationFrame(frame);
			document.documentElement.classList.remove('has-cursor-tooltip');
			window.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerleave', clear);
			window.removeEventListener('blur', clear);
			document.removeEventListener('visibilitychange', clear);
		};
	});
</script>

{#if enabled}
	<div
		bind:this={root}
		class="cursor"
		class:cursor--on={visible}
		class:cursor--labelled={label !== ''}
		class:cursor--clickable={clickable}
		aria-hidden="true"
	>
		<span class="cursor__dot"></span>
		<span class="cursor__card">{label}</span>
	</div>
{/if}

<style>
	/* The wrapper is the only thing that tracks. Its children never move
	   relative to it, so a frame costs one transform write on one node. */
	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 200; /* over the nav, which is 100 */
		pointer-events: none;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
		will-change: transform;
	}

	.cursor--on {
		opacity: 1;
	}

	/* Forest inside a sand ring, so it reads on the sand page and on the green
	   surfaces alike without a blend mode. Centred on the pointer, because a dot
	   with a corner would be a worse cursor than the one it replaces. */
	.cursor__dot {
		position: absolute;
		top: 0;
		left: 0;
		width: 10px;
		height: 10px;
		margin: -5px 0 0 -5px;
		border-radius: 50%;
		background: var(--color-fg-forest);
		box-shadow: 0 0 0 1.5px var(--color-bg-sand);
		transform: scale(1);
		transition:
			transform 200ms var(--ease-arrow),
			background-color 200ms var(--ease-out),
			box-shadow 200ms var(--ease-out),
			opacity 140ms var(--ease-out);
	}

	/* Clickable things open the dot into a ring rather than just growing it.
	   `cursor: none` takes the hand pointer away and this is what puts that
	   signal back — but a filled disc at this size sits on top of the word it is
	   pointing at, which is exactly what a cursor must not do. Hollow, it reads
	   as a target instead of a blot. */
	.cursor--clickable .cursor__dot {
		transform: scale(2);
		background: transparent;
		box-shadow:
			inset 0 0 0 1px var(--color-fg-forest),
			0 0 0 1px var(--color-bg-sand);
	}

	/* Grown from the dot rather than sized to fit it: the card is always laid out
	   at its natural width and scaled, so no text has to be measured and the
	   growth is a single transform. transform-origin is the top-left corner —
	   the one with no radius — so it expands away from the cursor's tip. */
	.cursor__card {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		padding: 0.375rem 0.625rem;
		border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm);
		background: var(--color-fg-forest);
		/* The green surfaces are only 1.86:1 against the card. The hairline keeps
		   its edge readable on those without darkening the card itself. */
		border: 1px solid color-mix(in srgb, var(--color-bg-sand) 40%, transparent);
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-light);
		line-height: 1.2;
		white-space: nowrap;
		transform-origin: 0 0;
		transform: scale(0.2);
		opacity: 0;
		transition:
			transform 220ms var(--ease-arrow),
			opacity 140ms var(--ease-out);
	}

	.cursor--labelled .cursor__dot {
		transform: scale(0.2);
		opacity: 0;
	}

	.cursor--labelled .cursor__card {
		transform: scale(1);
		opacity: 1;
	}
</style>
