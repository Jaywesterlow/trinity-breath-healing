<script lang="ts">
	import { onMount } from 'svelte';

	let sectionEl: HTMLElement;

	onMount(() => {
		const allDetails = Array.from(sectionEl.querySelectorAll('details'));

		// Desktop: force all open when viewport >= 1024px
		function openAllOnDesktop() {
			if (window.matchMedia('(min-width: 1024px)').matches) {
				allDetails.forEach((d) => (d.open = true));
			}
		}

		openAllOnDesktop();

		// Re-open when viewport crosses 1024px threshold
		const mq = window.matchMedia('(min-width: 1024px)');
		mq.addEventListener('change', (e) => {
			if (e.matches) {
				allDetails.forEach((d) => (d.open = true));
			}
		});

		// Mobile: sibling-close — when one opens, close others
		allDetails.forEach((detail) => {
			detail.addEventListener('toggle', () => {
				if (detail.open && !window.matchMedia('(min-width: 1024px)').matches) {
					allDetails.forEach((other) => {
						if (other !== detail && other.open) other.open = false;
					});
				}
			});
		});
	});
</script>

<section id="werkwijze" class="werkwijze" bind:this={sectionEl}>
	<div class="container">
		<p class="eyebrow">Werkwijze</p>
		<h2>Rustig, persoonlijk en op jouw tempo.</h2>
		<div class="cards">
			<details class="card">
				<summary class="card-heading">
					<span>Kennismaking</span>
					<svg
						class="chevron"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</summary>
				<p class="card-body">
					We beginnen met een vrijblijvend kennismakingsgesprek van 30 minuten. Hierin bespreken we
					wat je bezighoudt, wat je wilt loslaten en of een behandeling bij jou past. Geen
					verplichtingen — alleen een eerste stap als dat goed voelt.
				</p>
			</details>

			<details class="card">
				<summary class="card-heading">
					<span>De sessie</span>
					<svg
						class="chevron"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</summary>
				<p class="card-body">
					Een sessie duurt gemiddeld 60 tot 90 minuten en vindt plaats in een rustige, veilige
					omgeving. Via ademwerk en energetische technieken begeleid ik je bij het loslaten van
					spanning en blokkades. Je bepaalt zelf het tempo — er is geen haast.
				</p>
			</details>

			<details class="card">
				<summary class="card-heading">
					<span>Verdieping</span>
					<svg
						class="chevron"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</summary>
				<p class="card-body">
					Na de sessie nemen we de tijd voor integratie. Wat is er losgemaakt? Wat voel je nu?
					Verdieping betekent dat we samen kijken wat de volgende stap is — of dat nu rust, een
					vervolgsessie of gewoon tijd is.
				</p>
			</details>
		</div>
	</div>
</section>

<style>
	.werkwijze {
		padding-block: var(--space-12);
		background: var(--color-bg-sand);
	}

	.container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
	}

	.eyebrow {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: var(--space-4);
	}

	h2 {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-8);
		line-height: var(--line-height-tight);
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.card {
		background: var(--color-card-warm);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.card-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-6);
		cursor: pointer;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
		list-style: none;
		min-height: 44px;
	}

	/* Cross-browser: remove native disclosure triangle */
	.card-heading::marker {
		display: none;
	}
	.card-heading::-webkit-details-marker {
		display: none;
	}

	.card-body {
		padding: var(--space-6);
		padding-top: 0;
		font-size: var(--font-size-base);
		line-height: var(--line-height-loose);
		color: var(--color-fg-forest);
	}

	.chevron {
		width: 20px;
		height: 20px;
		transition: transform var(--motion-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.card[open] .chevron {
		transform: rotate(180deg);
	}

	/* Desktop: 3-column grid, no accordion */
	@media (min-width: 1024px) {
		.cards {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--space-8);
		}

		details.card .card-body {
			display: block !important;
			padding-top: var(--space-6);
		}

		details.card summary {
			pointer-events: none;
			cursor: default;
		}

		.card-heading .chevron {
			display: none;
		}
	}
</style>
