<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Centerline traces of the card art. Regenerate with .planning/quick/20260713-hero-draw-on/trace/.
	//
	// Inlined (?raw) rather than referenced by URL, because these draw themselves stroke by
	// stroke and an <img> cannot animate its own contents. That was the trade when they were
	// parked as <img>: each file is one compound fill path gated by a <mask> of up to 367
	// stroked paths, and inlined that mask is live DOM the browser re-rasterises whenever this
	// card's layer is re-rastered — on the one part of the page that moves during scroll. It
	// also puts ~129 KB back into the prerendered HTML.
	//
	// Re-inlined deliberately: the drawing is the point of the section. On mobile nothing
	// moves the cards (they stack and scroll with the page), and on desktop only the
	// staircase transforms them, so the raster cost lands on entry.
	import verdiepingArt from '$lib/images/card-verdieping-bg.svg?raw';
	import kennismakingArt from '$lib/images/card-kennismaking.svg?raw';
	import sessieArt from '$lib/images/card-sessie.svg?raw';

	let cardsEl: HTMLUListElement | null = $state(null);
	let rowEl: HTMLDivElement | null = $state(null);
	let headerEl: HTMLElement | null = $state(null);
	let sectionEl: HTMLElement | null = $state(null);

	// The desktop staircase's two states; the staircase itself is below. `stairs` is
	// decided in onMount, `stairsFaded` by the staircase's loop.
	let stairs = $state(false);
	let stairsFaded = $state(false);

	// ── Desktop staircase (≥ 1100px, not under reduced motion) ──────────────────────
	//
	// The three cards do not sit on one line as the section arrives. At the moment the
	// section's top reaches the bottom of the viewport all three stand below their rest
	// position, in a staircase: card 1 200px down, card 2 two thirds of a card (306px)
	// further, card 3 another 306 — 200 / 506 / 812. Card 1 is down too, deliberately: with
	// it already at rest as the section entered, the owner's reading was that it "isn't
	// animating at all". As the reader scrolls, each card moves up faster than the page and
	// the lower ones faster still, so they catch up. The offsets are spent over the scroll
	// it takes the row's rest position to reach the middle of the screen from where it is
	// at entry: vh / 2 + rowOffset px, where rowOffset is the row's distance below the
	// section's top (214px at 1440), so 664px at 1440x900 and 694 at 1920x960. That makes
	// their speeds relative to the page 1 + 200/664, 1 + 506/664 and 1 + 812/664 (1.30,
	// 1.76 and 2.22 at 1440x900; 1.29, 1.73, 2.17 at 1920x960), left slowest, right
	// fastest, all three seen to arrive in order, and on one line at the instant the
	// row's top crosses the viewport's centre.
	// Not a viewport later, as it first shipped: the reader had card 1 in place before the
	// section was half in.
	//
	// Past that point the row does not stop. Over the next 0.4 viewport of scroll all three
	// keep rising faster than the page by the height of the header block (eyebrow + h2), the
	// gap under it and half a card — measured live each time, 86 + 32 + 229.5 = 348px at
	// 1440 — so they visibly overtake the heading, which scrolls at the page's own speed
	// (they clear its bottom edge after ~30px of scroll and its top after ~120), and finish
	// with their centre line on the header's top edge; they fade from 1 to 0 over that same
	// range. Once fully faded they are also `visibility: hidden` (the --faded class): an
	// invisible card with a link in it is a keyboard trap, and visibility is what takes
	// the link out of the tab order and out of the accessibility tree. Scrolling back up
	// undoes every step of this, because position and opacity are pure functions of the
	// scroll position, damped: each frame the row closes a fixed fraction of the distance
	// to where the scroll says it should be (STAIR_SETTLE_S is how long that takes), so a
	// wheel step glides instead of snapping. Longer than ~0.4s reads as lag.
	//
	// Transforms and one non-inherited custom property only, never layout: the transform is
	// written inline per card, and the fade is a registered property (`@property
	// --stair-fade`, `inherits: false`, in the styles below) so writing it per frame does
	// not invalidate the cascade across the ~490 inlined SVG paths inside the cards.
	// `will-change: transform` is on the cards only while the section is within a viewport
	// of the screen. The staircase owns the cards' opacity. The lines inside each card keep their entrance
	// reveals (WerkwijzeCard.svelte), and nothing writes `opacity` inline on a card, so the
	// reveal audit still counts only what it counted before.
	//
	// Not a scroll-driven CSS animation, deliberately: three subjects
	// with three different progress curves and a shared damping cannot be expressed as one
	// view-timeline, and the damping is the point. Reduced motion: no staircase, no fade,
	// the cards simply sit aligned on their line as the static layout has them.
	/** px card 1 starts below its rest at entry; each further card starts STAIR_STEP lower. */
	const STAIR_BASE = 200;
	/** px between neighbouring cards' entry offsets: two thirds of a card's 459px height. */
	const STAIR_STEP = 306;
	/** The scroll the lift and the fade take, as a fraction of the viewport height. The lift
	 *  itself is not a constant: it is the header block, the gap and half a card, measured. */
	const STAIR_FADE_SPAN = 0.4;
	/** s for the row to close ~95% of the gap to its scroll-given target (three time
	 *  constants of the exponential lerp in `frame`). */
	const STAIR_SETTLE_S = 0.25;

	$effect(() => {
		if (!stairs) return;
		const section = sectionEl;
		const list = cardsEl;
		const row = rowEl;
		const header = headerEl;
		if (!section || !list || !row || !header) return;

		const items = Array.from(list.children).filter(
			(el): el is HTMLElement => el instanceof HTMLElement
		);
		const drop = items.map((_, i) => STAIR_BASE + i * STAIR_STEP);
		const targetY = drop.slice();
		let targetFade = 1;
		const y = drop.slice();
		let fade = 1;
		let raf: number | null = null;
		let last = 0;
		let near = false;

		/** Where the scroll says the row should be. `fall` is how much of its entry drop each
		 *  card still has to make up: 1 with the section's top at the bottom edge of the
		 *  viewport, 0 once the row's rest top has reached the viewport's vertical centre.
		 *  `rise` is the lift and the fade after that: 0 at the centre, 1 a further
		 *  STAIR_FADE_SPAN viewports on. The row wrapper is what is measured, never the
		 *  cards: it is the untransformed box, so its rect is the rest position whatever the
		 *  cards are doing. The lift is layout (offsetTop, offsetHeight), so the header's own
		 *  reveal transform cannot leak into it. */
		function targets() {
			const vh = window.innerHeight;
			const sectionTop = section!.getBoundingClientRect().top;
			const rowTop = row!.getBoundingClientRect().top;
			const rowOffset = rowTop - sectionTop;
			const fall = Math.min(Math.max((rowTop - vh / 2) / (vh / 2 + rowOffset), 0), 1);
			const rise = Math.min(Math.max((vh / 2 - rowTop) / (STAIR_FADE_SPAN * vh), 0), 1);
			const lift = row!.offsetTop - header!.offsetTop + items[0]!.offsetHeight / 2;
			for (let i = 0; i < drop.length; i++) targetY[i] = drop[i]! * fall - lift * rise;
			targetFade = 1 - rise;
		}

		function paint() {
			for (let i = 0; i < items.length; i++) {
				items[i]!.style.transform = `translate3d(0, ${y[i]!.toFixed(2)}px, 0)`;
				items[i]!.style.setProperty('--stair-fade', fade.toFixed(3));
			}
			stairsFaded = fade <= 0.001;
		}

		function frame(now: number) {
			raf = null;
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;
			const k = 1 - Math.exp((-3 * dt) / STAIR_SETTLE_S);
			let settled = true;
			for (let i = 0; i < y.length; i++) {
				const d = targetY[i]! - y[i]!;
				if (Math.abs(d) < 0.05) y[i] = targetY[i]!;
				else {
					y[i] = y[i]! + d * k;
					settled = false;
				}
			}
			const df = targetFade - fade;
			if (Math.abs(df) < 0.001) fade = targetFade;
			else {
				fade += df * k;
				settled = false;
			}
			paint();
			if (!settled) raf = requestAnimationFrame(frame);
		}

		/** Re-aim, and start the damped approach if it is not already running. */
		function sync() {
			targets();
			if (raf === null) {
				last = performance.now();
				raf = requestAnimationFrame(frame);
			}
		}

		/** Snap straight to the target, for when nobody is watching the approach. */
		function snap() {
			if (raf !== null) cancelAnimationFrame(raf);
			raf = null;
			targets();
			for (let i = 0; i < y.length; i++) y[i] = targetY[i]!;
			fade = targetFade;
			paint();
		}

		function onScroll() {
			if (near) sync();
		}

		// One viewport of margin either side: the cards are promoted and aimed before the
		// section is in view, and dropped once it is a screen away. Leaving the band snaps
		// to the final state, so a jump that skips the whole approach (an anchor link to the
		// footer, say) still leaves the row where the scroll says it belongs.
		const watcher = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					near = entry.isIntersecting;
					for (const item of items) {
						if (near) item.style.willChange = 'transform';
						else item.style.removeProperty('will-change');
					}
					if (near) sync();
					else snap();
				}
			},
			{ threshold: 0, rootMargin: '100% 0px 100% 0px' }
		);
		watcher.observe(section);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);

		return () => {
			watcher.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf !== null) cancelAnimationFrame(raf);
			for (const item of items) {
				item.style.removeProperty('transform');
				item.style.removeProperty('--stair-fade');
				item.style.removeProperty('will-change');
			}
			stairsFaded = false;
		};
	});

	onMount(() => {
		// The staircase's gate: the desktop row (1100px, the hero's two-column breakpoint too;
		// tablets count as mobile, the owner's rule since 2026-09-17) and motion allowed.
		const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const desktopMq = window.matchMedia('(min-width: 1100px)');

		function evaluate() {
			stairs = desktopMq.matches && !motionMq.matches;
		}

		evaluate();
		motionMq.addEventListener('change', evaluate);
		desktopMq.addEventListener('change', evaluate);

		return () => {
			motionMq.removeEventListener('change', evaluate);
			desktopMq.removeEventListener('change', evaluate);
		};
	});
</script>

<section class="werkwijze" id="werkwijze" class:werkwijze--stairs={stairs} bind:this={sectionEl}>
	<div class="werkwijze__inner">
		<!-- One reveal for the header block: eyebrow and heading arrive and leave as one
		     line of thought, not as two. -->
		<header class="werkwijze__header" use:reveal bind:this={headerEl}>
			<p class="werkwijze__eyebrow">Werkwijze</p>
			<h2 class="werkwijze__heading">Rustig, persoonlijk en op jouw tempo.</h2>
		</header>

		<!-- The row wrapper is the staircase's measuring stick: it never moves, so its rect is
		     the cards' rest position whatever their transforms are doing. -->
		<div class="werkwijze__row" bind:this={rowEl}>
			<ul class="werkwijze__cards" class:werkwijze__cards--faded={stairsFaded} bind:this={cardsEl}>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="Kennismaking"
						body="Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf."
						artSvg={kennismakingArt}
					/>
				</li>
				<li>
					<WerkwijzeCard
						variant="filled"
						title="De sessie"
						body="Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
						artSvg={sessieArt}
					/>
				</li>
				<li>
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
</section>

<style>
	.werkwijze {
		background: var(--color-bg-sand);
		padding: var(--section-pad) 0;
	}

	.werkwijze__inner {
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

	/* Under 1100px (phones and tablets): the cards stack top-down, one under the other,
	   and the page simply scrolls past them. No pin, no horizontal slider — the owner's
	   call (2026-09-25): sideways scrolling inside a vertical page was the one place a
	   reader had to change direction. A tablet gets the same single column; three 282px
	   cards do not fit a row below 1100 (see desktopMq), and two plus one reads as broken. */
	.werkwijze__cards {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		list-style: none;
		margin: 0;
		padding: 0 var(--space-4);
	}

	/* Desktop: one static row of three, the Figma layout. The staircase (see the script)
	   only ever moves the cards by transform from this rest position, so this is also
	   exactly what reduced motion gets. 1100px, not 1024 — see desktopMq in the script. */
	@media (min-width: 1100px) {
		.werkwijze__header {
			max-width: none;
		}

		.werkwijze__cards {
			flex-direction: row;
			align-items: stretch;
			justify-content: center;
			gap: 4.688rem; /* 75px — Figma spec; --space-16 (64px) is 11px off, too large to round */
		}

		/* The staircase's fade, as a registered property so that writing it per frame
		   costs a style recalc on the card alone: `inherits: false` stops the write from
		   invalidating the hundreds of SVG paths inside. It is set on each <li> by the
		   script; the initial value is what the cards have before it runs. */
		@property --stair-fade {
			syntax: '<number>';
			inherits: false;
			initial-value: 1;
		}

		/* In staircase mode the script owns both the transform and the opacity of each
		   card. */
		.werkwijze--stairs .werkwijze__cards > li {
			opacity: var(--stair-fade, 1);
		}

		/* Fully faded is also gone from the tab order and the accessibility tree; see the
		   script's note on the keyboard trap. */
		.werkwijze--stairs .werkwijze__cards--faded > li {
			visibility: hidden;
		}

		/* The compensation. The cards leave their box upward, ~350px in 0.4 viewport of
		   scroll once the row's rest top has crossed the middle of the screen, so the
		   section's own bottom padding would only add sand to the band the vacated box
		   already leaves. With it gone the gap from the aligned row to the next section's
		   first content is the next section's top padding alone — one --section-pad (96px
		   at 1440), where every other pair of sections has two. Re-measured 2026-09-17 at
		   1440x900 with the row aligned (its top on the viewport's centre line): the cards'
		   bottom edge to the Over mij portrait is 96px. */
		.werkwijze--stairs {
			padding-bottom: 0;
		}
	}
</style>
