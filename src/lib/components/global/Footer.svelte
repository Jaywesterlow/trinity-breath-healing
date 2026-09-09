<script lang="ts">
	import NavLogo from './NavLogo.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import FooterNavColumn from '$lib/components/ui/FooterNavColumn.svelte';
	import TextLink from '$lib/components/ui/interactions/TextLink.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	/* Instagram, WhatsApp, e-mail — the same row the hero renders, built once
	   in constants/socials.ts. Both used to assemble it separately, which is
	   how they both came to link two accounts that never existed. */
	import { SOCIAL_LINKS } from '$lib/constants/socials';

	const SOCIAL_COLOR = 'var(--color-bg-sand)';

	/* NAP comes from BRAND, never from literals in this file — brand.ts is the
	   source of truth and says so at the top. The address and phone were until
	   now typed straight into the markup and matched nothing: an unconfirmed
	   street in Almere and a placeholder "(+31) 6 123 456 78". A wrong address
	   on a health practice's site costs more than a missing one, and Google
	   reads footer NAP against KvK and the Business Profile, so anything still
	   marked TODO_ is withheld rather than guessed at.

	   NO STREET ADDRESS, decided 31-08. This footer printed Reigersbos on all
	   thirteen pages. That turned out to be her *home* — she works from there
	   and travels to clients — while the business is registered at a different
	   building, one she owns and rents to tenants. Neither belongs here: the
	   registered one would send a client to a stranger's door, and publishing a
	   solo practitioner's home on a health site is a decision she should make
	   deliberately rather than by listing it in a message.

	   So the footer answers "where are you" the way the practice actually works
	   — a region, home visits, remote — which is also how the Google Business
	   Profile is set up. The vestigingsadres that art. 3:15d BW requires lives
	   on the legal pages, where "gevestigd te" is the right frame for it. The
	   Organization JSON-LD has never carried an address either (see
	   schema/shared.ts), so this brings the footer in line with the rest. */
	const isPending = (value: string) => value.startsWith('TODO_');

	const hasPhone = !isPending(BRAND.phone);
	/* tel: needs the digits unspaced; the visible label keeps the spacing. */
	const telHref = `tel:${BRAND.phone.replace(/[^+\d]/g, '')}`;

	/* Reading order, left to right, on every screen. This used to be the reverse
	   and desktop flipped it back with `flex-direction: row-reverse`, so the two
	   breakpoints showed the columns in opposite orders and neither matched the
	   order a screen reader read them in. The array is now the order you see. */
	const NAV_COLUMNS = [
		{
			heading: 'LEZEN',
			links: [
				{ href: '/blog', label: 'Blog' },
				{ href: '/artikelen', label: 'Artikelen' },
				{ href: '/faq', label: 'FAQ' }
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
			heading: 'DIENSTEN',
			links: [
				{ href: '/diensten/mahatma-healing', label: 'Mahatma Healing' },
				{ href: '/diensten/goldhealing', label: 'Goldhealing' },
				{ href: '/diensten/raster-energie', label: 'Raster Energie' },
				{ href: '/diensten/spinal-touch', label: 'Spinal Touch' },
				{ href: '/diensten', label: 'Meer diensten' }
			]
		}
	] as const;
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__main">
			<!-- Brand: logo + contact -->
			<ul class="footer__brand">
				<li use:reveal><NavLogo inverted={true} footer={true} /></li>
				<li>
					<address class="footer__contact">
						<ul>
							<li>
								<span class="footer__area" use:reveal>{BRAND.workArea.label}</span>
								<!-- The region, then how she works. One without the other is
								     misleading in both directions: a place with no note reads
								     as a clinic you can walk into, and a note with no place
								     leaves a visitor unable to tell whether she covers them. -->
								<br /><span class="footer__note" use:reveal
									>{BRAND.practice.homeVisitNote} {BRAND.practice.remoteNote}</span
								>
							</li>
							<!-- Neither of these opens a web page. The cursor says what they
							     actually do, in her own voice rather than the browser's. -->
							<li use:reveal>
								<TextLink
									href="mailto:{BRAND.email}"
									label={BRAND.email}
									inverted={true}
									showArrow={false}
									size="sm"
									tooltip="Verstuur mij een mail"
								/>
							</li>
							{#if hasPhone}
								<li use:reveal>
									<TextLink
										href={telHref}
										label={BRAND.phoneDisplay}
										inverted={true}
										showArrow={false}
										size="sm"
										tooltip="Bereikbaar tussen {BRAND.phoneHours}"
									/>
								</li>
							{/if}
						</ul>
					</address>
				</li>
			</ul>

			<!-- Social icons — row on mobile, vertical column on desktop (order: 3) -->
			<nav class="footer__social" aria-label="Sociale media links">
				<ul class="footer__social-list">
					{#each SOCIAL_LINKS as social (social.icon)}
						<li use:reveal>
							<SocialIcon
								icon={social.icon}
								href={social.href}
								label={social.label}
								newTab={social.newTab}
								color={SOCIAL_COLOR}
								tooltip={social.tooltip}
							/>
						</li>
					{/each}
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
				<a class="link-underline" href="/privacyverklaring" use:reveal>Privacyverklaring</a>
				<a class="link-underline" href="/algemene-voorwaarden" use:reveal>Algemene voorwaarden</a>
			</nav>
			<p class="footer__copyright" use:reveal>
				©Copyright 2026 Trinity Breath &amp; Healing, alle rechten voorbehouden
			</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--color-brand-green);
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

	/* The region is the heading of this block, so it is set like one: the display
	   face at nav size, a step up from the lines under it. It was the same 16px as
	   the address rows below and read as one more row rather than as their title. */
	.footer__area {
		font-size: var(--font-size-xl); /* 20px */
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-snug);
	}

	/* The "only on Saturdays" line sits under the region and must read as a caveat
	   rather than part of it — smaller and lighter, but not so faint that someone
	   planning a visit skips it. */
	.footer__note {
		display: inline-block;
		margin-top: 0.5rem;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: var(--font-weight-light);
		line-height: 1.5;
		/* Weight, not opacity. The footer's ground is --color-brand-green, which
		   carries full sand at exactly 4.50:1 — fading this 13px line at all drops
		   it under AA (0.75 computes to 3.30:1), so the lighter face and the size
		   are what mark it as secondary. */
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

	/* 24px tall, which the 12px type alone does not reach. These sit in a <nav>,
	   not in a sentence, so WCAG 2.5.8's inline exception does not cover them.
	   Vertical padding only — the underline is drawn on the text box, so adding
	   horizontal padding would push the line out past the word. */
	.footer__legal a {
		display: inline-block;
		padding-block: 0.1875rem;
	}

	/* Plain text links get the underline reveal rather than the lift: moving a
	   line of running text is noisy, an underline arriving is not. The wipe
	   itself is .link-underline in app.css — it used to be redeclared here at
	   1px and rewound to the left on the way out. */

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

		/* Nav columns land in the middle. Plain `row` — the array is already in
		   LEZEN→MENU→DIENSTEN order, so what you read in the source, what a screen
		   reader announces and what both breakpoints show are one order. */
		.footer__nav {
			order: 2;
			display: flex;
			flex-direction: row;
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
