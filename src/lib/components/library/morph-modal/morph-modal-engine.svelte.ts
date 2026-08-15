/**
 * MorphModalEngine — the animation/behaviour half of MorphModal.svelte.
 *
 * Extracted from Trinity Breath & Healing's Behandelingen carousel (a
 * service-detail modal that grows out of a clicked card and shrinks back
 * into it). MorphModal.svelte stays deliberately dumb (markup/layout only,
 * same split TreatmentCard used in the original project); everything about
 * *when* things fade, grow, or shrink lives here, as a plain class so it
 * can be constructed once per usage site and bound straight into the
 * component's props.
 *
 * Two project-specific couplings were generalized on extraction so this is
 * usable outside Behandelingen's own carousel:
 *   - `getOriginEl`/`itemCount` replace the original's direct references to
 *     the carousel's own pivot-element lookup and service count.
 *   - `originFaceSelector` replaces a hardcoded TreatmentCard selector
 *     ('.tcard__icon-wrap, .tcard__bottom') — pass your own card's face
 *     selector, or omit it to skip the origin-face fade step entirely (the
 *     modal still opens/closes fine without it, just without that extra
 *     polish beat).
 *   - `onIndexChange` replaces a direct call into the carousel's own goTo()
 *     spring-latch — wire it to whatever (if anything) needs to stay in
 *     sync with the modal's current index.
 *
 * Usage (see this folder's README.md for the full walkthrough):
 *
 *   const modal = createMorphModalEngine({
 *     itemCount: items.length,
 *     getOriginEl: (i) => cardEls[i],
 *     originFaceSelector: '.card__icon, .card__bottom'
 *   });
 *   onDestroy(() => modal.destroy());
 *
 *   <MorphModal
 *     items={items}
 *     activeIndex={modal.index}
 *     bind:dialogRef={modal.dialogEl}
 *     bind:contentRef={modal.contentEl}
 *     bind:backdropRef={modal.backdropEl}
 *     onPrev={() => modal.prev()}
 *     onNext={() => modal.next()}
 *     onClose={() => modal.close()}
 *     onCancel={(e) => modal.onCancel(e)}
 *     onBackdropClick={(e) => modal.onBackdropClick(e)}
 *     onContentPointerDown={(e) => modal.onContentPointerDown(e)}
 *     onContentClickCapture={(e) => modal.onContentClickCapture(e)}
 *   />
 *
 * onclick={(e) => cardEls[i] && modal.open(cardEls[i], i)} on whatever
 * triggers the open (a card, a thumbnail, a list row).
 */

import { tick } from 'svelte';

export interface MorphModalEngineOptions {
	/** Total number of items the modal can page through — Prev/Next/swipe
	 * wrap at this bound. */
	itemCount: number;
	/** Given an item index, return the DOM element the modal should morph
	 * out of on open and shrink back into on close (e.g. the clicked card).
	 * Return null if it can't be found (mid-session removal, a filtered-out
	 * item, etc.) — open/close still run, just as a plain fade-in-place
	 * instead of a morph from/to that element's rect. */
	getOriginEl: (index: number) => HTMLElement | null;
	/** CSS selector(s) for "face" elements INSIDE the origin element that
	 * should fade out just before the modal opens and fade back in just
	 * after it closes (queried via originEl.querySelectorAll). Omit to skip
	 * this step — the modal still works, just without that extra beat. */
	originFaceSelector?: string;
	/** Called whenever the active index changes (open, Prev/Next, swipe) —
	 * e.g. to keep an underlying carousel/list selection in sync. Optional. */
	onIndexChange?: (index: number) => void;
	/** Called once close() has actually finished (any path — the close
	 * button, Esc, or a backdrop click all route through the same close(),
	 * see its own comment). Use this rather than wrapping onClose yourself
	 * if you need a hook that also fires for Esc/backdrop-click, which
	 * bypass whatever function you hand to the `onClose` prop. Optional. */
	onClosed?: () => void;
}

// step 1 of open / last step of close — see the constructor doc above for
// why these live as static defaults rather than required options: every
// number here was owner-tuned against ONE modal, but they're deliberately
// legible/tunable in place (change the class field, not a call site) if a
// future usage wants different timing.
const CARD_FADE_MS = 150;
const BOX_GROW_MS = 400;
const CONTENT_FADE_MS = 250; // open fade-in + Prev/Next transition
const CLOSE_FADE_MS = 208; // 250 / 1.2 — close reads faster than open
const BOX_SHRINK_MS = 417; // 500 / 1.2, itself 400 * 1.25 before that —
// close's own box-shrink is deliberately slower (net) than growBox's own
// 400ms open-side duration even after the 1.2x speed-up.
const NAV_STAGGER_MS = 60;
const SWIPE_THRESHOLD_PX = 50; // well above ordinary touch jitter — has to
// reject a vertical scroll-with-a-little-horizontal-wobble, not just a tap.

// A literal copy of the ease-in-out curve driving every opacity fade below —
// WAAPI's `easing` option is parsed independently of any stylesheet, so a
// var() reference wouldn't resolve here even if one existed. Front-loaded
// curves (the browser's own ease, or an ease-out) read as "instantly
// vanishing" rather than fading on a short (150-250ms) opacity change —
// this one departs from rest instead, which is what actually reads as a
// fade.
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
// growBox's own curve — easings.net's "easeOutExpo". Noticeably stronger
// tail than a plain ease-out: the box keeps visibly slowing right up to the
// last frame instead of arriving early and sitting still.
const BOX_GROW_EASE_OUT = 'cubic-bezier(0.19, 1, 0.22, 1)';
// shrinkBox's ease-out is NOT a bezier curve — see shrinkBox's own comment.
// One legible knob: progress(t) = 1 - (1-t)^POWER. Raise it for a more
// drastic slow-down at the tail, lower it for a gentler one.
const BOX_SHRINK_EASE_POWER = 3;

function prefersReducedMotion(): boolean {
	// matchMedia is guarded, not assumed: this can run under a bare jsdom
	// test environment with no matchMedia, or during SSR with no window.
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setBodyScrollLocked(locked: boolean): void {
	// Guarded: this can run during SSR prerendering, where there's no
	// document. Explicit overflow:hidden, not relying on the dialog's own
	// native inert-the-page-but-not-scroll behaviour — showModal() makes the
	// rest of the page unclickable/unfocusable but does NOT reliably stop it
	// scrolling underneath in every engine.
	if (typeof document === 'undefined') return;
	document.body.style.overflow = locked ? 'hidden' : '';
}

export class MorphModalEngine {
	index = $state(0);
	dialogEl = $state<HTMLDialogElement | null>(null);
	contentEl = $state<HTMLElement | null>(null);
	backdropEl = $state<HTMLElement | null>(null);

	#opts: MorphModalEngineOptions;
	#animating = false; // guards re-entrancy — plain, not $state: nothing renders from it
	// Tracks the most recent fade Animation per element so a new call can
	// cancel it before starting its own — necessary, not defensive: without
	// this, a rapid open→close→open (or the reverse) can leave an old,
	// uncancelled animation still applying its finished opacity underneath
	// a newer one, which resurfaces the instant the newer one cancels
	// itself. See fadeElements' own doc below for the full failure mode
	// this was caught by.
	#lastFade = new WeakMap<HTMLElement, Animation>();
	#swipeStartX = 0;
	#swipeStartY = 0;
	#swiped = false; // read once by onContentClickCapture — see its own doc

	constructor(opts: MorphModalEngineOptions) {
		this.#opts = opts;
	}

	#navEls(): HTMLElement[] {
		if (!this.dialogEl) return [];
		return Array.from(
			this.dialogEl.querySelectorAll<HTMLElement>('.morph-modal__close, .morph-modal__nav')
		);
	}

	#originFaceEls(originEl: HTMLElement): HTMLElement[] {
		if (!this.#opts.originFaceSelector) return [];
		return Array.from(originEl.querySelectorAll<HTMLElement>(this.#opts.originFaceSelector));
	}

	// Fades one or more elements' opacity via the Web Animations API — never
	// node.style.transition, which would clobber whatever transition the
	// caller's own stylesheet already declares on these elements (e.g. a
	// hover-reveal). `instant` (prefers-reduced-motion) skips the animation
	// and writes the end state directly.
	//
	// `staggerMs` delays each element in `els` by its own index times this
	// value. `fill: 'both'`: a delayed animation with only 'forwards' fill
	// has no effect during its own delay, so a staggered fade-IN element
	// would sit at whatever opacity the cascade already gives it for the
	// length of its delay — visible immediately, stagger or not. 'both'
	// also fills backwards, holding keyframe 0 for the delay's duration,
	// which is what actually makes the stagger visible.
	//
	// Fading OUT is left in its animated end state on purpose — nothing
	// clears it, so the element stays hidden for as long as the modal is
	// open with no separate inline-style bookkeeping required. Fading IN
	// cancels its own animation once finished, handing the property back
	// to the normal CSS cascade — and also clears any leftover inline
	// opacity from an earlier INSTANT call (open's pre-hide, below):
	// cancelling only removes the WAAPI effect, so without clearing the
	// inline value too, an element instant-hidden via el.style.opacity =
	// '0' would cancel back down to that stale inline value instead of the
	// cascade's true resting opacity, snapping invisible again right after
	// it had just finished fading in.
	#fadeElements(
		els: HTMLElement[],
		visible: boolean,
		instant: boolean,
		duration: number,
		staggerMs = 0
	): Promise<void> {
		if (els.length === 0) return Promise.resolve();
		if (instant) {
			els.forEach((el) => {
				this.#lastFade.get(el)?.cancel();
				this.#lastFade.delete(el);
				el.style.opacity = visible ? '' : '0';
			});
			return Promise.resolve();
		}
		const anims = els.map((el, i) => {
			this.#lastFade.get(el)?.cancel();
			const anim = el.animate([{ opacity: visible ? 0 : 1 }, { opacity: visible ? 1 : 0 }], {
				duration,
				delay: staggerMs * i,
				easing: EASE_IN_OUT,
				fill: 'both'
			});
			this.#lastFade.set(el, anim);
			return anim;
		});
		return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
			if (visible) {
				anims.forEach((a) => a.cancel());
				els.forEach((el) => {
					this.#lastFade.delete(el);
					el.style.opacity = '';
				});
			}
		});
	}

	// Morphs the dialog box between two live rects — used for both the open
	// grow and (with `from`/`to` swapped) would work for the close shrink
	// too, but close uses #shrinkBox below instead: same idea, different
	// easing technique. top/left/width/height rather than a transform
	// matrix — simpler to get right for a one-shot, rare (open/close only)
	// animation, and easy to verify directly against getBoundingClientRect().
	#growBox(dialog: HTMLDialogElement, from: DOMRect, to: DOMRect): Promise<void> {
		const anim = dialog.animate(
			[
				{
					top: `${from.top}px`,
					left: `${from.left}px`,
					width: `${from.width}px`,
					height: `${from.height}px`
				},
				{
					top: `${to.top}px`,
					left: `${to.left}px`,
					width: `${to.width}px`,
					height: `${to.height}px`
				}
			],
			{ duration: BOX_GROW_MS, easing: BOX_GROW_EASE_OUT, fill: 'forwards' }
		);
		// Hand control back to the stylesheet once settled — the dialog's own
		// CSS should express its near-fullscreen size responsively (vh/vw),
		// which an inline WAAPI end-state would otherwise pin in place across
		// a later viewport resize.
		return anim.finished.then(
			() => anim.cancel(),
			() => {}
		);
	}

	// Close's own box-shrink — built from many small keyframes sampled off a
	// genuine ease-out power curve (BOX_SHRINK_EASE_POWER) rather than a
	// bezier, so "how drastic" stays one legible number. A first version
	// tried to fake the same shape with just 2 straight-line segments glued
	// together at a fixed point — a real velocity discontinuity, not an
	// ease, which read as a stutter partway through the close. Enough
	// samples here that consecutive segments are close enough in slope that
	// there's no such seam.
	#shrinkBox(dialog: HTMLDialogElement, from: DOMRect, to: DOMRect): Promise<void> {
		const SAMPLES = 24;
		const at = (t: number, a: number, b: number) => a + (b - a) * t;
		const keyframes = Array.from({ length: SAMPLES + 1 }, (_, i) => {
			const t = i / SAMPLES;
			const p = 1 - Math.pow(1 - t, BOX_SHRINK_EASE_POWER);
			return {
				top: `${at(p, from.top, to.top)}px`,
				left: `${at(p, from.left, to.left)}px`,
				width: `${at(p, from.width, to.width)}px`,
				height: `${at(p, from.height, to.height)}px`,
				offset: t
			};
		});
		const anim = dialog.animate(keyframes, {
			duration: BOX_SHRINK_MS,
			easing: 'linear',
			fill: 'forwards'
		});
		return anim.finished.then(
			() => anim.cancel(),
			() => {}
		);
	}

	// Opacity fade for a real element standing in for the dialog's native
	// ::backdrop — animating ::backdrop directly via WAAPI's pseudoElement
	// option worked in Chromium-based testing but was confirmed NOT to fade
	// on a real device; pseudo-element animation support through the Web
	// Animations API is real but inconsistent across browsers. A plain
	// el.animate() call on an actual element has no such gap.
	//
	// display is toggled here too: 'none' keeps this out of the hit-testing
	// tree while the modal is closed, and has to flip to 'block' BEFORE the
	// fade-in starts or there's nothing to animate.
	#fadeBackdrop(el: HTMLElement, visible: boolean, duration: number): Promise<void> {
		if (visible) el.style.display = 'block';
		// Same rapid-toggle protection #fadeElements' lastFade gives — cancel
		// any prior animation on this element before starting a new one, or a
		// still-active older effect can end up applying OVER this element's
		// own inline opacity once THIS animation later cancels itself.
		this.#lastFade.get(el)?.cancel();
		const anim = el.animate([{ opacity: visible ? 0 : 1 }, { opacity: visible ? 1 : 0 }], {
			duration,
			easing: EASE_IN_OUT,
			fill: visible ? 'both' : 'forwards'
		});
		this.#lastFade.set(el, anim);
		return anim.finished.then(
			() => {
				this.#lastFade.delete(el);
				if (visible) {
					// Cancelling only removes the WAAPI effect — with no inline
					// opacity of its own, the element falls back to its
					// stylesheet's resting opacity: 0, snapping invisible again
					// right as the rest of the open sequence is still finishing.
					// Pin the inline value first so cancel() has something
					// correct to fall back to.
					el.style.opacity = '1';
					anim.cancel();
				} else {
					el.style.display = 'none';
				}
			},
			() => {}
		);
	}

	/** Opens the modal for item `index`, morphing out of `originEl`. */
	async open(originEl: HTMLElement, index: number): Promise<void> {
		if (this.#animating) return;
		this.#animating = true;
		setBodyScrollLocked(true);

		const reduced = prefersReducedMotion();
		// Captured before the face-fade below touches opacity — hiding the
		// origin's inner content doesn't change its own outer box, but doing
		// this first keeps the intent ("where did the user click") obvious.
		const originRect = originEl.getBoundingClientRect();

		await this.#fadeElements(this.#originFaceEls(originEl), false, reduced, CARD_FADE_MS);

		this.index = index;
		this.#opts.onIndexChange?.(index);
		await tick();

		const dialog = this.dialogEl;
		if (!dialog) {
			// Pathological — the ref should always be bound by the time open()
			// can be called — but restore the origin's face rather than leave
			// it stuck invisible if it somehow occurs.
			await this.#fadeElements(this.#originFaceEls(originEl), true, true, 0);
			setBodyScrollLocked(false);
			this.#animating = false;
			return;
		}

		if (!reduced) {
			// Hide content and nav buttons BEFORE the dialog is shown at all —
			// otherwise their resting opacity (1) paints for real on
			// showModal()'s first frame, at the dialog's full stylesheet size,
			// before #growBox below has a chance to even start. Without this
			// instant pre-hide the box flashes full then snaps back down to
			// origin size as growBox's first keyframe takes over.
			this.#fadeElements(
				[...(this.contentEl ? [this.contentEl] : []), ...this.#navEls()],
				false,
				true,
				0
			);
		}

		dialog.showModal();

		if (reduced) {
			if (this.backdropEl) {
				this.backdropEl.style.display = 'block';
				this.backdropEl.style.opacity = '1';
			}
			this.#animating = false;
			return;
		}

		// Started here, alongside showModal(), not inside the Promise.all
		// below — the backdrop's own resting opacity is already 0, so there's
		// no flash to guard against; this just makes it fade in over the same
		// window the box is growing in, rather than starting late.
		const backdropIn = this.backdropEl
			? this.#fadeBackdrop(this.backdropEl, true, BOX_GROW_MS)
			: Promise.resolve();

		// One rAF so the dialog's own stylesheet-driven near-fullscreen size
		// is what gets measured below — showModal() alone doesn't yet reflect
		// post-layout geometry synchronously in every engine.
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const targetRect = dialog.getBoundingClientRect();

		await Promise.all([this.#growBox(dialog, originRect, targetRect), backdropIn]);
		// Content leads, then close/prev/next fade in one after another
		// (NAV_STAGGER_MS apart) — same fade, same easing, just staggered, so
		// the buttons read as part of the same reveal instead of popping in
		// ahead of it.
		await this.#fadeElements(
			[...(this.contentEl ? [this.contentEl] : []), ...this.#navEls()],
			true,
			false,
			CONTENT_FADE_MS,
			NAV_STAGGER_MS
		);
		this.#animating = false;
	}

	/** Closes the modal, shrinking back into the current item's origin element. */
	async close(): Promise<void> {
		if (this.#animating) return;
		this.#animating = true;

		const dialog = this.dialogEl;
		const reduced = prefersReducedMotion();
		const originEl = this.#opts.getOriginEl(this.index);

		if (!dialog) {
			this.#animating = false;
			return;
		}

		if (reduced) {
			dialog.close();
			if (this.backdropEl) this.backdropEl.style.display = 'none';
			if (originEl) await this.#fadeElements(this.#originFaceEls(originEl), true, true, 0);
			setBodyScrollLocked(false);
			this.#animating = false;
			this.#opts.onClosed?.();
			return;
		}

		const fromRect = dialog.getBoundingClientRect();
		// No sensible shrink target if the origin has somehow vanished from
		// the DOM mid-session — shrink toward its own current box instead of
		// throwing, which is visually a plain fade-out rather than a morph.
		const toRect = originEl ? originEl.getBoundingClientRect() : fromRect;

		// Content and nav buttons fade out TOGETHER (no stagger) — box-shrink
		// starts immediately after, with no added delay, since content
		// shrinking along with the box would crop it mid-fade.
		await this.#fadeElements(
			[...(this.contentEl ? [this.contentEl] : []), ...this.#navEls()],
			false,
			false,
			CLOSE_FADE_MS
		);
		await Promise.all([
			this.#shrinkBox(dialog, fromRect, toRect),
			this.backdropEl
				? this.#fadeBackdrop(this.backdropEl, false, BOX_SHRINK_MS)
				: Promise.resolve()
		]);

		dialog.close();
		if (originEl)
			await this.#fadeElements(this.#originFaceEls(originEl), true, false, CARD_FADE_MS);
		setBodyScrollLocked(false);
		this.#animating = false;
		this.#opts.onClosed?.();
	}

	async #step(delta: number): Promise<void> {
		// Same re-entrancy guard open/close use, for the same reason: without
		// it, a close pressed mid-transition could run its own fade
		// concurrently against this one, both targeting contentEl.
		if (this.#animating) return;
		this.#animating = true;

		const reduced = prefersReducedMotion();
		const nextIndex = (this.index + delta + this.#opts.itemCount) % this.#opts.itemCount;
		const content = this.contentEl ? [this.contentEl] : [];

		if (reduced) {
			this.index = nextIndex;
			this.#opts.onIndexChange?.(nextIndex);
			this.#animating = false;
			return;
		}

		await this.#fadeElements(content, false, false, CONTENT_FADE_MS);
		this.index = nextIndex;
		this.#opts.onIndexChange?.(nextIndex);
		await tick();
		await this.#fadeElements(content, true, false, CONTENT_FADE_MS);
		this.#animating = false;
	}

	next(): void {
		this.#step(1);
	}
	prev(): void {
		this.#step(-1);
	}

	// Esc fires 'cancel' and would close the native dialog INSTANTLY —
	// prevented so the animated close() above runs instead; the dialog only
	// actually closes once that sequence calls dialog.close() itself.
	onCancel(e: Event): void {
		e.preventDefault();
		this.close();
	}

	// A click that lands on the dialog element itself, not any of its
	// children, is a backdrop click — the dialog's own box IS the click
	// target in that case, since nothing inside it covers that point. (Kept
	// even though MorphModal.svelte's own backdrop div also has an onclick,
	// since the dialog's native ::backdrop click target still exists and a
	// pointer can land there in some layouts.)
	onBackdropClick(e: MouseEvent): void {
		if (e.target === this.dialogEl) this.close();
	}

	// Touch-only swipe-to-navigate (mouse/trackpad users already have
	// Prev/Next, and a mouse-drag gesture here would fight text selection
	// inside the content). Window-level pointerup/pointercancel, not a
	// listener on the content element itself: a real swipe can easily end
	// with the finger outside the element it started on.
	onContentPointerDown = (e: PointerEvent): void => {
		if (e.pointerType !== 'touch') return;
		this.#swipeStartX = e.clientX;
		this.#swipeStartY = e.clientY;
		window.addEventListener('pointerup', this.#onContentPointerUp);
		window.addEventListener('pointercancel', this.#onContentPointerCancel);
	};

	#endSwipeTracking(): void {
		window.removeEventListener('pointerup', this.#onContentPointerUp);
		window.removeEventListener('pointercancel', this.#onContentPointerCancel);
	}

	// Direction only, decided once on release — not a live drag-follow. dx >
	// 0 (finger moved right) means the PREVIOUS item; dx < 0 means NEXT,
	// matching the usual "swipe left to advance" convention.
	#onContentPointerUp = (e: PointerEvent): void => {
		this.#endSwipeTracking();
		const dx = e.clientX - this.#swipeStartX;
		const dy = e.clientY - this.#swipeStartY;
		// Predominantly horizontal AND past the threshold — an ordinary
		// vertical scroll has to pass through here untouched.
		if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
		this.#swiped = true;
		if (dx < 0) this.next();
		else this.prev();
	};

	#onContentPointerCancel = (): void => {
		this.#endSwipeTracking();
	};

	// A touch release synthesises a click on whatever sat under the finger —
	// without this, a swipe ending over a link or list item inside the
	// content would also fire that element's own click right after
	// navigating. Capture phase — the caller wires this to onclickcapture.
	onContentClickCapture = (e: MouseEvent): void => {
		if (this.#swiped) {
			e.preventDefault();
			this.#swiped = false;
		}
	};

	/** Call from the consuming component's onDestroy — releases the body
	 * scroll lock if the component is torn down (e.g. a client-side
	 * navigation) without close() having run first. */
	destroy(): void {
		setBodyScrollLocked(false);
	}
}

export function createMorphModalEngine(opts: MorphModalEngineOptions): MorphModalEngine {
	return new MorphModalEngine(opts);
}
