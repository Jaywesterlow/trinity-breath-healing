<script lang="ts">
	/**
	 * HeroSection — LND-01 / PRF-02 / PRF-03 / PRF-04.
	 *
	 * Pure SSR static component. No $state, no $effect, no onMount.
	 * Hero image uses loading="eager" + fetchpriority="high" (LCP element).
	 * <svelte:head> emits <link rel="preload"> for the hero image (PRF-02).
	 *
	 * Layout:
	 *   Mobile (default): single column — image stacks above H1 + body + CTA.
	 *   Desktop (1024px+): 2-column CSS grid — content left, image right.
	 *
	 * Service tiles: 3 crawlable <a> links below the grid (D-04).
	 */
	import type { Picture } from 'vite-imagetools';
	import EnhancedImage from '$lib/components/EnhancedImage.svelte';
	import HeroImg from '$lib/assets/images/hero.png?enhanced';
	import SpinalTouchImg from '$lib/assets/images/card-spinal-touch.png?enhanced';
	import GoldHealingImg from '$lib/assets/images/card-goldhealing.png?enhanced';

	// Resolve the hero image src for the <link rel="preload"> href.
	// ?enhanced imports resolve to a Picture object ({ sources, img: { src, w, h } }).
	// Extract img.src which is the canonical hashed URL of the base image format.
	const heroPreloadHref: string = (HeroImg as Picture).img.src;
</script>

<svelte:head>
	{#if heroPreloadHref}
		<link rel="preload" as="image" fetchpriority="high" href={heroPreloadHref} />
	{/if}
</svelte:head>

<section class="hero">
	<div class="container">
		<div class="hero-grid">
			<!-- Left column: content -->
			<div class="hero-content">
				<h1>Rust in je hoofd. Ontspanning in je lichaam.</h1>
				<p>
					Trinity Breath &amp; Healing begeleidt je bij het loslaten van spanning, trauma en
					lichamelijke blokkades &mdash; op jouw tempo, met zachte en effectieve behandelingen.
				</p>
				<a href="#contact" class="btn-cta">Maak een afspraak</a>
			</div>

			<!-- Right column: hero illustration -->
			<div class="hero-image">
				<EnhancedImage
					src={HeroImg}
					alt="Trinity Breath & Healing — boom bij rivier illustratie"
					width={600}
					height={700}
					loading="eager"
					fetchpriority="high"
				/>
			</div>
		</div>

		<!-- Service tiles: 3 crawlable links (D-04) -->
		<div class="service-tiles">
			<a href="/diensten/spinal-touch" class="tile">
				<EnhancedImage
					src={SpinalTouchImg}
					alt="Spinal Touch behandeling"
					width={280}
					height={160}
					loading="lazy"
				/>
				<span>Spinal Touch</span>
			</a>

			<a href="/diensten/goldhealing" class="tile">
				<EnhancedImage
					src={GoldHealingImg}
					alt="Goldhealing behandeling"
					width={280}
					height={160}
					loading="lazy"
				/>
				<span>Goldhealing</span>
			</a>

			<a href="/diensten/" class="tile tile--text-only">
				<span>Meer klachten</span>
			</a>
		</div>
	</div>
</section>

<style>
	/* === Section === */
	.hero {
		background: var(--color-bg-sand);
		padding-block: var(--space-12);
	}

	/* === Container === */
	.container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
	}

	/* === Grid (mobile-first: single column) === */
	.hero-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	/* === Content column === */
	.hero-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	h1 {
		font-family: var(--font-display);
		font-size: var(--font-size-3xl);
		line-height: var(--line-height-tight);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
	}

	p {
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		color: var(--color-fg-forest);
	}

	/* === CTA button === */
	.btn-cta {
		display: inline-block;
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
		border-radius: var(--radius-full);
		padding: var(--space-3) var(--space-8);
		text-decoration: none;
		font-weight: var(--font-weight-bold);
		min-height: 44px;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		transition: filter var(--motion-base) var(--ease-out);
	}

	.btn-cta:hover {
		filter: brightness(0.9);
	}

	.btn-cta:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	/* === Service tiles (mobile: column stack) === */
	.service-tiles {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-block-start: var(--space-8);
	}

	.tile {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		background: var(--color-card-warm);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		text-decoration: none;
		color: var(--color-fg-forest);
	}

	.tile--text-only {
		font-weight: var(--font-weight-bold);
	}

	/* === Desktop: 2-column grid (1024px+) === */
	@media (min-width: 1024px) {
		.hero {
			padding-block: var(--space-16);
		}

		.hero-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			align-items: center;
			gap: var(--space-16);
		}

		.service-tiles {
			flex-direction: row;
		}
	}
</style>
