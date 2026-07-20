<script lang="ts">
	import NavLogo from './NavLogo.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import FooterNavColumn from '$lib/components/ui/FooterNavColumn.svelte';
	import TextLink from '$lib/components/ui/interactions/TextLink.svelte';

	const SOCIAL_COLOR = 'var(--color-bg-sand)';

	const NAV_COLUMNS = [
		{
			heading: 'DIENSTEN',
			links: [
				{ href: '/diensten/mahatma-healing', label: 'Mahatma Healing' },
				{ href: '/diensten/goldhealing', label: 'Goldhealing' },
				{ href: '/diensten/raster-energie', label: 'Raster Energie' },
				{ href: '/diensten/spinal-touch', label: 'Spinal Touch' },
				{ href: '/diensten', label: 'Meer diensten' }
			]
		},
		{
			heading: 'MENU',
			links: [
				{ href: '/', label: 'Home' },
				{ href: '/over-mij', label: 'Over mij' },
				{ href: '/behandelingen', label: 'Behandelingen' },
				{ href: '/werkwijze', label: 'Werkwijze' },
				{ href: '/contact', label: 'Contact' }
			]
		},
		{
			heading: 'LEZEN',
			links: [
				{ href: '/blog', label: 'Blog' },
				{ href: '/artikelen', label: 'Artikelen' },
				{ href: '/faq', label: 'FAQ' }
			]
		}
	] as const;
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__main">
			<!-- Brand: logo + contact -->
			<ul class="footer__brand">
				<li><NavLogo inverted={true} footer={true} /></li>
				<li>
					<address class="footer__contact">
						<ul>
							<li>Stationsstraat 45 A<br />1315 KS Almere, Nederland</li>
							<li>
								<TextLink
									href="mailto:info@trinitybnh.nl"
									label="info@trinitybnh.nl"
									inverted={true}
									showArrow={false}
									size="sm"
								/>
							</li>
							<li>
								<TextLink
									href="tel:+31612345678"
									label="(+31) 6 123 456 78"
									inverted={true}
									showArrow={false}
									size="sm"
								/>
							</li>
						</ul>
					</address>
				</li>
			</ul>

			<!-- Social icons — row on mobile, vertical column on desktop (order: 3) -->
			<nav class="footer__social" aria-label="Sociale media links">
				<ul class="footer__social-list">
					<li>
						<SocialIcon
							icon="x"
							href="https://x.com/trinitybnh"
							label="Volg ons op X (Twitter)"
							color={SOCIAL_COLOR}
						/>
					</li>
					<li>
						<SocialIcon
							icon="facebook"
							href="https://facebook.com/trinitybnh"
							label="Volg ons op Facebook"
							color={SOCIAL_COLOR}
						/>
					</li>
					<li>
						<SocialIcon
							icon="instagram"
							href="https://instagram.com/trinitybnh"
							label="Volg ons op Instagram"
							color={SOCIAL_COLOR}
						/>
					</li>
				</ul>
			</nav>

			<!-- Nav columns — order: 2 on desktop, after social on mobile -->
			<nav class="footer__nav" aria-label="Footer navigatie">
				{#each NAV_COLUMNS as col (col.heading)}
					<FooterNavColumn heading={col.heading} links={[...col.links]} />
				{/each}
			</nav>
		</div>

		<hr class="footer__divider" />

		<div class="footer__bottom">
			<nav class="footer__legal" aria-label="Juridische links">
				<a href="/privacyverklaring">Privacyverklaring</a>
				<a href="/algemene-voorwaarden">Algemene voorwaarden</a>
			</nav>
			<p class="footer__copyright">
				©Copyright 2026 Trinity Breath &amp; Healing, alle rechten voorbehouden
			</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
	}

	.footer__inner {
		max-width: var(--container-max);
		margin: 0 auto;
		padding: var(--space-8) var(--space-6); /* horizontal matches nav/hero below 1024px; zeroed again there since max-width + centering takes over */
	}

	/* ─── Main grid ─── */
	.footer__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	/* ─── Brand: logo + contact ─── */
	.footer__brand {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer__contact {
		font-style: normal;
		font-family: var(--font-display);
		font-size: var(--font-size-base);
		color: var(--color-bg-sand);
		line-height: var(--line-height-normal);
	}

	.footer__contact ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* ─── Social icons ─── */
	.footer__social {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.footer__social-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: row;
		gap: var(--space-2);
		align-items: flex-start;
	}

	/* ─── Nav columns ─── */
	.footer__nav {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	/* ─── Divider ─── */
	.footer__divider {
		border: none;
		border-top: 1px solid var(--color-bg-sand-25);
		margin: 0 0 var(--space-5);
	}

	/* ─── Bottom bar ─── */
	.footer__bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		text-align: center;
	}

	.footer__legal {
		display: flex;
		gap: var(--space-2);
	}

	.footer__legal a,
	.footer__copyright {
		font-family: var(--font-body);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		color: var(--color-bg-sand);
		text-decoration: none;
		line-height: var(--line-height-normal);
	}

	.footer__legal a:hover {
		opacity: 0.7;
	}

	/* ─── Desktop (≥ 1024px) ─── */
	@media (min-width: 1024px) {
		.footer__inner {
			padding: var(--space-10) 0;
		}

		.footer__main {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
			gap: var(--space-8);
			margin-bottom: var(--space-12);
		}

		.footer__brand {
			flex: 0 0 auto;
			width: clamp(
				16.25rem,
				24%,
				21.5rem
			); /* Figma spec 260px–344px; no spacing token applies to layout widths */
		}

		.footer__contact {
			font-size: var(--font-size-xl);
		}

		/* social moves to far right as a vertical column */
		.footer__social {
			order: 3;
			align-self: flex-start;
			padding: var(--space-4) 0;
		}

		.footer__social-list {
			flex-direction: column;
			gap: var(--space-8); /* 32px; Figma spec 31px — 1px deviation acceptable */
			align-items: flex-start;
		}

		/* nav columns land in the middle; row-reverse flips array order to LEZEN→MENU→DIENSTEN */
		.footer__nav {
			order: 2;
			display: flex;
			flex-direction: row-reverse;
			gap: 5.44rem; /* Figma spec 87px; nearest token --space-16 is 64px — deviation too large to round to token */
			align-self: flex-start;
		}

		.footer__bottom {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			text-align: left;
		}

		.footer__copyright {
			order: 1;
		}

		.footer__legal {
			order: 2;
			gap: var(--space-4);
		}

		.footer__copyright,
		.footer__legal a {
			font-size: var(--font-size-base);
		}
	}

	/* ─── Figma desktop spec (≥ 1440px) ─── */
	@media (min-width: 1440px) {
		.footer__inner {
			padding: var(--space-10) 0;
		}
	}
</style>
