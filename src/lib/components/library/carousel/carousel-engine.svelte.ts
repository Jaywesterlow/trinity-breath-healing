/**
 * CarouselEngine — the physics/behaviour half of Carousel.svelte.
 *
 * Extracted from Trinity Breath & Healing's Behandelingen carousel: a
 * curved fan of cards on a continuous, non-wrapping position line, driven
 * by one physical model from finger-down to rest — live drag-follow, a
 * decaying "coast" once released, a critically-damped spring "latch" onto
 * the nearest card, and a slow ambient "drift" while nothing is happening.
 * Carousel.svelte stays deliberately dumb (markup/layout only, same split
 * MorphModal.svelte uses); everything about *how* the fan moves lives
 * here, as a plain class constructed once per usage site.
 *
 * Core design, if you're reading this to understand the physics rather
 * than just to use it:
 *
 *   - `positions[i]` is each item's own persistent slot on an infinite
 *     line (not recomputed from an index every render) — it only ever
 *     moves by exactly ±1 per recycle (see `#shiftOne`). `offset` is the
 *     one continuous, fractional, ALWAYS-shared value added on top of
 *     every item's position to produce what's actually rendered
 *     (`positions[i] + offset`) — live during drag, coast, latch, AND
 *     drift alike. Combined, this is what lets a fast drag spanning many
 *     cards keep recycling smoothly mid-gesture instead of needing a
 *     special multi-step path.
 *   - `motionTick` is ONE requestAnimationFrame loop with three regimes
 *     (`motionPhase`): 'coast' (exponential velocity decay after a
 *     release), 'latch' (a critically-damped spring pulling onto the
 *     nearest integer, seeded with whatever real position/velocity the
 *     fan already had — never a discontinuous restart), and 'drift' (the
 *     idle auto-advance, constant velocity, never decays, never hands off
 *     to latch). A new drag or a button press always calls `#cancelMotion`
 *     first, so exactly one of these ever runs at a time.
 *   - The item list needs to be REPEATED (padded) so the recycle loop
 *     always has off-screen slots to wrap through — see `repeats`/`count`
 *     below, computed from `itemCount`/`visibleSlotMax`. Carousel.svelte
 *     builds the actual repeated render list from these; the engine only
 *     deals in slot arithmetic.
 *
 * Usage (see this folder's README.md for the full walkthrough):
 *
 *   const carousel = createCarouselEngine({
 *     itemCount: items.length,
 *     onCentreCardClick: (e, i) => { e.preventDefault(); modal.open(cardEls[i], i); }
 *   });
 *   onMount(() => carousel.mount());
 *
 * `carousel.positions`/`carousel.offset` drive each rendered pivot's
 * `--pos` custom property (`positions[i] + offset`); `carousel.dragging`/
 * `carousel.inGesture`/`carousel.cursorInBand` drive cursor and transition
 * classes — see Carousel.svelte for exactly how.
 */

import { SvelteSet } from 'svelte/reactivity';

export interface CarouselEngineOptions {
	/** Number of distinct items — NOT the padded/repeated render count
	 * (see `repeats`/`count`). */
	itemCount: number;
	/** How many slots are actually visible/rendered at once, symmetric
	 * around the centre (0). Trinity's own fan shows 5 (0, ±1, ±2). */
	visibleSlotMax?: number;
	/** Fired when the CENTRE card (slot 0) is clicked with a real pointer
	 * click (not a keyboard activation, not the trailing click after a
	 * drag) — e.g. to open a detail modal for that item. Every other
	 * card's click already centres itself; this is the one thing the
	 * engine doesn't decide on its own, since "what happens when you open
	 * the centre card" is specific to what you're building. Call
	 * `e.preventDefault()` inside if you don't want the card's own href to
	 * navigate. */
	onCentreCardClick?: (e: MouseEvent, index: number) => void;
}

// --- Release physics (coast -> latch), all in "steps" (positions[i]
// units) and ms — see the class-level doc comment for the model. Every
// number below is independently tunable in place; nothing here depends on
// screen pixels except FALLBACK_PX_PER_STEP; real geometry is measured at
// runtime (see #measurePxPerStep) so drag distance always converts to a
// consistent, breakpoint-correct number of steps.
const MOMENTUM_TAU_MS = 500; // time for coast velocity to decay to ~37% (1/e)
const VELOCITY_EPSILON = 0.0025; // steps/ms — below this, coast hands off to latch
const SPRING_OMEGA = 0.016; // pointer-release latch's angular frequency (1/ms)
const BUTTON_SPRING_OMEGA = SPRING_OMEGA / 4; // next/prev/goTo's own, slower feel
const JUMP_SPRING_OMEGA = SPRING_OMEGA / 2; // click-to-jump (a side card click)
const JUMP_KICK = 1; // 1 = fastest departure with zero overshoot; >1 overshoots and bounces
const LATCH_DONE_EPSILON = 0.01; // how close (steps) + how slow (steps/ms) counts as "arrived"
const VELOCITY_WINDOW_MS = 80; // trailing window a drag's exit velocity is averaged over
const DRAG_SLOP_PX = 4; // past this, a pointer gesture counts as a drag, not a click
const CARD_BAND_SAFE_MARGIN_PX = 24; // vertical margin around the centre card a drag can start in
const FALLBACK_PX_PER_STEP = 90; // only in effect before the first live geometry measurement

// Idle auto-drift — a slow, continuous, ambient advance in next()'s own
// direction once nothing has happened for a while. Two tunable numbers:
// how long to wait (IDLE_DRIFT_DELAY_MS) and how long one full step takes
// while drifting (DRIFT_SECONDS_PER_STEP, bigger = slower/more ambient).
// Runs as the third motionPhase (see motionTick) so every existing
// interruption point (a new drag, a button press) already cancels it for
// free, with no special-casing needed anywhere else.
const IDLE_DRIFT_DELAY_MS = 2000; // owner-tuned; started at 4000, halved on request
const DRIFT_SECONDS_PER_STEP = 6.4; // owner-tuned; started at 10, sped up 1.75x then 1.25x
const DRIFT_VELOCITY_PER_MS = -1 / (DRIFT_SECONDS_PER_STEP * 1000); // negative = next()'s direction

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export class CarouselEngine {
	// --- Reactive state the template reads directly. ---
	positions: number[] = $state([]);
	offset = $state(0);
	dragging = $state(false); // true only while a pointer is actually down and moving the fan
	// True from pointerdown through drag, coast, latch, AND drift — the
	// whole gesture/motion, not just the drag. Drives the "no CSS
	// transition" class on each pivot, since this continuous offset write
	// would otherwise fight a stylesheet transition with its own easing.
	inGesture = $state(false);
	cursorInBand = $state(false);
	fanEl = $state<HTMLElement | null>(null);
	// Indices currently mid-recycle — their transition is suppressed for a
	// frame so they reposition instantly instead of visibly sweeping
	// across from one edge to the other (see #shiftOne).
	noTransitionIndices = new SvelteSet<number>();

	// --- Slot geometry, fixed at construction from itemCount/visibleSlotMax. ---
	readonly itemCount: number;
	readonly visibleSlotMax: number;
	/** How many times the item list must repeat so the recycle loop always
	 * has off-screen slots to wrap through. Carousel.svelte uses this to
	 * build its actual repeated render list. */
	readonly repeats: number;
	/** repeats * itemCount — the padded render count `positions` is sized to. */
	readonly count: number;
	#highSlot: number;
	#lowSlot: number;

	#opts: CarouselEngineOptions;

	constructor(opts: CarouselEngineOptions) {
		this.#opts = opts;
		this.itemCount = opts.itemCount;
		this.visibleSlotMax = opts.visibleSlotMax ?? 2;

		// See Carousel.svelte's own doc comment for the full derivation —
		// `+3` (not `+2`) is what keeps an even itemCount's one-slot
		// asymmetry from landing a recycle boundary on a visible slot.
		const minItems = 2 * this.visibleSlotMax + 3;
		this.repeats = Math.max(1, Math.ceil(minItems / this.itemCount));
		this.count = this.repeats * this.itemCount;
		this.#highSlot = Math.floor(this.count / 2);
		this.#lowSlot = this.#highSlot - this.count + 1;

		this.positions = Array.from({ length: this.count }, (_, i) =>
			i <= this.#highSlot ? i : i - this.count
		);
	}

	isVisibleSlot(position: number): boolean {
		return Math.abs(position) <= this.visibleSlotMax;
	}

	/** The item list is repeated so the loop has off-screen slots to
	 * recycle through, so every real item exists at more than one render
	 * index. Dots/pagination therefore have to reason about an item, not a
	 * slot — this finds whichever copy of item `s` currently sits nearest
	 * the centre, so navigating to it always travels the short way round. */
	nearestCopyOf(s: number): number {
		let best = s;
		let bestDistance = Infinity;
		for (let i = s; i < this.count; i += this.itemCount) {
			const d = Math.abs(this.positions[i]!);
			if (d < bestDistance) {
				bestDistance = d;
				best = i;
			}
		}
		return best;
	}

	isItemCentred(s: number): boolean {
		for (let i = s; i < this.count; i += this.itemCount) {
			if (this.positions[i] === 0) return true;
		}
		return false;
	}

	// The one place a position ever changes, deliberately restricted to a
	// single ±1 step per call — see the class-level doc comment. An index
	// only recycles once it's a full step PAST the visible range on either
	// side (derived from #highSlot/#lowSlot, not hardcoded), so it's
	// always off-screen, invisible, at the moment it jumps.
	#shiftOne(delta: number): void {
		this.positions = this.positions.map((p, i) => {
			let next = p + delta;
			while (next <= this.#lowSlot - 1) {
				this.#armNoTransition(i);
				next += this.count;
			}
			while (next >= this.#highSlot + 1) {
				this.#armNoTransition(i);
				next -= this.count;
			}
			return next;
		});
	}

	#armNoTransition(index: number): void {
		this.noTransitionIndices.add(index);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.noTransitionIndices.delete(index);
			});
		});
	}

	// Whenever `offset` would carry a rendered position a full card past
	// its current slot, folds that whole step permanently into
	// positions[i] and removes the same amount from offset in the same
	// tick — positions[i] + offset is unchanged at that instant (no
	// visible jump), but the travel is now committed. A while loop, not an
	// if: a single fast frame can legitimately cross more than one
	// boundary. Returns how much was folded, signed — the drag path (see
	// #onWindowPointerMove) needs this to keep its own absolute formula in
	// sync; every other caller can ignore the return value.
	#absorbWholeSteps(): number {
		const before = this.offset;
		while (this.offset >= 1) {
			this.#shiftOne(1);
			this.offset -= 1;
		}
		while (this.offset <= -1) {
			this.#shiftOne(-1);
			this.offset += 1;
		}
		return before - this.offset;
	}

	// --- Geometry, measured at runtime rather than hardcoded so it stays
	// correct across breakpoints/retunes. ---

	#measurePxPerStep(el: HTMLElement): number | null {
		const pivotEls = el.querySelectorAll<HTMLElement>('.carousel__pivot');
		let centreEl: HTMLElement | null = null;
		let centreDist = Infinity;
		let neighbourEl: HTMLElement | null = null;
		let neighbourDist = Infinity;
		pivotEls.forEach((pivotEl, i) => {
			const p = this.positions[i]! + this.offset;
			const dc = Math.abs(p);
			if (dc < centreDist) {
				centreDist = dc;
				centreEl = pivotEl;
			}
			const dn = Math.abs(p - 1);
			if (dn < neighbourDist) {
				neighbourDist = dn;
				neighbourEl = pivotEl;
			}
		});
		if (!centreEl || !neighbourEl || centreEl === neighbourEl) return null;
		const centreRect = (centreEl as HTMLElement).getBoundingClientRect();
		const neighbourRect = (neighbourEl as HTMLElement).getBoundingClientRect();
		const centreX = centreRect.left + centreRect.width / 2;
		const neighbourX = neighbourRect.left + neighbourRect.width / 2;
		const distance = Math.abs(neighbourX - centreX);
		return distance > 0 ? distance : null;
	}

	#pxPerStep = FALLBACK_PX_PER_STEP;

	remeasurePxPerStep(): void {
		if (!this.fanEl) return;
		const measured = this.#measurePxPerStep(this.fanEl);
		if (measured !== null) this.#pxPerStep = measured;
	}

	// A rotated pivot's own bounding box is inflated (its transform tilts
	// it), so only the CENTRE pivot (rotation 0) gives an honest rectangle
	// — used both to gate where a drag may start and to drive the grab
	// cursor.
	#getCardBandY(): { top: number; bottom: number } | null {
		if (!this.fanEl) return null;
		const pivotEls = this.fanEl.querySelectorAll<HTMLElement>('.carousel__pivot');
		let centreEl: HTMLElement | null = null;
		let centreDist = Infinity;
		pivotEls.forEach((el, i) => {
			const p = this.positions[i]! + this.offset;
			const dist = Math.abs(p);
			if (dist < centreDist) {
				centreDist = dist;
				centreEl = el;
			}
		});
		if (!centreEl) return null;
		const rect = (centreEl as HTMLElement).getBoundingClientRect();
		const top = rect.top - CARD_BAND_SAFE_MARGIN_PX;
		let bottom = rect.bottom + CARD_BAND_SAFE_MARGIN_PX;

		// Hard requirement: the band must never reach into the controls
		// row below the fan, regardless of margin/card geometry.
		const controlsEl = this.fanEl
			.closest('.carousel__wrap')
			?.querySelector<HTMLElement>('.carousel__controls');
		if (controlsEl) {
			const controlsTop = controlsEl.getBoundingClientRect().top;
			if (bottom >= controlsTop) bottom = controlsTop - 1;
		}
		return { top, bottom };
	}

	// --- Motion state machine: drag -> coast -> latch, or idle -> drift. ---

	#dragStartX = 0;
	#dragStartY = 0;
	#dragBaseOffset = 0;
	#dragMoved = false;
	#moveHistory: { x: number; t: number }[] = [];
	#pendingDx = 0;
	#dragRafId: number | null = null;

	#motionRafId: number | null = null;
	#motionPhase: 'coast' | 'latch' | 'drift' = 'coast';
	#velocity = 0; // steps/ms
	#lastFrameTime = 0;
	#idleDriftTimer: ReturnType<typeof setTimeout> | null = null;
	#latchTarget = 0;
	#latchY0 = 0;
	#latchV0 = 0;
	#latchStartTime = 0;
	#latchOmega = SPRING_OMEGA;

	/** Cancels whatever's currently moving the fan (coast/latch/drift) and
	 * any pending idle-drift countdown — call before starting anything
	 * else that should take over (a new drag, a modal opening over the
	 * fan). Safe to call at any time, including when nothing is running. */
	cancelMotion(): void {
		if (this.#motionRafId !== null) {
			cancelAnimationFrame(this.#motionRafId);
			this.#motionRafId = null;
		}
		if (this.#idleDriftTimer !== null) {
			clearTimeout(this.#idleDriftTimer);
			this.#idleDriftTimer = null;
		}
	}

	/** (Re)starts the countdown to the next idle auto-drift. Call after
	 * anything that should count as "the fan is idle again" (e.g. a modal
	 * that paused it via cancelMotion() has just closed). */
	scheduleIdleDrift(): void {
		if (this.#idleDriftTimer !== null) clearTimeout(this.#idleDriftTimer);
		this.#idleDriftTimer = setTimeout(() => {
			this.#idleDriftTimer = null;
			if (!prefersReducedMotion()) this.#beginDrift();
		}, IDLE_DRIFT_DELAY_MS);
	}

	#beginDrift(): void {
		this.#motionPhase = 'drift';
		this.inGesture = true;
		this.#lastFrameTime = performance.now();
		this.#motionRafId = requestAnimationFrame(this.#motionTick);
	}

	#beginMotion(): void {
		this.#motionPhase = 'coast';
		this.#lastFrameTime = performance.now();
		this.#motionRafId = requestAnimationFrame(this.#motionTick);
	}

	// Hands coast off into the latch spring, carrying its REAL position
	// (y0) and velocity (v0) over exactly as they were the instant before
	// — never a discontinuous restart onto a freshly-guessed curve.
	#beginLatch(now: number): void {
		this.#motionPhase = 'latch';
		this.#latchTarget = Math.round(this.offset);
		this.#latchY0 = this.offset - this.#latchTarget;
		this.#latchV0 = this.#velocity;
		this.#latchStartTime = now;
		this.#latchOmega = SPRING_OMEGA; // pointer-release latch always runs at this
	}

	#endGesture(): void {
		this.inGesture = false;
		this.#motionRafId = null;
		this.#velocity = 0;
		this.scheduleIdleDrift();
	}

	// ONE rAF loop, three regimes — see the class-level doc comment.
	#motionTick = (now: number): void => {
		const dt = Math.min(now - this.#lastFrameTime, 50); // clamp a stalled/backgrounded frame
		this.#lastFrameTime = now;

		if (this.#motionPhase === 'drift') {
			this.offset += DRIFT_VELOCITY_PER_MS * dt;
			this.#absorbWholeSteps();
			this.#motionRafId = requestAnimationFrame(this.#motionTick);
			return;
		}

		if (this.#motionPhase === 'coast') {
			this.#velocity *= Math.exp(-dt / MOMENTUM_TAU_MS);
			this.offset += this.#velocity * dt;
			this.#absorbWholeSteps();
			if (Math.abs(this.#velocity) < VELOCITY_EPSILON) {
				// Falls through into the latch spring's own t=0 frame in
				// this same tick — no extra rAF wait, so there's no pause
				// at the handoff.
				this.#beginLatch(now);
			} else {
				this.#motionRafId = requestAnimationFrame(this.#motionTick);
				return;
			}
		}

		// Critically-damped harmonic oscillator, closed-form solution for
		// y'' + 2*omega*y' + omega^2*y = 0 with y0/v0 as initial
		// conditions — not per-frame Euler integration, which would need
		// its own stability check against omega:
		//   y(t) = e^(-omega*t) * (y0 + (v0 + omega*y0) * t)
		//   v(t) = e^(-omega*t) * (v0 - omega*t*(v0 + omega*y0))
		const t = Math.max(0, now - this.#latchStartTime); // clamped: see #driveMotion's own note
		const decay = Math.exp(-this.#latchOmega * t);
		const b = this.#latchV0 + this.#latchOmega * this.#latchY0;
		const y = decay * (this.#latchY0 + b * t);
		const v = decay * (this.#latchV0 - this.#latchOmega * t * b);
		this.offset = this.#latchTarget + y;
		this.#velocity = v; // kept live so a retarget mid-latch has a real velocity to carry over
		this.#latchTarget -= this.#absorbWholeSteps();

		if (Math.abs(y) < LATCH_DONE_EPSILON && Math.abs(v) < VELOCITY_EPSILON) {
			// Land exactly on the integer, not the spring's asymptotic
			// tail, then fold it in one last time so offset always ends a
			// gesture at exactly 0.
			this.offset = this.#latchTarget;
			this.#absorbWholeSteps();
			this.#endGesture();
			return;
		}
		this.#motionRafId = requestAnimationFrame(this.#motionTick);
	};

	#settleInstant(): void {
		this.offset = Math.round(this.offset);
		this.#absorbWholeSteps();
		this.#endGesture();
	}

	// Button-driven motion (next/prev/goTo/jumpTo) drives the exact same
	// continuous spring the pointer-release latch does, through this one
	// entry point. With y0/v0 chosen so b = v0 + omega*y0 is exactly 0
	// (the default `kick`), the spring degenerates to pure exponential
	// decay — maximum speed at t=0 (no ease-in), smoothly to zero at the
	// target (all ease-out). A press that interrupts already-moving motion
	// instead carries over the REAL, live velocity, so repeated presses
	// accelerate through fluidly instead of restarting from a dead stop.
	#driveMotion(target: number, omega = BUTTON_SPRING_OMEGA, kick = 1): void {
		const now = performance.now();

		if (prefersReducedMotion()) {
			this.cancelMotion();
			this.inGesture = true;
			this.offset = target;
			this.#absorbWholeSteps();
			this.#endGesture();
			return;
		}

		// "Already moving" is a velocity test, not the inGesture flag
		// alone — a plain click already runs a complete zero-distance
		// "drag" first (onPointerDown/onWindowPointerUp), leaving
		// inGesture true with velocity 0 in the same tick a click handler
		// then calls this. Testing inGesture alone would seed every real
		// click's spring from a dead stop, silently defeating `kick`.
		const y0 = this.offset - target;
		const isMoving = this.inGesture && Math.abs(this.#velocity) > VELOCITY_EPSILON;
		const v0 = isMoving ? this.#velocity : -kick * omega * y0;

		this.inGesture = true;
		this.#motionPhase = 'latch';
		this.#latchTarget = target;
		this.#latchY0 = y0;
		this.#latchV0 = v0;
		this.#latchStartTime = now;
		this.#latchOmega = omega;

		this.cancelMotion();
		this.#motionRafId = requestAnimationFrame(this.#motionTick);
	}

	/** Moves relative to wherever the fan is already headed — its current
	 * latch target if one is live, or its resting position otherwise — so
	 * a rapid double `next()` extends the same journey by one more step
	 * instead of each press fighting over its own separate target. */
	driveBy(delta: number): void {
		const baseTarget =
			this.inGesture && this.#motionPhase === 'latch' ? this.#latchTarget : Math.round(this.offset);
		this.#driveMotion(baseTarget + delta);
	}

	next(): void {
		this.driveBy(-1);
	}
	prev(): void {
		this.driveBy(1);
	}

	/** Absolute navigation to render-index `i` — dots and click-to-jump
	 * both go through this. `omega`/`kick` default to the button curve;
	 * `jumpTo` below passes its own, faster one. */
	goTo(i: number, omega = BUTTON_SPRING_OMEGA, kick = 1): void {
		this.#driveMotion(-this.positions[i]!, omega, kick);
	}

	/** Side-card click-to-centre — a faster, more ease-out curve than
	 * next()/prev()/goTo's default. */
	jumpTo(i: number): void {
		if (this.#dragMoved) return; // a mouse drag ending in a click shouldn't also jump
		this.goTo(i, JUMP_SPRING_OMEGA, JUMP_KICK);
	}

	// --- Hover band (grab-cursor affordance, desktop only in practice —
	// inert on touch). ---

	#hoverRafId: number | null = null;
	#pendingHoverY = 0;

	onFanHoverMove = (e: PointerEvent): void => {
		if (this.dragging) return; // --dragging already owns the cursor; band is irrelevant
		this.#pendingHoverY = e.clientY;
		if (this.#hoverRafId !== null) return;
		this.#hoverRafId = requestAnimationFrame(() => {
			this.#hoverRafId = null;
			const band = this.#getCardBandY();
			this.cursorInBand =
				band !== null && this.#pendingHoverY >= band.top && this.#pendingHoverY <= band.bottom;
		});
	};

	onFanHoverLeave = (): void => {
		if (this.#hoverRafId !== null) {
			cancelAnimationFrame(this.#hoverRafId);
			this.#hoverRafId = null;
		}
		this.cursorInBand = false;
	};

	// --- Drag gesture: pointerdown -> window pointermove/up/cancel. ---

	onPointerDown = (e: PointerEvent): void => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const band = this.#getCardBandY();
		if (band && (e.clientY < band.top || e.clientY > band.bottom)) return;
		this.cancelMotion(); // take over from wherever a running motion currently is
		this.dragging = true;
		this.inGesture = true;
		this.#dragMoved = false;
		this.#dragStartX = e.clientX;
		this.#dragStartY = e.clientY;
		this.#dragBaseOffset = this.offset;
		this.#moveHistory = [{ x: e.clientX, t: e.timeStamp }];
		window.addEventListener('pointermove', this.#onWindowPointerMove);
		window.addEventListener('pointerup', this.#onWindowPointerUp);
		window.addEventListener('pointercancel', this.#onWindowPointerCancel);
	};

	// rAF-throttled to one state write per frame — touch sampling commonly
	// outpaces the display, and writing on every raw pointer event reads
	// as choppy rather than smooth.
	#onWindowPointerMove = (e: PointerEvent): void => {
		if (!this.dragging) return;
		const dx = e.clientX - this.#dragStartX;
		const dy = e.clientY - this.#dragStartY;
		if (Math.hypot(dx, dy) > DRAG_SLOP_PX) this.#dragMoved = true;
		// Undecided-intent moves (still mostly vertical) don't drive the
		// fan yet, so an in-progress vertical scroll doesn't creep sideways.
		if (Math.abs(dx) <= Math.abs(dy)) return;
		this.#moveHistory.push({ x: e.clientX, t: e.timeStamp });
		const cutoff = e.timeStamp - VELOCITY_WINDOW_MS;
		while (this.#moveHistory.length > 2 && this.#moveHistory[0]!.t < cutoff) {
			this.#moveHistory.shift();
		}
		this.#pendingDx = dx;
		if (this.#dragRafId === null) {
			this.#dragRafId = requestAnimationFrame(() => {
				this.#dragRafId = null;
				this.offset = this.#dragBaseOffset + this.#pendingDx / this.#pxPerStep;
				// Recycle DURING the drag, not only after release — a drag
				// spanning more than `count` cards must keep producing
				// cards the whole time it's held.
				this.#dragBaseOffset -= this.#absorbWholeSteps();
			});
		}
	};

	#endDrag(): void {
		this.dragging = false;
		if (this.#dragRafId !== null) {
			cancelAnimationFrame(this.#dragRafId);
			this.#dragRafId = null;
		}
		window.removeEventListener('pointermove', this.#onWindowPointerMove);
		window.removeEventListener('pointerup', this.#onWindowPointerUp);
		window.removeEventListener('pointercancel', this.#onWindowPointerCancel);

		let velocityPxPerMs = 0;
		if (this.#moveHistory.length >= 2) {
			const first = this.#moveHistory[0]!;
			const last = this.#moveHistory[this.#moveHistory.length - 1]!;
			const dt = last.t - first.t;
			if (dt > 0) velocityPxPerMs = (last.x - first.x) / dt;
		}
		this.#velocity = velocityPxPerMs / this.#pxPerStep;

		if (prefersReducedMotion()) {
			this.#settleInstant();
			return;
		}
		// Every release coasts now — a gentle release just coasts a very
		// short distance before VELOCITY_EPSILON hands it to the latch
		// spring almost immediately.
		this.#beginMotion();
	}

	#onWindowPointerUp = (): void => {
		this.#endDrag();
	};

	#onWindowPointerCancel = (): void => {
		this.#endDrag();
	};

	/** Capture-phase click guard for the fan itself — a mouse drag ends in
	 * a `click` on whatever sat under the pointer, so without this a
	 * desktop drag-follow ending over a card's own link would also
	 * navigate on release. Wire to `onclickcapture` on the fan element. */
	onFanClickCapture = (e: MouseEvent): void => {
		// e.detail > 0 excludes a keyboard-synthesised click (Tab + Enter),
		// which never had a preceding drag and must still navigate.
		if (this.#dragMoved && e.detail > 0) {
			e.preventDefault();
		}
	};

	/** What a click on card `i` means. Centre card (slot 0): fires
	 * `onCentreCardClick` for a real pointer click (a keyboard Enter
	 * navigates the card's own href directly instead — centring would
	 * strand a keyboard user who can't then re-activate to open it).
	 * Every other card: centres itself instead of following its href. */
	onCardClick = (e: MouseEvent, i: number): void => {
		if (this.positions[i] === 0) {
			// onFanClickCapture already preventDefault()s a drag's
			// trailing click — reuse that signal instead of re-testing
			// dragMoved a second time.
			if (e.defaultPrevented) return;
			this.#opts.onCentreCardClick?.(e, i % this.itemCount);
			return;
		}
		if (e.detail === 0) return; // keyboard: navigate directly
		e.preventDefault();
		this.jumpTo(i);
	};

	// --- Lifecycle. ---

	/** Call from the consuming component's onMount. Measures real
	 * geometry, starts the idle-drift countdown (a never-touched carousel
	 * is exactly as "idle" as one touched once and left alone), and pauses
	 * everything while the tab is hidden. Returns a cleanup function —
	 * `onMount(() => carousel.mount())` works directly, since Svelte's
	 * onMount already supports a callback that itself returns cleanup. */
	mount(): () => void {
		this.remeasurePxPerStep();
		const onResize = () => this.remeasurePxPerStep();
		window.addEventListener('resize', onResize);

		this.scheduleIdleDrift();

		function isHidden() {
			return typeof document !== 'undefined' && document.hidden;
		}
		const onVisibilityChange = () => {
			if (isHidden()) {
				this.cancelMotion();
			} else {
				this.scheduleIdleDrift();
			}
		};
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', onVisibilityChange);
		}

		return () => {
			window.removeEventListener('resize', onResize);
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', onVisibilityChange);
			}
			this.cancelMotion();
		};
	}
}

export function createCarouselEngine(opts: CarouselEngineOptions): CarouselEngine {
	return new CarouselEngine(opts);
}
