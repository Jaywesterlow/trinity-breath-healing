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

<svelte:window bind:scrollY onkeydown={handleKeydown} />

<header class="header" class:header--hidden={hidden} class:header--open={menuOpen}>
	<nav class="nav" class:nav--open={menuOpen} aria-label="Site navigatie">
		<div class="nav__inner">
			<NavLogo inverted={menuOpen} />

			<!-- Desktop nav links — hidden on mobile -->
			<div class="nav__links" aria-label="Hoofdnavigatie">
				{#each NAV_LINKS as link (link.path)}
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
				<svg
					class="dot-grid"
					style="transform: rotate({rotation}deg)"
					width="21"
					height="21"
					viewBox="0 0 21 21"
					aria-hidden="true"
				>
					<circle cx="1.5" cy="1.5" r="1.5" />
					<circle cx="10.5" cy="1.5" r="1.5" />
					<circle cx="19.5" cy="1.5" r="1.5" />
					<circle cx="1.5" cy="10.5" r="1.5" />
					<circle cx="10.5" cy="10.5" r="1.5" />
					<circle cx="19.5" cy="10.5" r="1.5" />
					<circle cx="1.5" cy="19.5" r="1.5" />
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
		role="dialog"
		aria-modal="true"
		aria-label="Mobiel navigatiemenu"
		{...{ inert: menuOpen ? undefined : true }}
	>
		{#each NAV_LINKS as link (link.path)}
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
		/* Ring in the fill's own colour, so the button reads as one flat disc. */
		border: 2px solid var(--brand-border);
		box-sizing: border-box;
		cursor: pointer;
		flex-shrink: 0;
	}

	/* Opening the menu turns the dot grid and nothing else. The button keeps its
	   brown fill and sand dots in both states — the rotation is the whole signal,
	   and a colour swap layered on top of it read as two things happening. */
	.dot-grid {
		display: block;
		fill: var(--color-bg-sand);
		transition: transform 350ms var(--ease-out); /* ← tweak ms to change rotation speed */
	}

	/* ─── Nav open state (mobile) ─── */
	.nav--open {
		background: var(--color-brand-green);
	}

	/* ─── Mobile menu — full-screen overlay ─── */
	.mobile-menu {
		position: fixed;
		inset: 0;
		z-index: 15;
		background: var(--color-brand-green);
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

	/* Same two-line idea as the desktop nav, minus the hover half: a touch screen
	   has no hover, so only the current-page line is ever drawn. Sand on forest,
	   and the same 2px as every other underline on the site. */
	.mobile-menu__link {
		position: relative;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-bg-sand);
		text-decoration: none;
		padding: var(--space-1) 0.375rem;
	}

	.mobile-menu__link::after {
		content: '';
		position: absolute;
		left: 0.375rem;
		right: 0.375rem;
		bottom: 0;
		height: var(--underline-height);
		background: var(--color-bg-sand);
		transform: scaleX(0);
		transform-origin: center;
		transition: transform var(--motion-underline) var(--ease-out);
	}

	.mobile-menu__link--active {
		font-weight: 600;
	}

	.mobile-menu__link--active::after {
		transform: scaleX(1);
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

		/* Two lines under every link, both centred and both growing outward from
		   the middle to the same width. ::before is the grey one and answers
		   hover; ::after is the green one and answers being the current page. On
		   navigation the green line on the old link shrinks back to its centre
		   while the new link's grows out of its own — the nav is never rebuilt
		   between pages, so both run as plain transitions on elements that stay
		   put. */
		.nav__link {
			position: relative;
			font-family: var(--font-display);
			font-weight: 500;
			font-size: var(--font-size-xl);
			color: var(--brand-muted);
			text-decoration: none;
			padding: var(--space-1) 0.375rem;
			white-space: nowrap;
			transition: color var(--motion-fast);
		}

		.nav__link::before,
		.nav__link::after {
			content: '';
			position: absolute;
			left: 0.375rem; /* inside the link's own padding, so the two agree */
			right: 0.375rem;
			bottom: 0;
			height: var(--underline-height);
			transform: scaleX(0);
			transform-origin: center;
			transition: transform var(--motion-underline) var(--ease-out);
		}

		/* Stage one is an actual grey. It was --brand-muted, which is a sage green
		   — near enough to the forest that lands on top of it that the two
		   stages read as a single line and the first one was never visible. */
		.nav__link::before {
			background: var(--color-underline-idle);
		}

		.nav__link::after {
			background: var(--color-fg-forest);
		}

		.nav__link:focus-visible::before {
			transform: scaleX(1);
		}

		@media (hover: hover) and (pointer: fine) {
			.nav__link:hover::before {
				transform: scaleX(1);
			}
		}

		.nav__link--active {
			color: var(--color-fg-forest);
		}

		/* The current page draws both: the grey first, then the green out of the
		   same centre a beat later. They occupy the same pixels, so without the
		   delay the green simply covers the grey on the way out and the page
		   looks like it only ever had one line. */
		.nav__link--active::before,
		.nav__link--active::after {
			transform: scaleX(1);
		}

		.nav__link--active::after {
			transition-delay: var(--underline-stage-delay);
		}
	}
</style>
