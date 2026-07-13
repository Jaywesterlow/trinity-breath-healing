<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';

	// Centerline trace of the Verdieping card's backdrop art, inlined so it draws itself when
	// the card scrolls into view. Regenerate with .planning/quick/20260713-hero-draw-on/trace/.
	import verdiepingSvg from '$lib/images/card-verdieping-bg.svg?raw';

	let pinEl: HTMLDivElement | null = $state(null);
	let cardsEl: HTMLUListElement | null = $state(null);
	let scrolljack = $state(false);
	let offset = $state(0);

	// 'disabled': matchMedia gate off (desktop or reduced-motion).
	// 'idle-before'/'idle-after': mobile mode active, native scroll, lock not engaged (yet / anymore).
	// 'locked': vertical scroll frozen, wheel/touch/keydown drive the card track.
	let phase: 'disabled' | 'idle-before' | 'locked' | 'idle-after' = $state('disabled');

	// Non-reactive: read/written inside imperative scroll/wheel/touch/keydown/resize handlers only.
	let maxOffset = 0;
	let lastTouchY = 0;
	// Tracks which side of the viewport's vertical center the pin's own center was on at
	// the last check — null until the first sample. A flip since the last sample means the
	// pin's center just crossed the viewport's middle, in either scroll direction.
	let wasAboveCenter: boolean | null = null;
	let triggerTicking = false;

	function computeMaxOffset() {
		return cardsEl ? Math.max(0, cardsEl.scrollWidth - cardsEl.clientWidth) : 0;
	}

	function onResize() {
		if (!scrolljack) return;
		maxOffset = computeMaxOffset();
		offset = Math.min(offset, maxOffset);
		if (cardsEl) cardsEl.scrollLeft = offset;
	}

	// Shared boundary/clamp/release-passthrough logic for wheel, touch, and keydown input.
	function applyDelta(rawDelta: number, event: WheelEvent | TouchEvent | KeyboardEvent) {
		const next = offset + rawDelta;

		if (next >= maxOffset && offset >= maxOffset) {
			// Already at (or past) the last card and still pushing forward — let this event
			// fall through to native scroll and release the lock going forward.
			releaseLock('forward');
			return;
		}

		if (next <= 0 && offset <= 0) {
			// Already at (or past) the first card and still pulling backward — release
			// symmetrically so upward scroll resumes.
			releaseLock('backward');
			return;
		}

		event.preventDefault();
		offset = Math.min(Math.max(next, 0), maxOffset);
		// Drive the native scroll position directly — a CSS transform on this same
		// overflow-hidden element would just slide the whole clipped box sideways as
		// a rigid unit instead of revealing the next card (transform moves the box's
		// own clip region along with it; scrollLeft moves content within a fixed box).
		if (cardsEl) cardsEl.scrollLeft = offset;
	}

	function onWheel(e: WheelEvent) {
		if (phase !== 'locked') return;

		let normalizedDelta = e.deltaY;
		if (e.deltaMode === 1) {
			// DOM_DELTA_LINE
			normalizedDelta *= 16;
		} else if (e.deltaMode === 2) {
			// DOM_DELTA_PAGE
			normalizedDelta *= window.innerHeight;
		}

		applyDelta(normalizedDelta, e);
	}

	function onTouchStart(e: TouchEvent) {
		if (phase !== 'locked') return;
		lastTouchY = e.touches[0]!.clientY;
	}

	function onTouchMove(e: TouchEvent) {
		if (phase !== 'locked') return;
		const currentY = e.touches[0]!.clientY;
		// Finger moving up (currentY decreases) = positive delta = forward/next-card
		// direction, matching wheel's deltaY sign convention.
		const rawDelta = lastTouchY - currentY;
		lastTouchY = currentY;
		applyDelta(rawDelta, e);
	}

	function onKeydown(e: KeyboardEvent) {
		if (phase !== 'locked') return;

		const active = document.activeElement;
		if (
			active instanceof HTMLInputElement ||
			active instanceof HTMLTextAreaElement ||
			active instanceof HTMLSelectElement ||
			(active as HTMLElement | null)?.isContentEditable
		) {
			return;
		}

		const cardWidth = cardsEl?.clientWidth ?? 300;
		let rawDelta: number;

		switch (e.key) {
			case ' ':
			case 'PageDown':
			case 'ArrowDown':
				rawDelta = cardWidth;
				break;
			case 'PageUp':
			case 'ArrowUp':
				rawDelta = -cardWidth;
				break;
			case 'Home':
				rawDelta = -offset;
				break;
			case 'End':
				rawDelta = maxOffset - offset;
				break;
			default:
				// Not a scroll-relevant key (includes Tab/Shift+Tab) — never intercepted.
				return;
		}

		applyDelta(rawDelta, e);
	}

	// Checks whether the pin's own vertical center just crossed the viewport's vertical
	// center since the last sample, engaging the lock if so. Driven by a scroll listener
	// (see onTriggerScroll) rather than IntersectionObserver: a rootMargin band thin enough
	// to approximate "exactly centered" fires unreliably in practice (confirmed empirically —
	// only the initial observe callback ever arrives, never subsequent crossings), and a band
	// wide enough to fire reliably re-introduces the original "triggers too early" bug this
	// is fixing. Direct position comparison is exact and reliable in both directions.
	function checkTriggerCrossing() {
		if (!pinEl || phase === 'locked') return;
		const rect = pinEl.getBoundingClientRect();
		const centerY = rect.top + rect.height / 2;
		const isAboveCenter = centerY < window.innerHeight / 2;
		if (wasAboveCenter !== null && isAboveCenter !== wasAboveCenter) {
			engageLock();
		}
		wasAboveCenter = isAboveCenter;
	}

	function onTriggerScroll() {
		if (triggerTicking) return;
		triggerTicking = true;
		requestAnimationFrame(() => {
			checkTriggerCrossing();
			triggerTicking = false;
		});
	}

	function engageLock() {
		phase = 'locked';
		// Guard against a resize since the last measurement.
		maxOffset = computeMaxOffset();

		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('keydown', onKeydown);

		// Defense-in-depth backstops only — the primary mechanism is preventDefault()
		// in the wheel/touchmove/keydown handlers above.
		document.documentElement.classList.add('werkwijze-locked');
		document.body.style.overflow = 'hidden';
	}

	function releaseLockListeners() {
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('keydown', onKeydown);

		document.documentElement.classList.remove('werkwijze-locked');
		document.body.style.overflow = '';
	}

	function releaseLock(direction: 'forward' | 'backward') {
		releaseLockListeners();
		phase = direction === 'forward' ? 'idle-after' : 'idle-before';
	}

	function activate() {
		maxOffset = computeMaxOffset();
		scrolljack = true;
		phase = 'idle-before';
		offset = 0;
		if (cardsEl) cardsEl.scrollLeft = 0;

		wasAboveCenter = null;
		checkTriggerCrossing(); // establish baseline; guarded by the null check, won't engage yet
		window.addEventListener('scroll', onTriggerScroll, { passive: true });
		window.addEventListener('resize', onResize);
	}

	function deactivate() {
		window.removeEventListener('scroll', onTriggerScroll);
		wasAboveCenter = null;
		releaseLockListeners();

		phase = 'disabled';
		offset = 0;
		scrolljack = false;

		window.removeEventListener('resize', onResize);
	}

	onMount(() => {
		const mobileMq = window.matchMedia('(max-width: 1023.98px)');
		const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

		function evaluate() {
			const shouldEnable = mobileMq.matches && !motionMq.matches;
			if (shouldEnable && phase === 'disabled') {
				activate();
			} else if (!shouldEnable && phase !== 'disabled') {
				deactivate();
			}
		}

		evaluate();
		mobileMq.addEventListener('change', evaluate);
		motionMq.addEventListener('change', evaluate);

		return () => {
			mobileMq.removeEventListener('change', evaluate);
			motionMq.removeEventListener('change', evaluate);
			deactivate();
		};
	});
</script>

<section
	class="werkwijze"
	id="werkwijze"
	class:werkwijze--scrolljack={scrolljack}
	class:werkwijze--locked={phase === 'locked'}
	data-scroll-phase={phase}
>
	<div class="werkwijze__pin" bind:this={pinEl}>
		<div class="werkwijze__sticky">
			<header class="werkwijze__header">
				<p class="werkwijze__eyebrow">Werkwijze</p>
				<h2 class="werkwijze__heading">Rustig, persoonlijk en op jouw tempo.</h2>
			</header>

			<ul class="werkwijze__cards" bind:this={cardsEl}>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="Kennismaking"
						body="Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf."
						imgSrc="/images/card-kennismaking.svg"
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="De sessie"
						body="Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
						imgSrc="/images/card-sessie.svg"
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="outline"
						title="Verdieping"
						body="We beginnen rustig. In een eerste gesprek kijken we samen wat er speelt en wat je nodig hebt."
						artSvg={verdiepingSvg}
						ctaHref="/contact"
						ctaLabel="Maak een afspraak"
					/>
				</li>
			</ul>
		</div>
	</div>
</section>

<style>
	.werkwijze {
		background: var(--color-bg-sand);
		padding: var(--space-16) 0;
		overflow: hidden;
	}

	.werkwijze__pin {
		position: relative;
	}

	.werkwijze__sticky {
		max-width: var(--container-max); /* 1200px — same cap as nav/footer/hero, so edges line up */
		margin: 0 auto;
	}

	.werkwijze__header {
		max-width: 24rem; /* 384px — Figma spec */
		margin: 0 auto var(--space-8);
		padding: 0 var(--space-6);
		text-align: center;
	}

	.werkwijze__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl); /* 20px — Figma spec, exact token match */
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.werkwijze__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2); /* clamp 28→48px; Figma desktop spec is 40px, within range */
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	/* Mobile: horizontal slider — every card in the initial HTML, no JS gating visibility.
	   padding-inline centers the snapped card in the viewport (card is a fixed 17.625rem);
	   the large gap keeps neighbours fully offscreen so only one card shows at a time. */
	.werkwijze__cards {
		display: flex;
		list-style: none;
		margin: 0;
		padding-inline: calc((100% - 17.625rem) / 2);
		/* vw, not %: % inside gap resolves against a different basis than % inside padding
		   (the flex container's content-box width, already minus its own padding), which
		   silently capped this at a flat 64px regardless of viewport width and let
		   neighbouring cards peek in from ~412px up. vw always resolves against the real
		   viewport, which is what this calc actually needs. */
		gap: max(var(--space-16), calc((100vw - 17.625rem) / 2 + var(--space-4)));
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.werkwijze__cards::-webkit-scrollbar {
		display: none;
	}

	/* Mobile scroll-jack: JS-toggled only (matchMedia mobile + !prefers-reduced-motion).
	   Sticky wrapper pins the section at a fixed viewport position while phase === 'locked';
	   native scrollY never advances during the lock, so no extra pin-wrapper height is needed. */
	.werkwijze--scrolljack .werkwijze__sticky {
		position: sticky;
		top: 0;
	}

	/* Only while genuinely locked: hide the scrollbar and block direct touch/wheel-driven
	   native scrolling — JS still moves this element via scrollLeft (not transform, which
	   would drag the clip box along with the content instead of revealing it), so
	   programmatic scrolling remains unaffected by overflow: hidden. scroll-snap-type is
	   also suspended here — otherwise the browser hard-snaps to the nearest card after
	   every scroll input, fighting our continuous scrollLeft assignment and making the
	   motion feel like discrete jumps instead of tracking the scroll input fluidly. Native
	   snap resumes automatically once unlocked, for the plain-swipe escape hatch. */
	.werkwijze--locked .werkwijze__cards {
		overflow-x: hidden;
		touch-action: none;
		scroll-snap-type: none;
	}

	/* Defense-in-depth backstop only — the primary lock mechanism is preventDefault()
	   in the wheel/touchmove/keydown handlers. */
	:global(html.werkwijze-locked) {
		overscroll-behavior: none;
	}

	/* Desktop: static row, all cards visible — matches Figma exactly, no accordion/JS needed */
	@media (min-width: 1024px) {
		.werkwijze__header {
			max-width: none;
		}

		.werkwijze__cards {
			justify-content: center;
			padding: 0; /* zero — .werkwijze__sticky's max-width + centering sets the edge */
			gap: 4.688rem; /* 75px — Figma spec; --space-16 (64px) is 11px off, too large to round */
			overflow-x: visible;
			scroll-snap-type: none;
		}
	}
</style>
