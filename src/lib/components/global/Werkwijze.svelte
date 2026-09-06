<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';
	import { REVEAL_ROOT_MARGIN, reveal } from '$lib/actions/reveal';

	// Centerline traces of the card art. Regenerate with .planning/quick/20260713-hero-draw-on/trace/.
	//
	// Inlined (?raw) rather than referenced by URL, because these draw themselves stroke by
	// stroke and an <img> cannot animate its own contents. That was the trade when they were
	// parked as <img>: each file is one compound fill path gated by a <mask> of up to 367
	// stroked paths, and inlined that mask is live DOM the browser re-rasterises whenever this
	// card's layer is re-rastered — on the one part of the page that moves during scroll. It
	// also puts ~129 KB back into the prerendered HTML.
	//
	// Re-inlined deliberately: the drawing is the point of the section, and the pan itself is
	// now compositor-driven (see the view-timeline below), so the raster cost lands on entry
	// rather than on every frame of the pan.
	import verdiepingArt from '$lib/images/card-verdieping-bg.svg?raw';
	import kennismakingArt from '$lib/images/card-kennismaking.svg?raw';
	import sessieArt from '$lib/images/card-sessie.svg?raw';

	// Sticky-pin + tall-spacer horizontal scroll — see
	// .planning/notes/RESEARCH-werkwijze-scroll.md (the pin) and
	// .planning/notes/RESEARCH-werkwijze-stutter.md (why the pan is driven from CSS).
	//
	// The section is made taller than the viewport, its content sticks while the page scrolls
	// through it, and that scroll distance drives a horizontal translate on the card track.
	// Native scroll is never blocked, so a touch fling has nothing to desync from.
	//
	// The translate is driven by a CSS view-timeline, NOT by a scroll listener. That is the
	// whole point: scrolling happens on the compositor thread and the scroll event reaches the
	// main thread a frame later, so anything positioned from that event is positioned from a
	// stale scroll offset — while the sticky frame around it, which the compositor owns, is
	// exactly right. The resulting lag is invisible at constant speed and reads as stutter
	// whenever the speed changes: entering the section, starting a fling, coasting to a stop.
	// A CSS scroll-driven animation runs on the compositor too, so it cannot drift from the
	// scroll position at all. Do not reintroduce a scroll handler here.
	//
	// JS is left with two jobs, neither of them per-frame: decide whether to pin at all, and
	// measure how far the track has to travel.

	let cardsEl: HTMLUListElement | null = $state(null);
	let rowEl: HTMLDivElement | null = $state(null);

	/**
	 * The row's exit. Leaving the section fades the cards away one at a time in reading
	 * order — first card first, last card last — and coming back fades them in the same
	 * way, so the section closes and reopens like a hand of cards rather than a light
	 * switch. The order is a per-card `transition-delay` in the markup below; all this
	 * holds is whether the row is on its way out.
	 *
	 * One observer on the whole row, not `use:reveal` per card. On mobile the cards sit
	 * horizontally outside the viewport until the pan brings them in, so a per-card
	 * observer would report cards 2 and 3 as gone from the moment the page loads and the
	 * stagger would never be seen. The row is always vertically where the reader is.
	 *
	 * The observed element is .werkwijze__row, the untransformed wrapper — never the <ul>
	 * itself. An IntersectionObserver intersects on both axes and honours ancestor clips,
	 * and in pinned mode the <ul> is translated up to --travel px to the left: its own
	 * 100%-wide box ends up entirely outside .werkwijze's overflow-x clip while the cards
	 * spilling out of it are still dead centre on screen. Observed directly, the row
	 * therefore reported itself gone halfway through the section. The wrapper never moves.
	 *
	 * The band matches the one in $lib/actions/reveal, so the cards leave on the same edge
	 * as the heading above them.
	 */
	let cardsGone = $state(false);
	const CARD_STAGGER_MS = 110;

	$effect(() => {
		const row = rowEl;
		if (!row) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) cardsGone = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: REVEAL_ROOT_MARGIN }
		);
		observer.observe(row);
		return () => observer.disconnect();
	});

	// 'native': default / desktop / reduced-motion / no scroll-timeline support / pre-hydration.
	// Plain overflow-x: auto snap slider — every card in the initial HTML, swipeable, and smooth
	// because the browser scrolls it natively.
	// 'pinned': mobile + !prefers-reduced-motion + scroll-driven animations. Tall pin + sticky +
	// compositor-driven pan.
	let mode: 'native' | 'pinned' = $state('native');
	let travel = $state(0); // px the track must move; written on mount and on resize only

	// Distance from the first card to the last one. Translating the track by exactly this much
	// lands the last card where the first one started — i.e. centred, since the track's
	// padding-inline centres whatever sits at offset 0.
	//
	// Deliberately NOT `scrollWidth - clientWidth`: that only reports a real value while the
	// track is a scroll container, and in pinned mode it is not one (see the overflow: visible
	// note in the styles below). It would read 0 on any re-measure after pinning — so a resize
	// or orientation change would silently collapse the travel to nothing. Sibling offsets are
	// true in either mode.
	function measure() {
		const cards = cardsEl ? Array.from(cardsEl.children) : [];
		const first = cards[0];
		const last = cards[cards.length - 1];
		if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement)) {
			travel = 0;
			return;
		}
		travel = Math.max(0, last.offsetLeft - first.offsetLeft);
	}

	onMount(() => {
		// Width alone is not enough to qualify for the pin. A landscape phone satisfies the
		// mobile width but is far too short: the pinned content (header + a 459px card) measures
		// ~577px, and inside a 100svh sticky slice on a 390px-tall viewport it overflows by
		// ~187px — heading cropped off the top, cards running out of the bottom. The pin only
		// makes sense when a viewport can actually hold what gets pinned into it, so the height
		// is a condition of pinning, not an afterthought. Below it the section falls back to the
		// native snap slider, which simply scrolls like any other content.
		const mobileMq = window.matchMedia('(max-width: 1023.98px) and (min-height: 640px)');
		const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

		// Mirrors the @supports guard on the pinned styles. Without scroll-driven animations the
		// pin would have nothing driving it, so those browsers keep the native snap slider —
		// deliberately, rather than falling back to a scroll handler, which would just reinstate
		// the stutter for whoever landed on the fallback.
		const hasScrollTimeline =
			typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'view()');

		function evaluate() {
			const shouldPin = mobileMq.matches && !motionMq.matches && hasScrollTimeline;
			if (shouldPin && mode !== 'pinned') {
				measure();
				mode = 'pinned';
			} else if (!shouldPin && mode !== 'native') {
				mode = 'native';
				travel = 0;
			}
		}

		function onResize() {
			if (mode === 'pinned') measure();
		}

		evaluate();
		mobileMq.addEventListener('change', evaluate);
		motionMq.addEventListener('change', evaluate);
		window.addEventListener('resize', onResize);

		return () => {
			mobileMq.removeEventListener('change', evaluate);
			motionMq.removeEventListener('change', evaluate);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<section
	class="werkwijze"
	id="werkwijze"
	class:werkwijze--pinned={mode === 'pinned'}
	data-scroll-mode={mode}
	style:--travel="{travel}px"
>
	<div class="werkwijze__pin">
		<div class="werkwijze__sticky">
			<header class="werkwijze__header">
				<p class="werkwijze__eyebrow" use:reveal={{ delay: 0 }}>Werkwijze</p>
				<h2 class="werkwijze__heading" use:reveal={{ delay: 120 }}>
					Rustig, persoonlijk en op jouw tempo.
				</h2>
			</header>

			<!-- The wrapper exists so the exit observer has something that stays put; see the
			     note on the observer above. It is a plain block, no styling of its own. -->
			<div class="werkwijze__row" bind:this={rowEl}>
				<ul class="werkwijze__cards" class:werkwijze__cards--gone={cardsGone} bind:this={cardsEl}>
					<li style="--card-stagger: 0ms">
						<WerkwijzeCard
							variant="filled"
							title="Kennismaking"
							body="Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf."
							artSvg={kennismakingArt}
						/>
					</li>
					<li style="--card-stagger: {CARD_STAGGER_MS}ms">
						<WerkwijzeCard
							variant="filled"
							title="De sessie"
							body="Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
							artSvg={sessieArt}
						/>
					</li>
					<li style="--card-stagger: {CARD_STAGGER_MS * 2}ms">
						<WerkwijzeCard
							variant="outline"
							title="Verdieping"
							body="We beginnen rustig. In een eerste gesprek kijken we samen wat er speelt en wat je nodig hebt."
							artSvg={verdiepingArt}
							ctaHref="/contact"
							ctaLabel="Maak een afspraak"
						/>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<style>
	.werkwijze {
		background: var(--color-bg-sand);
		padding: var(--space-16) 0;
		/* overflow-x: clip, NOT overflow: hidden. `overflow: hidden` on an ancestor turns it
		   into a scroll container, which silently breaks `position: sticky` on every
		   descendant (including .werkwijze__sticky below) — the sticky element would just
		   scroll away with the rest of the content instead of pinning. `overflow: clip` clips
		   the same way without creating a scroll container, so sticky keeps working. Do not
		   "simplify" this back to `overflow: hidden` — it looks equivalent and is not. */
		overflow-x: clip;
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
		/* One card's width, in one place. It sets the centring padding and the gap below, and
		   it has to agree with .wcard's own width in WerkwijzeCard — three literals of the same
		   number is how they drift apart. */
		--wcard-w: 17.625rem; /* 282px — Figma spec */

		display: flex;
		list-style: none;
		margin: 0;
		padding-inline: calc((100% - var(--wcard-w)) / 2);
		/* vw, not %: % inside gap resolves against a different basis than % inside padding
		   (the flex container's content-box width, already minus its own padding), which
		   silently capped this at a flat 64px regardless of viewport width and let
		   neighbouring cards peek in from ~412px up. vw always resolves against the real
		   viewport, which is what this calc actually needs. */
		gap: max(var(--space-16), calc((100vw - var(--wcard-w)) / 2 + var(--space-4)));
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}

	.werkwijze__cards::-webkit-scrollbar {
		display: none;
	}

	/* The staggered exit. --card-stagger is set per card in the markup, so the same rule
	   drives both directions: out in reading order, back in the same order. Leaving is
	   quicker than returning, matching $lib/actions/reveal's own two durations. */
	.werkwijze__cards > li {
		transition: opacity 600ms var(--ease-out) var(--card-stagger, 0ms);
	}

	.werkwijze__cards--gone > li {
		opacity: 0;
		transition-duration: 450ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.werkwijze__cards > li {
			transition: none;
		}
	}

	/* Mobile pin. The pinned styles are gated twice over: the JS gate (mobile +
	   !prefers-reduced-motion + scroll-timeline support) supplies .werkwijze--pinned, and this
	   @supports block makes sure the pin can never exist without the thing that drives it. A
	   pinned section whose track never moves would be a tall dead scroll with one card in it. */
	@supports (animation-timeline: view()) {
		/* .werkwijze__pin is made taller than the viewport by --travel (the horizontal distance
		   the track has to move), and .werkwijze__sticky then holds still for the whole of that
		   extra height — which is what turns vertical scroll distance into dwell time for the pan.
		   The pin is also the view-timeline subject: its own progress across the scrollport IS the
		   pan's progress, so the two cannot drift apart. */
		.werkwijze--pinned .werkwijze__pin {
			/* svh, not vh: 100vh factors in the mobile browser's collapsible toolbar and changes
			   value as that toolbar shows and hides mid-scroll, which would re-jump the pin height
			   underneath the reader. 100svh is the small viewport height — stable either way. */
			height: calc(100svh + var(--travel, 0px));
			view-timeline-name: --werkwijze-pin;
			view-timeline-axis: block;
		}

		.werkwijze--pinned .werkwijze__sticky {
			position: sticky;
			top: 0;
			height: 100svh;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		.werkwijze--pinned .werkwijze__cards {
			/* overflow: visible is load-bearing. The clip MUST NOT live on the element being
			   transformed: an element's overflow clip is part of the element, so translating it
			   drags the clip along and the whole window slides off as a rigid unit — card 1 exits
			   and cards 2/3 stay clipped forever. Clipping happens one level up instead, on
			   .werkwijze (overflow-x: clip), which never moves. */
			overflow: visible;
			scroll-snap-type: none;

			/* No duration: with a scroll timeline the duration is `auto`, meaning "fill the range".
			   The range is `contain`, which for a subject taller than the scrollport spans exactly
			   the period where it covers the viewport — from the pin's top edge reaching the top of
			   the screen to its bottom edge leaving it. That is precisely when .werkwijze__sticky is
			   stuck, so the pan starts and ends on the same frames the pin engages and releases,
			   with no measurement shared between them and nothing to keep in sync. */
			animation: werkwijze-pan linear forwards;
			animation-timeline: --werkwijze-pin;
			animation-range: contain 0% contain 100%;
			will-change: transform;
		}

		@keyframes werkwijze-pan {
			to {
				transform: translate3d(calc(-1 * var(--travel, 0px)), 0, 0);
			}
		}
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
