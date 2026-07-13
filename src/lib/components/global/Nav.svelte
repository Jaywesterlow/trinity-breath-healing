<script lang="ts">
	import { page } from '$app/stores';
	import NavLogo from './NavLogo.svelte';
	import NavCta from './NavCta.svelte';
	import { ButtonLink } from '$lib/components/ui/interactions';

	const NAV_LINKS = [
		{ path: '/', label: 'Home' },
		{ path: '/werkwijze', label: 'Werkwijze' },
		{ path: '/over-mij', label: 'Over mij' },
		{ path: '/behandelingen', label: 'Behandelingen' },
		{ path: '/contact', label: 'Contact' }
	] as const;

	let menuOpen = $state(false);
	let hamburgerEl: HTMLButtonElement | null = $state(null);
	let scrollY = $state(0);
	let prevScrollY = 0;
	let hidden = $state(false);
	let rotation = $state(0);

	$effect(() => {
		if (scrollY > 80 && scrollY > prevScrollY) {
			hidden = true;
		} else if (scrollY < prevScrollY) {
			hidden = false;
		}
		prevScrollY = scrollY;
	});

	function closeMenu() {
		rotation += 45;
		menuOpen = false;
		hamburgerEl?.focus();
	}

	function toggleMenu() {
		rotation += 45;
		if (menuOpen) {
			menuOpen = false;
			hamburgerEl?.focus();
		} else {
			menuOpen = true;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) closeMenu();
	}
</script>

<svelte:window bind:scrollY={scrollY} onkeydown={handleKeydown} />

<header class="header" class:header--hidden={hidden} class:header--open={menuOpen}>
	<nav class="nav" class:nav--open={menuOpen} aria-label="Site navigatie">
		<div class="nav__inner">

			<NavLogo inverted={menuOpen} />

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
			<NavCta />

			<!-- Mobile hamburger — 44×44 touch target -->
			<button
				bind:this={hamburgerEl}
				class="hamburger"
				aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
				onclick={toggleMenu}
			>
				<svg class="dot-grid" style="transform: rotate({rotation}deg)" width="21" height="21" viewBox="0 0 21 21" aria-hidden="true">
					<circle cx="1.5"  cy="1.5"  r="1.5" />
					<circle cx="10.5" cy="1.5"  r="1.5" />
					<circle cx="19.5" cy="1.5"  r="1.5" />
					<circle cx="1.5"  cy="10.5" r="1.5" />
					<circle cx="10.5" cy="10.5" r="1.5" />
					<circle cx="19.5" cy="10.5" r="1.5" />
					<circle cx="1.5"  cy="19.5" r="1.5" />
					<circle cx="10.5" cy="19.5" r="1.5" />
					<circle cx="19.5" cy="19.5" r="1.5" />
				</svg>
			</button>

		</div>
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
				onclick={closeMenu}
				tabindex={menuOpen ? 0 : -1}
			>
				{link.label}
			</a>
		{/each}
		<div class="mobile-menu__cta">
			<ButtonLink label="Maak een afspraak" href="/contact" onclick={closeMenu} />
		</div>
	</div>
</header>

<style>
	/* ─── Fixed header — hides on scroll down, reappears on scroll up ─── */
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		transition: transform var(--motion-base) var(--ease-out);
	}

	.header--hidden {
		transform: translateY(-100%);
	}

	.nav {
		background: var(--color-bg-sand);
		position: relative;
		z-index: 20;
		transition: background var(--motion-base) var(--ease-out);
	}

	/* Content row, capped at the same --container-max (1200px) as the footer so every
	   section's content lines up at the same edges once the viewport outgrows it. .nav
	   itself stays full-bleed (background spans edge-to-edge); this is what centers. */
	.nav__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: var(--container-max);
		margin: 0 auto;
		padding: var(--space-5) var(--space-6);
	}

	/* ─── Desktop elements hidden on mobile ─── */
	.nav__links {
		display: none;
	}

	/* ─── Mobile hamburger ─── */
	.hamburger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-full);
		background: var(--brand-border);
		border: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.dot-grid {
		display: block;
		fill: var(--color-bg-sand);
		transition: transform 350ms var(--ease-out); /* ← tweak ms to change rotation speed */
	}

	/* ─── Nav open state (mobile) ─── */
	.nav--open {
		background: var(--color-fg-forest);
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
		gap: var(--space-10);
		padding-top: var(--nav-height);
		opacity: 0;
		pointer-events: none;
		transition: opacity 350ms var(--ease-out); /* ← tweak ms to change overlay fade speed */
	}

	.mobile-menu--open {
		opacity: 1;
		pointer-events: auto;
	}

	.mobile-menu__cta {
		position: absolute;
		bottom: var(--space-10);
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.mobile-menu--open .mobile-menu__cta {
		pointer-events: auto;
	}

	.mobile-menu__link {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-bg-sand);
		text-decoration: none;
		padding: var(--space-1) 0.375rem;
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
			height: var(--nav-height);
		}

		.nav__inner {
			height: 100%;
			padding: 0; /* zero — matches footer; max-width + centering alone sets the edge */
			gap: var(--space-6);
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
			gap: 1.125rem;
			flex: 1;
			justify-content: center;
		}

		.nav__link {
			font-family: var(--font-display);
			font-weight: 500;
			font-size: var(--font-size-xl);
			color: var(--brand-muted);
			text-decoration: none;
			padding: var(--space-1) 0.375rem;
			white-space: nowrap;
			border-bottom: 1px solid transparent;
			transition: color var(--motion-fast);
		}

		.nav__link--active {
			color: var(--color-fg-forest);
			border-bottom-color: var(--color-fg-forest);
		}

	}
</style>
