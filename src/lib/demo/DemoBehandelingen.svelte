<script lang="ts">
	/**
	 * The seven treatments as a hairline list beside a photo: the sector's
	 * service rows, on the page's one tint band. The photo wipes open from
	 * below as it enters (library 12). Names and teasers are BRAND.services,
	 * verbatim; each row links to the treatment's own page.
	 */
	import stones from './images/stones.jpg?enhanced';
	import { BRAND } from '$lib/constants/brand';
</script>

<section class="treat" id="behandelingen" aria-labelledby="treat-heading">
	<div class="frame">
		<header class="treat__header" data-lines>
			<span class="eyebrow">Behandelingen</span>
			<h2 id="treat-heading"><span class="line"><span>Zeven behandelingen</span></span></h2>
			<p class="lead">
				Lichaamsgerichte therapie, ademwerk en energetische behandelingen. Welke bij jou past,
				bepalen we samen.
			</p>
		</header>

		<div class="treat__grid">
			<div class="treat__media">
				<div class="treat__photo" data-reveal-img data-dir="up">
					<enhanced:img
						src={stones}
						alt="Helder, langzaam stromend water over gladde grijsgroene stenen, van boven gezien"
						sizes="(min-width: 1024px) 40vw, 100vw"
						loading="lazy"
					/>
				</div>
			</div>

			<ul class="treat__list">
				{#each BRAND.services as service (service.slug)}
					<li class="treat__row">
						<a class="treat__link" href="/diensten/{service.slug}">
							<span class="treat__name">{service.name}</span>
							<span class="treat__teaser">{service.teaser}</span>
							<svg
								class="treat__arrow"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									d="M5 12h14M13 6l6 6-6 6"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.treat {
		background: var(--d-tint);
		padding-block: var(--d-s7);
	}
	.treat__header {
		max-width: 46rem;
	}
	.treat__grid {
		margin-top: var(--d-s5);
		display: grid;
		gap: var(--d-s5);
		align-items: start;
	}
	.treat__media {
		position: sticky;
		top: calc(var(--d-bar) + var(--d-s3));
	}
	.treat__photo {
		border-radius: var(--d-radius);
		overflow: hidden;
		aspect-ratio: 4 / 5;
		background: var(--d-deep);
	}
	.treat__photo :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform-origin: center;
	}

	.treat__list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--d-line);
	}
	.treat__row {
		border-bottom: 1px solid var(--d-line);
	}
	.treat__link {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'name arrow'
			'teaser arrow';
		column-gap: var(--d-s3);
		row-gap: var(--d-s1);
		align-items: center;
		padding: var(--d-s3) 0;
		color: inherit;
		text-decoration: none;
	}
	.treat__name {
		grid-area: name;
		font-family: var(--d-font-display);
		font-size: var(--d-fs-h3);
		font-weight: 700;
		line-height: 1.1;
		transition: color 150ms var(--d-ease);
	}
	.treat__teaser {
		grid-area: teaser;
		color: var(--d-ink-soft);
		max-width: 60ch;
	}
	.treat__arrow {
		grid-area: arrow;
		color: var(--d-deep);
		transition: transform 200ms var(--d-ease);
	}
	.treat__link:hover .treat__name,
	.treat__link:focus-visible .treat__name {
		color: var(--d-deep);
	}
	.treat__link:hover .treat__arrow,
	.treat__link:focus-visible .treat__arrow {
		transform: translateX(4px);
	}

	@media (min-width: 1024px) {
		.treat__grid {
			grid-template-columns: 5fr 7fr;
			gap: var(--d-s6);
		}
	}
</style>
