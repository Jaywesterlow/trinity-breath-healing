<script lang="ts">
	/**
	 * The seven treatments as the card grid the owner likes on the service
	 * pages (name, teaser, the arrow circle in the corner, the whole card a
	 * link), laid out as a bento: the stones photo takes the first double cell,
	 * seven cards fill the rest with no orphan. The cards float up one after
	 * another (library 08a) and tilt toward the cursor (27b); the photo wipes
	 * open (12). Names and teasers are BRAND.services, verbatim.
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

		<ul class="treat__grid" data-float>
			<li class="treat__photo-cell">
				<div class="treat__photo" data-reveal-img data-dir="up">
					<enhanced:img
						src={stones}
						alt="Helder, langzaam stromend water over gladde grijsgroene stenen, van boven gezien"
						sizes="(min-width: 1024px) 66vw, 100vw"
						loading="lazy"
					/>
				</div>
			</li>
			{#each BRAND.services as service (service.slug)}
				<li>
					<a class="tcard" href="/diensten/{service.slug}" data-tilt="5">
						<span class="tcard__name">{service.name}</span>
						<span class="tcard__teaser">{service.teaser}</span>
						<span class="tcard__arrow" aria-hidden="true">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path
									d="M4 12L12 4M12 4H7M12 4V9"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</span>
					</a>
				</li>
			{/each}
		</ul>
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
		list-style: none;
		margin: var(--d-s5) 0 0;
		padding: 0;
		display: grid;
		gap: var(--d-s3);
	}
	.treat__grid > li {
		min-width: 0;
	}
	/* The photo takes the row's height from the card beside it, never the
	   other way round: the <picture> is absolute inside the tile (gsap scales
	   it, and a transformed box is the containing block for anything absolute
	   inside it, so the <img> itself stays in flow at 100%). */
	.treat__photo {
		position: relative;
		height: 100%;
		min-height: 14rem;
		border-radius: var(--d-radius);
		overflow: hidden;
		background: var(--d-deep);
	}
	.treat__photo :global(picture) {
		position: absolute;
		inset: 0;
		display: block;
		transform-origin: center;
	}
	.treat__photo :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.tcard {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--d-s1);
		height: 100%;
		padding: var(--d-s3);
		padding-bottom: calc(var(--d-s3) + 2.625rem + var(--d-s2));
		border: 1px solid var(--d-line);
		border-radius: var(--d-radius);
		background: var(--d-paper);
		color: inherit;
		text-decoration: none;
		transition:
			background-color 150ms var(--d-ease),
			border-color 150ms var(--d-ease);
	}
	.tcard:hover,
	.tcard:focus-visible {
		background: #fff;
		border-color: var(--d-water);
	}
	.tcard__name {
		font-family: var(--d-font-display);
		font-size: var(--d-fs-h3);
		font-weight: 700;
		line-height: 1.15;
	}
	.tcard__teaser {
		color: var(--d-ink-soft);
	}
	/* The arrow circle from the service pages: a ring that fills on hover,
	   with a soft halo. */
	.tcard__arrow {
		position: absolute;
		right: var(--d-s3);
		bottom: var(--d-s3);
		width: 2.625rem;
		height: 2.625rem;
		display: grid;
		place-items: center;
		border-radius: var(--d-pill);
		border: 1px solid var(--d-deep);
		color: var(--d-deep);
		box-shadow: 0 0 0 0 rgba(30, 78, 88, 0);
		transition:
			background-color 200ms var(--d-ease),
			color 200ms var(--d-ease),
			box-shadow 200ms var(--d-ease);
	}
	.tcard:hover .tcard__arrow,
	.tcard:focus-visible .tcard__arrow {
		background: var(--d-deep);
		color: #fff;
		box-shadow: 0 0 0 6px rgba(30, 78, 88, 0.18);
	}

	@media (min-width: 700px) {
		.treat__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.treat__photo-cell {
			grid-column: span 2;
		}
	}
	@media (min-width: 1024px) {
		.treat__grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.treat__photo-cell {
			grid-column: span 2;
		}
	}
</style>
