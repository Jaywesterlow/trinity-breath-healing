<script lang="ts">
	import { BRAND } from '$lib/constants/brand';
	import AboutStat from '$lib/components/ui/AboutStat.svelte';
	import AboutFeature from '$lib/components/ui/AboutFeature.svelte';
	import TextLink from '$lib/components/ui/interactions/TextLink.svelte';
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import DrawOn from '$lib/components/ui/DrawOn.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Centerline traces of the portrait line art, inlined so their strokes can draw
	// themselves when the section scrolls into view. Regenerate with the tracer in
	// .planning/quick/20260713-hero-draw-on/trace/ if the artwork changes.
	import portrait1 from '$lib/images/about-portrait-1.svg?raw';
	import portrait2 from '$lib/images/about-portrait-2.svg?raw';

	// Heart and sprout feature icons, same treatment. Infinity stays a plain PNG (not traced).
	import heartSvg from '$lib/images/heart.svg?raw';
	import sproutSvg from '$lib/images/sprout.svg?raw';

	/* Shared with /over-mij, which shows the same introduction. One constant, so
	   editing her words in one place cannot leave the other version behind. */
	import { ABOUT_INTRO as bodyText } from '$lib/content/about';
</script>

{#snippet portraitCard(svg: string, modifier: string)}
	<div class="about__card {modifier}">
		<DrawOn {svg} class="about__card-draw" />
	</div>
{/snippet}

<section class="about" id="over-mij">
	<div class="about__inner">
		<header class="about__header">
			<p class="about__eyebrow" use:reveal={{ delay: 0 }}>Over mij</p>
			<h2 class="about__heading" use:reveal={{ delay: 120 }}>
				Vanuit eigen ervaring weet ik wat jij doormaakt.
			</h2>
		</header>

		<div class="about__media">
			<div class="about__card about__card--mobile">
				<DrawOn svg={portrait2} class="about__card-draw" />
				<div class="about__gradient-blur" aria-hidden="true">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
				<div class="about__pill">
					<ButtonLink label="Plan een kennismaking" href="/contact" variant="outline" />
				</div>
				<div class="about__scrim">
					<p class="about__scrim-body">{bodyText}</p>
					<TextLink label="Lees meer over mij" href="/over-mij" tone="gold-soft" size="sm" />
				</div>
			</div>

			{@render portraitCard(portrait1, 'about__card--desktop-1')}
			{@render portraitCard(portrait2, 'about__card--desktop-2')}
		</div>

		<div class="about__content">
			<p class="about__body" use:reveal={{ delay: 240 }}>{bodyText}</p>
			<ul class="about__features">
				<li use:reveal={{ delay: 360 }}>
					<AboutFeature
						artSvg={heartSvg}
						title="Vanuit eigen ervaring"
						body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
					/>
				</li>
				<li use:reveal={{ delay: 480 }}>
					<AboutFeature
						artSvg={sproutSvg}
						iconScale={1.2}
						title="Vakkundig opgeleid"
						body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
					/>
				</li>
			</ul>
			<TextLink label="Lees meer over mij" href="/over-mij" tone="muted" />
		</div>

		<ul class="about__stats">
			<li use:reveal={{ delay: 0 }}>
				<AboutStat value={BRAND.stats.yearsExperience} label="Jaren ervaring" />
			</li>
			<li use:reveal={{ delay: 120 }}>
				<AboutStat value={BRAND.stats.clientsHelped} label="Klachten verholpen" />
			</li>
			<li use:reveal={{ delay: 240 }}>
				<AboutStat iconSrc="/images/infinity.png" label="Mogelijkheden voor herstel" />
			</li>
		</ul>
	</div>
</section>

<style>
	.about {
		background: var(--color-bg-sand);
	}

	.about__inner {
		max-width: var(--container-max); /* 1200px — same cap as nav/footer/hero/werkwijze */
		margin: 0 auto;
		padding: var(--space-16) 0;
	}

	.about__header {
		max-width: 24rem; /* 384px — matches Werkwijze convention */
		margin: 0 auto var(--space-8);
		padding: 0 var(--space-6);
		text-align: center;
	}

	.about__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.about__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	/* --- Media block --- */
	.about__media {
		padding: 0 var(--space-6);
		margin-bottom: var(--space-8);
	}

	.about__card {
		position: relative;
		background: var(
			--color-fg-forest
		); /* portrait art is transparent-bg line work; needs this behind it */
		border-radius: 1.563rem; /* 25px — Figma spec, matches WerkwijzeCard convention */
		overflow: hidden;
	}

	/* The portraits are now inlined SVG (so their strokes can draw). DrawOn is display:contents,
	   so the <svg> lands exactly where the <img> did and inherits its box. object-fit has no
	   effect on an inline SVG — its equivalent is preserveAspectRatio="xMidYMid slice", which
	   is baked into the generated file. :global() because {@html} content carries no scoping
	   class; it stays contained by the scoped .about__card parent. */
	.about__card :global(svg.lt) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Mobile: single full-bleed card with overlay pill + scrim */
	.about__card--mobile {
		display: block;
		width: 100%;
		height: 36.188rem; /* 579px — Figma mobile spec */
	}

	.about__card--desktop-1,
	.about__card--desktop-2 {
		display: none;
	}

	.about__pill {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
	}

	/* Progressive gradient blur behind the scrim text, adapted from
	   https://codepen.io/silas/pen/rNYqZoz (their scroll/#wrapper demo dropped — kept
	   only the .gradient-blur mechanism, repointed from position:fixed/viewport to
	   position:absolute/this card). backdrop-filter samples the real portrait behind
	   it, so a single masked blur layer would work in theory — but one full-height
	   mask on one blurred layer is exactly what didn't render in this browser (see
	   git history). The pen's actual technique is 8 stacked layers (::before, 6 divs,
	   ::after), each blurring MORE (0.5px doubling to 64px) and each masked to only
	   its own narrow band, so no single layer needs a full 0–100% mask — that's what
	   makes it render reliably, and it's the standard iOS-style progressive blur
	   recipe. Direction: least blur near the top of this zone, heaviest at the very
	   bottom, matching the tint gradient. */
	.about__gradient-blur {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.about__gradient-blur > div,
	.about__gradient-blur::before,
	.about__gradient-blur::after {
		position: absolute;
		inset: 0;
	}

	.about__gradient-blur::before {
		content: '';
		z-index: 1;
		backdrop-filter: blur(0.5px);
		-webkit-backdrop-filter: blur(0.5px);
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 12.5%,
			black 25%,
			transparent 37.5%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 12.5%,
			black 25%,
			transparent 37.5%
		);
	}

	.about__gradient-blur > div:nth-of-type(1) {
		z-index: 2;
		backdrop-filter: blur(1px);
		-webkit-backdrop-filter: blur(1px);
		mask-image: linear-gradient(
			to bottom,
			transparent 12.5%,
			black 25%,
			black 37.5%,
			transparent 50%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 12.5%,
			black 25%,
			black 37.5%,
			transparent 50%
		);
	}

	.about__gradient-blur > div:nth-of-type(2) {
		z-index: 3;
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		mask-image: linear-gradient(
			to bottom,
			transparent 25%,
			black 37.5%,
			black 50%,
			transparent 62.5%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 25%,
			black 37.5%,
			black 50%,
			transparent 62.5%
		);
	}

	.about__gradient-blur > div:nth-of-type(3) {
		z-index: 4;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		mask-image: linear-gradient(
			to bottom,
			transparent 37.5%,
			black 50%,
			black 62.5%,
			transparent 75%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 37.5%,
			black 50%,
			black 62.5%,
			transparent 75%
		);
	}

	.about__gradient-blur > div:nth-of-type(4) {
		z-index: 5;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		mask-image: linear-gradient(
			to bottom,
			transparent 50%,
			black 62.5%,
			black 75%,
			transparent 87.5%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 50%,
			black 62.5%,
			black 75%,
			transparent 87.5%
		);
	}

	.about__gradient-blur > div:nth-of-type(5) {
		z-index: 6;
		backdrop-filter: blur(var(--space-4)); /* 16px */
		-webkit-backdrop-filter: blur(var(--space-4));
		mask-image: linear-gradient(
			to bottom,
			transparent 62.5%,
			black 75%,
			black 87.5%,
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 62.5%,
			black 75%,
			black 87.5%,
			transparent 100%
		);
	}

	.about__gradient-blur > div:nth-of-type(6) {
		z-index: 7;
		backdrop-filter: blur(var(--space-8)); /* 32px */
		-webkit-backdrop-filter: blur(var(--space-8));
		mask-image: linear-gradient(to bottom, transparent 75%, black 87.5%, black 100%);
		-webkit-mask-image: linear-gradient(to bottom, transparent 75%, black 87.5%, black 100%);
	}

	.about__gradient-blur::after {
		content: '';
		z-index: 8;
		backdrop-filter: blur(var(--space-16)); /* 64px */
		-webkit-backdrop-filter: blur(var(--space-16));
		mask-image: linear-gradient(to bottom, transparent 87.5%, black 100%);
		-webkit-mask-image: linear-gradient(to bottom, transparent 87.5%, black 100%);
	}

	.about__scrim {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: var(--space-8) var(--space-6) var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: flex-start; /* flex default (stretch) was stretching the link's own box — and its border-bottom underline with it — to the scrim's full width */
		gap: var(--space-4);
		background: linear-gradient(
			to top,
			var(--color-fg-forest-92) 0%,
			transparent 55%
		); /* tint — plain background gradient, no mask needed, fades on its own */
		z-index: 1; /* above .about__gradient-blur (that wrapper is its own stacking context at z-index: 0, so its internal 1–8 layers don't leak out and collide with this) */
	}

	.about__scrim-body {
		align-self: stretch; /* .about__scrim is flex-start now (for the link below) — this stays full-width so its text still wraps normally */
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-bg-sand);
		line-height: var(--line-height-normal);
	}

	/* --- Content block (desktop-only) --- */
	.about__content {
		display: none;
	}

	.about__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
		line-height: var(--line-height-normal);
	}

	.about__features {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* --- Stats row --- */
	.about__stats {
		display: flex;
		flex-direction: column;
		align-items: center; /* column flex: cross-axis is horizontal, so this centers each stat row */
		gap: var(--space-6);
		padding: 0 var(--space-6);
		list-style: none;
		margin: 0;
	}

	.about__stats li {
		width: 12.5rem; /* 200px — no token near this value exists (spacing scale tops out at --space-16/64px, --container-max/1200px is the page container), so plain rem. Fixed, not max-width — content length (label text) no longer decides it, and all three stay equal */
		flex-shrink: 0;
	}

	/* --- Tablet (768–1023px) --- */
	/* No Figma tablet frame exists for this section. Applying the mobile layout as-is here
	   stretches badly: .about__card--mobile is width:100% with a fixed height, so at tablet
	   widths the crop gets much wider without getting taller, distorting the portrait image.
	   Built as a 2-column combination instead: the mobile card (portrait-2 + pill + scrim,
	   already self-contained) kept at its natural fixed width instead of stretching, paired
	   beside desktop's other portrait (portrait-1) — reusing both existing card designs
	   rather than inventing a third. Header, feature rows, and stats are untouched (feature
	   rows stay desktop-only, matching "keep the rest of the section as is"). */
	@media (min-width: 768px) and (max-width: 1023px) {
		.about__media {
			display: flex;
			justify-content: center;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.about__card--mobile {
			width: 17.625rem; /* 282px — matched to the desktop card size so both tablet cards are equal */
			height: 28.688rem; /* 459px */
			flex-shrink: 0;
			order: 2; /* content card on the right — the "second" card at this breakpoint */
			margin-top: var(--space-10); /* 2.5rem */
		}

		.about__card--desktop-1 {
			display: block;
			flex-shrink: 0;
			width: 17.625rem; /* 282px — same as desktop */
			height: 28.688rem; /* 459px — same as desktop */
			order: 1; /* plain portrait on the left */
		}

		.about__stats {
			flex-direction: row;
			justify-content: center;
			align-items: stretch; /* base rule's align-items:center (for mobile's column stack) would otherwise vertically center each li by its own height once row — with the infinity label wrapping to 2 lines vs 1 for the others, that misaligns the circles */
		}

		.about__stats li {
			height: 100%; /* stretch to the row height (tallest li) — li is a plain block box, so its child (.stat) still just sits at the top, with any extra space falling below it */
		}
	}

	/* --- Desktop (>=1024px) --- */
	/* Figma: two portrait cards and the eyebrow/heading/body/features/link column sit
	   side by side, with the stats row spanning full width below both. A grid on the
	   section lets the header and content blocks (separate DOM siblings, for a sane
	   reading/source order) share one column beside the media column, without
	   restructuring the markup. */
	@media (min-width: 1024px) {
		.about__inner {
			display: grid;
			grid-template-columns: auto 1fr;
			grid-template-areas:
				'media header'
				'media content'
				'stats stats';
			column-gap: 7.5rem; /* ~126px Figma gap between media and text column; matches this file's existing 1440px lock value */
			row-gap: var(--space-6);
			align-items: start;
			padding: var(--space-16) 0; /* horizontal is 0 — max-width + centering sets the edge */
		}

		.about__header {
			grid-area: header;
			max-width: none;
			margin: 0;
			padding: 0;
			text-align: left;
		}

		.about__media {
			grid-area: media;
			display: flex;
			gap: 4.688rem; /* 75px — matches Werkwijze card gap convention */
			margin-bottom: 0;
		}

		.about__card--mobile {
			display: none;
		}

		.about__card--desktop-1,
		.about__card--desktop-2 {
			display: block;
			flex-shrink: 0;
			width: 17.625rem; /* 282px — Figma spec */
			height: 28.688rem; /* 459px — Figma spec */
		}

		.about__card--desktop-2 {
			margin-top: var(--space-10); /* 2.5rem — the second card in the media row */
		}

		.about__content {
			grid-area: content;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-6);
			max-width: 37.5rem;
			margin: 0;
			padding: 0;
			text-align: left;
		}

		.about__content :global(.text-link) {
			--text-link-size: var(
				--font-size-xl
			); /* 1.25rem — a little smaller than TextLink's 1.5rem default, desktop only */
		}

		.about__stats {
			grid-area: stats;
			flex-direction: row;
			justify-content: center;
			align-items: stretch; /* base rule's align-items:center (for mobile's column stack) would otherwise vertically center each li by its own height once row — with the infinity label wrapping to 2 lines vs 1 for the others, that misaligns the circles */
			gap: var(--space-16);
			padding: 0;
			margin-top: var(--space-16);
		}

		.about__stats li {
			height: 100%; /* stretch to the row height (tallest li) — li is a plain block box, so its child (.stat) still just sits at the top, with any extra space falling below it */
		}
	}
</style>
