/**
 * `use:reveal` — below-the-fold scroll reveal.
 *
 * Companion to the hero's pure-CSS cascade (`Hero.svelte`), but the opposite mechanism on
 * purpose: below the fold, arming the hidden state has to happen from JavaScript, because the
 * element hasn't painted yet when the action runs. See the root `HANDOFF.md`, "Above the fold
 * vs below it", for the full reasoning. Never give the hero an entrance from here — it
 * already has its own. Its text column does use this action, but in `entrance: false` mode:
 * exit fade only, nothing on the way in.
 *
 * Contract, in order:
 *   1. Under `prefers-reduced-motion: reduce`, bail before touching any style. No inline
 *      styles are ever set.
 *   2. If the element is already in the viewport when the action runs (hydration happens
 *      after the prerendered HTML has painted), bail without arming — arming something the
 *      user can already see would flash it.
 *   3. Otherwise arm synchronously, in the action body: hidden opacity + a small upward
 *      offset, set before the next paint.
 *   4. Release on `load` (next frame) or on first intersection for `view` (the default).
 *   5. Releasing plays the fade/rise, then strips the `transform` once it finishes. A
 *      leftover `transform` makes the element a containing block for any `position:
 *      fixed`/`sticky` descendant, which would silently break that positioning elsewhere
 *      on the page. Backed by a timeout, since a never-painted element never fires a
 *      finish event.
 *   6. From then on the observer STAYS, and opacity follows the viewport in both
 *      directions: the element fades out as it leaves and fades back in when it returns.
 *      Only opacity — the rise is a one-time entrance, and re-animating `transform` would
 *      reintroduce the compositing-layer problem described below.
 *
 * The band is inset from the real viewport (see BAND_TOP / BAND_BOTTOM), so the fade starts
 * while the element is still on screen rather than at the instant it clips. That is the whole
 * point of it: something sliding off the top edge at full opacity reads as the page cutting
 * it off, and the same element easing out reads as the page moving on.
 *
 * The two halves are separable. `entrance: false` is exit-only (the hero's text column);
 * `exit: false` is entrance-only, for something whose exit is owned one level up (the
 * Werkwijze cards, which fade as whole cards in a staggered row).
 *
 * Implementation notes:
 *
 * Web Animations API, not a CSS `transition`. An earlier version drove the release with
 * `node.style.transition = '...'`. On a plain element that's harmless, but applied to
 * `Faq.svelte`'s `<details class="faq__item">` — which already owns a CSS transition on
 * `grid-template-rows` for its own open/close disclosure — it silently broke that
 * disclosure's close animation. `transition` is a single CSS property, not additive: setting
 * it here replaces the stylesheet's declaration for the whole element, not just for
 * opacity/transform. `element.animate()` never reads or writes the `transition` property, so
 * it can't collide with a transition the element's own stylesheet declares for something else.
 *
 * `distance: 0` skips the rise animation entirely, rather than animating a 0px offset.
 * Animating `transform` — even to a no-op value, even via Web Animations rather than a CSS
 * transition — promotes the element onto its own compositing layer for the animation's
 * duration. Empirically, on `.faq__item` (a `display: grid` element whose *own*
 * `grid-template-rows` disclosure transition requires layout, not just compositing), that
 * promotion left the element unable to run its close transition correctly afterwards — even
 * long after this action's own cleanup had fully removed every inline style it set. This
 * reproduced with a single isolated element and was independent of the CSS-transition-merge
 * approach above, so it isn't specific to that mechanism; it's specific to animating
 * `transform` on this element at all. `distance: 0` is used for exactly that case: the fade
 * still plays, opacity is untouched by this bug, and the rise — which would be invisible at
 * 0px anyway — is skipped rather than merely made imperceptible.
 *
 * No SSR guard needed: Svelte actions never run on the server. Just don't touch `window` at
 * module scope.
 */

export type RevealOptions = {
	/** Delay before the release transition starts, in ms. */
	delay?: number;
	/** Duration of the opacity fade, in ms. */
	duration?: number;
	/** Upward rise distance, in px. 0 skips the rise animation entirely (see note above). */
	distance?: number;
	/** 'load' releases on the next frame; 'view' releases on first scroll-into-view. */
	trigger?: 'load' | 'view';
	/**
	 * false = no entrance at all. The element is never armed, never rises and never fades
	 * in on first sight; it starts exactly as rendered and only ever answers the exit fade
	 * below. This is the mode the hero's text column uses — its entrance is the pure-CSS
	 * cascade in Hero.svelte, and all it wants from here is the way out.
	 */
	entrance?: boolean;
	/**
	 * false = entrance only. The element fades in once and then stops answering the
	 * viewport. Used where something outside this element owns the exit — a card that
	 * fades as a whole, say, whose inner lines must not fade a second time inside it.
	 */
	exit?: boolean;
};

const DEFAULTS: Required<RevealOptions> = {
	delay: 0,
	duration: 1300,
	distance: 10,
	trigger: 'view',
	entrance: true,
	exit: true
};

const FADE_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const RISE_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const RISE_DURATION = 1100;

/* THE RULE, and it is the same for every revealed element on the site — one band, no
   per-element exceptions, because content fading at slightly different scroll positions is
   what makes the whole effect read as a bug rather than as a decision.

   Two horizontal lines are drawn across the viewport and never move:

     the fade-in line    BAND_BOTTOM of the viewport height ABOVE the bottom edge
     the fade-out line   BAND_TOP of the viewport height BELOW the top edge

   An element fades IN when its TOP crosses the fade-in line, and fades OUT when its BOTTOM
   crosses the fade-out line. Top on the way in and bottom on the way out is the part that
   matters: measure from an element's middle and a 500px block starts fading 250px into the
   screen while a 100px block starts 50px in, so nothing ever lines up. Measure from the
   leading edge in each direction and a heading, a card and a whole form all begin at the
   same instant regardless of how tall they are.

   This is precisely what one IntersectionObserver with threshold 0 and a negative
   rootMargin computes, which is why it is an observer and not a scroll handler: the root
   rect is inset to [BAND_TOP, viewportHeight - BAND_BOTTOM], intersection begins when
   `rect.top < viewportHeight - BAND_BOTTOM` and ends when `rect.bottom <= BAND_TOP`. The
   two conditions ARE the two rules above. Do not add a threshold, a per-element margin or
   a scroll listener on top of it — each of those reintroduces the drift this replaced.

   Percentages rather than pixels so the band means the same thing on a 844px phone as on a
   1080px laptop; the site is mobile-first and these were tuned there. 34% starts the exit
   in the upper third, so leaving reads as the page moving on rather than as a snap. 18%
   (~150px on a phone) holds the entrance until the element is properly on screen — at the
   flat 80px this used to be, most of a heading was already showing before it began. */
const BAND_TOP = 0.34;
const BAND_BOTTOM = 0.18;

/** The band as a rootMargin string. Exported so observers outside this action arrive on the
 *  same two lines — Werkwijze's staggered card row is the one that does. */
export const REVEAL_ROOT_MARGIN = `${-BAND_TOP * 100}% 0px ${-BAND_BOTTOM * 100}% 0px`;

/**
 * Some boxes are much bigger than what they draw. The treatments carousel is the one that
 * forced this: its track is tall enough to hold a rotated card at every fan position, so the
 * box's top edge is over a hundred pixels above anything the reader can see, and it was
 * fading in long before the cards arrived.
 *
 * `--reveal-inset-top` / `--reveal-inset-bottom`, in px on the element itself, say how far
 * inside the box the visible content actually starts and ends. This corrects the ELEMENT,
 * not the band: the two lines stay exactly where they are for everything on the page, and
 * what changes is which edge of this element is measured against them. Read from computed
 * style rather than passed as an option so the correction lives in CSS beside the geometry
 * it is correcting, and is re-read whenever the observer is rebuilt.
 */
function insetsOf(node: HTMLElement): { top: number; bottom: number } {
	const style = getComputedStyle(node);
	return {
		top: parseFloat(style.getPropertyValue('--reveal-inset-top')) || 0,
		bottom: parseFloat(style.getPropertyValue('--reveal-inset-bottom')) || 0
	};
}

/**
 * The rootMargin for one element.
 *
 * With no inset this is the shared percentage band, so a viewport resize needs no rebuild.
 * With one, the whole thing has to be resolved to px — an inset is a length and cannot be
 * added to a percentage inside rootMargin — and the element then depends on the rebuild that
 * the document-height watcher below triggers.
 *
 * Intersection begins when `rect.top < rootBottom` and ends when `rect.bottom <= rootTop`, so
 * pushing rootBottom UP by the top inset delays the entrance until the visible top has
 * crossed, and pushing rootTop DOWN by the bottom inset delays the exit until the visible
 * bottom has.
 */
function rootMarginFor(node: HTMLElement): string {
	const { top, bottom } = insetsOf(node);
	if (!top && !bottom) return REVEAL_ROOT_MARGIN;
	const vh = window.innerHeight;
	return `${-(vh * BAND_TOP + bottom)}px 0px ${-(vh * BAND_BOTTOM + top)}px 0px`;
}

/**
 * True when this element can never reach the fade-in line, however far the page is
 * scrolled — i.e. it sits inside the last screenful, below the line even at maximum
 * scroll. The footer's legal row (privacy statement, terms, copyright) is exactly that,
 * and it was invisible: armed at 0, waiting for a crossing that cannot happen.
 *
 * The answer is NOT to give those elements their own band — that is the inconsistency
 * this file exists to avoid. They get the band like everything else, plus the fallback
 * below, which reveals them when they enter the viewport at all. They also never fade out,
 * correctly: an element already at its highest possible position cannot rise past the
 * fade-out line either.
 */
function unreachable(node: HTMLElement): boolean {
	const vh = window.innerHeight;
	const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
	const highestTop = node.getBoundingClientRect().top + window.scrollY - maxScroll;
	return highestTop >= vh * (1 - BAND_BOTTOM);
}

/* One height watcher for the whole page rather than one per revealed element (there are
   ~50 of them). A document that grows or shrinks — a font swapping in, an image landing,
   the viewport rotating — moves every element's ceiling at once. */
const heightListeners = new Set<() => void>();
let heightWatcher: ResizeObserver | null = null;

/** For a component that has just measured and written its own --reveal-inset-*: the vars
 *  did not exist when the action first read them, so ask every band to be re-read. */
export function refreshRevealBands() {
	for (const listener of heightListeners) listener();
}

function watchDocumentHeight(fn: () => void) {
	heightListeners.add(fn);
	if (!heightWatcher && typeof ResizeObserver !== 'undefined') {
		heightWatcher = new ResizeObserver(() => {
			for (const listener of heightListeners) listener();
		});
		heightWatcher.observe(document.documentElement);
	}
	return () => {
		heightListeners.delete(fn);
		if (heightListeners.size === 0) {
			heightWatcher?.disconnect();
			heightWatcher = null;
		}
	};
}

/* Leaving is quicker than arriving. A slow fade-out on scroll feels like lag; a slow fade-in
   feels like the section settling. */
const EXIT_DURATION = 450;
const RETURN_DURATION = 600;

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	// matchMedia is guarded, not assumed. Svelte actions do not run during SSR, but they DO run
	// under component unit tests, and a bare jsdom environment has no matchMedia — an unguarded
	// call throws there and fails a test that has nothing to do with animation (it surfaced on
	// Footer's landmark test the moment this action was added to the footer).
	//
	// If the preference cannot be read, skip the animation rather than guess. The element is
	// left exactly as rendered, which is the same failure mode as every other bail here:
	// no animation, never no content.
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return;
	}
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	const { delay, duration, distance, trigger, entrance, exit } = { ...DEFAULTS, ...options };
	const hasRise = entrance && distance > 0;

	/* Already on screen when this runs (hydration happens after the prerendered HTML has
	   painted), so there is nothing to arm — showing it would only flash it. It still gets
	   the observer below, because it will leave the viewport eventually. */
	const rect = node.getBoundingClientRect();
	const armed = entrance && rect.top >= window.innerHeight;

	// Arm synchronously, before the next paint. Plain property writes — independent of
	// whatever the element's own `transition`/`animation` CSS is doing.
	if (armed) {
		node.style.opacity = '0';
		if (hasRise) {
			node.style.transform = `translate3d(0, ${distance}px, 0)`;
		}
	}

	let observer: IntersectionObserver | null = null;
	let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
	let releaseFrame: number | null = null;
	let fadeAnimation: Animation | null = null;
	let riseAnimation: Animation | null = null;
	let driftAnimation: Animation | null = null;
	let released = false;
	let shown = !armed;

	/** Ends the entrance: strips the transform, keeps opacity under our control. */
	function settle() {
		if (cleanupTimer !== null) {
			clearTimeout(cleanupTimer);
			cleanupTimer = null;
		}
		fadeAnimation?.removeEventListener('finish', settle);
		fadeAnimation?.cancel();
		riseAnimation?.cancel();
		fadeAnimation = null;
		riseAnimation = null;
		/* The transform has to go — while it is set, this element is a containing block for
		   any fixed or sticky descendant. Opacity stays: it is what the drift below animates,
		   and an inline `opacity: 1` costs nothing. */
		node.style.removeProperty('transform');
		node.style.removeProperty('will-change');
		node.style.opacity = '1';
	}

	/** The ongoing in/out fade, once the entrance is done. Opacity only. */
	function driftTo(value: number, duration: number) {
		if (shown === (value === 1)) return;
		shown = value === 1;
		driftAnimation?.cancel();
		const from = Number(
			node.style.opacity || getComputedStyle(node).opacity || (value === 1 ? 0 : 1)
		);
		driftAnimation = node.animate([{ opacity: from }, { opacity: value }], {
			duration,
			easing: FADE_EASING,
			fill: 'forwards'
		});
		driftAnimation.addEventListener('finish', () => {
			node.style.opacity = String(value);
			driftAnimation?.cancel();
			driftAnimation = null;
		});
	}

	function release() {
		if (released) return;
		released = true;
		shown = true;
		// Two independent Web Animations, not one — the fade and the rise want different
		// curves and durations (see Hero.svelte's cascade for the same reasoning). Neither
		// touches the CSS `transition` property, so this can never collide with a
		// transition the element's own stylesheet declares for something else.
		node.style.willChange = hasRise ? 'opacity, transform' : 'opacity';

		fadeAnimation = node.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration,
			delay,
			easing: FADE_EASING,
			fill: 'forwards'
		});

		if (hasRise) {
			riseAnimation = node.animate(
				[{ transform: `translate3d(0, ${distance}px, 0)` }, { transform: 'translate3d(0, 0, 0)' }],
				{
					duration: RISE_DURATION,
					delay,
					easing: RISE_EASING,
					fill: 'forwards'
				}
			);
		}

		fadeAnimation.addEventListener('finish', settle);
		// A `finish` event never fires for an animation that's never painted (e.g. the tab
		// is backgrounded before the element is shown), so back it with a timeout.
		cleanupTimer = setTimeout(settle, delay + duration + 100);
	}

	/* Nothing to observe: no entrance to release and no exit to answer. */
	if (!entrance && !exit) return;

	if (entrance && trigger === 'load') {
		releaseFrame = requestAnimationFrame(() => {
			releaseFrame = null;
			release();
		});
	}

	/* One observer for the whole life of the element, not one that fires once and
	   disconnects. The first intersection releases the entrance; every one after that is the
	   element crossing the band's edge, in either direction. */
	/* The observer's first callback reports where the element already is, which is not a
	   crossing — nobody scrolled anywhere. An element sitting below the fade-in line at load
	   would otherwise fade out in front of the reader before it had ever faded in. Snap it
	   instead, and animate from the second callback on. */
	let firstReport = true;

	const onCross: IntersectionObserverCallback = (entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				if (!released) release();
				else if (exit) driftTo(1, firstReport ? 0 : RETURN_DURATION);
			} else if (released && exit) {
				driftTo(0, firstReport ? 0 : EXIT_DURATION);
			}
			firstReport = false;
		}
	};

	observer = new IntersectionObserver(onCross, { threshold: 0, rootMargin: rootMarginFor(node) });
	observer.observe(node);

	/* The last-screenful fallback described on unreachable() above. A second observer on the
	   real viewport, attached only to elements the band cannot reach, and only ever used to
	   show them. */
	let tail: IntersectionObserver | null = null;

	function syncTail() {
		const needed = unreachable(node);
		if (needed === !!tail) return;
		if (!needed) {
			tail?.disconnect();
			tail = null;
			return;
		}
		tail = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					if (!released) release();
					else driftTo(1, RETURN_DURATION);
				}
			},
			{ threshold: 0 }
		);
		tail.observe(node);
	}

	/* A rebuild, because an element carrying an inset resolves its band in px and both the
	   inset and the viewport height can have moved. Cheap: the string is compared first and
	   the observer is only replaced when it actually differs. */
	let margin = rootMarginFor(node);

	function resync() {
		const next = rootMarginFor(node);
		if (next !== margin) {
			margin = next;
			observer?.disconnect();
			observer = new IntersectionObserver(onCross, { threshold: 0, rootMargin: margin });
			observer.observe(node);
		}
		syncTail();
	}

	syncTail();
	const unwatch = watchDocumentHeight(resync);

	/* An element that starts on screen never had an entrance to release, so mark it done and
	   let the observer drive it from here. */
	if (!armed) {
		released = true;
		/* An exit-only element is left exactly as rendered — writing opacity here would
		   override whatever its own stylesheet or entrance animation is doing to it. The
		   first drift reads the computed value instead. */
		if (entrance) node.style.opacity = '1';
	}

	return {
		destroy() {
			unwatch();
			tail?.disconnect();
			tail = null;
			observer?.disconnect();
			observer = null;
			if (releaseFrame !== null) cancelAnimationFrame(releaseFrame);
			if (cleanupTimer !== null) clearTimeout(cleanupTimer);
			fadeAnimation?.removeEventListener('finish', settle);
			fadeAnimation?.cancel();
			riseAnimation?.cancel();
			driftAnimation?.cancel();
		}
	};
}
