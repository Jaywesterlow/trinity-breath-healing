<script lang="ts">
	import { onMount } from 'svelte';
	import WerkwijzeCard from '$lib/components/ui/WerkwijzeCard.svelte';
	import { reveal } from '$lib/actions/reveal';

	// The redesign cards (approved in Figma 2026-10-24, TODO §15): each image is the whole
	// card, 9:16, on the site green. 408 css px wide on desktop, the full column on a phone.
	import card1 from '$lib/images/redesign/werkwijze-card1.webp?w=408;816;1224&enhanced';
	import card2 from '$lib/images/redesign/werkwijze-card2.webp?w=408;816;1224&enhanced';
	import card3 from '$lib/images/redesign/werkwijze-card3.webp?w=408;816;1224&enhanced';

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
	// position, in a staircase: card 1 200px down, card 2 two thirds of a card (387px)
	// further, card 3 another 387 — 200 / 587 / 974. Card 1 is down too, deliberately: with
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
	// Then the row pauses, aligned under the heading, while its top scrolls from the centre
	// up to STAIR_RISE_START (0.12 of the viewport; ported from PR #29 on 2026-10-18, it was
	// never merged). Only then, over the next 0.4 viewport of scroll, all three
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
	/** px between neighbouring cards' entry offsets: two thirds of a card's height. It was 306
	 *  for the 459px card; the redesign card is 580px (2026-10-24). */
	const STAIR_STEP = 387;
	/** The scroll the lift and the fade take, as a fraction of the viewport height. The lift
	 *  itself is not a constant: it is the header block, the gap and half a card, measured. */
	const STAIR_FADE_SPAN = 0.4;
	/** Where the lift and the fade begin, as the row's rest top in viewport heights from the
	 *  top. It was the centre (0.5): the cards started leaving the moment they had aligned,
	 *  which the owner read as "they fade away and float over their title far too quickly"
	 *  (2026-10-14). Now they stay aligned while the row scrolls up from the centre to this
	 *  line, and only then lift and fade over STAIR_FADE_SPAN. */
	const STAIR_RISE_START = 0.12;
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
			const rise = Math.min(
				Math.max((STAIR_RISE_START * vh - rowTop) / (STAIR_FADE_SPAN * vh), 0),
				1
			);
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
		<!-- One reveal for the header block: heading, rule and line arrive and leave as one
		     thought. -->
		<header class="werkwijze__header" use:reveal bind:this={headerEl}>
			<h2 class="werkwijze__heading">Wat kun je verwachten?</h2>
			<p class="werkwijze__sub">Rustig, persoonlijk en op jouw tempo.</p>
		</header>

		<!-- The row wrapper is the staircase's measuring stick: it never moves, so its rect is
		     the cards' rest position whatever their transforms are doing. -->
		<div class="werkwijze__row" bind:this={rowEl}>
			<ul class="werkwijze__cards" class:werkwijze__cards--faded={stairsFaded} bind:this={cardsEl}>
				<li>
					<WerkwijzeCard
						title="Kennismaking & intake"
						body="We beginnen met een persoonlijk gesprek. Samen kijken we naar jouw wensen en behoeften, en naar wat je op dit moment bezighoudt. Je kunt al je vragen stellen, zodat je weet wat je kunt verwachten."
						image={card1}
					/>
				</li>
				<li>
					<WerkwijzeCard
						title="De behandeling"
						body="Iedere behandeling stem ik af op wat jij nodig hebt. Ik werk met ademwerk, lichaamsgerichte technieken en energetische ondersteuning, en waar passend met de biotensor. Zo ontstaat ruimte om spanning los te laten en dichter bij jezelf te komen."
						image={card2}
					/>
				</li>
				<li>
					<WerkwijzeCard
						title="Afronding & nazorg"
						body="Na de behandeling nemen we alle tijd om rustig af te ronden. Je krijgt de ruimte om je ervaringen te delen en, wanneer dat nodig is, ontvang je persoonlijke adviezen voor je nazorg."
						image={card3}
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
		/* No container cap: the card row (1272px) is wider than the 1200px container at 1440,
		   and sets its own width below. */
		margin: 0 auto;
	}

	/* Figma "Werkwijze (redesign) — chosen": centred heading, a short gold rule under it, the
	   line below that, 36px to the cards. */
	.werkwijze__header {
		margin: 0 auto 2.25rem;
		padding: 0 var(--space-6);
		text-align: center;
	}

	.werkwijze__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: #5d674d; /* Figma heading colour; 5.2:1 on the sand */
		text-wrap: balance;
	}

	.werkwijze__heading::after {
		content: '';
		display: block;
		width: 4.5rem; /* 72px */
		height: 2px;
		margin: var(--space-4) auto;
		background: #bb964d; /* Figma gold rule; decorative */
	}

	.werkwijze__sub {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		color: var(--brand-muted);
	}

	/* Under 1100px (phones and tablets): the cards stack top-down, one under the other,
	   and the page simply scrolls past them. No pin, no horizontal slider — the owner's
	   call (2026-09-25). A tablet gets the same single column; three cards do not fit a
	   row below 1100, and two plus one reads as broken. */
	.werkwijze__cards {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		list-style: none;
		margin: 0;
		padding: 0 var(--space-4);
	}

	.werkwijze__cards > li {
		width: min(100%, 25.5rem); /* 408px */
	}

	/* Desktop: one static row of three, the Figma layout. The staircase (see the script)
	   only ever moves the cards by transform from this rest position, so this is also
	   exactly what reduced motion gets. 1100px, not 1024 — see desktopMq in the script. */
	@media (min-width: 1100px) {
		/* Three 408px cards and two 24px gaps, the Figma row (1272px). Below ~1320px the cards
		   narrow together and grow taller (WerkwijzeCard), so the text never runs into the
		   drawing. */
		.werkwijze__cards {
			flex-direction: row;
			align-items: stretch;
			justify-content: center;
			gap: 1.5rem;
			max-width: calc(3 * 25.5rem + 2 * 1.5rem + 2 * var(--space-6));
			margin: 0 auto;
			padding: 0 var(--space-6);
		}

		.werkwijze__cards > li {
			flex: 1 1 0;
			width: auto;
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
