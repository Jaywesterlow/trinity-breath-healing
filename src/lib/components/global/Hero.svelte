<script lang="ts">
	import { onMount } from 'svelte';
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';

	// The hero illustration is a centerline trace of the original line art, inlined as SVG so
	// its strokes can draw themselves on load (stroke-dashoffset, see .hero__draw below).
	// Inlined via ?raw + {@html} rather than <img>: an external SVG can't be reached by this
	// component's CSS, and inlining also drops the 790 KB PNG request off the LCP path.
	// Regenerate with .planning/quick/20260713-hero-draw-on/trace/ if the artwork changes.
	import heroSvg from '$lib/images/hero-illustration.svg?raw';

	let sectionEl: HTMLElement | null = $state(null);
	let leftEl: HTMLDivElement | null = $state(null);

	// The desktop hero image must never grow taller than the content column beside it
	// (heading + body + CTA). CSS percentage-height on a replaced
	// element (img) nested this deep in grid+flex doesn't resolve as a definite value —
	// confirmed empirically, it falls back to matching the viewport width outright and
	// crops the image (the same failure mode documented on .hero__img below for a
	// different combo). A ResizeObserver measures .hero__left's real rendered height
	// and writes it as a plain px custom property, which var() substitutes into a
	// genuinely definite length — sidestepping the percentage-resolution issue entirely.
	onMount(() => {
		if (!leftEl || !sectionEl) return;

		const ro = new ResizeObserver((entries) => {
			const height = entries[0]?.contentRect.height;
			if (height && sectionEl) {
				sectionEl.style.setProperty('--hero-content-height', `${height}px`);
			}
		});
		ro.observe(leftEl);

		return () => ro.disconnect();
	});
</script>

<section class="hero" bind:this={sectionEl}>
	<div class="hero__inner">
		<!-- Image column: top on mobile (DOM order), right on desktop (order:2) -->
		<div class="hero__image-col">
			<!-- Wrapper stands in for the <picture> that <enhanced:img> used to emit: a
			     full-width block box. It keeps this flex item's width constant across the
			     ResizeObserver's height write, so only height shifts (as before) — without it
			     the SVG becomes the flex item itself and its width shifts too, tripling CLS. -->
			<div class="hero__img-wrap">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
				{@html heroSvg}
			</div>
		</div>

		<!-- Content column: below image on mobile (DOM order), left on desktop (order:1) -->
		<div class="hero__left" bind:this={leftEl}>
			<div class="hero__content">
				<h1 class="hero__heading">
					Rust in je hoofd.<br />
					Ontspanning in je lichaam.
				</h1>
				<p class="hero__body">
					Ik weet hoe het voelt om vast te lopen, fysiek, mentaal en emotioneel. Via
					lichaamsgerichte therapie, ademwerk en energetische behandelingen help ik jou terug naar
					rust, herstel en jezelf.
				</p>
				<div class="hero__cta">
					<ButtonLink href="/contact" label="Maak een afspraak" />
				</div>
			</div>

		</div>
	</div>
</section>

<style>
	/* ─── Entrance cascade ──────────────────────────────────────────────────────────
	   The hero arrives a piece at a time, top to bottom, rather than all at once.

	   Pure CSS, and deliberately not the scroll-reveal pattern used further down the page.
	   That one arms the hidden state from JavaScript so the server-rendered HTML always shows
	   finished content — safe for a section nobody has scrolled to yet, but wrong here: the
	   hero is painted long before hydration on a phone, so arming it after the fact would show
	   the hero, blank it, and fade it back in. A CSS animation is in force from the very first
	   frame, needs no JavaScript at all, and cannot flash.

	   `backwards` is what does that: it applies the keyframe's starting state during the delay,
	   so an element with a 410ms delay is hidden from frame zero rather than visible until its
	   turn comes.

	   Ordered by where things sit on screen, not by DOM order — the two columns swap sides at
	   1024px. The illustration is left out on purpose: its draw-on stroke animation is already
	   its entrance, and fading it in on top of that would be two entrances for one element.

	   The whole cascade waits for the illustration to finish drawing itself, so the two
	   entrances read as one sequence rather than talking over each other.

	   KNOWN COST, accepted deliberately: the heading is the LCP element, and an element at
	   opacity 0 does not count as painted, so this delay lands directly on Largest Contentful
	   Paint. It was 1ms before this wait was added. The project's budget is LCP < 2.5s, and
	   the wait alone is 2.86s — so LCP is over budget by roughly the length of the draw. The
	   fix, if that budget starts to bite, is to shorten the draw rather than to unpick the
	   sequencing: the trace's stagger is generated, and regenerating it with a shorter total
	   pulls this number down with it. */
	.hero {
		/* Longest --t + --d baked into hero-illustration.svg, i.e. the frame the last stroke
		   finishes. Regenerating the trace changes this — the generator's stagger and duration
		   are what set it, so re-measure rather than assuming it held. */
		--hero-draw-total: 2.86s;

		/* The text starts arriving at the drawing's halfway point, not its end. Waiting for the
		   full draw put the heading's first visible frame at 2.86s, and since the heading is the
		   LCP element and an element at opacity 0 does not count as painted, that landed whole on
		   Largest Contentful Paint — against a 2.5s budget.

		   Halving it halves the cost almost exactly, because LCP is marked when opacity leaves 0
		   (the end of this delay), not when the fade completes. The sequencing survives: the
		   drawing is still visibly going when the text begins, so the two still read in order
		   rather than together. Expressed as a fraction of the total so that regenerating the
		   trace moves both in step. */
		--hero-in-start: calc(var(--hero-draw-total) / 2);
	}

	@media (prefers-reduced-motion: no-preference) {
		/* Two animations, not one, because the fade and the movement want opposite curves.
		   Running both off a single 620ms expo keyframe made this read as a fly-in: an expo
		   ease-out is ~80% done in its first quarter, so the element arrived almost at once and
		   the movement — not the fade — was the thing you noticed.

		   The fade is now the long, dominant half: 1300ms on a gentle curve, so it is visibly
		   still fading most of the way through. The movement is the short, subordinate half:
		   10px rather than 16, on a hard expo ease-out that settles early and gets out of the
		   way. What is left is a slow fade with a hint of rise under it.

		   A single animation-delay value applies to both entries in the list. */
		.hero__heading,
		.hero__body,
		.hero__cta {
			animation:
				hero-fade 1300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards,
				hero-rise 1100ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
		}

		.hero__heading {
			animation-delay: var(--hero-in-start);
		}
		.hero__body {
			animation-delay: calc(var(--hero-in-start) + 140ms);
		}
		.hero__cta {
			animation-delay: calc(var(--hero-in-start) + 280ms);
		}
	}

	@keyframes hero-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes hero-rise {
		from {
			transform: translate3d(0, 10px, 0);
		}
	}

	/* ─── Section ─── */
	.hero {
		background: var(--color-bg-sand);
		overflow: hidden; /* clips mobile image bleed */
	}

	.hero__inner {
		display: flex;
		flex-direction: column;
		max-width: var(--container-max); /* 1200px — same cap as nav/footer, so content edges line up */
		margin: 0 auto;
	}

	/* ─── Image column — mobile: top via DOM order ─── */
	.hero__image-col {
		/* Hero's mobile content is fixed-height (image is width-bound, not vh-bound), so on
		   tall viewports the next section starts creeping into view below the fold. Content
		   height also varies by viewport WIDTH (heading/body text wraps to a different number
		   of lines at different widths, non-monotonically) — 808px is calibrated to the
		   worst case in the ≤389px bucket (~340-375px, where text wraps tallest). The ≥390px
		   bucket below uses a later threshold since its content is naturally shorter, keeping
		   the added margin closer to the minimum actually needed at those widths. Verified via
		   a full width x height scan (320-430 x 667-1300) to leave zero peek in either bucket. */
		margin-top: calc(var(--space-6) + max(0px, 100vh - 808px));
		width: 100%;
		overflow: hidden; /* clip the symmetric bleed to the viewport edges */
		position: relative;
	}

	/* ≥390px: heading/body text wraps to fewer lines here, so content is naturally shorter —
	   a later threshold keeps the added margin closer to the minimum actually needed. */
	@media (min-width: 390px) and (max-width: 767px) {
		.hero__image-col {
			margin-top: calc(var(--space-6) + max(0px, 100vh - 861px));
		}
	}

	/* The illustration is injected via {@html}, so Svelte's scoping classes never land on it —
	   :global() under the (scoped) parent reaches it without leaking outside the hero.
	   Every sizing rule below is carried over unchanged from the <img> this replaced, with one
	   addition: an inline <svg> is NOT a replaced element the way <img> is — `width: auto`
	   resolves to "fill the container" rather than "follow the intrinsic aspect ratio", which
	   letterboxed the art inside a too-wide box on desktop (measured 1.093 vs the true 1.171).
	   An explicit aspect-ratio restores the <img> behaviour the surrounding CSS was tuned for. */
	.hero__img-wrap {
		display: block;
		width: 100%;
	}

	.hero__image-col :global(.hero__img) {
		display: block;
		position: relative;
		left: 50%;
		transform: translateX(-50%); /* symmetric bleed — centres the image whatever its width */
		aspect-ratio: 2015 / 1721; /* the artwork's intrinsic ratio — see note above */
		width: auto; /* auto width keeps aspect locked — never crops, never stretches */
		height: auto;
		/* Was 130%. That ceiling was never actually reachable before: <enhanced:img> served a
		   downscaled raster (intrinsic 389px at this breakpoint), so `width: auto` landed well
		   under the cap and the art sat inside the column. The SVG's intrinsic width is the
		   artwork's full 2015px, which WOULD hit 130% and bleed off both edges — a size change
		   nobody asked for. 100% reproduces the shipped rendering exactly (390x333 at 390px). */
		max-width: 100%;
		max-height: max(
			220px,
			calc(100vh - 24rem)
		); /* full-bleed on tall phones; shrinks (never below 220px) on short screens, in step with the heading */
		color: #211f1d; /* the original artwork's ink colour; strokes are currentColor */
	}

	/* ─── Draw-on: the strokes paint themselves on load ─────────────────────────────
	   Each <path> carries pathLength="1", so one dash covers the whole path whatever its
	   real length, and offsetting 1 → 0 draws it end to end. Per-path --t (delay) and
	   --d (duration) are baked into the SVG, staggered ridges → tree → river → waterfall.
	   Composited on the GPU; no JS, no layout, no scroll coupling. */
	.hero__image-col :global(.hero__draw path) {
		/* Gap 1.1, not 1 — see DrawOn.svelte for the full reasoning. `stroke-dasharray: 1`
		   parks the gap exactly over the path with no margin, and WebKit's rounding when it
		   scales the pattern back from pathLength="1" leaves a sub-pixel dash that a round
		   linecap paints as a full-width dot. The wider gap keeps the path clear until the
		   offset animates; at offset 0 the dash covers it exactly, as before. */
		stroke-dasharray: 1 1.1;
		stroke-dashoffset: 1;
		animation: hero-draw var(--d, 0.6s) ease-out var(--t, 0s) forwards;
	}

	@keyframes hero-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Reduced motion: show the finished drawing immediately, never animate. */
	@media (prefers-reduced-motion: reduce) {
		.hero__image-col :global(.hero__draw path) {
			stroke-dashoffset: 0;
			animation: none;
		}
	}

	/* ─── Content ─── */
	.hero__content {
		padding: var(--space-4) var(--space-6) var(--space-16); /* bottom space so the section doesn't butt the next one */
		--btn-label-size: var(--font-size-sm); /* 14px on mobile, Figma spec */
	}

	.hero__heading {
		font-family: var(--font-display);
		font-size: min(
			var(--fs-title),
			4.8vh
		); /* mobile: token size, but shrinks with the image on short screens */
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
		line-height: var(--line-height-tight);
		margin-bottom: var(--space-4);
	}

	.hero__body {
		font-family: var(--font-body);
		font-size: var(--fs-body-xs); /* fluid hero-intro clamp: 11px → 16px */
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
		margin-bottom: var(--space-4);
	}

	/* ─── Desktop / tablet (≥ 768px) — two-column, image beside text ─── */
	@media (min-width: 768px) {
		.hero__inner {
			display: grid;
			grid-template-columns: 44% 1fr; /* content keeps its reserved 44% share; image gets the rest */
			/* align-items: start (not the grid default, stretch) is load-bearing: .hero__left
			   must report its own intrinsic content height to the ResizeObserver in the
			   script block, unaffected by the row's track height. Stretch would make it
			   match the row instead — which the image's height also feeds — a circular
			   dependency that compounds every frame into runaway values (confirmed
			   empirically: heights spiralled into the thousands of px). */
			align-items: start;
			position: relative; /* anchor for the absolutely-positioned social icons */
		}

		/* Content column: heading group + cards stack from the top, fixed gap between them.
		   flex-start (not space-between) keeps the gap tight and constant at every viewport
		   height, so the content never drifts and the cards stay above the fold. */
		.hero__left {
			grid-column: 1;
			grid-row: 1;
			position: relative;
			z-index: 1; /* content always paints above the artwork — no absolute positioning needed */
			min-width: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
		}

		.hero__content {
			padding: var(--space-12) var(--space-10) 0 0; /* left is 0 — max-width + centering sets the edge */
			margin-bottom: var(
				--space-8
			); /* desktop-only floor gap so content never butts the service cards */
			--btn-label-size: var(--font-size-xl); /* 20px on desktop */
		}

		.hero__heading {
			font-size: var(
				--fs-title-sm
			); /* tablet 768–1023: smaller token; ≥1024 restores full --fs-title */
			max-width: 25rem;
			margin-bottom: var(--space-4);
		}

		.hero__body {
			max-width: 27.5rem;
			margin-bottom: var(--space-6);
		}

		/* Image column sits in the right grid track (col 2), which spans exactly from the content's
		   right edge to the screen's right edge. The illustration is centred within it — i.e. at the
		   midpoint between the hero content and the right edge of the screen. */
		.hero__image-col {
			grid-column: 2; /* right track only — no longer spans/overlaps the content column */
			grid-row: 1;
			min-width: 0;
			margin-top: 0;
			display: flex;
			align-items: flex-start;
			justify-content: center; /* centre the illustration in the right zone (content-right ↔ screen-right) */
			padding-top: var(--space-12);
			overflow: hidden; /* clip only if the art is wider than the track — never a horizontal scrollbar */
		}

		.hero__image-col :global(.hero__img) {
			left: auto;
			transform: none; /* reset the mobile bleed-centring; desktop positions via the grid column */
			width: auto;
			/* Definite height, not auto+max-height/percentage: confirmed empirically (twice,
			   with two different approaches) that this replaced element's sizing inside
			   nested grid+flex falls back to matching the viewport width outright instead
			   of the aspect-ratio + height-clamped size, badly cropping the image. A
			   genuinely definite length sidesteps it. --hero-content-height is a plain px
			   value written by a ResizeObserver in the script block, measuring
			   .hero__left's real rendered height (heading + body + CTA) — so the
			   image is capped at exactly the content column's height and never grows past
			   it. The var() fallback only matters for the brief pre-hydration paint,
			   before the observer has measured anything. */
			height: var(--hero-content-height, min(calc(100vh - var(--nav-height)), 1000px, 55vw));
			max-width: none; /* width follows aspect */
			max-height: none; /* cancels the mobile-base max-height, which otherwise keeps cascading through */
		}

	}

	/* Tablet only (768–1023px): row is too narrow for content to breathe flush against
	   the edge the way it can once max-width takes over at 1024px+, or the way the
	   true-mobile stacked layout can below 768px. */
	@media (min-width: 768px) and (max-width: 1023.98px) {
		.hero__content {
			padding-left: var(--space-6);
		}
	}

	/* ─── Desktop (≥ 1024px) — restore the full-size hero title (tablet uses --fs-title-sm) ─── */
	@media (min-width: 1024px) {
		.hero__heading {
			font-size: var(--fs-title); /* full 36→48 above the tablet range */
		}
	}
</style>
