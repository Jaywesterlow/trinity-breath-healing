<script lang="ts">
	/**
	 * The site's cursor.
	 *
	 * An arrowhead follows the pointer everywhere, and changes shape to say what
	 * the thing under it does:
	 *
	 *   default   the arrowhead alone
	 *   link      the arrowhead becomes a small filled dot, and a faint ring
	 *             fades in around it a beat later. The dot carries the same sand
	 *             outline the arrowhead's stroke gives it, so it stays findable
	 *             on the green grounds; the ring stays one colour and quiet.
	 *   toggle    a filled circle with a +, on an FAQ row. Clicking turns it 45°
	 *             into a ×, the way the menu button turns. Moving to a row in
	 *             the other state takes the SHORT way round instead, so an ×
	 *             unwinds counter-clockwise into a + rather than snapping.
	 *   text      a caret bar, because a form field needs to show where the next
	 *             character lands and an arrow cannot
	 *   disabled  the arrowhead, dimmed, over a control that will not respond
	 *   label     a card carrying `data-tooltip` text. Its top-left corner is a
	 *             hard point where every other corner is rounded, and it grows
	 *             out of that corner, so the corner reads as the pointer itself
	 *             rather than needing a second marker beside it.
	 *
	 * Any click, in any mode, sends a ring out from the pointer and fades it —
	 * the click's own acknowledgement, independent of whatever the page does
	 * with it.
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

	type Mode = 'default' | 'link' | 'toggle' | 'text' | 'disabled' | 'label';
	type Icon = '' | 'zoom' | 'page';

	const CLICKABLE =
		'a, button, [role="button"], select, label, summary, [tabindex]:not([tabindex="-1"])';
	const TEXT_ENTRY =
		'textarea, [contenteditable], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])';

	const MODES = new Set<Mode>(['default', 'link', 'toggle', 'text', 'disabled', 'label']);

	let enabled = $state(false);
	let mode = $state<Mode>('default');
	let label = $state('');
	/** Optional glyph in front of the label — see `data-tooltip-icon`. */
	let icon = $state<'' | 'zoom' | 'page'>('');
	let visible = $state(false);
	let root: HTMLDivElement | null = $state(null);

	/* The disclosure glyph in eighths of a turn: even = +, odd = ×. Clicking a
	   row adds one, always clockwise, the way the menu button turns. Moving to a
	   row in the other state takes the SHORT way instead — one step back, so an
	   × unwinds counter-clockwise into a + rather than jumping. Interaction goes
	   forward; re-aiming takes whichever way is nearer. */
	let turns = $state(0);
	let toggleHost: Element | null = null;

	/* Held down. The whole cursor shrinks a little while a button is pressed and
	   comes back on release — the same thing a physical button does. */
	let pressed = $state(false);
	let ringEl: HTMLSpanElement | null = $state(null);
	let cardEl: HTMLSpanElement | null = $state(null);

	/**
	 * Rounds the card up to a whole pixel.
	 *
	 * Its hairline is one CSS pixel on every edge, but an edge only renders as one
	 * DEVICE pixel when it lands on a whole one. The card's natural size is set by
	 * a 13px string and 8px of padding, i.e. fractional in both directions, so the
	 * top and left edges (which start at the pointer, an integer) came out crisp
	 * and the right and bottom ones were spread across two rows and read heavier.
	 * The height is fixed in the stylesheet; the width depends on the label, so it
	 * is measured here, once, whenever the label changes.
	 */
	$effect(() => {
		void label;
		const el = cardEl;
		if (!el) return;
		el.style.width = '';
		if (mode !== 'label') return;
		const frame = requestAnimationFrame(() => {
			/* offsetWidth, not getBoundingClientRect: the card is mid-transition from
			   scale(0.2) when this runs, and the rect is the SCALED width — pinning that
			   left the label clipped to a fifth of itself. offsetWidth is layout, so a
			   transform cannot reach it. +1 because it rounds to nearest and rounding
			   down would shave the last glyph's edge. */
			if (cardEl) cardEl.style.width = `${cardEl.offsetWidth + 1}px`;
		});
		return () => cancelAnimationFrame(frame);
	});

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
		pressed = false;
		mode = 'default';
		label = '';
		icon = '';
		toggleHost = null;
	}

	/** Turn the glyph to match the row now under the pointer, the short way. */
	function rebaseToggle(host: Element) {
		toggleHost = host;
		const open = !!host.closest('details[open]');
		/* Already the right shape — an × over an open row, a + over a closed one —
		   so leave the rotation exactly where it is. Only a parity mismatch is
		   worth a turn, and that is always one step: back one when the glyph is
		   ahead of the row, forward one when it is behind. */
		if (turns % 2 === (open ? 1 : 0)) return;
		turns += open ? 1 : -1;
	}

	function onPress(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		pressed = true;
		/* Only the link shape pulses, and it is the ring itself doing it rather
		   than a second element flying out of the pointer: it swells away to
		   nothing and comes back at the size it started. Over a tooltip there is
		   no ring to swell, and over a form field or a disclosure the shape is
		   already saying something of its own. */
		if (mode !== 'link' || !ringEl) return;
		ringEl.animate(
			[
				{ transform: 'scale(1)', opacity: 1, offset: 0 },
				/* Draws in against the dot first. A ring that only ever expands reads as
				   something leaving; the small gather before it goes is what makes it read
				   as a press being answered. */
				{ transform: 'scale(0.72)', opacity: 1, offset: 0.22 },
				{ transform: 'scale(2.2)', opacity: 0, offset: 0.72 },
				{ transform: 'scale(1)', opacity: 0, offset: 0.74 },
				{ transform: 'scale(1)', opacity: 1, offset: 1 }
			],
			{ duration: 680, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
		);
	}

	function onRelease() {
		pressed = false;
	}

	function onToggleClick(event: MouseEvent) {
		const host = (event.target as Element | null)?.closest?.('[data-cursor="toggle"]');
		if (host) turns += 1;
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

		/* Whichever host is DEEPER wins. A `data-cursor` on a whole section must
		   not override the shape a button inside it asks for, and a `data-cursor`
		   on a control must not be overridden by the
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

		if (
			hasDeclared &&
			(!inferredHost || declaredHost === inferredHost || !declaredHost!.contains(inferredHost))
		) {
			if (declared === 'toggle' && declaredHost !== toggleHost) rebaseToggle(declaredHost!);
			return { mode: declared as Mode, label: '', icon: '' };
		}
		if (toggleHost && !declaredHost) toggleHost = null;

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
		window.addEventListener('pointerdown', onPress, { passive: true, capture: true });
		window.addEventListener('pointerup', onRelease, { passive: true, capture: true });
		window.addEventListener('pointercancel', onRelease, { passive: true, capture: true });
		window.addEventListener('click', onToggleClick, true);
		/* Leaving the document, tabbing away, or switching to another tab all end
		   with the pointer somewhere this page will never hear about again. */
		document.addEventListener('pointerleave', clear);
		window.addEventListener('blur', clear);
		document.addEventListener('visibilitychange', clear);

		return () => {
			if (frame) cancelAnimationFrame(frame);
			document.documentElement.classList.remove('has-cursor-tooltip');
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerdown', onPress, true);
			window.removeEventListener('pointerup', onRelease, true);
			window.removeEventListener('pointercancel', onRelease, true);
			window.removeEventListener('click', onToggleClick, true);
			document.removeEventListener('pointerleave', clear);
			window.removeEventListener('blur', clear);
			document.removeEventListener('visibilitychange', clear);
		};
	});
</script>

{#if enabled}
	<div bind:this={root} class="cursor cursor--{mode}" class:cursor--on={visible} aria-hidden="true">
		<!-- One group holds every shape, so the press shrink is a single transform on
		     a single node rather than a scale applied to each shape separately (which
		     would fight each shape's own transform). It sits at the wrapper's origin
		     and has no size of its own. -->
		<span class="cursor__scale" class:cursor__scale--pressed={pressed}>
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
			<span class="cursor__dot"></span>
			<span bind:this={ringEl} class="cursor__ring"></span>
			<span class="cursor__caret"></span>
			<!-- Turns one way only, like the menu button: + at 0deg, x at 45deg. -->
			<span class="cursor__toggle" style="--turn: {turns * 45}deg">
				<span class="cursor__bar"></span>
				<span class="cursor__bar cursor__bar--v"></span>
			</span>
			<span bind:this={cardEl} class="cursor__card">
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
				<span class="cursor__card-text">{label}</span>
			</span>
		</span>
	</div>
{/if}

<style>
	/* The wrapper is the only thing that tracks. Its children never move
	   relative to it, so a frame costs one transform write on one node. */
	.cursor {
		/* The cream the arrowhead is stroked in. Everything that needs an edge on
		   this site's two grounds uses it: forest on --color-brand-green is 1.9:1,
		   so an unstroked shape disappears on half the page. */
		--cursor-hairline: color-mix(in srgb, var(--color-bg-sand) 88%, var(--color-fg-forest));

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

	/* No size of its own, so it does not disturb the shapes it holds — they are
	   all absolutely positioned and resolve against this box's origin, which is
	   the wrapper's origin, which is the pointer. */
	.cursor__scale {
		position: absolute;
		top: 0;
		left: 0;
		transform: scale(1);
		transform-origin: 0 0;
		transition: transform 130ms var(--ease-out);
	}

	.cursor__scale--pressed {
		transform: scale(0.86);
	}

	/* Every shape shares one origin — the pointer's own position — and one
	   transition. Only which of them is visible changes.

	   max-width: none is load-bearing. The wrapper has no size of its own (every
	   child is absolute), and app.css's reset caps svg and img at max-width:
	   100% — which against a zero-width containing block is zero. The arrowhead
	   computed to 0x0 until this was here. */
	.cursor__arrow,
	.cursor__dot,
	.cursor__ring,
	.cursor__caret,
	.cursor__toggle,
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
	.cursor--toggle .cursor__arrow,
	.cursor--text .cursor__arrow,
	.cursor--label .cursor__arrow {
		transform: scale(0.35);
		opacity: 0;
	}

	.cursor--disabled .cursor__arrow {
		opacity: 0.4;
	}

	/* ─── The dot and its ring, for anything clickable ───
	   The arrowhead collapses into a small filled dot, and a ring fades in
	   around it slightly after — so the shape settles first and the ring arrives
	   as a hint rather than as a second object appearing at the same instant.

	   The ring is one colour at low opacity. It used to be an inset forest edge
	   plus an outer sand edge, which is two rings of two colours pretending to
	   be one, and it read heavy against every ground on the site. */
	.cursor__dot {
		width: 9px;
		height: 9px;
		margin: -4.5px 0 0 -4.5px;
		border-radius: 50%;
		background: var(--color-fg-forest);
		/* The arrowhead's sand stroke, as a ring. Forest on --color-brand-green is
		   1.9:1 — on the contact cards and the filled Werkwijze cards the bare dot
		   all but disappeared, exactly where a lot of the clickable things are. */
		box-shadow: 0 0 0 1.4px var(--cursor-hairline);
		transform: scale(0.4);
	}

	.cursor--link .cursor__dot {
		transform: scale(1);
		opacity: 1;
	}

	.cursor__ring {
		width: 22px;
		height: 22px;
		margin: -11px 0 0 -11px;
		border-radius: 50%;
		border: 1px solid color-mix(in srgb, var(--color-fg-forest) 38%, transparent);
		/* A single faint sand halo on the outside — enough to separate the ring
		   from a green ground, not enough to read as a second ring. */
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-bg-sand) 32%, transparent);
		transform: scale(0.55);
	}

	.cursor--link .cursor__ring {
		transform: scale(1);
		opacity: 1;
		/* Behind the dot by a beat, and slower on the way in than the dot is. */
		transition-delay: 70ms;
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

	/* ─── The disclosure glyph, on an FAQ row ───
	   A filled circle with a +, turning 45deg into a × on click the way the menu
	   button turns. Slower than every other shape here on purpose: it is the one
	   the visitor is meant to watch, because it is telling them what their click
	   just did. */
	.cursor__toggle {
		transition:
			transform var(--motion-toggle) var(--ease-arrow),
			opacity 200ms var(--ease-out);
		width: 32px;
		height: 32px;
		margin: -16px 0 0 -16px;
		border-radius: 50%;
		background: var(--color-fg-forest);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-bg-sand) 55%, transparent);
		transform: scale(0.35) rotate(var(--turn, 0deg));
	}

	.cursor--toggle .cursor__toggle {
		transform: scale(1) rotate(var(--turn, 0deg));
		opacity: 1;
	}

	.cursor__bar {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 13px;
		height: 1.5px;
		margin: -0.75px 0 0 -6.5px;
		border-radius: 1px;
		background: var(--color-bg-sand);
	}

	.cursor__bar--v {
		transform: rotate(90deg);
	}

	/* ─── The label card ───
	   Its top-left corner is the pointer. Every other corner is rounded and that
	   one is not, so the sharp point is where the tip was — no dot beside it, no
	   circle carved out of it, nothing added to the card at all. That was the
	   whole problem with the earlier versions: each of them answered "where is
	   the cursor" by putting another object on screen next to the answer.

	   It grows out of that corner (transform-origin: 0 0, scale 0.14 to 1) and
	   takes noticeably longer than the other shapes to do it. The card is the one
	   shape big enough that the reader can watch it arrive, and watching it come
	   out of a single point is what says which point that is. */
	.cursor__card {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--cursor-hairline);
		border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm);
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-light);
		/* A whole number, not 1.2 — see the width rounding in the script. 13 x 1.2 is
		   15.6px, which put the card's bottom edge on a fractional device pixel and
		   spread its hairline across two rows while the top edge stayed crisp. */
		line-height: 16px;
		white-space: nowrap;
		transform-origin: 0 0;
		transform: scale(0.14);
		/* Its own curve, not --ease-out. That one is cubic-bezier(0.16, 1, 0.3, 1),
		   which is nearly finished in the first fifth of its duration — the card
		   snapped to full size and then crept, so there was nothing to watch and
		   no way to see which corner it had come from. This one accelerates and
		   decelerates evenly, so the whole 300ms is spent growing. */
		transition:
			transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
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
