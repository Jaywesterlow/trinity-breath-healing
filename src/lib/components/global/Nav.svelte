<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/interactions';

	const NAV_LINKS = [
		{ path: '/', label: 'Home' },
		{ path: '/werkwijze', label: 'Werkwijze' },
		{ path: '/over-mij', label: 'Over mij' },
		{ path: '/behandelingen', label: 'Behandelingen' },
		{ path: '/contact', label: 'Contact' }
	] as const;

	let menuOpen = $state(false);
</script>

<!-- TODO: self-host Cinzel + Montserrat woff2 to static/fonts/ and remove Google Fonts -->
<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Cinzel&family=Montserrat:wght@300&display=swap" rel="stylesheet" />
</svelte:head>

<header class:header--open={menuOpen}>
	<nav class="nav" class:nav--open={menuOpen} aria-label="Site navigatie">

		<!-- Logo -->
		<a href="/" class="logo" aria-label="TRINITY Breath &amp; Healing — naar home">
			<img
				class="logo__mark"
				src="/logo.svg"
				alt=""
				aria-hidden="true"
				width="49"
				height="40"
			/>
			<div class="logo__wordmark">
				<span class="logo__name">TRINITY</span>
				<span class="logo__sub">Breath &amp; Healing</span>
			</div>
		</a>

		<!-- Desktop nav links — hidden on mobile -->
		<div class="nav__links" aria-label="Hoofdnavigatie">
			{#each NAV_LINKS as link}
				<a
					href={link.path}
					class="nav__link"
					class:nav__link--active={$page.url.pathname === link.path}
					aria-current={$page.url.pathname === link.path ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Desktop CTA — hidden on mobile -->
		<div class="nav__cta">
			<Button label="Maak een afspraak" href="/contact" withArrow={true} />
			<!-- TODO: replace href with Instagram URL from PROJECT.md NAP block once confirmed -->
			<a href="/contact" class="nav__social-btn" aria-label="Volg ons op Instagram">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.5"/>
					<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
					<circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
				</svg>
			</a>
		</div>

		<!-- Mobile hamburger -->
		<button
			class="hamburger"
			class:hamburger--open={menuOpen}
			aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
			aria-expanded={menuOpen}
			aria-controls="mobile-menu"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg class="dot-grid" width="21" height="21" viewBox="0 0 21 21" aria-hidden="true">
				<circle cx="1.5"  cy="1.5"  r="1.5"/>
				<circle cx="10.5" cy="1.5"  r="1.5"/>
				<circle cx="19.5" cy="1.5"  r="1.5"/>
				<circle cx="1.5"  cy="10.5" r="1.5"/>
				<circle cx="10.5" cy="10.5" r="1.5"/>
				<circle cx="19.5" cy="10.5" r="1.5"/>
				<circle cx="1.5"  cy="19.5" r="1.5"/>
				<circle cx="10.5" cy="19.5" r="1.5"/>
				<circle cx="19.5" cy="19.5" r="1.5"/>
			</svg>
		</button>

	</nav>

	<!-- Mobile menu — full-screen overlay -->
	<div
		id="mobile-menu"
		class="mobile-menu"
		class:mobile-menu--open={menuOpen}
		aria-hidden={!menuOpen}
	>
		{#each NAV_LINKS as link}
			<a
				href={link.path}
				class="mobile-menu__link"
				class:mobile-menu__link--active={$page.url.pathname === link.path}
				aria-current={$page.url.pathname === link.path ? 'page' : undefined}
				onclick={() => (menuOpen = false)}
			>
				{link.label}
			</a>
		{/each}
	</div>
</header>

<style>
	header {
		position: relative;
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		background: var(--color-bg-sand);
		position: relative;
		z-index: 20;
		transition: background var(--motion-base) var(--ease-out);
	}

	/* ─── Logo ─── */
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo__mark {
		width: 49px;
		height: 40px;
		object-fit: contain;
	}

	.logo__wordmark {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.logo__name {
		/* Cinzel loaded via svelte:head; TODO: self-host woff2 */
		font-family: 'Cinzel', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 400;
		letter-spacing: 0.18em;
		color: #404040;
		line-height: 1;
		transition: color var(--motion-base);
	}

	.logo__sub {
		/* Montserrat loaded via svelte:head; TODO: self-host woff2 */
		font-family: 'Montserrat', system-ui, sans-serif;
		font-weight: 300;
		font-size: 0.625rem;
		letter-spacing: 0.15em;
		color: #7a6f4f;
		line-height: 1;
		transition: color var(--motion-base);
	}

	/* ─── Desktop elements hidden on mobile ─── */
	.nav__links,
	.nav__cta {
		display: none;
	}

	/* ─── Mobile hamburger ─── */
	.hamburger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 39px;
		height: 39px;
		border-radius: var(--radius-full);
		background: var(--color-border);
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: transform var(--motion-base) var(--ease-out);
	}

	.hamburger--open {
		transform: rotate(45deg);
	}

	.dot-grid {
		display: block;
		fill: var(--color-bg-sand);
	}

	/* ─── Nav open state (mobile) ─── */
	.nav--open {
		background: var(--color-fg-forest);
	}

	.nav--open .logo__name {
		color: #f2f2f2;
	}

	.nav--open .logo__sub {
		color: #afa483;
	}

	/* ─── Mobile menu — full-screen overlay ─── */
	.mobile-menu {
		position: fixed;
		inset: 0;
		z-index: 15;
		background: var(--color-fg-forest);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 40px;
		padding-top: 80px; /* clear the nav bar */
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--motion-base) var(--ease-out);
	}

	.mobile-menu--open {
		opacity: 1;
		pointer-events: auto;
	}

	.mobile-menu__link {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 500;
		color: var(--color-bg-sand);
		text-decoration: none;
		padding: 4px 6px;
		border-bottom: 1px solid transparent;
		transition: border-color var(--motion-fast);
	}

	.mobile-menu__link--active {
		font-weight: 600;
		border-bottom-color: var(--color-bg-sand);
	}

	/* ─── Desktop ≥ 1024px ─── */
	@media (min-width: 1024px) {
		.nav {
			height: 100px;
			padding: 0 8.33vw;
			gap: 24px;
		}

		.hamburger {
			display: none;
		}

		.mobile-menu {
			display: none;
		}

		.nav__links {
			display: flex;
			align-items: center;
			gap: 18px;
			flex: 1;
			justify-content: center;
		}

		.nav__link {
			font-family: var(--font-display);
			font-weight: 500;
			font-size: 20px;
			color: var(--color-muted);
			text-decoration: none;
			padding: 4px 6px;
			white-space: nowrap;
			border-bottom: 1px solid transparent;
			transition: color var(--motion-fast);
		}

		.nav__link--active {
			color: var(--color-fg-forest);
			border-bottom-color: var(--color-fg-forest);
		}

		.nav__cta {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-shrink: 0;
		}

		.nav__social-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			border: 2px solid var(--color-border);
			color: var(--color-border);
			text-decoration: none;
			flex-shrink: 0;
			transition: border-color var(--motion-fast), color var(--motion-fast);
		}

		.nav__social-btn:hover {
			border-color: var(--color-fg-forest);
			color: var(--color-fg-forest);
		}
	}

	/* ─── ≥ 1440px — Figma desktop spec ─── */
	@media (min-width: 1440px) {
		.nav {
			padding: 0 120px;
		}
	}
</style>
