<script lang="ts">
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import { reveal } from '$lib/actions/reveal';

	// The redesign hero (approved in Figma 2026-10-24, TODO §15): the tree by the river on
	// the site green, as two images that each overflow on the narrower screen of their range,
	// so a fade edge never shows.
	//
	//   - Portrait 3:4 for portrait screens (phone, tablet held upright). Wider than a phone,
	//     so the sides crop; exactly full width on a tablet. Its lower part runs into the site
	//     green, which is where the text sits, under the tree.
	//   - Landscape 21:9 for everything wider than tall (tablet on its side, laptop, desktop,
	//     ultrawide). Cropped at the sides on 16:9, full width on ultrawide. Ultrawide is not
	//     taller, so one height serves both.
	//
	// The switch is the screen's shape, not its width: the layout depends on whether the
	// image sits above the text or behind it, and that is a question of aspect ratio. The
	// same query is used by the <source> below and by the layout CSS.
	//
	// Widths by hand: the landscape image is drawn at max(100vw, 21/9 × 100vh), the portrait
	// one at max(100vw, 58vh) (see .hero__media), and the sets cover those at 1x–2x.
	import landscape from '$lib/images/redesign/hero-landscape-21x9.webp?w=1440;2120;2880;3840;4800&enhanced';
	import portrait from '$lib/images/redesign/hero-portrait-3x4.webp?w=600;900;1200;1600;2400&enhanced';
	import HeroLights from './HeroLights.svelte';

	// The intro (approved in the prototype, Figma/Hero-redesign/intro-prototype, 2026-10-27):
	// the painting's own lines draw themselves out from the tree's base, the paint washes in
	// from the tree, the lights come in with it, then the text. The drawing is a mask of traced
	// centrelines over the painting's line layer, inlined so it runs from the HTML with CSS
	// only, before hydration (as the line-art hero on main did). Regenerate both SVGs with
	// Figma/Hero-redesign/intro-prototype/{lines,trace,emit-draw}.cjs if the painting changes.
	import drawLandscapeSvg from '$lib/images/redesign/hero-draw-landscape.svg?raw';
	import drawPortraitSvg from '$lib/images/redesign/hero-draw-portrait.svg?raw';
	import linesLandscape from '$lib/images/redesign/hero-lines-landscape.webp?url';
	import linesPortrait from '$lib/images/redesign/hero-lines-portrait.webp?url';

	const PORTRAIT = '(max-aspect-ratio: 1/1)';
	const drawLandscape = drawLandscapeSvg.replace('%LINES%', linesLandscape);
	const drawPortrait = drawPortraitSvg.replace('%LINES%', linesPortrait);
</script>

<section class="hero">
	<!-- The stage holds the picture. On portrait screens it takes whatever height the text
	     leaves, and the picture hangs from its top; when the text needs more room, the picture
	     slides up and loses sky, never river (see the portrait block). -->
	<div class="hero__stage">
		<div class="hero__frame">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
			{@html drawLandscape}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
			{@html drawPortrait}
			<!-- Decorative: the heading and the lead carry the meaning, so the image is alt="".
			     Eager and high priority: it is the largest thing on the first screen. -->
			<picture class="hero__media">
				{#each Object.entries(portrait.sources) as [format, srcset] (format)}
					<source media={PORTRAIT} type="image/{format}" {srcset} sizes="max(100vw, 58vh)" />
				{/each}
				{#each Object.entries(landscape.sources) as [format, srcset] (format)}
					<source type="image/{format}" {srcset} sizes="max(100vw, 236vh)" />
				{/each}
				<img
					class="hero__img"
					src={landscape.img.src}
					width={landscape.img.w}
					height={landscape.img.h}
					alt=""
					loading="eager"
					fetchpriority="high"
					decoding="async"
				/>
			</picture>
			<HeroLights />
		</div>
		<div class="hero__spacer"></div>
	</div>

	<div class="hero__inner">
		<!-- Two exit fades, not one and not three: the heading answers the band on its own bottom
		     edge, and the body and the button leave together, since a button never fades alone.
		     `entrance: false` on both: the arrival is the pure-CSS cascade below. -->
		<div class="hero__content">
			<h1 class="hero__heading" use:reveal={{ entrance: false }}>
				Stress, emoties en ingrijpende ervaringen kunnen je uit balans brengen.
			</h1>
			<div class="hero__text" use:reveal={{ entrance: false }}>
				<p class="hero__body">
					Bij Trinity Breath &amp; Healing begeleid ik je met ademwerk, lichaamsgerichte en
					energetische behandelingen om spanning los te laten, patronen te herkennen en weer dichter
					bij jezelf te komen.
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
	   The text arrives a piece at a time, top to bottom. Pure CSS rather than the
	   scroll-reveal used further down: the hero is painted long before hydration on a
	   phone, so arming a hidden state from JavaScript would show it, blank it and fade it
	   back in. `backwards` applies the start state during the delay, from frame zero.

	   It comes last in the intro (Jay, 2026-10-27): lines draw (0–2.6s), the paint washes in
	   from 1.82s with the lights 0.2s behind it (HeroLights), the text wash at 3.6s, the
	   text at 4.1s. */
	.hero {
		--hero-in-start: 4.1s;
		--paint-at: 1.82s;
		--text-wash-at: 3.6s;
		/* The portrait image's width (see the portrait block). Declared here, not inside that
		   block, so it always resolves: the dead-variable guard checks var() on every screen. */
		--img-w: min(max(100vw, 58.24svh), 117.6vw);
		--img-h: calc(var(--img-w) * 4800 / 3584);
		--side: clamp(24px, calc(9.3vw - 12.3px), 64px); /* portrait: side and bottom padding */
	}

	@media (prefers-reduced-motion: no-preference) {
		/* Two animations, because the fade and the movement want opposite curves: a long
		   gentle fade, and a short 10px rise on a hard expo ease-out that settles early. */
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

	/* The wash paints itself in: three soft radial masks that grow from slightly different
	   centres at different rates, so it spreads like pigment on wet paper, not as a circle.
	   It starts once the painting is in (--text-wash-at), half a second before the text.
	   The resting value (150%) leaves the mask fully open, so without motion it is just there. */
	@property --wash-r {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 150%;
	}

	.hero__content::before {
		mask-image:
			radial-gradient(
				farthest-side at 50% 50%,
				#000 calc(var(--wash-r) - 40%),
				#0000 var(--wash-r)
			),
			radial-gradient(
				farthest-side at 32% 58%,
				#000 calc(var(--wash-r) * 0.85 - 40%),
				#0000 calc(var(--wash-r) * 0.85)
			),
			radial-gradient(
				farthest-side at 66% 42%,
				#000 calc(var(--wash-r) * 0.7 - 40%),
				#0000 calc(var(--wash-r) * 0.7)
			);
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero__content::before {
			animation: hero-wash 1800ms cubic-bezier(0.22, 1, 0.36, 1) var(--text-wash-at) backwards;
		}
	}

	@keyframes hero-wash {
		from {
			--wash-r: 0%;
		}
	}

	/* ─── Intro 1: the lines draw themselves ───
	   Each mask stroke carries pathLength="1", so one dash covers it whatever its length, and
	   offsetting 1 → 0 draws it end to end; --t and --d are baked into the SVG (emit-draw.cjs),
	   starting nearest the tree's base. Gap 1.1, not 1: WebKit's rounding when it scales the
	   pattern back from pathLength="1" otherwise leaves a dot (see main's DrawOn.svelte). The
	   drawing sits under the picture, which covers it once the paint is in. */
	.hero__frame :global(.hero__draw) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.hero__frame :global(.hero__draw path) {
		stroke-dasharray: 1 1.1;
		stroke-dashoffset: 1;
		animation: hero-draw var(--d, 0.6s) ease-out var(--t, 0s) forwards;
	}

	@keyframes hero-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* ─── Intro 2: the paint washes in from the tree ───
	   The text wash's three-radial mask, on the picture, centred on the tree. Its own property
	   so the two washes never share a value. At rest (150%) the picture is simply there. */
	@property --paint-r {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 150%;
	}

	.hero__media {
		--paint-mask:
			radial-gradient(
				farthest-side at var(--cx) var(--cy),
				#000 calc(var(--paint-r) - 40%),
				#0000 var(--paint-r)
			),
			radial-gradient(
				farthest-side at calc(var(--cx) - 12%) calc(var(--cy) + 10%),
				#000 calc(var(--paint-r) * 0.85 - 40%),
				#0000 calc(var(--paint-r) * 0.85)
			),
			radial-gradient(
				farthest-side at calc(var(--cx) + 10%) calc(var(--cy) - 12%),
				#000 calc(var(--paint-r) * 0.7 - 40%),
				#0000 calc(var(--paint-r) * 0.7)
			);
		-webkit-mask-image: var(--paint-mask);
		mask-image: var(--paint-mask);
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero__media {
			animation: hero-paint 1800ms cubic-bezier(0.22, 1, 0.36, 1) var(--paint-at) backwards;
		}
	}

	@keyframes hero-paper {
		from {
			opacity: 0;
		}
	}

	@keyframes hero-paint {
		from {
			--paint-r: 0%;
		}
	}

	/* Reduced motion: the finished picture, no drawing, no wash. */
	@media (prefers-reduced-motion: reduce) {
		.hero__frame :global(.hero__draw path) {
			stroke-dashoffset: 0;
			animation: none;
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

	/* ─── Section ───
	   Starts under the fixed nav (the layout pads <main> by --nav-height), so the image
	   runs to the top of the screen and the nav sits on it, transparent at the top of the
	   home page (Nav.svelte). The site green is the fallback while the image loads, and
	   the colour the portrait image runs into. */
	.hero {
		position: relative;
		isolation: isolate;
		margin-top: calc(-1 * var(--nav-height));
		min-height: 100svh;
		background: var(--color-brand-green);
		color: var(--color-bg-sand);
		overflow: hidden;
	}

	.hero__stage {
		z-index: -1;
	}

	.hero__frame {
		position: relative;
	}

	/* The drawing, the picture and the lights all cover the frame exactly. */
	.hero__media {
		position: absolute;
		inset: 0;
	}

	.hero__img {
		display: block;
		width: 100%;
		height: 100%;
		max-width: none;
	}

	.hero__inner {
		max-width: var(
			--container-max
		); /* same cap as nav/footer, so the text lines up with the logo */
		margin: 0 auto;
	}

	.hero__content {
		position: relative;
		isolation: isolate;
	}

	/* The watercolour wash under the text, instead of a radial scrim: a wash painted on white,
	   its paper keyed to alpha (Figma/Hero-redesign/scripts/wash-process.cjs), pigment
	   #2f3a28 at up to 55%. It has faded to nothing before its edge, so no edge shows.
	   Sized from the text block, centred on it. */
	.hero__content::before {
		content: '';
		position: absolute;
		z-index: -1;
		left: 50%;
		top: 50%;
		aspect-ratio: 2400 / 1792;
		background: url('../../images/redesign/hero-text-wash-1400.webp') center / 100% 100% no-repeat;
		pointer-events: none;
	}

	.hero__heading {
		font-family: var(--font-body); /* DM Sans Medium, per the Figma frames */
		font-weight: var(--font-weight-medium);
		line-height: 1.15;
		text-wrap: balance;
	}

	.hero__body {
		font-family: var(--font-body);
		line-height: 1.5;
	}

	/* ─── Portrait screens: tree above, text at the bottom ───
	   The image is as wide as the screen or 58svh (78% of the height at its 3:4 ratio),
	   whichever is more, so on a phone it overflows at the sides and on a tablet it is full
	   width. The text sits at the bottom of the screen: the button's bottom is one side
	   padding above the edge (Jay, 2026-10-27), so as much of the painting shows as fits.
	   Sizes from the Figma frames: 30/16px at 390, 46/19px at 820.

	   No script for the fit: the stage is a flex column that takes the height the text
	   leaves. The frame counts only down to the river's lowest point (63% of the image) plus
	   8px of air; the rest hangs below behind the text, which there is calm paper. With room
	   to spare, the spacer after the frame takes it and the frame stays at the top. Without
	   it, justify-content: flex-end lets the frame overflow at the top, so a short phone
	   loses sky, never river, and the text never covers it.

	   Across, the river runs out to 2.6% of the image at the left and the canopy to 86.7% at
	   the right, so both show when the screen holds 85% of the image's width: hence the cap
	   of 117.6vw on --img-w (Jay: the whole river, 2026-10-27). The frame's centre sits
	   between the two, at 44.1%, clamped to the image's edges. */
	@media (max-aspect-ratio: 1/1) {
		.hero {
			display: flex;
			flex-direction: column;
		}

		.hero__stage {
			position: relative;
			flex: 1 1 0;
			min-height: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
		}

		.hero__frame {
			flex: none;
			align-self: flex-start;
			width: var(--img-w);
			height: var(--img-h);
			margin-bottom: calc(8px - var(--img-h) * 0.37);
			margin-left: clamp(calc(100% - var(--img-w)), calc(50% - var(--img-w) * 0.441), 0px);
		}

		.hero__spacer {
			flex: 1 0 0;
		}

		/* The painting's paper runs on below it, so its texture never stops at a flat-green
		   edge (its own bottom band, mirrored: intro-prototype/paper.cjs). */
		.hero__frame::after {
			content: '';
			position: absolute;
			top: calc(100% - 1px);
			left: 0;
			width: 100%;
			height: 100svh;
			background: url('../../images/redesign/hero-paper-portrait.webp') top center / 100% auto
				repeat-y;
		}

		/* It belongs to the paint, so it arrives with it, not before the lines are drawn. */
		@media (prefers-reduced-motion: no-preference) {
			.hero__frame::after {
				animation: hero-paper 1.4s ease calc(var(--paint-at) + 0.5s) backwards;
			}
		}

		.hero__frame :global(.hero__draw--landscape) {
			display: none;
		}

		.hero__media {
			--cx: 60%;
			--cy: 48%;
		}

		.hero__inner {
			width: 100%;
			padding: 0 var(--side) var(--side);
		}

		.hero__content {
			max-width: 40rem;
		}

		/* Smaller and lighter than on landscape: here the text sits on the calm green under the
		   river, which already holds 4.4:1, so the wash only has to lift it, and at full size
		   it read as a dark cloud under the button. */
		.hero__content::before {
			width: 125%;
			opacity: 0.7;
			transform: translate(-50%, -50%);
		}

		.hero__heading {
			font-size: clamp(28px, calc(15.5px + 3.72vw), 46px);
			max-width: 14em;
			margin-bottom: 0.5em;
		}

		.hero__body {
			font-size: clamp(15px, calc(13.3px + 0.7vw), 19px);
			max-width: 31em;
			margin-bottom: 1.8em;
		}
	}

	/* ─── Landscape screens: text on the left, over the image ───
	   The image covers the section: height-bound and cropped at the sides on 16:9, width-
	   bound on ultrawide. The text block is centred vertically, 20px below centre as in the
	   frames, and starts at the container's left edge. Sizes follow the frames: 52/19px at
	   1440, 56/20 at 1920, 62/21 at 2560, 68/23 at 3440.

	   The frame is the image's own box, not the section, so the drawing, the picture and the
	   lights crop as one. Across, its centre is 51.5% (between the river's left end at 21%
	   and the canopy's right at 81%), so a 4:3 tablet loses equal bits of both and 1.44:1
	   shows both whole. Down, it hangs from the bottom so the river shows to the edge, but
	   never higher than 15.3% of the image (just above the canopy): on very wide screens the
	   tree keeps its crown and the river gives way first. */
	@media (min-aspect-ratio: 1/1) {
		.hero {
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		.hero__stage {
			position: absolute;
			inset: 0;
			container-type: size;
		}

		.hero__frame {
			--fw: max(100cqw, 100cqh * 6336 / 2688);
			--fh: calc(var(--fw) * 2688 / 6336);
			position: absolute;
			left: clamp(calc(100cqw - var(--fw)), calc(50cqw - var(--fw) * 0.515), 0px);
			top: max(calc(100cqh - var(--fh)), var(--fh) * -0.153);
			width: var(--fw);
			height: var(--fh);
		}

		.hero__frame :global(.hero__draw--portrait) {
			display: none;
		}

		.hero__media {
			--cx: 67%;
			--cy: 58%;
		}

		.hero__img {
			object-fit: cover;
		}

		.hero__inner {
			width: 100%;
			padding: calc(var(--nav-height) + 40px) var(--space-6) var(--nav-height);
		}

		.hero__content {
			width: min(100%, 714px, calc(416px + 8.66vw)); /* the title's width: 10.4em at its size */
		}

		/* Shifted left of centre, so it clears the tree's canopy. */
		.hero__content::before {
			width: 205%;
			transform: translate(-57%, -50%);
		}

		.hero__heading {
			font-size: clamp(40px, calc(40px + 0.833vw), 68px);
			margin-bottom: 0.5em;
		}

		.hero__body {
			font-size: clamp(16px, calc(16px + 0.208vw), 23px);
			max-width: 27em;
			margin-bottom: 1.8em;
		}
	}

	/* From 1100px the nav's row is min(container, 100% - 3rem) with no padding; the text
	   takes the same box, so its left edge is the logo's. */
	@media (min-aspect-ratio: 1/1) and (min-width: 1100px) {
		.hero__inner {
			width: min(var(--container-max), 100% - 3rem);
			padding-inline: 0;
		}
	}
</style>
