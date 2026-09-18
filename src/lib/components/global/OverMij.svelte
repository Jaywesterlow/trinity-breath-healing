<script lang="ts">
	import { BRAND } from '$lib/constants/brand';
	import AboutStat from '$lib/components/ui/AboutStat.svelte';
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import DrawOn from '$lib/components/ui/DrawOn.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Centerline trace of the portrait line art, inlined so its strokes can draw
	// themselves when the section scrolls into view. Regenerate with the tracer in
	// .planning/quick/20260713-hero-draw-on/trace/ if the artwork changes.
	// The second portrait (about-portrait-2.svg) is no longer shown here; the file
	// stays under $lib/images for the day it is wanted again.
	import portrait from '$lib/images/about-portrait-1.svg?raw';

	/* Shared with /over-mij, which shows the same introduction. One constant, so
	   editing her words in one place cannot leave the other version behind. */
	import { ABOUT_INTRO as bodyText } from '$lib/content/about';
</script>

<!-- Design "A, grootboek" (2026-09-16). Three columns on desktop: the portrait drawn
     straight onto the sand, the words, and a ledger of three figures with hairlines
     between them. No cards, no fills, no circles — the two green cards, the second
     portrait and the three stat circles this replaced are gone.

     DOM order is the reading order on every width: eyebrow and heading, portrait,
     body and button, ledger. Desktop places the same four blocks on a grid (see the
     ≥1100 rules); below that they simply stack in this order, everything centred on
     one axis (2026-09-17). -->
<section class="about" id="over-mij">
	<div class="about__inner">
		<header class="about__header" use:reveal>
			<p class="about__eyebrow">Over mij</p>
			<h2 class="about__heading">Vanuit eigen ervaring weet ik wat jij doormaakt.</h2>
		</header>

		<!-- No reveal: the portrait draws its own strokes on entry (DrawOn), which is
		     an entrance of its own, and at 532px on desktop it is well over the third
		     of the viewport the 2026-09-15 audit set as the ceiling for a fading box. -->
		<div class="about__portrait">
			<DrawOn svg={portrait} />
		</div>

		<!-- Body and button fade as one block, separate from the header above because on
		     mobile the portrait sits between them. -->
		<div class="about__text" use:reveal>
			<p class="about__body">{bodyText}</p>
			<div class="about__more">
				<ButtonLink label="Lees meer over mij" href="/over-mij" variant="secondary" />
			</div>
		</div>

		<!-- The two feature bullets, parked for now (2026-09-16) so they can come back.
		     They need `AboutFeature` from $lib/components/ui and the heart/sprout traces
		     from $lib/images (import heartSvg from '$lib/images/heart.svg?raw', same for
		     sprout.svg), and sat between the body and the button:

		     <ul class="about__features" use:reveal>
		       <li>
		         <AboutFeature
		           artSvg={heartSvg}
		           title="Vanuit eigen ervaring"
		           body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
		         />
		       </li>
		       <li>
		         <AboutFeature
		           artSvg={sproutSvg}
		           iconScale={1.2}
		           title="Vakkundig opgeleid"
		           body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
		         />
		       </li>
		     </ul>

		     with `.about__features { display: flex; flex-direction: column; gap: var(--space-6);
		     list-style: none; padding: 0; margin: 0; }`. -->

		<!-- The ledger. One reveal per row, not one for the list: three rows of 64px
		     numerals are 387px on desktop and the same on a phone, over the third of the
		     viewport the audit allows a fading box, and the audit's own rule for a list
		     that does not fit is a reveal per row. -->
		<ul class="about__ledger">
			<li use:reveal>
				<AboutStat value={BRAND.stats.yearsExperience} label="jaar ervaring" />
			</li>
			<li use:reveal>
				<AboutStat value={BRAND.stats.clientsHelped} label="klachten verholpen" />
			</li>
			<li use:reveal>
				<AboutStat value={BRAND.stats.satisfaction} label="mogelijkheden voor herstel" />
			</li>
		</ul>
	</div>
</section>

<style>
	.about {
		background: var(--color-bg-sand);
		/* The hairline between ledger rows: the site's brown at 28%, so it sits on the
		   sand as a rule rather than a border. */
		--about-hairline: color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.about__inner {
		max-width: var(--container-max); /* same cap as nav/footer/hero/werkwijze */
		margin: 0 auto;
		padding: var(--section-pad) var(--space-6);
	}

	/* --- Header --- */
	.about__header {
		max-width: 24rem; /* 384px — matches Werkwijze convention */
		margin: 0 auto var(--space-8);
		text-align: center;
	}

	.about__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	/* The heading and the paragraph under it share one measure — the site's rule for
	   any block that is not centred. On mobile the header's 24rem cap is the narrower
	   of the two and wins; on desktop 38ch is the one that bites. */
	.about__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 38ch;
		/* The block itself sits on the header's centre line, not only its text: with
		   a max-width narrower than the header, a left-hugging block would put the
		   heading's centre off the paragraph's and the button's below it. */
		margin-inline: auto;
	}

	/* --- Portrait --- */
	/* Drawn straight onto the sand: no card, no fill, no border, no shadow. The SVG
	   paints one masked path with fill="#FFFBF5" baked in for the green card it used
	   to sit on; the rule below inks it forest instead. */
	.about__portrait {
		max-width: 17.5rem; /* ~280px on a phone; the grid column sets it on desktop */
		margin: 0 auto var(--space-8);
	}

	/* DrawOn is display:contents, so the <svg> is the box. :global() because {@html}
	   content carries no scoping class; it stays contained by the scoped parent. The
	   width/height attributes give it the artwork's own ratio, so the baked-in
	   preserveAspectRatio="slice" has nothing to crop. */
	.about__portrait :global(svg.lt) {
		display: block;
		width: 100%;
		height: auto;
	}

	/* The painted path is the svg's one direct child; the mask strokes DrawOn animates
	   live inside <defs> and are untouched by this. */
	.about__portrait :global(svg.lt > path) {
		fill: var(--color-fg-forest);
	}

	/* --- Body + button --- */
	/* Below the desktop grid (< 1100px, phones and tablets alike since 2026-09-17)
	   the whole column reads as one centred stack: eyebrow, heading, portrait,
	   paragraph, button, ledger, all on the same axis. The header above was
	   already centred; the paragraph, the button and the ledger rows used to hug
	   the left edge under a centred heading and a centred portrait. */
	.about__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-10);
		text-align: center;
	}

	.about__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
		line-height: var(--line-height-normal);
		max-width: 38ch; /* the same measure as the heading — see .about__heading */
	}

	/* The wrapper is what centres the button; ButtonLink itself is untouched. */
	.about__more {
		align-self: center;
		display: flex;
		justify-content: center;
	}

	/* --- Ledger --- */
	.about__ledger {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.about__ledger li {
		padding: var(--space-5) 0;
		border-top: 1px solid var(--about-hairline);
		text-align: center; /* number and label on the column's axis, like everything above */
	}

	.about__ledger li:last-child {
		border-bottom: 1px solid var(--about-hairline);
	}

	/* --- Desktop (>=1100px) --- */
	/* 1100, not 1024, since 2026-09-17: the owner's rule is that tablets render as
	   mobile, and the hero and the Werkwijze pin switch at 1100px (b827984), so this
	   section switches on the same line rather than giving a 1024px iPad Pro the
	   desktop grid between a mobile hero and a pinned track.

	   Portrait, words, ledger: 4fr 5fr 3fr on a 64px gutter, everything centred on the
	   row. The header and the text block are separate siblings (the phone puts the
	   portrait between them), so they take the two rows of the middle column and hug
	   the seam between them — header at the end of its row, text at the start of the
	   next — which centres the pair as a unit against the portrait and the ledger,
	   each of which spans both rows. */
	@media (min-width: 1100px) {
		.about__inner {
			display: grid;
			grid-template-columns: 4fr 5fr 3fr;
			grid-template-areas:
				'portrait header ledger'
				'portrait text ledger';
			column-gap: var(--space-16); /* 64px */
			row-gap: var(--space-6);
			align-items: center;
			padding: var(--section-pad) 0; /* horizontal is 0 — max-width + centering sets the edge */
		}

		.about__header {
			grid-area: header;
			align-self: end;
			max-width: none;
			margin: 0;
			text-align: left;
		}

		.about__heading {
			margin-inline: 0; /* left-aligned in its column; the base rule's auto is the stack's */
		}

		.about__portrait {
			grid-area: portrait;
			max-width: none;
			margin: 0;
		}

		/* The grid's middle column is a left-aligned reading column: text, button
		   and ledger go back to the left edge the base rules centre below 1100. */
		.about__text {
			grid-area: text;
			align-self: start;
			align-items: flex-start;
			margin: 0;
			text-align: left;
		}

		.about__more {
			align-self: flex-start;
			justify-content: flex-start;
		}

		.about__ledger {
			grid-area: ledger;
		}

		.about__ledger li {
			text-align: left;
		}
	}
</style>
