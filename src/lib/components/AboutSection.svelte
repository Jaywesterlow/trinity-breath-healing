<script lang="ts">
	import EnhancedImage from '$lib/components/EnhancedImage.svelte';
	import { BRAND } from '$lib/constants/brand.js';
	import AboutImg1 from '$lib/assets/images/about-illustration-1.png?enhanced';
	import AboutImg2 from '$lib/assets/images/about-illustration-2.png?enhanced';
</script>

<section id="over-mij" class="about">
	<div class="container">
		<div class="about-grid">
			<div class="about-images">
				<EnhancedImage
					src={AboutImg1}
					alt="Trinity practitioner — illustratie 1"
					width={400}
					height={500}
					loading="lazy"
				/>
				<EnhancedImage
					src={AboutImg2}
					alt="Trinity practitioner — illustratie 2"
					width={300}
					height={380}
					loading="lazy"
				/>
			</div>
			<div class="about-content">
				<h2>Vanuit eigen ervaring weet ik wat jij doormaakt.</h2>
				<ul class="about-bullets">
					<li>Gecertificeerd in Spinal Touch en Goldhealing</li>
					<li>
						Meer dan {BRAND.stats.yearsExperience} jaar ervaring met ademwerk en lichaamsgerichte therapie
					</li>
					<li>Gespecialiseerd in het loslaten van trauma en lichamelijke blokkades</li>
					<li>Persoonlijke, niet-invasieve aanpak — geen medicatie, geen diagnoses</li>
				</ul>
				<ul class="about-bullets">
					<li>Werkzaam vanuit Holland, Michigan</li>
					<li>Sessies via Google Meet beschikbaar voor cliënten buiten de regio</li>
				</ul>
				<div class="stats-row">
					<div class="stat">
						<span class="stat-value">{BRAND.stats.yearsExperience}</span>
						<span class="stat-label">jaar ervaring</span>
					</div>
					<div class="stat">
						<span class="stat-value">{BRAND.stats.clientsHelped}</span>
						<span class="stat-label">cliënten geholpen</span>
					</div>
					<div class="stat">
						<span class="stat-value">{BRAND.stats.satisfaction}</span>
						<span class="stat-label">toewijding</span>
					</div>
				</div>
				<a href="/over-mij" class="link-more">Lees meer over mij →</a>
			</div>
		</div>
	</div>
</section>

<style>
	.about {
		background: var(--color-card-warm);
		padding-block: var(--space-12);
	}
	.container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
	}
	.about-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.about-images {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}
	h2 {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		color: var(--color-fg-forest);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-tight);
	}
	.about-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.about-bullets {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.about-bullets li {
		font-size: var(--font-size-base);
		color: var(--color-fg-forest);
		padding-left: var(--space-5);
		position: relative;
	}
	.about-bullets li::before {
		content: '—';
		position: absolute;
		left: 0;
		color: var(--color-accent-gold);
	}
	.stats-row {
		display: flex;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}
	.stat-value {
		font-family: var(--font-display);
		font-size: var(--font-size-3xl);
		color: var(--color-accent-gold);
		font-weight: var(--font-weight-bold);
		line-height: 1;
	}
	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
	}
	.link-more {
		color: var(--color-fg-forest);
		font-weight: var(--font-weight-bold);
		text-decoration: none;
		font-size: var(--font-size-base);
		align-self: flex-start;
	}
	.link-more:hover {
		text-decoration: underline;
	}
	@media (min-width: 1024px) {
		.about-grid {
			flex-direction: row;
			align-items: center;
		}
		.about-images {
			flex-shrink: 0;
			width: 40%;
		}
	}
</style>
