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

	const PORTRAIT = '(max-aspect-ratio: 1/1)';
</script>

<section class="hero">
	<!-- Decorative: the heading and the lead carry the meaning, so the image is alt="". Eager
	     and high priority: it is the largest thing on the first screen, so the LCP candidate. -->
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

	   The start used to wait for the line drawing to draw itself (half of 2.86s). The
	   drawing is gone, and the heading at opacity 0 does not count as painted, so the wait
	   is now only long enough for the image to be the first thing seen. */
	.hero {
		--hero-in-start: 150ms;
		/* The portrait image's width (see the portrait block). Declared here, not inside that
		   block, so it always resolves: the dead-variable guard checks var() on every screen. */
		--img-w: max(100vw, 58.24svh);
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
	   Preview of the reveal (TODO §15), timed against the text cascade, which is unchanged.
	   The resting value (150%) leaves the mask fully open, so without motion it is just there. */
	@property --wash-r {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 150%;
	}

	.hero__content::before {
		--wash-mask:
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
		mask-image: var(--wash-mask);
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero__content::before {
			animation: hero-wash 1800ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
		}
	}

	@keyframes hero-wash {
		from {
			--wash-r: 0%;
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

	.hero__media {
		position: absolute;
		z-index: -1;
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

	/* ─── Portrait screens: tree above, text below ───
	   The image is as wide as the screen or 58svh (78% of the height at its 3:4 ratio),
	   whichever is more, so on a phone it overflows at the sides and on a tablet it is full
	   width. The text starts at 58% of the image's height, where the river has faded into
	   the green. Sizes from the Figma frames: 30/16px at 390, 46/19px at 820. */
	@media (max-aspect-ratio: 1/1) {
		.hero__media {
			top: 0;
			left: 50%;
			width: var(--img-w);
			aspect-ratio: 3584 / 4800;
			transform: translateX(-50%);
		}

		/* Belt and braces: the image's own bottom is the site green already (#637456 against
		   #627454), this hides the last 1% if a decoder shifts it. */
		.hero__media::after {
			content: '';
			position: absolute;
			inset: auto 0 0;
			height: 10rem;
			background: linear-gradient(to bottom, transparent, var(--color-brand-green));
		}

		.hero__inner {
			padding: calc(var(--img-w) * 0.7768) clamp(24px, calc(9.3vw - 12.3px), 64px)
				clamp(64px, 12vw, 120px);
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
	   1440, 56/20 at 1920, 62/21 at 2560, 68/23 at 3440. */
	@media (min-aspect-ratio: 1/1) {
		.hero {
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		.hero__media {
			inset: 0;
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
