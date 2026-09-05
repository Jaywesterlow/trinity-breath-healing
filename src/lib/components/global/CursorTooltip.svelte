<script lang="ts">
	/**
	 * The site's cursor.
	 *
	 * An arrowhead follows the pointer everywhere, and changes shape to say what
	 * the thing under it does:
	 *
	 *   default   the arrowhead alone
	 *   link      the arrowhead shrinks inside a ring that blooms around it
	 *   text      a caret bar, because a form field needs to show where the next
	 *             character lands and an arrow cannot
	 *   drag      a two-headed arrow, on the carousel's fan; it compresses while
	 *             the fan is actually being dragged
	 *   expand    a circled +, on a closed FAQ row — the + turns 45° into a ×
	 *   collapse  when that row is open
	 *   disabled  the arrowhead, dimmed, over a control that will not respond
	 *   label     the whole thing becomes a card carrying `data-tooltip` text,
	 *             its square top-left corner where the tip was
	 *
	 * Everything is one wrapper that tracks and a handful of small children that
	 * never move relative to it, so a frame costs a single transform write. The
	 * shapes are all laid out at natural size and scaled/faded between, so
	 * nothing is ever measured.
	 *
	 * Modes come from `data-cursor="…"` on any ancestor, or are inferred: text
	 * fields, disabled controls, then anything clickable. `data-tooltip` wins
	 * over all of them.
	 *
	 * Two limits that are not negotiable:
	 *
	 * - Nothing renders, and `cursor: none` never applies, until JavaScript has
	 *   run AND confirmed a real pointer AND found no reduced-motion preference
	 *   (the gate is a class on <html> — see app.css). A failed bundle, a touch
	 *   screen or that preference leaves the ordinary cursor exactly where it
	 *   was, rather than a page with no cursor and nothing in its place.
	 * - It never eases toward the pointer. A follower lagging behind the cursor
	 *   is what makes people report their cursor as broken, so this writes the
	 *   real coordinates once per frame and nothing else. Only the shape changes
	 *   are animated, and those happen in place.
	 */
	import { onMount } from 'svelte';

	type Mode =
		| 'default'
		| 'link'
		| 'text'
		| 'drag'
		| 'dragging'
		| 'expand'
		| 'collapse'
		| 'disabled'
		| 'label';

	const CLICKABLE =
		'a, button, [role="button"], select, label, summary, [tabindex]:not([tabindex="-1"])';
	const TEXT_ENTRY =
		'textarea, [contenteditable], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])';

	const MODES = new Set<Mode>([
		'default',
		'link',
		'text',
		'drag',
		'dragging',
		'expand',
		'collapse',
		'disabled',
		'label'
	]);

	let enabled = $state(false);
	let mode = $state<Mode>('default');
	let label = $state('');
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
		mode = 'default';
		label = '';
	}

	function resolve(target: Element | null): { mode: Mode; label: string } {
		if (!target?.closest) return { mode: 'default', label: '' };

		const tip = target.closest('[data-tooltip]')?.getAttribute('data-tooltip');
		if (tip) return { mode: 'label', label: tip };

		/* An explicit declaration beats everything inferred — that is the whole
		   point of it. Anything unrecognised falls through to the inference
		   below rather than blanking the cursor. */
		const declared = target.closest('[data-cursor]')?.getAttribute('data-cursor');
		if (declared && MODES.has(declared as Mode)) {
			/* A disclosure declares `expand` once and the open state is read off
			   the <details> it lives in, so the FAQ markup never has to track
			   which glyph the cursor should be showing. */
			if (declared === 'expand' && target.closest('details[open]')) {
				return { mode: 'collapse', label: '' };
			}
			return { mode: declared as Mode, label: '' };
		}

		const control = target.closest('button, input, select, textarea, a');
		if (control && 'disabled' in control && (control as HTMLButtonElement).disabled) {
			return { mode: 'disabled', label: '' };
		}

		if (target.closest(TEXT_ENTRY)) return { mode: 'text', label: '' };
		if (target.closest(CLICKABLE)) return { mode: 'link', label: '' };
		return { mode: 'default', label: '' };
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		x = event.clientX;
		y = event.clientY;
		visible = true;
		const next = resolve(event.target as Element | null);
		if (next.mode !== mode) mode = next.mode;
		if (next.label !== label) label = next.label;
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
	<div bind:this={root} class="cursor cursor--{mode}" class:cursor--on={visible} aria-hidden="true">
		<!-- Tip at (0,0), which is where the pointer actually is. -->
		<svg class="cursor__arrow" width="17" height="17" viewBox="0 0 17 17" fill="none">
			<path
				d="M0.6 0.6 L15.4 6.3 L8.7 8.7 L6.3 15.4 Z"
				fill="var(--color-fg-forest)"
				stroke="var(--color-bg-sand)"
				stroke-width="1.1"
				stroke-linejoin="round"
			/>
		</svg>
		<span class="cursor__ring"></span>
		<span class="cursor__caret"></span>
		<svg class="cursor__pan" width="34" height="14" viewBox="0 0 34 14" fill="none">
			<path
				d="M6 3 L2 7 L6 11 M28 3 L32 7 L28 11 M4 7 H30"
				stroke="var(--color-bg-sand)"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span class="cursor__toggle">
			<span class="cursor__toggle-bar"></span>
			<span class="cursor__toggle-bar cursor__toggle-bar--v"></span>
		</span>
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

	/* Every shape shares one origin — the pointer's own position — and one
	   transition. Only which of them is visible changes.

	   max-width: none is load-bearing. The wrapper has no size of its own (every
	   child is absolute), and app.css's reset caps svg and img at max-width:
	   100% — which against a zero-width containing block is zero. The arrowhead
	   computed to 0x0 and the two-headed arrow to 10px until this was here. */
	.cursor__arrow,
	.cursor__ring,
	.cursor__caret,
	.cursor__pan,
	.cursor__toggle,
	.cursor__card {
		position: absolute;
		top: 0;
		left: 0;
		max-width: none;
		opacity: 0;
		transition:
			transform 220ms var(--ease-arrow),
			opacity 140ms var(--ease-out);
	}

	/* ─── The arrowhead ─── */
	.cursor__arrow {
		display: block;
		width: 17px;
		height: 17px;
		transform-origin: 0 0;
		transform: scale(1);
		opacity: 1;
	}

	.cursor--text .cursor__arrow,
	.cursor--drag .cursor__arrow,
	.cursor--dragging .cursor__arrow,
	.cursor--expand .cursor__arrow,
	.cursor--collapse .cursor__arrow,
	.cursor--label .cursor__arrow {
		transform: scale(0.3);
		opacity: 0;
	}

	/* Tucked inside the ring rather than hidden by it, so a link still shows
	   which way the pointer is facing. */
	.cursor--link .cursor__arrow {
		transform: scale(0.72);
	}

	.cursor--disabled .cursor__arrow {
		opacity: 0.4;
	}

	/* ─── The ring, for anything clickable ─── */
	.cursor__ring {
		width: 30px;
		height: 30px;
		margin: -15px 0 0 -15px;
		border-radius: 50%;
		box-shadow:
			inset 0 0 0 1px var(--color-fg-forest),
			0 0 0 1px var(--color-bg-sand);
		transform: scale(0.3);
	}

	.cursor--link .cursor__ring {
		transform: scale(1);
		opacity: 1;
	}

	/* ─── The caret, for text entry ─── */
	.cursor__caret {
		width: 2px;
		height: 22px;
		margin: -11px 0 0 -1px;
		border-radius: 1px;
		background: var(--color-fg-forest);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-bg-sand) 70%, transparent);
		transform: scaleY(0.3);
	}

	.cursor--text .cursor__caret {
		transform: scaleY(1);
		opacity: 1;
	}

	/* ─── The two-headed arrow, for a surface you can drag ─── */
	.cursor__pan {
		display: block;
		width: 44px;
		height: 24px;
		margin: -12px 0 0 -22px;
		padding: 5px;
		border-radius: var(--radius-full);
		background: var(--color-fg-forest);
		transform: scale(0.4);
	}

	.cursor--drag .cursor__pan,
	.cursor--dragging .cursor__pan {
		transform: scale(1);
		opacity: 1;
	}

	/* Held, it squeezes along its own axis — the same gesture the fan is making. */
	.cursor--dragging .cursor__pan {
		transform: scale(0.86, 0.94);
	}

	/* ─── The circled +, for a disclosure ─── */
	.cursor__toggle {
		display: block;
		width: 32px;
		height: 32px;
		margin: -16px 0 0 -16px;
		border-radius: 50%;
		background: var(--color-fg-forest);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-bg-sand) 55%, transparent);
		transform: scale(0.3);
	}

	.cursor--expand .cursor__toggle,
	.cursor--collapse .cursor__toggle {
		transform: scale(1);
		opacity: 1;
	}

	.cursor__toggle-bar {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 12px;
		height: 1.5px;
		margin: -0.75px 0 0 -6px;
		border-radius: 1px;
		background: var(--color-bg-sand);
		transition: transform 260ms var(--ease-arrow);
	}

	.cursor__toggle-bar--v {
		transform: rotate(90deg);
	}

	/* Open, the + turns into a × rather than losing a stroke — the same shape
	   carrying both states is what makes it read as one control. */
	.cursor--collapse .cursor__toggle-bar {
		transform: rotate(45deg);
	}

	.cursor--collapse .cursor__toggle-bar--v {
		transform: rotate(135deg);
	}

	/* ─── The label card ─── */
	.cursor__card {
		display: block;
		padding: 0.375rem 0.625rem;
		/* Square where the tip was, rounded everywhere else. */
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
	}

	.cursor--label .cursor__card {
		transform: scale(1);
		opacity: 1;
	}
</style>
