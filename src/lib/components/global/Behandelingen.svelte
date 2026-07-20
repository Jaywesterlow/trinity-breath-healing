<script lang="ts">
	import { onMount } from 'svelte';
	import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel';
	import { BRAND } from '$lib/constants/brand';

	// Embla's own AutoScroll plugin only supports a constant velocity with no
	// ease-in/out, and its speed isn't live-adjustable after init (confirmed by
	// reading its source — no shortcut exists, see conversation history). So the
	// ticker is hand-rolled here: a custom ScrollBody that *composes* over
	// Embla's own default one (engine.scrollBody) — native drag/snap/settle
	// physics keep working untouched, and the ticking offset is layered on top,
	// scaled by an eased 0→1 "velocity factor" that ramps whenever play()/stop()
	// is called. This is the pattern from davidjerleke/embla-carousel discussion
	// #1320, verified against our installed embla-carousel@8.6.0 types.
	const CRUISE_SPEED = 0.5; // px per tick at full speed — matches the old plugin's `speed`
	const HOVER_FACTOR = 0.3; // ticker speed while hovered — slows instead of stopping, so it never fights a drag
	const RAMP_MS = 500; // ease-in/out duration
	const RESUME_DELAY_MS = 750; // minimum pause before resuming after a real stop (drag only — hover no longer counts as a stop)

	function easeInOutQuad(t: number): number {
		return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	}

	const ICONS: Record<string, string> = {
		'mahatma-healing': '/images/card-mahatma-healing.svg',
		goldhealing: '/images/card-goldhealing.svg',
		'raster-energie': '/images/infinity.png',
		'spinal-touch': '/images/card-spinal-touch.svg'
	};

	const CARD_COUNT = 7;

	const items = Array.from({ length: CARD_COUNT }, (_, i) => {
		const service = BRAND.services[i];
		return service
			? { key: service.slug, icon: ICONS[service.slug] }
			: { key: `filler-${i}`, icon: null };
	});

	let viewportNode: HTMLDivElement | undefined = $state();
	let selectedIndex = $state(0);
	// Self-calibrating: measured from real time between 'select' events, so the
	// active dot's ring duration always matches the actual (steady) scroll speed
	// instead of a guessed constant.
	let cycleDurationMs = $state(2500);
	let emblaApi: EmblaCarouselType | undefined;
	// Set right before any manually-triggered index change (drag release, dot
	// click). The interval leading up to a manual jump isn't a real cruise
	// cycle, so it must not be recorded as the next ring's duration — that was
	// making the ring show an arbitrary (often much too long) time right after
	// any manual interaction.
	let suppressNextDurationUpdate = false;

	function goToSlide(i: number): void {
		suppressNextDurationUpdate = true;
		// No explicit direction → Embla's own shortcut() picks whichever way
		// (forward or backward through the loop) is the shorter distance.
		emblaApi?.scrollTo(i);
	}

	onMount(() => {
		if (!viewportNode) return;

		// skipSnaps: by default Embla's drag-release always clamps a flick to
		// exactly the adjacent slide (see allowedForce() in embla-carousel core —
		// it hard-codes index±1 for any flick past the threshold, regardless of
		// velocity). skipSnaps lets force scale with the flick instead, so a hard
		// swipe travels multiple cards before settling, instead of always
		// snapping to the nearest one.
		emblaApi = EmblaCarousel(viewportNode, { loop: true, watchDrag: true, skipSnaps: true });
		// Embla watches the container and every slide with a ResizeObserver and
		// calls reInit() on any ≥0.5px size change (window resize, our own
		// --card-size breakpoint at 1024px, even layout settling after fonts
		// load) — reInit() builds a BRAND NEW internal engine object. `engine`
		// and `defaultScrollBody` are therefore `let`, re-pointed by wireEngine()
		// on every 'reInit', not just once at mount — otherwise the composed
		// scrollBody below is wired to an engine Embla has already discarded, and
		// the ticker goes silently, permanently dead on the next resize.
		let engine = emblaApi.internalEngine();
		let defaultScrollBody = engine.scrollBody;

		let rampFrom = 0;
		let rampTo = 0;
		let rampStart = performance.now();
		let currentFactor = 0;
		let resumeTimer = 0;
		let isDragging = false;
		let isHovering = false;
		// TEMP DEBUG — remove once fresh-load freeze is confirmed/fixed.
		let __debugSeekCount = 0;
		let __debugStart = performance.now();

		function setTargetFactor(target: number): void {
			rampFrom = currentFactor;
			rampTo = target;
			rampStart = performance.now();
		}

		// Eases toward whatever the current drag/hover state calls for, with no
		// artificial delay — used for hover enter/leave, which only ever slows
		// the ticker, never stops it, so there's nothing to "wait out" here.
		function easeToCurrentState(): void {
			window.clearTimeout(resumeTimer);
			setTargetFactor(isHovering ? HOVER_FACTOR : 1);
		}

		// Immediate, no ease-out — used for drag start, where the user needs
		// instant control handoff rather than the ticker coasting under their
		// finger while it eases down.
		function hardStopTicking(): void {
			window.clearTimeout(resumeTimer);
			rampFrom = 0;
			rampTo = 0;
			currentFactor = 0;
		}

		// Only used after a real stop (drag release) — keeps the "minimum pause
		// before it moves again" behavior, then eases to the hover speed if the
		// cursor is still over the carousel after the drop, or full speed otherwise.
		function startTickingAfterDelay(): void {
			window.clearTimeout(resumeTimer);
			resumeTimer = window.setTimeout(() => {
				// Embla's own render loop calls engine.animation.stop() whenever it
				// judges the carousel "settled and idle" — and because our seek()
				// always syncs target to location, that judgement fires almost every
				// time the ticker pauses (hover, drag, ease-out reaching 0). Nothing
				// else ever restarts that loop, so without this the ramp state below
				// updates correctly but nothing is left calling seek() to apply it —
				// the carousel silently never moves again. start() is a no-op if the
				// loop is already running, so it's always safe to call here.
				engine.animation.start();
				setTargetFactor(isHovering ? HOVER_FACTOR : 1);
				// TEMP DEBUG — remove once fresh-load freeze is confirmed/fixed.
				console.log(
					`[carousel-debug] resume timer FIRED t=${performance.now().toFixed(0)} rampTo=${rampTo}`
				);
			}, RESUME_DELAY_MS);
		}

		function emitSelectIfIndexChanged(): void {
			// The only place embla-carousel's core emits 'select' is inside
			// ScrollTo.scrollTo() (explicit navigation calls) — our ticker moves
			// location/target directly and never goes through that, so without this
			// the pagination/active-card never update from the ticker's own
			// continuous motion, only from manual interaction. Replicates the same
			// per-frame index check the stock AutoScroll plugin did internally.
			const currentIndex = engine.scrollTarget.byDistance(0, false).index;
			if (engine.index.get() !== currentIndex) {
				engine.indexPrevious.set(engine.index.get());
				engine.index.set(currentIndex);
				emblaApi!.emit('select');
			}
		}

		// Re-run on mount AND on every 'reInit' (see the note above) — rebuilds
		// the composed scrollBody against whichever engine object is currently
		// live, so a resize never silently kills the ticker.
		function wireEngine(): void {
			// TEMP DEBUG — remove once fresh-load freeze is confirmed/fixed.
			console.log(`[carousel-debug] wireEngine() called t=${performance.now().toFixed(0)}`);
			engine = emblaApi!.internalEngine();
			defaultScrollBody = engine.scrollBody;
			engine.scrollBody = {
				...defaultScrollBody,
				seek: () => {
					defaultScrollBody.seek(); // keep Embla's native drag/snap/settle physics intact
					const elapsed = performance.now() - rampStart;
					const t = Math.min(1, elapsed / RAMP_MS);
					currentFactor = rampFrom + (rampTo - rampFrom) * easeInOutQuad(t);
					// Only add our own offset once the NATIVE physics is actually at rest.
					// A hard flick's momentum decay (drag release) can take well over a
					// second to satisfy Embla's own settled() check (measured directly —
					// not assumed) — our resume timer fires on its own fixed schedule
					// regardless, and without this guard we'd immediately overwrite
					// target with location mid-glide, killing the native momentum
					// animation dead in place. This is exactly "let go and it just stops
					// on one card." Gating on settled() means we simply wait our turn;
					// once native motion is genuinely done, our ramp (which keeps
					// progressing in the background) applies immediately.
					if (currentFactor > 0.0001 && defaultScrollBody.settled()) {
						const delta = -CRUISE_SPEED * currentFactor;
						engine.location.add(delta);
						engine.target.set(engine.location);
						// This is the exact moment genuine ticker motion resumes after any
						// manual action (drag or dot click) — clearing the suppression flag
						// here, rather than on "the next select event", is deliberate: our
						// per-frame index tracking fires additional 'select' events all
						// through a settle-glide (dot click included, not just drag), and
						// those intermediate events have no reliable "last one" to hang a
						// reset on — index can stop changing before settled() flips true,
						// leaving nothing to clear a select-triggered flag. Tying it to this
						// gate instead means it clears exactly when real cruising resumes.
						suppressNextDurationUpdate = false;
					}
					emitSelectIfIndexChanged();
					// TEMP DEBUG — remove once fresh-load freeze is confirmed/fixed.
					// Logs every seek() call for the first 2s after mount, then every
					// ~150ms after that — proves whether the animation loop is even
					// running, and if so what factor/settled()/loc/target look like.
					__debugSeekCount++;
					const __t = performance.now() - __debugStart;
					if (__t < 2000 || __debugSeekCount % 10 === 0) {
						console.log(
							`[carousel-debug] seek t=${__t.toFixed(0)} factor=${currentFactor.toFixed(4)} ` +
								`settled=${defaultScrollBody.settled()} rampFrom=${rampFrom.toFixed(2)} rampTo=${rampTo.toFixed(2)} ` +
								`loc=${engine.location.get().toFixed(2)} tgt=${engine.target.get().toFixed(2)}`
						);
					}
					return engine.scrollBody;
				}
			};
			engine.animation.start();
		}
		wireEngine();
		emblaApi.on('reInit', wireEngine);
		startTickingAfterDelay();

		const onPointerDown = (): void => {
			isDragging = true;
			suppressNextDurationUpdate = true;
			hardStopTicking();
		};
		const onPointerUp = (): void => {
			isDragging = false;
			startTickingAfterDelay();
		};
		const onMouseEnter = (): void => {
			isHovering = true;
			if (!isDragging) easeToCurrentState();
		};
		const onMouseLeave = (): void => {
			isHovering = false;
			if (!isDragging) easeToCurrentState();
		};
		viewportNode.addEventListener('pointerdown', onPointerDown);
		viewportNode.addEventListener('pointerup', onPointerUp);
		viewportNode.addEventListener('mouseenter', onMouseEnter);
		viewportNode.addEventListener('mouseleave', onMouseLeave);

		let lastSelectTime = performance.now();
		const onSelect = (): void => {
			const now = performance.now();
			const delta = now - lastSelectTime;
			// suppressNextDurationUpdate is cleared inside the seek() gate above, once
			// genuine ticker motion resumes — not here. See the comment there for why.
			if (delta > 50 && !suppressNextDurationUpdate) cycleDurationMs = delta;
			lastSelectTime = now;
			selectedIndex = emblaApi!.selectedScrollSnap();
		};
		emblaApi.on('select', onSelect);

		return () => {
			window.clearTimeout(resumeTimer);
			viewportNode?.removeEventListener('pointerdown', onPointerDown);
			viewportNode?.removeEventListener('pointerup', onPointerUp);
			viewportNode?.removeEventListener('mouseenter', onMouseEnter);
			viewportNode?.removeEventListener('mouseleave', onMouseLeave);
			emblaApi?.destroy();
		};
	});
</script>

<section class="treatments" aria-label="Behandelingen">
	<header class="treatments__header">
		<p class="treatments__eyebrow">Diensten</p>
		<h2 class="treatments__heading">
			Elke behandeling is uniek, met een centraal doel: jouw herstel.
		</h2>
	</header>

	<div class="treatments__carousel-wrap">
		<div class="embla">
			<div class="embla__viewport" bind:this={viewportNode}>
				<ul class="embla__container">
					{#each items as item, i (item.key)}
						<li class="embla__slide">
							<div
								class="embla__slide__card"
								class:embla__slide__card--active={i === selectedIndex}
							>
								{#if item.icon}
									<img src={item.icon} alt="" aria-hidden="true" class="embla__slide__icon" />
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<ul class="treatments__dots">
			{#each items as item, i (item.key)}
				<li class="treatments__dot">
					<button
						type="button"
						class="treatments__dot-visual"
						class:treatments__dot-visual--active={i === selectedIndex}
						aria-label={`Ga naar kaart ${i + 1}`}
						onclick={() => goToSlide(i)}
					></button>
					{#if i === selectedIndex}
						<svg class="treatments__dot-ring" viewBox="0 0 20 20">
							<circle cx="10" cy="10" r="8.5" style="animation-duration: {cycleDurationMs}ms"
							></circle>
						</svg>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.treatments {
		background: var(--color-bg-sand);
		min-height: 70vh; /* 30% less than desktop's 100vh on mobile */
		display: flex;
		flex-direction: column;
		padding: var(--space-16) 0 var(--space-8);
	}

	.treatments__header {
		max-width: 24rem;
		margin: 0 auto var(--space-8);
		padding: 0 var(--space-6);
		text-align: center;
	}

	.treatments__carousel-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
	}

	.treatments__dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Grid-stacking: dot-visual and dot-ring are two separate elements placed
	   in the SAME single grid cell (both grid-area: 1 / 1) and centered via
	   place-items — concentricity is guaranteed by the grid, not by hand-
	   computed inset/rem math (which drifted out of sync before). Fixed cell
	   size (matching the ring's footprint) so the row never jitters when the
	   ring appears/disappears on the active dot. */
	.treatments__dot {
		display: grid;
		place-items: center;
		width: 0.7rem;
		height: 0.7rem;
	}

	.treatments__dot-visual {
		grid-area: 1 / 1;
		width: 0.4rem;
		height: 0.4rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-fg-forest);
		background: transparent;
		padding: 0;
		appearance: none;
		cursor: pointer;
		transition: background-color var(--motion-fast);
	}

	.treatments__dot-visual--active {
		background: var(--color-fg-forest);
	}

	/* Ring starts empty at 12 o'clock and sweeps clockwise; duration is bound
	   per-instance to the live-measured scroll cadence (see cycleDurationMs).
	   Recreated fresh each time a new dot becomes active
	   ({#if i === selectedIndex}), so it always restarts at 0. */
	.treatments__dot-ring {
		grid-area: 1 / 1;
		width: 0.7rem;
		height: 0.7rem;
		/* global.css resets svg { max-width: 100%; height: auto } — max-width
		   isn't overridden by width's specificity, so it still clamps this
		   grid item down to the dot-visual's tiny content size. Neutralize it. */
		max-width: none;
		overflow: visible;
	}

	.treatments__dot-ring circle {
		fill: none;
		stroke: var(--color-fg-forest);
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-dasharray: 53.407;
		stroke-dashoffset: 53.407;
		transform: rotate(-90deg);
		transform-origin: center;
		animation: treatments-ring-fill linear forwards;
	}

	@keyframes treatments-ring-fill {
		to {
			stroke-dashoffset: 0;
		}
	}

	.treatments__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.treatments__heading {
		max-width: 20rem;
		margin: 0 auto;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.treatments {
			min-height: 100vh;
		}

		.treatments__header {
			max-width: none;
		}

		.treatments__heading {
			max-width: 34rem;
		}
	}

	/* --- Embla carousel: structure/behavior ported from the Embla
	   "Auto Scroll" vanilla example; colors/decoration swapped for this
	   project's tokens, nav/play controls and per-card labels removed,
	   rotation padded to 7 cards for uninterrupted continuous scroll.
	   Container = 5 cards + 4 gaps + 1 extra card-length, and that extra
	   card-length is split evenly into the two edge fades (each fade grows
	   by half a card) so cards fade in/out more gradually; the fully-clear
	   middle still shows ~5 cards. --- */

	.embla {
		position: relative;
		--card-size: 3rem;
		--gap: var(--space-4);
		--slide-total: calc(var(--card-size) + var(--gap));
		width: calc(5 * var(--slide-total) - var(--gap) + var(--card-size));
		max-width: 100%;
		margin: 0 auto;
		/* half a card, +10%, plus half of the extra card-length added above */
		--fade-width: calc(var(--card-size) * 1.05);
	}

	.embla::before,
	.embla::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		/* +2px overscan: sub-pixel layout rounding (esp. at fractional device
		   pixel ratios) can leave .embla and .embla__viewport's edges a
		   fraction of a pixel apart, exposing a hairline of card under the
		   gradient. Extending past the true edge onto the same-color section
		   background absorbs that rounding with no visible cost. */
		width: calc(var(--fade-width) + 2px);
		z-index: 2;
		pointer-events: none;
	}

	.embla::before {
		left: -2px;
		background: linear-gradient(
			to right,
			var(--color-bg-sand) 0%,
			var(--color-bg-sand) 42%,
			transparent 100%
		);
	}

	.embla::after {
		right: -2px;
		background: linear-gradient(
			to left,
			var(--color-bg-sand) 0%,
			var(--color-bg-sand) 42%,
			transparent 100%
		);
	}

	.embla__viewport {
		overflow: hidden;
		cursor: grab;
	}

	.embla__viewport:active {
		cursor: grabbing;
	}

	.embla__container {
		display: flex;
		touch-action: pan-y pinch-zoom;
		margin-left: calc(var(--gap) * -1);
		list-style: none;
		padding: var(--space-2) 0;
	}

	.embla__slide {
		transform: translate3d(0, 0, 0);
		flex: 0 0 var(--slide-total);
		min-width: 0;
		padding-left: var(--gap);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.embla__slide__card {
		width: var(--card-size);
		height: var(--card-size);
		border-radius: var(--radius-md);
		background: var(--color-fg-forest);
		padding: var(--space-2);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform var(--motion-base);
	}

	.embla__slide__card--active {
		transform: scale(1.2);
	}

	.embla__slide__icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	@media (min-width: 1024px) {
		.embla {
			--card-size: 6.25rem;
		}

		.embla__slide__card {
			border-radius: var(--radius-lg);
		}
	}
</style>
