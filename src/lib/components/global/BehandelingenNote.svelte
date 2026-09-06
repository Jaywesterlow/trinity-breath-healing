<script lang="ts">
	/**
	 * The line under the treatments carousel.
	 *
	 * One paragraph, centred, with a lot of air around it — a breath between the
	 * seven services above and the contact section below, and a place to say the
	 * thing the cards cannot: that the list is not a menu to choose from on your
	 * own.
	 *
	 * Deliberately not a heading. It is body copy set large, so it reads as
	 * something being said rather than as another section opening, and the
	 * page's h2 rhythm is untouched.
	 */
	import { reveal } from '$lib/actions/reveal';
</script>

<section class="note" aria-label="Over de behandelingen">
	<p class="note__text" use:reveal={{ delay: 0 }}>
		Welke behandeling bij je past, hoef je niet zelf uit te zoeken. In een eerste gesprek kijken we
		samen wat er speelt en wat je lijf op dat moment aankan — en van daaruit kiezen we. Geen vast
		programma, wel een vaste basis: rust, veiligheid en de tijd om te landen.
	</p>
</section>

<style>
	.note {
		background: var(--color-bg-sand);
		padding-block: var(--space-12);
	}

	.note__text {
		max-width: 46rem; /* ~736px — a comfortable measure at this size */
		margin-inline: auto;
		padding-inline: var(--space-6);
		text-align: center;
		font-family: var(--font-display);
		/* Between the section headings (--fs-h2) and body copy: large enough to
		   carry the whole width on its own, quiet enough not to read as a title. */
		font-size: clamp(1.375rem, 1.1rem + 1.2vw, 1.875rem); /* 22 → 30px */
		font-weight: var(--font-weight-light);
		line-height: 1.55;
		color: var(--color-fg-forest);
		text-wrap: balance;
	}

	@media (min-width: 1024px) {
		.note {
			padding-block: var(--space-16);
		}
	}
</style>
