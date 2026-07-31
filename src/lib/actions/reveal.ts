/**
 * `use:reveal` — below-the-fold scroll reveal.
 *
 * Companion to the hero's pure-CSS cascade (`Hero.svelte`), but the opposite mechanism on
 * purpose: below the fold, arming the hidden state has to happen from JavaScript, because the
 * element hasn't painted yet when the action runs. See the root `HANDOFF.md`, "Above the fold
 * vs below it", for the full reasoning. Never apply this to the hero — it already has its own
 * entrance.
 *
 * Contract, in order:
 *   1. Under `prefers-reduced-motion: reduce`, bail before touching any style. No inline
 *      styles are ever set.
 *   2. If the element is already in the viewport when the action runs (hydration happens
 *      after the prerendered HTML has painted), bail without arming — arming something the
 *      user can already see would flash it.
 *   3. Otherwise arm synchronously, in the action body: hidden opacity + a small upward
 *      offset, set before the next paint.
 *   4. Release on `load` (next frame) or on first intersection for `view` (the default) —
 *      one observer, fires once, disconnects.
 *   5. Releasing plays the fade/rise, then clears the values once it finishes so the element
 *      is left at its natural, unstyled state.
 *   6. Once the fade ends (backed by a timeout, since a never-painted element never fires a
 *      finish event), strip every inline style this action set. A leftover `transform` makes
 *      the element a containing block for any `position: fixed`/`sticky` descendant, which
 *      would silently break that positioning elsewhere on the page.
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
};

const DEFAULTS: Required<RevealOptions> = {
	delay: 0,
	duration: 1300,
	distance: 10,
	trigger: 'view'
};

const FADE_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const RISE_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const RISE_DURATION = 1100;

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

	const rect = node.getBoundingClientRect();
	if (rect.top < window.innerHeight) {
		return;
	}

	const { delay, duration, distance, trigger } = { ...DEFAULTS, ...options };
	const hasRise = distance > 0;

	// Arm synchronously, before the next paint. Plain property writes — independent of
	// whatever the element's own `transition`/`animation` CSS is doing.
	node.style.opacity = '0';
	if (hasRise) {
		node.style.transform = `translate3d(0, ${distance}px, 0)`;
	}

	let observer: IntersectionObserver | null = null;
	let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
	let releaseFrame: number | null = null;
	let fadeAnimation: Animation | null = null;
	let riseAnimation: Animation | null = null;
	let cleaned = false;

	function cleanup() {
		if (cleaned) return;
		cleaned = true;
		if (cleanupTimer !== null) {
			clearTimeout(cleanupTimer);
			cleanupTimer = null;
		}
		fadeAnimation?.removeEventListener('finish', cleanup);
		fadeAnimation?.cancel();
		riseAnimation?.cancel();
		fadeAnimation = null;
		riseAnimation = null;
		node.style.removeProperty('opacity');
		node.style.removeProperty('transform');
		node.style.removeProperty('will-change');
	}

	function release() {
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

		fadeAnimation.addEventListener('finish', cleanup);
		// A `finish` event never fires for an animation that's never painted (e.g. the tab
		// is backgrounded before the element is shown), so back it with a timeout.
		cleanupTimer = setTimeout(cleanup, delay + duration + 100);
	}

	if (trigger === 'load') {
		releaseFrame = requestAnimationFrame(() => {
			releaseFrame = null;
			release();
		});
	} else {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						observer?.disconnect();
						observer = null;
						release();
						break;
					}
				}
			},
			{ threshold: 0, rootMargin: '0px 0px -80px 0px' }
		);
		observer.observe(node);
	}

	return {
		destroy() {
			observer?.disconnect();
			observer = null;
			if (releaseFrame !== null) cancelAnimationFrame(releaseFrame);
			if (cleanupTimer !== null) clearTimeout(cleanupTimer);
			fadeAnimation?.removeEventListener('finish', cleanup);
			fadeAnimation?.cancel();
			riseAnimation?.cancel();
		}
	};
}
