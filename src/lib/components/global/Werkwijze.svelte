<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';

	// Centerline traces of the card art. Regenerate with .planning/quick/20260713-hero-draw-on/trace/.
	//
	// Referenced by URL, not inlined (?url, not ?raw), while the draw-on animation is parked —
	// see .planning/notes/KNOWN-ISSUES.md. Each of these files is one compound fill path gated
	// by a <mask> built from up to 367 stroked paths. Inlined, that mask is live DOM the browser
	// must rasterise into an alpha surface every time this card's layer needs re-rastering — and
	// this is the one part of the page that moves during scroll, so it is the one place that
	// cost is paid per frame. As an <img> the browser rasterises the whole thing once and the
	// pan becomes a plain texture move. Inlining only buys anything when the paths need to be
	// individually animated, which right now they do not.
	import verdiepingArt from '$lib/images/card-verdieping-bg.svg?url';
	import kennismakingArt from '$lib/images/card-kennismaking.svg?url';
	import sessieArt from '$lib/images/card-sessie.svg?url';

	// Sticky-pin + tall-spacer horizontal scroll — see .planning/notes/RESEARCH-werkwijze-scroll.md.
	// Native scroll is never blocked: the section is made taller than the viewport, the inner
	// content sticks in place while the page scrolls through it, and scroll progress through
	// the tall section is mapped to a horizontal translate on the card track. No preventDefault,
	// no scrollLeft driving, nothing to desync from a touch fling.

	let pinEl: HTMLDivElement | null = $state(null);
	let stickyEl: HTMLDivElement | null = $state(null);
	let cardsEl: HTMLUListElement | null = $state(null);

	// 'native': default / desktop / reduced-motion / pre-hydration — plain overflow-x: auto
	// snap slider, every card in the initial HTML.
	// 'pinned': mobile + !prefers-reduced-motion, after mount — tall pin + sticky + transform.
	let mode: 'native' | 'pinned' = $state('native');
	let travel = $state(0); // px the track must move, measured while still in native layout
	let progress = $state(0); // 0..1, clamped
	// Is the pin within roughly a viewport of the screen? Gates the per-frame work only.
	let near = $state(false);
	// Latches true the first time the pin is approached and never goes back. Gates the
	// compositing layer — deliberately one-way, see the will-change note in the styles.
	let promoted = $state(false);

	// Non-reactive: read/written inside the rAF-throttled scroll/resize handlers only.
	let ticking = false;
	// Vertical distance the pin spans beyond its sticky slice — the denominator for progress.
	// Cached, not re-read per frame: see measureSpan().
	let span = 0;

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

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

	// Measured from real heights rather than reused from `travel`, so sub-pixel layout rounding
	// can't desync the two — but cached rather than re-read every frame. offsetHeight forces a
	// synchronous layout, and doing that inside the scroll handler (which then writes a style
	// back out) is a read/write thrash that stalls the frame. Only ever changes on resize.
	function measureSpan() {
		span = pinEl && stickyEl ? pinEl.offsetHeight - stickyEl.offsetHeight : 0;
	}

	function update() {
		if (!pinEl || span <= 0) {
			progress = 0;
			return;
		}
		// The scroll listener is attached for as long as the component is pinned, which means
		// it fires for every scroll frame of the whole page — including the metres of page
		// nowhere near this section. Without this guard each of those frames still recomputes
		// progress and writes a fresh inline transform, for a section that is offscreen.
		if (!near) return;
		progress = clamp(-pinEl.getBoundingClientRect().top / span, 0, 1);
	}

	function onScrollOrResize() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			update();
			ticking = false;
		});
	}

	function onResize() {
		measure();
		// One frame later: the pin's height is derived from --travel, which Svelte has not
		// written to the DOM yet, so measuring the span now would read the old layout.
		requestAnimationFrame(() => {
			measureSpan();
			update();
		});
	}

	function addListeners() {
		window.addEventListener('scroll', onScrollOrResize, { passive: true });
		window.addEventListener('resize', onResize);
	}

	function removeListeners() {
		window.removeEventListener('scroll', onScrollOrResize);
		window.removeEventListener('resize', onResize);
	}

	onMount(() => {
		const mobileMq = window.matchMedia('(max-width: 1023.98px)');
		const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

		// One viewport of margin either side, so both the promotion and the per-frame work
		// begin before the section can be seen rather than on the frame it appears.
		const proximity = new IntersectionObserver(
			(entries) => {
				for (const e of entries) near = e.isIntersecting;
				if (near) promoted = true;
				update();
			},
			{ rootMargin: '100% 0px 100% 0px' }
		);
		if (pinEl) proximity.observe(pinEl);

		function evaluate() {
			const shouldPin = mobileMq.matches && !motionMq.matches;
			if (shouldPin && mode !== 'pinned') {
				measure();
				mode = 'pinned';
				addListeners();
				// Deferred one frame: `mode = 'pinned'` hasn't been committed to the DOM yet
				// (Svelte batches the class/style update), so pinEl/stickyEl would still report
				// their pre-pin heights if read synchronously here.
				requestAnimationFrame(() => {
					measureSpan();
					update();
				});
			} else if (!shouldPin && mode !== 'native') {
				removeListeners();
				mode = 'native';
				progress = 0;
				travel = 0;
				span = 0;
			}
		}

		evaluate();
		mobileMq.addEventListener('change', evaluate);
		motionMq.addEventListener('change', evaluate);

		return () => {
			proximity.disconnect();
			mobileMq.removeEventListener('change', evaluate);
			motionMq.removeEventListener('change', evaluate);
			removeListeners();
		};
	});
</script>

<section
	class="werkwijze"
	id="werkwijze"
	class:werkwijze--pinned={mode === 'pinned'}
	class:werkwijze--promoted={mode === 'pinned' && promoted}
	data-scroll-mode={mode}
	style:--travel="{travel}px"
>
	<div class="werkwijze__pin" bind:this={pinEl}>
		<div class="werkwijze__sticky" bind:this={stickyEl}>
			<header class="werkwijze__header">
				<p class="werkwijze__eyebrow">Werkwijze</p>
				<h2 class="werkwijze__heading">Rustig, persoonlijk en op jouw tempo.</h2>
			</header>

			<!-- The per-frame value is written straight onto this element as `transform`, not as a
			     custom property on the section. A custom property is inherited, so changing one on
			     an ancestor invalidates the inherited-property cascade for every descendant — and
			     the descendants here are three inlined SVG traces totalling ~490 <path> elements.
			     That is a style recalc over ~490 nodes on every scroll frame, to move one box. -->
			<ul
				class="werkwijze__cards"
				bind:this={cardsEl}
				style:transform={mode === 'pinned' ? `translate3d(${-(progress * travel)}px, 0, 0)` : null}
			>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="Kennismaking"
						body="Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf."
						imgSrc={kennismakingArt}
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="De sessie"
						body="Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
						imgSrc={sessieArt}
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="outline"
						title="Verdieping"
						body="We beginnen rustig. In een eerste gesprek kijken we samen wat er speelt en wat je nodig hebt."
						imgSrc={verdiepingArt}
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

	/* Mobile pin: JS-toggled only (matchMedia mobile + !prefers-reduced-motion), after mount.
	   .werkwijze__pin is made taller than the viewport by --travel (the horizontal distance
	   the track needs to move); .werkwijze__sticky then holds still at the top of the
	   viewport for the whole tall pin, which is what turns vertical scroll distance into
	   "dwell time" for the horizontal pan below. */
	.werkwijze--pinned .werkwijze__pin {
		/* svh, not vh: 100vh includes the mobile browser's collapsible toolbar in its
		   calculation and changes value as that toolbar shows/hides mid-scroll, which would
		   visibly re-jump the pin height (and therefore --progress) while the user is
		   scrolling through it. 100svh is the small viewport height — stable regardless of
		   toolbar state. */
		height: calc(100svh + var(--travel, 0px));
	}

	.werkwijze--pinned .werkwijze__sticky {
		position: sticky;
		top: 0;
		height: 100svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	/* Scroll is never blocked: JS reads scroll position against the pin's tall height and writes
	   the resulting translate directly onto this element as an inline style (see the template).
	   No transform here, and no transition on purpose — the transform must track the scroll
	   position exactly, 1:1, every frame; a transition would make it visibly lag the finger. */
	.werkwijze--pinned .werkwijze__cards {
		/* overflow: visible is load-bearing. The clip MUST NOT live on the element being
		   transformed: an element's overflow clip is part of the element, so translating it
		   drags the clip along and the whole window slides off as a rigid unit — card 1 exits
		   and cards 2/3 stay clipped forever. Clipping happens one level up instead, on
		   .werkwijze (overflow-x: clip), which never moves. */
		overflow: visible;
		scroll-snap-type: none;
	}

	/* Applied a viewport before the section is reachable, and then never removed — the latch is
	   one-way on purpose.

	   will-change: transform asks for this subtree to live on its own compositing layer, and
	   creating that layer means rasterising all of it in one go (three cards, ~1100x460 CSS px,
	   which at a phone's 3x DPR is a ~4.5 megapixel texture). Destroying it means painting the
	   content back into the parent. Both are real work, and a gate that toggles puts one of
	   each on the frames either side of the section — precisely where a stutter is most
	   visible, and in both scroll directions.

	   So: pay it once, early, off to the side of the section, and never again. Holding the
	   layer afterwards costs memory, not frames. Do not "tidy" this into a symmetric
	   add/remove gate — that trade is the wrong way round. */
	.werkwijze--promoted .werkwijze__cards {
		will-change: transform;
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
