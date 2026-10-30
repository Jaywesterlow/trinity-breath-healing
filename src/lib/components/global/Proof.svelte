<script lang="ts">
	/**
	 * The band straight under the hero. Until 2026-10-30 it held three figures
	 * (8+ jaar ervaring, 65+ klachten verholpen, ∞); the owner replaced them with the
	 * three words the practice is named after, each with its own short line, exactly
	 * as supplied: Geest, Lichaam, Ziel.
	 *
	 * Phone: one row per word, the word on the left and its line on the right, a
	 * hairline between rows (the layout of the sketch he sent). From 700px: three
	 * columns, word above line, a hairline in each seam, as the figures were.
	 */
	import { reveal } from '$lib/actions/reveal';

	const PILLARS = [
		{ word: 'Geest', line: 'Bewustwording & rust' },
		{ word: 'Lichaam', line: 'Voelen & ontspannen' },
		{ word: 'Ziel', line: 'Verbinding & groei' }
	] as const;
</script>

<section class="proof" aria-label="Geest, lichaam en ziel">
	<ul class="proof__list">
		{#each PILLARS as pillar (pillar.word)}
			<li class="proof__item" use:reveal>
				<span class="proof__word">{pillar.word}</span>
				<span class="proof__line">{pillar.line}</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	.proof {
		background: var(--color-card-warm);
		--proof-hairline: color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.proof__list {
		list-style: none;
		margin: 0 auto;
		padding: var(--space-6) var(--space-6);
		max-width: var(--container-max);
		display: grid;
	}

	/* Phone: word left, line right, a hairline between the rows. */
	.proof__item {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) 0;
	}

	.proof__item + .proof__item {
		border-top: 1px solid var(--proof-hairline);
	}

	.proof__word {
		font-family: var(--font-display);
		font-weight: var(--font-weight-medium);
		font-size: var(--fs-h2);
		line-height: 1;
		color: var(--color-fg-forest);
	}

	.proof__line {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
		text-align: right;
	}

	@media (min-width: 700px) {
		/* A row of three, word above line, a hairline in each seam. */
		.proof__list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			padding-block: var(--space-12);
		}

		.proof__item {
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: var(--space-2);
			padding: var(--space-2) var(--space-6);
			text-align: center;
		}

		.proof__item + .proof__item {
			border-top: 0;
			border-left: 1px solid var(--proof-hairline);
		}

		.proof__line {
			text-align: center;
		}
	}

	@media (min-width: 1100px) {
		.proof__list {
			padding-inline: 0; /* max-width + centring sets the edge, as everywhere else */
		}
	}
</style>
