/**
 * `use:magnetic` — magnetic cursor-follow for the Behandelingen carousel's
 * centre card (260809-hov). Translate only — no rotation, no perspective, no
 * tilt; the owner was explicit the card stays flat.
 *
 * Writes `--magnet-x`/`--magnet-y` custom properties onto the node rather
 * than the `transform` property directly, so the card's own stylesheet (see
 * TreatmentCard.svelte) can compose the magnet offset with its independent
 * hover-scale transform on the same `transform` declaration without either
 * one clobbering the other.
 *
 * Contract:
 *   - Only attaches when `enabled` is true (the carousel only ever passes
 *     this for the centre card — see Behandelingen.svelte's positions[i]
 *     === 0 gate) AND the device actually has a fine pointer with real
 *     hover (touch never gets a listener attached at all, matching the CSS
 *     hover reveal's own (hover: hover) and (pointer: fine) gate) AND
 *     prefers-reduced-motion is not set.
 *   - Releases (snaps the offset back to 0, WITH the CSS transition
 *     re-enabled so it animates rather than jumps) the instant `dragging`
 *     becomes true — a magnet fighting the carousel's own drag would be a
 *     real bug.
 *   - rAF-throttles pointermove, same reasoning as this component's own
 *     onWindowPointerMove in Behandelingen.svelte: pointer events can
 *     outrun the display.
 */

export type MagneticOptions = {
	/** Only the carousel's centre card ever passes true. */
	enabled: boolean;
	/** True while the carousel fan itself is being dragged. */
	dragging: boolean;
};

// Fraction of the cursor's offset from the card's centre that the card
// follows by, before the falloff below is applied.
//
// This does NOT set the pull on its own — strength and radius are coupled.
// Actual peak offset is MAGNET_STRENGTH * radius / 4 (the maximum of the
// d * (1 - d/r) curve, reached at d = r/2). So halving the radius also
// halves the pull unless strength rises to match. The owner spotted this
// coupling: "I think that might be tied to the strength."
//
// Raised 0.15 -> 0.3 alongside the radius drop below, chosen to hold the
// peak offset at ~14px on desktop across both changes: the range shrinks,
// the strength of the pull itself does not.
const MAGNET_STRENGTH = 0.3;

// Multiple of the card's own half-diagonal beyond which the magnet releases
// (a fixed px value would only be correct at one breakpoint — --card-width
// is 6.5rem on mobile and 15rem on desktop, see Behandelingen.svelte's own
// pxPerStep comment for the exact same breakpoint trap already hit once in
// this file). Measured live off the card's own getBoundingClientRect on
// every move instead, the same "measure the real geometry, don't hardcode
// it" pattern getCardBandY/measurePxPerStep already use elsewhere in this
// carousel.
//
// 0.8x half-diagonal, down from 1.6 — "the range at which the magnet starts
// tracking needs to be lowered a lot." At this multiple the engagement circle
// sits roughly at the card's own left/right edges on desktop, so the magnet
// is a close-range effect rather than something that reaches out across the
// section.
//
// Note what this does NOT change: how fast the card moves once engaged. That
// is MAGNET_TRACK_MS, deliberately left at 300ms. A smaller radius does make
// the pull ramp up over less cursor travel (the falloff is steeper), which
// can read as "snappier" even at an unchanged duration — the compensating
// lever if that happens is this multiplier, not the duration.
const MAGNET_RADIUS_MULTIPLIER = 0.8;

// How long the shared transform transition runs WHILE the magnet is tracking
// the cursor. Not zero, deliberately — the magnet translate and the hover
// scale are composed into one transform property, so this duration is also
// the only thing the scale has to animate over (see the comment at its use
// site below). Was 150ms; doubled to 300ms on the owner's "it needs to snap
// half as fast to the card". This is also the only thing the hover scale has
// to animate over, so it doubles that too — which is fine, the grow reads
// better slower.
const MAGNET_TRACK_MS = 300;

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canHover(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function magnetic(node: HTMLElement, options: MagneticOptions) {
	let opts = options;
	let attached = false;
	let rafId: number | null = null;
	let pendingX = 0;
	let pendingY = 0;

	function releaseTo(x: string, y: string): void {
		// Restore the CSS transition BEFORE changing the offset, in the same
		// tick, so the browser animates the change instead of snapping —
		// "release must animate back, not snap."
		node.style.removeProperty('--tcard-transition-duration');
		node.style.setProperty('--magnet-x', x);
		node.style.setProperty('--magnet-y', y);
	}

	function onPointerMove(e: PointerEvent): void {
		// Return without writing. The drag->release is already handled once,
		// on the transition, by update() below. Calling releaseTo() here
		// instead ran three inline-style writes on EVERY raw pointer sample —
		// bypassing the rAF throttle immediately below, on the drag hot path,
		// and now multiplied by every visible card since the magnet stopped
		// being centre-only.
		if (opts.dragging) return;
		pendingX = e.clientX;
		pendingY = e.clientY;
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			rafId = null;
			const rect = node.getBoundingClientRect();
			const centreX = rect.left + rect.width / 2;
			const centreY = rect.top + rect.height / 2;
			const dx = pendingX - centreX;
			const dy = pendingY - centreY;
			const distance = Math.hypot(dx, dy);
			// offsetWidth/offsetHeight, NOT rect.width/height: getBoundingClientRect
			// on a rotated element returns the inflated axis-aligned box, not the
			// card. The ±1/±2 cards sit at --tilt-step and twice it (14deg/28deg),
			// where the bbox diagonal runs ~30% long — so deriving the engagement
			// radius from the rect made the magnet reach noticeably further on the
			// outer cards than the centre one, and pull harder there too (peak is
			// MAGNET_STRENGTH * radius / 4). Same rotated-bbox trap getCardBandY
			// documents at length in Behandelingen.svelte. The offset* properties
			// are layout size, untouched by transforms, so they describe the card
			// itself at any angle.
			const halfDiagonal = Math.hypot(node.offsetWidth, node.offsetHeight) / 2;
			const radius = halfDiagonal * MAGNET_RADIUS_MULTIPLIER;

			if (distance > radius) {
				releaseTo('0px', '0px');
				return;
			}

			// Actively tracking. This used to set 0s so the translate followed
			// the cursor with no lag at all — but the magnet translate and the
			// hover scale share ONE transform property (see TreatmentCard's
			// own comment on it), so 0s here also killed the scale's
			// transition: the card snapped to its hover size instead of
			// growing into it. The owner reported exactly that ("the grow has
			// to be smoothed out... I didn't see a transition speed").
			//
			// A short duration serves both: the magnet still reads as
			// following the cursor, and the scale has something to animate
			// over.
			node.style.setProperty('--tcard-transition-duration', `${MAGNET_TRACK_MS}ms`);

			// Linear falloff to zero at the radius. Without it the pull was
			// `distance * MAGNET_STRENGTH` with a hard cutoff, so the offset
			// was at its LARGEST exactly where the magnet switched on: cross
			// the boundary and the card jumped by strength * radius in one
			// go (~52px at the old radius). That discontinuity is what
			// the owner reported as "it snaps way too fast" — the duration
			// only controlled how long the jump took, not that it was a jump.
			//
			// Scaling by (1 - distance/radius) makes the pull start at zero
			// on the boundary and grow as the cursor closes in, so there is
			// no step to see. Peak offset is now
			// MAGNET_STRENGTH * radius / 4 (the maximum of d*(1-d/r)), i.e.
			// ~14px on desktop — a card that "slightly sticks to the cursor",
			// which is what was asked for originally. Both constants feed
			// that one number; see MAGNET_STRENGTH's comment for why they
			// have to be tuned as a pair.
			const falloff = 1 - distance / radius;
			const pull = MAGNET_STRENGTH * falloff;
			node.style.setProperty('--magnet-x', `${dx * pull}px`);
			node.style.setProperty('--magnet-y', `${dy * pull}px`);
		});
	}

	function onPointerLeave(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		releaseTo('0px', '0px');
	}

	// Listens on WINDOW, not on the node. Listening on the node only fires
	// once the cursor is already over the card, which made the radius above
	// dead code — the magnet could never engage on approach, and the first
	// event it ever saw was already up to a half-diagonal from the centre,
	// so the card lurched the moment the cursor crossed its edge. The owner
	// asked for the opposite: "it needs to snap whenever my cursor is close
	// to the card." Distance is computed from the card's own live rect, so a
	// window listener costs one rAF-throttled read and nothing else, and
	// only the centre card ever attaches one (see the enabled gate).
	function attach(): void {
		if (attached) return;
		attached = true;
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerleave', onPointerLeave);
	}

	function detach(): void {
		if (!attached) return;
		attached = false;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerleave', onPointerLeave);
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		releaseTo('0px', '0px');
	}

	function sync(): void {
		if (opts.enabled && canHover() && !prefersReducedMotion()) {
			attach();
		} else {
			detach();
		}
	}

	sync();

	return {
		update(newOptions: MagneticOptions) {
			const wasDragging = opts.dragging;
			opts = newOptions;
			if (opts.dragging && !wasDragging) {
				releaseTo('0px', '0px');
			}
			sync();
		},
		destroy() {
			detach();
		}
	};
}
