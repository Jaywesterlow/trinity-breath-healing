<script lang="ts">
	/**
	 * The site's cursor.
	 *
	 * An arrowhead follows the pointer everywhere, and changes shape to say what
	 * the thing under it does:
	 *
	 *   default   the arrowhead alone
	 *   breathe   the arrowhead, with a ring expanding and contracting around it
	 *             at 4s in / 6s out — the hero, and only the hero
	 *   link      a hand — the one shape everybody already reads as "click here".
	 *             An arrow inside a ring is a nice effect and says nothing.
	 *   zoom      a magnifier with a + in it, on something that opens in place
	 *             rather than navigating (a treatment card's modal)
	 *   text      a caret bar, because a form field needs to show where the next
	 *             character lands and an arrow cannot
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

	type Mode = 'default' | 'breathe' | 'link' | 'zoom' | 'text' | 'disabled' | 'label';
	type Icon = '' | 'zoom' | 'page';

	const CLICKABLE =
		'a, button, [role="button"], select, label, summary, [tabindex]:not([tabindex="-1"])';
	const TEXT_ENTRY =
		'textarea, [contenteditable], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])';

	const MODES = new Set<Mode>(['default', 'breathe', 'link', 'zoom', 'text', 'disabled', 'label']);

	let enabled = $state(false);
	let mode = $state<Mode>('default');
	let label = $state('');
	/** Optional glyph in front of the label — see `data-tooltip-icon`. */
	let icon = $state<'' | 'zoom' | 'page'>('');
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
		icon = '';
	}

	function resolve(target: Element | null): { mode: Mode; label: string; icon: Icon } {
		if (!target?.closest) return { mode: 'default', label: '', icon: '' };

		const tipHost = target.closest('[data-tooltip]');
		const tip = tipHost?.getAttribute('data-tooltip');
		if (tip) {
			const declaredIcon = tipHost?.getAttribute('data-tooltip-icon');
			return {
				mode: 'label',
				label: tip,
				icon: declaredIcon === 'zoom' || declaredIcon === 'page' ? declaredIcon : ''
			};
		}

		/* Whichever host is DEEPER wins. A `data-cursor` on a whole section (the
		   hero's breathing ring) must not override the hand on a button inside
		   it, and a `data-cursor` on a control must not be overridden by the
		   generic clickable inference around it. Comparing containment says
		   which is which without either rule having to know about the other. */
		const declaredHost = target.closest('[data-cursor]');
		const declared = declaredHost?.getAttribute('data-cursor');
		const hasDeclared = !!declared && MODES.has(declared as Mode);

		const control = target.closest('button, input, select, textarea, a');
		const disabled = control && 'disabled' in control && (control as HTMLButtonElement).disabled;
		const inferredHost = disabled
			? control
			: (target.closest(TEXT_ENTRY) ?? target.closest(CLICKABLE));
		const inferredMode: Mode | null = disabled
			? 'disabled'
			: target.closest(TEXT_ENTRY)
				? 'text'
				: target.closest(CLICKABLE)
					? 'link'
					: null;

		if (hasDeclared && inferredHost) {
			const declaredIsOuter = declaredHost !== inferredHost && declaredHost!.contains(inferredHost);
			if (!declaredIsOuter) return { mode: declared as Mode, label: '', icon: '' };
		} else if (hasDeclared) {
			return { mode: declared as Mode, label: '', icon: '' };
		}

		if (inferredMode) return { mode: inferredMode, label: '', icon: '' };
		return { mode: 'default', label: '', icon: '' };
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		x = event.clientX;
		y = event.clientY;
		visible = true;
		const next = resolve(event.target as Element | null);
		if (next.mode !== mode) mode = next.mode;
		if (next.label !== label) label = next.label;
		if (next.icon !== icon) icon = next.icon;
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
		<!-- The pointing hand, drawn so its fingertip lands on (0,0) too — the
		     shape swaps under the pointer without the hotspot moving. -->
		<svg class="cursor__hand" width="22" height="26" viewBox="0 0 22 26" fill="none">
			<path
				d="M8.7 13.2V4.5a1.75 1.75 0 0 1 3.5 0v5.1a1.6 1.6 0 0 1 3.2 0v1.1a1.6 1.6 0 0 1 3.2 0v5.6c0 3.8-2.4 6.7-6.3 6.7-3.4 0-4.9-1.5-6.4-4.1l-2.1-3.7a1.7 1.7 0 0 1 2.7-2z"
				fill="var(--color-fg-forest)"
				stroke="var(--color-bg-sand)"
				stroke-width="1.3"
				stroke-linejoin="round"
			/>
			<path
				d="M12.2 13.4v-3.8M15.4 13.4v-2.6"
				stroke="var(--color-bg-sand)"
				stroke-width="1.1"
				stroke-linecap="round"
				opacity="0.75"
			/>
		</svg>
		<span class="cursor__breath"></span>
		<span class="cursor__caret"></span>
		<!-- Opens in place rather than navigating, so: a magnifier, not a hand. -->
		<svg class="cursor__zoom" width="30" height="30" viewBox="0 0 30 30" fill="none">
			<circle cx="13" cy="13" r="8.4" fill="var(--color-fg-forest)" />
			<circle
				cx="13"
				cy="13"
				r="8.4"
				stroke="var(--color-bg-sand)"
				stroke-width="1.4"
				opacity="0.55"
			/>
			<path
				d="M13 9.6v6.8M9.6 13h6.8"
				stroke="var(--color-bg-sand)"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
			<path
				d="M19.2 19.2 25 25"
				stroke="var(--color-fg-forest)"
				stroke-width="3.4"
				stroke-linecap="round"
			/>
			<path
				d="M19.2 19.2 25 25"
				stroke="var(--color-bg-sand)"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</svg>
		<span class="cursor__card">
			{#if icon === 'zoom'}
				<!-- Opens in place. The magnifier says that before the words do. -->
				<svg class="cursor__card-icon" width="13" height="13" viewBox="0 0 14 14" fill="none">
					<circle cx="5.8" cy="5.8" r="4.2" stroke="currentColor" stroke-width="1.4" />
					<path
						d="M5.8 4v3.6M4 5.8h3.6M9 9l3.4 3.4"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
					/>
				</svg>
			{:else if icon === 'page'}
				<!-- Leaves for another page. The same up-right arrow the CTA
				     buttons use, so the two say the same thing. -->
				<svg class="cursor__card-icon" width="13" height="13" viewBox="0 0 14 14" fill="none">
					<path
						d="M3 11L11 3M11 3H6M11 3V8"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
			{label}
		</span>
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
	   computed to 0x0 until this was here. */
	.cursor__arrow,
	.cursor__hand,
	.cursor__breath,
	.cursor__caret,
	.cursor__zoom,
	.cursor__card {
		position: absolute;
		top: 0;
		left: 0;
		max-width: none;
		opacity: 0;
		transition:
			transform 200ms var(--ease-arrow),
			opacity 130ms var(--ease-out);
	}

	/* ─── The arrowhead, which is the cursor at rest ─── */
	.cursor__arrow {
		display: block;
		width: 17px;
		height: 17px;
		transform-origin: 0 0;
		transform: scale(1);
		opacity: 1;
	}

	.cursor--link .cursor__arrow,
	.cursor--zoom .cursor__arrow,
	.cursor--text .cursor__arrow,
	.cursor--label .cursor__arrow {
		transform: scale(0.35);
		opacity: 0;
	}

	.cursor--disabled .cursor__arrow {
		opacity: 0.4;
	}

	/* ─── The hand, for anything clickable ───
	   A ring around the arrowhead looked good and meant nothing. This is the one
	   shape a visitor already knows, and it is the shape the native cursor would
	   have shown them if it were still there. */
	.cursor__hand {
		display: block;
		width: 22px;
		height: 26px;
		/* The fingertip sits at roughly (10.4, 2.8) in the glyph's own box, so
		   the whole thing shifts up and left by that much to put it exactly on
		   the pointer — the hotspot must not jump when the shape swaps. */
		margin: -3px 0 0 -10px;
		transform-origin: 10px 3px;
		transform: scale(0.4);
	}

	.cursor--link .cursor__hand {
		transform: scale(1);
		opacity: 1;
	}

	/* ─── The breathing ring, in the hero ───
	   Not a replacement for the arrowhead — it sits around it. The site teaches
	   a longer exhale than inhale, so the ring does the same: it expands over
	   4 of the 10 seconds and releases over the other 6, with a beat of stillness
	   at the top. Reduced motion never reaches this: the whole cursor is off by
	   then and the native one is back. */
	.cursor__breath {
		width: 44px;
		height: 44px;
		margin: -22px 0 0 -22px;
		border-radius: 50%;
		border: 1px solid color-mix(in srgb, currentcolor 34%, transparent);
		color: var(--color-fg-forest);
		transform: scale(0.55);
	}

	.cursor--breathe .cursor__breath {
		opacity: 1;
		animation: cursor-breathe 10s cubic-bezier(0.45, 0, 0.55, 1) infinite;
	}

	@keyframes cursor-breathe {
		0% {
			transform: scale(0.62);
			opacity: 0.45;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
		52% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.62);
			opacity: 0.45;
		}
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

	/* ─── The magnifier, for something that opens in place ─── */
	.cursor__zoom {
		display: block;
		width: 30px;
		height: 30px;
		margin: -13px 0 0 -13px;
		transform-origin: 13px 13px;
		transform: scale(0.4);
	}

	.cursor--zoom .cursor__zoom {
		transform: scale(1);
		opacity: 1;
	}

	/* ─── The label card ─── */
	.cursor__card {
		display: flex;
		align-items: center;
		gap: 0.375rem;
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

	.cursor__card-icon {
		flex: none;
		max-width: none;
		opacity: 0.85;
	}
</style>
