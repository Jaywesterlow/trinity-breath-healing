<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';

	// Centerline traces of the card art, inlined so it draws itself when the card scrolls into
	// view. Regenerate with .planning/quick/20260713-hero-draw-on/trace/.
	import verdiepingSvg from '$lib/images/card-verdieping-bg.svg?raw';
	import kennismakingSvg from '$lib/images/card-kennismaking.svg?raw';
	import sessieSvg from '$lib/images/card-sessie.svg?raw';

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

	// Non-reactive: read/written inside the rAF-throttled scroll/resize handlers only.
	let ticking = false;

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	// Must run while the track is still laid out natively (overflow-x: auto) — once
	// `.werkwijze--pinned .werkwijze__cards` switches to overflow-x: hidden, scrollWidth still
	// reflects the track's full unclipped content width in every browser tested, but this is
	// still called before that class ever applies (measure-then-pin ordering below), so there
	// is no reliance on that behaviour holding across engines.
	function measure() {
		if (!cardsEl) {
			travel = 0;
			return;
		}
		travel = Math.max(0, cardsEl.scrollWidth - cardsEl.clientWidth);
	}

	function update() {
		if (!pinEl || !stickyEl) {
			progress = 0;
			return;
		}
		// Derived from real measured heights, not reused from `travel` — keeps progress from
		// desyncing against `--travel` under sub-pixel layout rounding.
		const total = pinEl.offsetHeight - stickyEl.offsetHeight;
		progress = total > 0 ? clamp(-pinEl.getBoundingClientRect().top / total, 0, 1) : 0;
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
		onScrollOrResize();
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

		function evaluate() {
			const shouldPin = mobileMq.matches && !motionMq.matches;
			if (shouldPin && mode !== 'pinned') {
				// Measure before flipping the mode class, so the track is still in its native
				// (scrollable) layout when scrollWidth is read.
				measure();
				mode = 'pinned';
				addListeners();
				// Deferred one frame: `mode = 'pinned'` hasn't been committed to the DOM yet
				// (Svelte batches the class/style update), so pinEl/stickyEl would still report
				// their pre-pin heights if read synchronously here.
				requestAnimationFrame(update);
			} else if (!shouldPin && mode !== 'native') {
				removeListeners();
				mode = 'native';
				progress = 0;
				travel = 0;
			}
		}

		evaluate();
		mobileMq.addEventListener('change', evaluate);
		motionMq.addEventListener('change', evaluate);

		return () => {
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
	data-scroll-mode={mode}
	style:--travel="{travel}px"
	style:--progress={progress}
>
	<div class="werkwijze__pin" bind:this={pinEl}>
		<div class="werkwijze__sticky" bind:this={stickyEl}>
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
						artSvg={kennismakingSvg}
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="De sessie"
						body="Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
						artSvg={sessieSvg}
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

	/* Scroll is never blocked. --progress (0..1) comes from JS reading scroll position against
	   the pin's tall height; the track's horizontal position is a pure function of it. No
	   transition here on purpose — the transform must track the scroll position exactly,
	   1:1, every frame; a transition would make it visibly lag behind the finger. */
	.werkwijze--pinned .werkwijze__cards {
		overflow-x: hidden;
		scroll-snap-type: none;
		transform: translate3d(calc(-1 * var(--progress, 0) * var(--travel, 0px)), 0, 0);
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
