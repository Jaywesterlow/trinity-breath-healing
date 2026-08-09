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
// follows by. 0.1 is subtle, 0.3 is very sticky — the owner asked for this
// to stay tunable.
const MAGNET_STRENGTH = 0.15;

// Multiple of the card's own half-diagonal beyond which the magnet releases
// (a fixed px value would only be correct at one breakpoint — --card-width
// is 6.5rem on mobile and 15rem on desktop, see Behandelingen.svelte's own
// pxPerStep comment for the exact same breakpoint trap already hit once in
// this file). Measured live off the card's own getBoundingClientRect on
// every move instead, the same "measure the real geometry, don't hardcode
// it" pattern getCardBandY/measurePxPerStep already use elsewhere in this
// carousel. 1.5x half-diagonal per the plan: engages a little before the
// cursor visually arrives at the card's corner.
const MAGNET_RADIUS_MULTIPLIER = 1.5;

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
		if (opts.dragging) {
			releaseTo('0px', '0px');
			return;
		}
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
			const halfDiagonal = Math.hypot(rect.width, rect.height) / 2;
			const radius = halfDiagonal * MAGNET_RADIUS_MULTIPLIER;

			if (distance > radius) {
				releaseTo('0px', '0px');
				return;
			}

			// Actively tracking: no transition, so the translate follows the
			// cursor 1:1 with no lag (a lagging transition here would visibly
			// trail the cursor, the same reasoning this file's own
			// onWindowPointerMove rAF-throttle comment already gives for why
			// pointer events need careful handling against the display).
			node.style.setProperty('--tcard-transition-duration', '0s');
			node.style.setProperty('--magnet-x', `${dx * MAGNET_STRENGTH}px`);
			node.style.setProperty('--magnet-y', `${dy * MAGNET_STRENGTH}px`);
		});
	}

	function onPointerLeave(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		releaseTo('0px', '0px');
	}

	function attach(): void {
		if (attached) return;
		attached = true;
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerleave', onPointerLeave);
	}

	function detach(): void {
		if (!attached) return;
		attached = false;
		node.removeEventListener('pointermove', onPointerMove);
		node.removeEventListener('pointerleave', onPointerLeave);
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
