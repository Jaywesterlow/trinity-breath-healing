<script lang="ts">
	/**
	 * The closing block of the treatments section: the line under the carousel,
	 * and the disclaimer under that.
	 *
	 * Two sentences, one long and one short. The first draft ran twice this
	 * length and carried every tell going: a negative parallelism ("geen vast
	 * programma, wel een vaste basis"), a rule of three ("rust, veiligheid en de
	 * tijd om te landen"), and an em dash in the middle of the thought.
	 *
	 * Was its own <section> with a --section-pad band of air on either side. Since
	 * 2026-09-16 it is rendered inside Behandelingen.svelte after the carousel
	 * controls, on the section's own background, with more air above it than
	 * below: 112px from the pagination to the heading, 64px from the disclaimer to
	 * the section's end. The sentence is an h2 now, set large (38px on desktop) and
	 * centred, and on desktop it breaks by hand after "nodig" so the two lines are
	 * the two halves of the thought rather than wherever the measure happened to
	 * fall; its max-width is sized to that break, see the style.
	 *
	 * The disclaimer is BRAND.disclaimer, the same constant every treatment page
	 * shows, set the way ServicePage sets it: small, left-aligned, a brown rule
	 * down its left edge. No button: the contact section is directly below.
	 */
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';
</script>

<!-- One reveal for the block: heading and disclaimer together are 165px at
     1440x900 and 229px at 390x844, inside the third of the viewport the
     2026-09-15 audit allows a fading box. -->
<div class="note" use:reveal>
	<h2 class="note__heading">
		Je hoeft niet te weten welke behandeling je nodig<br class="note__br" />
		hebt. Dat zoeken we in het eerste gesprek samen uit.
	</h2>
	<p class="note__disclaimer">{BRAND.disclaimer}</p>
</div>

<style>
	.note {
		margin-top: 7rem; /* 112px from the carousel's pagination to the heading */
		padding-inline: var(--space-6);
	}

	.note__heading {
		/* 44ch, and not the 30-odd it looks like it should be. The measure is set by the
		   hand break below: line 1 ("Je hoeft ... je nodig") is 40.0ch of this display face
		   and line 2 ("hebt. Dat zoeken ... samen uit.") 42.4ch, measured off the rendered
		   line boxes, and the ratio holds at every size because ch scales with the font.
		   Anything under 42.4ch wraps line 2 into a third line; anything under 40ch moves
		   the break off "nodig". 44ch is the smallest whole width with a rendering margin
		   (~1.5% of the line) on both. On a phone 44ch is wider than the screen, so the
		   padding sets the measure there, as before. */
		max-width: 44ch;
		margin: 0 auto;
		text-align: center;
		font-family: var(--font-display);
		/* 38px from the desktop breakpoint up, 28px on a phone: the same slope shape as
		   the site's --fs-h2 tokens (390px -> 1024px), one step smaller at the top than
		   the 42px it opened at (2026-09-17, "a touch smaller and narrower"). */
		font-size: clamp(1.75rem, 1.366rem + 1.577vw, 2.375rem);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	/* The hand break only exists on desktop; below that the sentence wraps as the
	   width dictates and the <br> is simply not rendered. */
	.note__br {
		display: none;
	}

	/* Set apart from the heading without being a warning box, the way the service
	   pages set the same line: a rule down the left, small light type. Left-aligned
	   text in a block that is itself centred under the heading. */
	.note__disclaimer {
		max-width: 60ch;
		margin: var(--space-8) auto 0;
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		text-align: left;
		font-family: var(--font-body);
		font-size: 0.875rem; /* 14px */
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	@media (min-width: 1024px) {
		.note__br {
			display: inline;
		}
	}
</style>
