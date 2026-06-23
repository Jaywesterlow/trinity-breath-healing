<script lang="ts">
	import { onMount } from 'svelte';
	import { BRAND } from '$lib/constants/brand.js';

	let overlayOpen = $state(false);
	let isHidden = $state(false);
	let lastScrollY = $state(0);

	let headerEl: HTMLElement;
	let hamburgerEl: HTMLButtonElement;
	let closeButtonEl: HTMLButtonElement;

	function openOverlay() {
		overlayOpen = true;
		setTimeout(() => closeButtonEl?.focus(), 0);
	}

	function closeOverlay() {
		overlayOpen = false;
		hamburgerEl?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && overlayOpen) closeOverlay();
	}

	onMount(() => {
		const main = document.querySelector('main') as HTMLElement;
		if (main) main.style.paddingTop = headerEl.clientHeight + 'px';

		const handleScroll = () => {
			const current = window.scrollY;
			if (current > lastScrollY + 8) {
				isHidden = true;
			} else if (current < lastScrollY - 8) {
				isHidden = false;
			}
			lastScrollY = current;
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<header bind:this={headerEl} class:hidden={isHidden}>
	<div class="nav-container">
		<a href="/" class="logo-link">
			<img src="/logo.svg" alt="TRINITY Breath &amp; Healing logo" width="160" height="32" />
		</a>
		<nav aria-label="Hoofdnavigatie" class="desktop-nav">
			<a href="/">Home</a>
			<a href="#werkwijze">Werkwijze</a>
			<a href="#over-mij">Over mij</a>
			<a href="#behandelingen">Behandelingen</a>
			<a href="#contact">Contact</a>
		</nav>
		<div class="header-actions">
			<a href="#contact" class="btn-cta">Maak een afspraak</a>
			<div class="social-icons">
				<a
					href={BRAND.socials.instagram && BRAND.socials.instagram !== 'TODO_INSTAGRAM_HANDLE'
						? 'https://instagram.com/' + BRAND.socials.instagram
						: '#'}
					aria-label="Volg ons op Instagram"
					class="social-link"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
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
						<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
						<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
						<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
					</svg>
				</a>
			</div>
		</div>
		<button
			bind:this={hamburgerEl}
			class="hamburger"
			aria-label="Menu openen"
			aria-expanded={overlayOpen}
			aria-controls="mobile-overlay"
			onclick={openOverlay}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
		</button>
	</div>
</header>

<!-- Mobile overlay — ALWAYS in DOM; CSS class controls visibility (never {#if overlayOpen}) -->
<div
	id="mobile-overlay"
	role="dialog"
	aria-modal="true"
	aria-label="Navigatiemenu"
	class="overlay"
	class:overlay--open={overlayOpen}
>
	<div class="overlay-header">
		<a href="/" class="logo-link">
			<img src="/logo.svg" alt="TRINITY Breath &amp; Healing logo" width="160" height="32" />
		</a>
		<button
			bind:this={closeButtonEl}
			class="overlay-close"
			aria-label="Menu sluiten"
			onclick={closeOverlay}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>
	<nav aria-label="Mobiele navigatie" class="overlay-nav">
		<a href="/" onclick={closeOverlay}>Home</a>
		<a href="#werkwijze" onclick={closeOverlay}>Werkwijze</a>
		<a href="#over-mij" onclick={closeOverlay}>Over mij</a>
		<a href="#behandelingen" onclick={closeOverlay}>Behandelingen</a>
		<a href="#contact" onclick={closeOverlay}>Contact</a>
	</nav>
	<a href="#contact" class="btn-cta overlay-cta" onclick={closeOverlay}>Maak een afspraak</a>
</div>

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--color-bg-sand);
		transform: translateY(0);
		transition: transform var(--motion-base) var(--ease-out);
	}

	header.hidden {
		transform: translateY(-100%);
	}

	.nav-container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding-block: var(--space-4);
	}

	.logo-link {
		display: flex;
		align-items: center;
	}

	.desktop-nav {
		display: none;
	}

	@media (min-width: 1024px) {
		.desktop-nav {
			display: flex;
			gap: var(--space-6);
			align-items: center;
		}
	}

	.desktop-nav a {
		font-size: var(--font-size-sm);
		color: var(--color-fg-forest);
		text-decoration: none;
	}

	.desktop-nav a:hover {
		text-decoration: underline;
		color: var(--color-accent-gold);
	}

	.header-actions {
		display: none;
	}

	@media (min-width: 1024px) {
		.header-actions {
			display: flex;
			align-items: center;
			gap: var(--space-4);
			margin-left: auto;
		}
	}

	.hamburger {
		display: flex;
		background: none;
		border: none;
		cursor: pointer;
		min-width: 44px;
		min-height: 44px;
		align-items: center;
		justify-content: center;
		color: var(--color-fg-forest);
		margin-left: auto;
		padding: 0;
	}

	@media (min-width: 1024px) {
		.hamburger {
			display: none;
		}
	}

	.btn-cta {
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
		border-radius: var(--radius-full);
		padding: var(--space-2) var(--space-5);
		text-decoration: none;
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-sm);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}

	.social-icons {
		display: flex;
		align-items: center;
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

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		display: flex;
		flex-direction: column;
		padding: var(--space-6);
		visibility: hidden;
		opacity: 0;
		transition:
			visibility 0s var(--motion-slow),
			opacity var(--motion-slow) var(--ease-out);
	}

	.overlay--open {
		visibility: visible;
		opacity: 1;
		transition-delay: 0s;
	}

	.overlay-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.overlay-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		margin-top: var(--space-12);
	}

	.overlay-nav a {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		color: var(--color-bg-sand);
		text-decoration: none;
		font-weight: var(--font-weight-bold);
	}

	.overlay-close {
		background: none;
		border: none;
		color: var(--color-bg-sand);
		cursor: pointer;
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.overlay-cta {
		align-self: flex-start;
		margin-top: auto;
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
	}

	@media (prefers-reduced-motion: reduce) {
		header {
			transition: none;
		}

		.overlay {
			transition: none;
		}
	}
</style>
