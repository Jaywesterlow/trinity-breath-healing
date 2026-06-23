<script lang="ts">
	import { onMount } from 'svelte';
	import { BRAND } from '$lib/constants/brand';

	const services = [
		...BRAND.services.map((s) => ({ slug: s.slug, name: s.name })),
		{ slug: '', name: 'Meer diensten' }
	];

	let currentIndex = $state(0);
	let trackEl: HTMLElement;
	const CARD_COUNT = 5;

	function goTo(idx: number) {
		currentIndex = ((idx % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
		const cards = Array.from(trackEl.querySelectorAll('.carousel-card')) as HTMLElement[];
		const targetCard = cards[currentIndex];
		if (targetCard) {
			targetCard.scrollIntoView({
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
				block: 'nearest',
				inline: 'center'
			});
		}
	}

	onMount(() => {
		const section = trackEl.closest('.carousel-wrapper') as HTMLElement;
		if (!section) return;

		const prevBtn = document.createElement('button');
		prevBtn.className = 'carousel-prev';
		prevBtn.setAttribute('aria-label', 'Vorige behandeling');
		prevBtn.innerHTML = '&#8592;';
		prevBtn.addEventListener('click', () => goTo(currentIndex - 1));

		const nextBtn = document.createElement('button');
		nextBtn.className = 'carousel-next';
		nextBtn.setAttribute('aria-label', 'Volgende behandeling');
		nextBtn.innerHTML = '&#8594;';
		nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

		section.appendChild(prevBtn);
		section.appendChild(nextBtn);
	});
</script>

<section id="behandelingen">
	<div class="container">
		<p class="eyebrow">Behandelingen</p>
		<h2>Rustig, persoonlijk en op jouw tempo.</h2>
	</div>
	<div class="carousel-wrapper">
		<div class="carousel-track" bind:this={trackEl}>
			{#each services as service, i}
				<a
					href={service.slug ? `/diensten/${service.slug}` : '/diensten/'}
					class="carousel-card"
					class:active={i === currentIndex}
					onclick={() => {
						currentIndex = i;
					}}
				>
					<div class="card-icon" class:inactive={i !== currentIndex}>
						<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
							<circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2" />
							<text x="50%" y="55%" text-anchor="middle" font-size="14" fill="currentColor"
								>{service.name.charAt(0)}</text
							>
						</svg>
					</div>
					<span class="card-name">{service.name}</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	section {
		padding-block: var(--space-12);
		background: var(--color-card-warm);
	}

	.container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
		margin-bottom: var(--space-8);
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
	}

	.carousel-wrapper {
		position: relative;
		overflow: hidden;
	}

	.carousel-track {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		gap: var(--space-6);
		padding-inline: var(--space-6);
		scrollbar-width: none;
	}

	.carousel-track::-webkit-scrollbar {
		display: none;
	}

	.carousel-card {
		flex-shrink: 0;
		min-width: 280px;
		max-width: 320px;
		scroll-snap-align: center;
		background: var(--color-bg-sand);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-decoration: none;
		color: var(--color-fg-forest);
		border-left: 4px solid transparent;
		transition: border-color var(--motion-base) var(--ease-out);
	}

	.carousel-card.active {
		border-left-color: var(--color-accent-gold);
	}

	.card-name {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
		text-align: center;
	}

	.card-icon {
		color: var(--color-fg-forest);
	}

	.card-icon.inactive {
		opacity: 0.5;
		color: var(--color-muted);
	}

	:global(.carousel-prev),
	:global(.carousel-next) {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: var(--color-card-warm);
		border: none;
		border-radius: var(--radius-full);
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-fg-forest);
		font-size: var(--font-size-lg);
		z-index: 10;
	}

	:global(.carousel-prev) {
		left: var(--space-2);
	}

	:global(.carousel-next) {
		right: var(--space-2);
	}

	@media (min-width: 1024px) {
		section {
			padding-block: var(--space-16);
		}

		.carousel-track {
			padding-inline: var(--space-16);
		}
	}
</style>
