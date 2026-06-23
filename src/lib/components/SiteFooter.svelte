<script lang="ts">
	import { BRAND } from '$lib/constants/brand';
</script>

<footer aria-labelledby="site-footer-heading">
	<h2 id="site-footer-heading" class="visually-hidden">Sitenavigatie</h2>
	<div class="footer-container">
		<!-- Top row: logo + NAP + social + 3 columns -->
		<div class="footer-top">
			<div class="footer-brand">
				<a href="/" aria-label="TRINITY Breath &amp; Healing — naar de startpagina">
					<img src="/logo.svg" alt="TRINITY Breath &amp; Healing logo" width="160" height="32" />
				</a>
				<p class="footer-tagline">Lichaamsgerichte therapie en energetische genezing</p>
				<address class="footer-nap">
					<span>Stationsstraat 45 A</span><br />
					<span>1315 KS Almere, Nederland</span><br />
					<a href={`mailto:${BRAND.email}`}>{BRAND.email}</a><br />
					{#if BRAND.phone !== 'TODO_PHONE'}
						<a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a>
					{:else}
						<span class="placeholder">{BRAND.phone}</span>
					{/if}
				</address>
				<dl class="footer-credentials">
					<dt>KvK</dt>
					<dd>TODO_KVK</dd>
					<dt>Opleiding</dt>
					<dd>TODO_BIG</dd>
				</dl>
				<div class="footer-social">
					<a
						href={BRAND.socials.instagram !== 'TODO_INSTAGRAM_HANDLE'
							? `https://instagram.com/${BRAND.socials.instagram}`
							: '#'}
						aria-label="Volg ons op Instagram"
						class="social-link"
					>
						<svg
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
							<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
							<circle cx="12" cy="12" r="5"></circle>
							<circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"></circle>
						</svg>
					</a>
					{#if BRAND.socials.facebook !== null}
						<a href={BRAND.socials.facebook} aria-label="Volg ons op Facebook" class="social-link">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
							</svg>
						</a>
					{/if}
					{#if BRAND.socials.x !== null}
						<a href={BRAND.socials.x} aria-label="Volg ons op X" class="social-link">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
								/>
							</svg>
						</a>
					{/if}
				</div>
			</div>

			<!-- 3 link columns -->
			<nav aria-label="Footer navigatie" class="footer-columns">
				<div class="footer-col">
					<h3 class="col-heading">DIENSTEN</h3>
					<ul>
						{#each BRAND.services as service}
							<li><a href={`/diensten/${service.slug}`}>{service.name}</a></li>
						{/each}
						<li><a href="/diensten/">Meer diensten</a></li>
					</ul>
				</div>
				<div class="footer-col">
					<h3 class="col-heading">MENU</h3>
					<ul>
						<li><a href="/">Home</a></li>
						<li><a href="/#werkwijze">Werkwijze</a></li>
						<li><a href="/#over-mij">Over mij</a></li>
						<li><a href="/#behandelingen">Behandelingen</a></li>
						<li><a href="/#contact">Contact</a></li>
					</ul>
				</div>
				<div class="footer-col">
					<h3 class="col-heading">LEZEN</h3>
					<ul>
						<li><a href="/privacyverklaring">Privacyverklaring</a></li>
						<li><a href="/algemene-voorwaarden">Algemene voorwaarden</a></li>
						<li><a href="/blog">Blog</a></li>
						<li><a href="/artikelen">Artikelen</a></li>
					</ul>
				</div>
			</nav>
		</div>

		<!-- Bottom bar -->
		<div class="footer-bottom">
			<p class="copyright">
				©Copyright 2026 Trinity Breath &amp; Healing, alle rechten voorbehouden
			</p>
			<div class="footer-bottom-links">
				<a href="/privacyverklaring">Privacyverklaring</a>
				<a href="/algemene-voorwaarden">Algemene voorwaarden</a>
			</div>
		</div>
	</div>
</footer>

<style>
	footer {
		background: var(--color-card-warm);
		color: var(--color-fg-forest);
		padding-block: var(--space-12);
	}

	.footer-container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
	}

	.footer-top {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	@media (min-width: 1024px) {
		footer {
			padding-block: var(--space-16);
		}

		.footer-top {
			flex-direction: row;
			gap: var(--space-16);
		}
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 320px;
	}

	.footer-tagline {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
	}

	.footer-nap {
		font-size: var(--font-size-sm);
		color: var(--color-fg-forest);
		font-style: normal;
		line-height: var(--line-height-normal);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.footer-nap a {
		text-decoration: underline;
	}

	.footer-credentials {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-1) var(--space-4);
	}

	.footer-credentials dt {
		font-weight: var(--font-weight-bold);
	}

	.placeholder {
		color: var(--color-muted);
		font-style: italic;
	}

	.footer-social {
		display: flex;
		gap: var(--space-4);
	}

	.social-link {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-fg-forest);
		min-width: 44px;
		min-height: 44px;
	}

	.social-link:hover {
		color: var(--color-accent-gold);
	}

	.footer-columns {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	@media (min-width: 768px) {
		.footer-columns {
			flex-direction: row;
			gap: var(--space-8);
			flex: 1;
		}
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		flex: 1;
	}

	.col-heading {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.footer-col ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.footer-col a {
		font-size: var(--font-size-sm);
		color: var(--color-fg-forest);
		text-decoration: none;
	}

	.footer-col a:hover {
		text-decoration: underline;
	}

	.footer-bottom {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	@media (min-width: 768px) {
		.footer-bottom {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}

	.copyright {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
	}

	.footer-bottom-links {
		display: flex;
		gap: var(--space-6);
	}

	.footer-bottom-links a {
		font-size: var(--font-size-sm);
		color: var(--color-fg-forest);
		text-decoration: none;
	}

	.footer-bottom-links a:hover {
		text-decoration: underline;
	}
</style>
