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

/* How far in from each edge the band sits: the strip of the viewport in which content is
   held at full opacity. Everything outside it is faded. Both edges are percentages of the
   viewport height, so the same band means the same thing on a 844px phone and a 1080px
   laptop — the site is mobile-first and these were tuned there.

   The top edge is what makes an element fade WHILE it is still visible on the way up
   rather than at the instant it clips. It was 22%, which on a phone left content sitting
   at full strength almost until it touched the nav and then fading in a hurry; 34% starts
   it in the upper third, so the exit reads as the page moving on rather than as a snap.

   The bottom edge is the other half of the same complaint. It was a flat -80px, meaning an
   element began fading in the moment 80px of it had cleared the bottom edge — on a phone
   that is most of a heading, so things arrived already lit. 18% (~150px on a phone) holds
   the fade until the element is properly on screen.

   Note that with threshold 0 the element has to leave the band ENTIRELY, so a tall section
   starts fading later than a short one; that reads correctly, because a tall section is
   still mostly on screen at that point. */
const BAND_TOP = '-34%';
const BAND_BOTTOM = '-18%';

/** The band as a rootMargin string, for observers outside this action that have to leave
 *  on the same edge — Werkwijze's staggered card row is the one that does. */
export const REVEAL_ROOT_MARGIN = `${BAND_TOP} 0px ${BAND_BOTTOM} 0px`;

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
	   transition — nobody scrolled anywhere. An element sitting below the band at load
	   (visible, but in the bottom fifth of the screen) would otherwise fade out in front of
	   the reader before it had ever faded in. Snap it instead, and animate from the second
	   callback on, which is a real crossing. */
	let firstReport = true;

	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					if (!released) release();
					else if (exit) driftTo(1, firstReport ? 0 : RETURN_DURATION);
				} else if (released && exit) {
					driftTo(0, firstReport ? 0 : EXIT_DURATION);
				}
				firstReport = false;
			}
		},
		{ threshold: 0, rootMargin: REVEAL_ROOT_MARGIN }
	);
	observer.observe(node);

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
