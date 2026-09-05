<script lang="ts">
	/**
	 * The pointer becomes the label.
	 *
	 * Any element carrying `data-tooltip="…"` hides the native cursor while the
	 * pointer is over it and draws that text as a small forest card whose square
	 * top-left corner sits exactly where the cursor's tip was. Icon-only controls
	 * — the social links, the carousel's Vorige/Volgende, a treatment card's
	 * corner arrow — get to say what they do without a caption underneath them.
	 *
	 * Three deliberate limits:
	 *
	 * - It renders nothing until JavaScript has run AND said this is a real
	 *   pointer. `cursor: none` is applied from the same flag (a class on <html>,
	 *   see app.css), so a failed bundle, a touch screen or a reduced-motion
	 *   preference leaves the ordinary cursor exactly where it was rather than a
	 *   page with no cursor at all and no replacement for it.
	 * - It never animates toward the pointer. Easing a follower behind the cursor
	 *   is the thing that makes people report their cursor as broken; this writes
	 *   the real coordinates, once per frame, and nothing else.
	 * - It is `aria-hidden`. Every target already carries the same words in its
	 *   accessible name, and a screen reader has no cursor to decorate.
	 */
	import { onMount } from 'svelte';

	let enabled = $state(false);
	let label = $state('');
	let el: HTMLDivElement | null = $state(null);

	/* Written straight to the node rather than through state: this runs on every
	   frame the pointer moves, and a reactive round-trip per frame is exactly the
	   overhead this has to stay clear of. */
	let x = 0;
	let y = 0;
	let frame = 0;

	const MARGIN = 8;

	function place() {
		frame = 0;
		if (!el) return;
		const { width, height } = el.getBoundingClientRect();
		/* Clamped so the card cannot be pushed off-screen near an edge — past
		   that point the corner stops being the cursor's tip, which is better
		   than a label nobody can read. */
		const left = Math.min(x, window.innerWidth - width - MARGIN);
		const top = Math.min(y, window.innerHeight - height - MARGIN);
		el.style.transform = `translate3d(${Math.max(MARGIN, left)}px, ${Math.max(MARGIN, top)}px, 0)`;
	}

	function schedule() {
		if (frame) return;
		frame = requestAnimationFrame(place);
	}

	function clear() {
		label = '';
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		x = event.clientX;
		y = event.clientY;
		const target = (event.target as Element | null)?.closest?.('[data-tooltip]');
		const next = target?.getAttribute('data-tooltip') ?? '';
		if (next !== label) label = next;
		if (label) schedule();
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

	/* The node only exists once there is something to say, so its size is known
	   by the time place() measures it. */
	$effect(() => {
		if (label && el) place();
	});
</script>

{#if enabled && label}
	<div bind:this={el} class="cursor-tooltip" aria-hidden="true">{label}</div>
{/if}

<style>
	.cursor-tooltip {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 200; /* over the nav, which is 100 */
		padding: 0.375rem 0.625rem;
		/* Square where the cursor's tip is, rounded everywhere else — the corner
		   is the pointer, the rest is the card. */
		border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm);
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-light);
		line-height: 1.2;
		white-space: nowrap;
		pointer-events: none;
		will-change: transform;
	}
</style>
