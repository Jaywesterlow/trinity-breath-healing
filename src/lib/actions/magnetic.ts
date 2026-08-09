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

// Fraction of the cursor's offset from the card's CENTRE that the card
// follows by, before the edge falloff below is applied. This is what sets
// how far the card actually moves: at the card's own left/right edge the
// pull is MAGNET_STRENGTH * halfWidth, i.e. ~10px on a 240px-wide desktop
// card. Raise it for a stickier card, lower it for a subtler one.
const MAGNET_STRENGTH = 0.08;

// How far OUTSIDE the card's edge the magnet starts tracking, in px.
//
// This replaced a radius measured from the card's centre (a multiple of its
// half-diagonal), which went through three rounds of tuning without ever
// landing, because a circle cannot describe a 240x390 rectangle. Big enough
// to reach the left/right edges and it overshot top and bottom by ~100px;
// small enough to sit near the edges vertically and it never reached them
// horizontally at all. The owner's report is exactly that failure: "even if
// I move to the outer edge of the card, it doesn't track... it only starts
// tracking when I move towards the center."
//
// Measuring to the card's RECTANGLE instead makes the knob mean what it
// says: the magnet engages this many pixels out from whichever edge the
// cursor approaches, uniformly on all four sides, and is fully engaged
// anywhere on the card itself. Breakpoint-safe without a multiplier, since
// it is a margin around the real measured box rather than a fraction of it.
const MAGNET_MARGIN_PX = 60;

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
			// Distance from the cursor to the card's RECTANGLE, not to its
			// centre: zero anywhere on the card, and the true perpendicular /
			// corner distance once outside it. offsetWidth/offsetHeight rather
			// than the rect's own width/height because getBoundingClientRect on
			// a rotated element returns the inflated axis-aligned box — the ±1
			// and ±2 cards sit at 14deg and 28deg, where that box runs ~30%
			// long. Same rotated-bbox trap getCardBandY documents at length.
			const halfWidth = node.offsetWidth / 2;
			const halfHeight = node.offsetHeight / 2;
			const edgeDistance = Math.hypot(
				Math.max(0, Math.abs(dx) - halfWidth),
				Math.max(0, Math.abs(dy) - halfHeight)
			);

			if (edgeDistance > MAGNET_MARGIN_PX) {
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

			// Falloff runs on the EDGE distance, so the card is fully engaged
			// anywhere on itself and fades out across MAGNET_MARGIN_PX as the
			// cursor leaves — reaching exactly zero at the boundary. That last
			// part is the whole point: an earlier version cut off hard at the
			// boundary while the pull was still at its maximum there, so
			// crossing it teleported the card by tens of pixels. The owner
			// reported that as "it snaps way too fast"; a longer transition
			// would only have stretched the jump out rather than removed it.
			//
			// Magnitude still comes from the cursor's offset from the CENTRE,
			// so the card leans toward wherever the cursor is on it: nothing
			// at dead centre, ~MAGNET_STRENGTH * halfWidth (~10px) at the
			// left/right edge.
			const falloff = 1 - edgeDistance / MAGNET_MARGIN_PX;
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
	// once the cursor is already over the card, which made the margin above
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
