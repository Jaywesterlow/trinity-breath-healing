<script lang="ts">
	import NavLogo from './NavLogo.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import FooterNavColumn from '$lib/components/ui/FooterNavColumn.svelte';
	import TextLink from '$lib/components/ui/interactions/TextLink.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';

	const SOCIAL_COLOR = 'var(--color-bg-sand)';
	const instagramUrl = `https://www.instagram.com/${BRAND.socials.instagram.replace('@', '')}/`;

	/* NAP comes from BRAND, never from literals in this file — brand.ts is the
	   source of truth and says so at the top. The address and phone were until
	   now typed straight into the markup and matched nothing: an unconfirmed
	   street in Almere and a placeholder "(+31) 6 123 456 78". A wrong address
	   on a health practice's site costs more than a missing one, and Google
	   reads footer NAP against KvK and the Business Profile, so anything still
	   marked TODO_ is withheld rather than guessed at. */
	const isPending = (value: string) => value.startsWith('TODO_');

	const address = BRAND.address;
	const hasAddress = !(
		isPending(address.street) ||
		isPending(address.postalCode) ||
		isPending(address.city)
	);
	const hasPhone = !isPending(BRAND.phone);
	/* tel: needs the digits unspaced; the visible label keeps the spacing. */
	const telHref = `tel:${BRAND.phone.replace(/[^+\d]/g, '')}`;

	/* Only the profiles that actually exist. facebook and x are null in BRAND —
	   they were still rendered here as links to x.com/trinitybnh and
	   facebook.com/trinitybnh, neither of which is a real account. */
	const socials = [
		{ icon: 'instagram' as const, href: instagramUrl, label: 'Volg ons op Instagram' },
		...(BRAND.socials.facebook
			? [
					{
						icon: 'facebook' as const,
						href: BRAND.socials.facebook,
						label: 'Volg ons op Facebook'
					}
				]
			: []),
		...(BRAND.socials.x
			? [{ icon: 'x' as const, href: BRAND.socials.x, label: 'Volg ons op X' }]
			: [])
	];

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
			<ul class="footer__brand" use:reveal={{ delay: 0 }}>
				<li><NavLogo inverted={true} footer={true} /></li>
				<li>
					<address class="footer__contact">
						<ul>
							{#if hasAddress}
								<li>
									{address.street}<br />{address.postalCode}
									{address.city}, {address.country}
								</li>
							{/if}
							<li>
								<TextLink
									href="mailto:{BRAND.email}"
									label={BRAND.email}
									inverted={true}
									showArrow={false}
									size="sm"
								/>
							</li>
							{#if hasPhone}
								<li>
									<TextLink
										href={telHref}
										label={BRAND.phone}
										inverted={true}
										showArrow={false}
										size="sm"
									/>
								</li>
							{/if}
						</ul>
					</address>
				</li>
			</ul>

			<!-- Social icons — row on mobile, vertical column on desktop (order: 3) -->
			<nav class="footer__social" aria-label="Sociale media links" use:reveal={{ delay: 110 }}>
				<ul class="footer__social-list">
					{#each socials as social (social.icon)}
						<li>
							<SocialIcon
								icon={social.icon}
								href={social.href}
								label={social.label}
								color={SOCIAL_COLOR}
							/>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- Nav columns — order: 2 on desktop, after social on mobile -->
			<nav class="footer__nav" aria-label="Footer navigatie" use:reveal={{ delay: 220 }}>
				{#each NAV_COLUMNS as col (col.heading)}
					<FooterNavColumn heading={col.heading} links={[...col.links]} />
				{/each}
			</nav>
		</div>

		<hr class="footer__divider" />

		<div class="footer__bottom" use:reveal={{ delay: 330 }}>
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

	/* Plain text links get the underline reveal rather than the lift: moving a
	   line of running text is noisy, an underline arriving is not. */
	.footer__legal a {
		position: relative;
	}

	.footer__legal a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.125rem;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.footer__legal a:hover::after,
	.footer__legal a:focus-visible::after {
		transform: scaleX(1);
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
