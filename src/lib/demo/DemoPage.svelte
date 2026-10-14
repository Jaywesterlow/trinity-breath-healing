<script lang="ts">
	/**
	 * The water demo of the landing page (2026-10-14). One route, its own
	 * chrome, its own tokens on `.demo`; nothing here is shared with the live
	 * components so the two can be compared side by side and either one can be
	 * thrown away. Recipe and motion concept: src/lib/demo/RECIPE.md.
	 */
	import { onMount } from 'svelte';
	import { BRAND } from '$lib/constants/brand';
	import { STATEMENT, PRACTICE } from './content';
	import { initMotion } from './motion';
	import DemoHero from './DemoHero.svelte';
	import DemoBehandelingen from './DemoBehandelingen.svelte';
	import DemoWerkwijze from './DemoWerkwijze.svelte';
	import DemoOverMij from './DemoOverMij.svelte';
	import DemoClosing from './DemoClosing.svelte';
	import DemoFaq from './DemoFaq.svelte';

	let { dateModified }: { dateModified?: string } = $props();

	let root: HTMLElement | undefined = $state();
	let scrollY = $state(0);
	let menuOpen = $state(false);
	// The bar starts transparent over the water and gains its surface once,
	// 40px in: one transition, one cue (the hairline), height constant.
	const solid = $derived(scrollY > 40 || menuOpen);

	const NAV = [
		{ href: '#behandelingen', label: 'Behandelingen' },
		{ href: '#werkwijze', label: 'Werkwijze' },
		{ href: '#over-mij', label: 'Over mij' },
		{ href: '#contact', label: 'Contact' },
		{ href: '#faq', label: 'Vragen' }
	] as const;

	// The statement's three hand-set lines, each one a mask for 03b.
	const STATEMENT_LINES = [
		'Je hoeft niet te weten welke behandeling',
		'je nodig hebt. Dat zoeken we in het',
		'eerste gesprek samen uit.'
	] as const;

	onMount(() => {
		let cleanup: (() => void) | undefined;
		if (root) initMotion(root).then((c) => (cleanup = c));
		return () => cleanup?.();
	});
</script>

<svelte:window bind:scrollY />

<div class="demo" bind:this={root}>
	<a class="skip" href="#inhoud">Naar de inhoud</a>

	<header class="bar" class:bar--solid={solid}>
		<div class="bar__inner">
			<a class="brand" href="/demo" aria-label="TRINITY Breath & Healing, naar boven">
				<img class="brand__mark" src="/trinity-logo.svg" alt="" width="36" height="36" />
				<span class="brand__text">
					<span class="brand__name">TRINITY</span>
					<span class="brand__sub">Breath &amp; Healing</span>
				</span>
			</a>

			<nav class="bar__nav" aria-label="Hoofdnavigatie">
				<ul class="bar__links">
					{#each NAV as item (item.href)}
						<li><a class="bar__link" href={item.href}>{item.label}</a></li>
					{/each}
				</ul>
			</nav>

			<a class="pill pill--bar" href="/contact">Maak een afspraak</a>

			<button
				class="bar__menu-btn"
				type="button"
				aria-expanded={menuOpen}
				aria-controls="demo-menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{menuOpen ? 'Sluiten' : 'Menu'}
			</button>
		</div>

		<nav id="demo-menu" class="bar__sheet" class:bar__sheet--open={menuOpen} aria-label="Menu">
			<ul>
				{#each NAV as item (item.href)}
					<li><a href={item.href} onclick={() => (menuOpen = false)}>{item.label}</a></li>
				{/each}
				<li><a class="pill" href="/contact">Maak een afspraak</a></li>
			</ul>
		</nav>
	</header>

	<div id="inhoud">
		<DemoHero />

		<!-- The statement: one thought, under-filled on purpose (a 46ch column
		     on the sand), then the three facts about how she works. -->
		<section class="statement" aria-labelledby="statement-heading">
			<div class="frame">
				<h2 id="statement-heading" class="statement__text" data-lines>
					{#each STATEMENT_LINES as line, i (i)}
						<span class="line"><span>{line}</span></span>
					{/each}
				</h2>
				<p class="visually-hidden">{STATEMENT}</p>
				<ul class="practice">
					{#each PRACTICE as item (item.label)}
						<li class="practice__item">
							<span class="eyebrow">{item.label}</span>
							<p>{item.text}</p>
						</li>
					{/each}
				</ul>
			</div>
		</section>

		<DemoBehandelingen />
		<DemoWerkwijze />
		<DemoOverMij />
		<DemoClosing />
		<DemoFaq />
	</div>

	<footer class="foot">
		<div class="frame foot__grid">
			<div class="foot__brand">
				<span class="brand__name brand__name--foot">TRINITY</span>
				<span class="brand__sub brand__sub--foot">Breath &amp; Healing</span>
				<address class="foot__address">
					<span>{BRAND.workArea.label}</span>
					<span class="foot__note">{BRAND.practice.homeVisitNote} {BRAND.practice.remoteNote}</span>
					<a href="mailto:{BRAND.email}">{BRAND.email}</a>
					<a href="tel:{BRAND.phone}">{BRAND.phoneDisplay}</a>
				</address>
			</div>
			<nav class="foot__col" aria-label="Pagina's">
				<span class="eyebrow eyebrow--dark">Pagina's</span>
				<a href="/behandelingen">Behandelingen</a>
				<a href="/werkwijze">Werkwijze</a>
				<a href="/over-mij">Over mij</a>
				<a href="/contact">Contact</a>
				<a
					href="https://www.instagram.com/{BRAND.socials.instagram.replace('@', '')}/"
					rel="noopener">Instagram</a
				>
			</nav>
			<nav class="foot__col" aria-label="Juridisch">
				<span class="eyebrow eyebrow--dark">Praktisch</span>
				<a href="/privacyverklaring">Privacyverklaring</a>
				<a href="/algemene-voorwaarden">Algemene voorwaarden</a>
				<a href="/disclaimer">Disclaimer</a>
				<span class="foot__kvk">KvK {BRAND.kvk}</span>
			</nav>
		</div>
		<div class="frame foot__bottom">
			<p>© 2026 {BRAND.legalName}. Alle rechten voorbehouden.</p>
			{#if dateModified}
				<time datetime={dateModified}>Bijgewerkt {dateModified}</time>
			{/if}
		</div>
	</footer>
</div>

<style>
	/* ─── Tokens: the demo's own, on its root, so nothing leaks either way ─── */
	.demo {
		--d-ink: #17333a;
		--d-ink-soft: #3f5a62;
		--d-deep: #1e4e58;
		--d-water: #4f8f9c;
		--d-tint: #dfeaec;
		--d-sand: #f6f2ea;
		--d-paper: #fbf9f5;
		--d-on-dark: #f3ece0;
		--d-on-dark-soft: #c9d6d8;
		--d-line: rgba(23, 51, 58, 0.14);
		--d-line-dark: rgba(243, 236, 224, 0.18);

		--d-font-display: 'Cormorant Garamond', Georgia, serif;
		--d-font-body: 'DM Sans', system-ui, sans-serif;

		/* type scale, seven steps */
		--d-fs-eyebrow: 0.8125rem;
		--d-fs-body: 1rem;
		--d-fs-lead: 1.125rem;
		--d-fs-h3: 1.375rem;
		--d-fs-stat: 2rem;
		--d-fs-h2: clamp(2rem, 1.4rem + 2.2vw, 3rem);
		--d-fs-h1: clamp(2.5rem, 1.5rem + 4.2vw, 4.5rem);

		/* spacing scale, 8-base */
		--d-s1: 0.5rem;
		--d-s2: 1rem;
		--d-s3: 1.5rem;
		--d-s4: 2rem;
		--d-s5: 3rem;
		--d-s6: 4rem;
		--d-s7: 6rem;
		--d-s8: 8rem;

		--d-radius: 1rem;
		--d-pill: 999px;
		--d-frame: 75rem;
		--d-gutter: 1.5rem;
		--d-bar: 4.5rem;

		--d-ease: cubic-bezier(0, 0, 0.3, 1);
		--d-ease-16: cubic-bezier(0.83, 0.01, 0.29, 1);

		font-family: var(--d-font-body);
		font-size: var(--d-fs-body);
		line-height: 1.6;
		color: var(--d-ink);
		background: var(--d-sand);
		overflow-x: clip;
	}

	/* ─── Shared pieces, global inside .demo so the sections can use them ─── */
	.demo :global(.frame) {
		max-width: var(--d-frame);
		margin-inline: auto;
		padding-inline: var(--d-gutter);
	}

	.demo :global(.eyebrow) {
		display: block;
		font-family: var(--d-font-body);
		font-size: var(--d-fs-eyebrow);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--d-ink-soft);
	}
	.demo :global(.eyebrow--dark) {
		color: var(--d-on-dark-soft);
	}

	.demo :global(h2),
	.demo :global(h3) {
		font-family: var(--d-font-display);
		font-weight: 700;
		line-height: 1.1;
		margin: 0;
		text-wrap: balance;
	}
	.demo :global(h2) {
		font-size: var(--d-fs-h2);
	}
	.demo :global(h3) {
		font-size: var(--d-fs-h3);
	}
	.demo :global(p) {
		margin: 0;
		text-wrap: pretty;
	}
	.demo :global(.lead) {
		font-size: var(--d-fs-lead);
		color: var(--d-ink-soft);
		max-width: 46ch;
	}
	/* eyebrow 8–12 above a heading, heading to subline 16–24, header to content 40–64 */
	.demo :global(.eyebrow + h2) {
		margin-top: var(--d-s1);
	}
	.demo :global(h2 + .lead) {
		margin-top: var(--d-s2);
	}

	/* 03b's masks: a line is a window; what rises inside it comes from below the window */
	.demo :global(.line) {
		display: block;
		overflow: hidden;
		padding-bottom: 0.12em;
		margin-bottom: -0.12em;
	}
	.demo :global(.line > *) {
		display: block;
	}

	.demo :global(.pill) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		padding: 0 1.5rem;
		border-radius: var(--d-pill);
		border: 1.5px solid var(--d-deep);
		background: var(--d-deep);
		color: #fff;
		font-family: var(--d-font-body);
		font-size: var(--d-fs-body);
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color 150ms var(--d-ease),
			color 150ms var(--d-ease),
			border-color 150ms var(--d-ease);
	}
	.demo :global(.pill:hover),
	.demo :global(.pill:focus-visible) {
		background: var(--d-ink);
		border-color: var(--d-ink);
	}
	.demo :global(.pill--ghost) {
		background: transparent;
		color: var(--d-deep);
	}
	.demo :global(.pill--ghost:hover),
	.demo :global(.pill--ghost:focus-visible) {
		background: var(--d-deep);
		color: #fff;
	}
	.demo :global(.pill--sand) {
		background: var(--d-on-dark);
		border-color: var(--d-on-dark);
		color: var(--d-ink);
	}
	.demo :global(.pill--sand:hover),
	.demo :global(.pill--sand:focus-visible) {
		background: #fff;
		border-color: #fff;
	}
	.demo :global(.pill--light) {
		background: transparent;
		border-color: var(--d-on-dark);
		color: var(--d-on-dark);
	}
	.demo :global(.pill--light:hover),
	.demo :global(.pill--light:focus-visible) {
		background: var(--d-on-dark);
		color: var(--d-ink);
	}
	.demo :global(:focus-visible) {
		outline: 2px solid var(--d-water);
		outline-offset: 3px;
	}
	.demo :global(.visually-hidden) {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.skip {
		position: absolute;
		top: -100px;
		left: var(--d-gutter);
		z-index: 200;
		padding: var(--d-s1) var(--d-s2);
		background: var(--d-ink);
		color: var(--d-on-dark);
		border-radius: var(--d-pill);
	}
	.skip:focus {
		top: var(--d-s2);
	}

	/* ─── The bar ─── */
	.bar {
		position: fixed;
		inset: 0 0 auto;
		z-index: 100;
		height: var(--d-bar);
		color: var(--d-on-dark);
		background: transparent;
		border-bottom: 1px solid transparent;
		transition:
			background-color 200ms var(--d-ease),
			color 200ms var(--d-ease),
			border-color 200ms var(--d-ease);
	}
	.bar--solid {
		color: var(--d-ink);
		background: var(--d-sand);
		border-bottom-color: var(--d-line);
	}
	.bar__inner {
		max-width: var(--d-frame);
		height: 100%;
		margin-inline: auto;
		padding-inline: var(--d-gutter);
		display: flex;
		align-items: center;
		gap: var(--d-s4);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--d-s1);
		color: inherit;
		text-decoration: none;
		flex-shrink: 0;
	}
	.brand__mark {
		width: 2.25rem;
		height: 2.25rem;
	}
	.brand__text {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}
	.brand__name {
		font-family: 'Cinzel', var(--d-font-display);
		font-size: 1.125rem;
		letter-spacing: 0.08em;
	}
	.brand__sub {
		font-family: var(--d-font-display);
		font-size: 0.875rem;
		font-style: italic;
		opacity: 0.85;
	}
	.bar__nav {
		display: none;
		flex: 1;
		justify-content: center;
	}
	.bar__links {
		display: flex;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bar__link {
		position: relative;
		color: inherit;
		text-decoration: none;
		font-size: 1rem;
		padding: var(--d-s1) 0;
	}
	.bar__link::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 200ms var(--d-ease);
	}
	.bar__link:hover::after,
	.bar__link:focus-visible::after {
		transform: scaleX(1);
	}
	.demo :global(.pill--bar) {
		display: none;
		min-height: 2.5rem;
		padding-inline: 1.25rem;
		font-size: 0.9375rem;
		margin-left: auto;
	}
	.bar:not(.bar--solid) :global(.pill--bar) {
		background: var(--d-on-dark);
		border-color: var(--d-on-dark);
		color: var(--d-ink);
	}
	.bar__menu-btn {
		margin-left: auto;
		min-height: 2.5rem;
		padding: 0 1rem;
		border-radius: var(--d-pill);
		border: 1.5px solid currentColor;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.bar__sheet {
		display: none;
		background: var(--d-sand);
		border-bottom: 1px solid var(--d-line);
		padding: var(--d-s2) var(--d-gutter) var(--d-s3);
	}
	.bar__sheet--open {
		display: block;
	}
	.bar__sheet ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--d-s2);
	}
	.bar__sheet a:not(.pill) {
		color: var(--d-ink);
		text-decoration: none;
		font-size: 1.125rem;
	}

	@media (min-width: 1024px) {
		.bar__nav {
			display: flex;
		}
		.demo :global(.pill--bar) {
			display: inline-flex;
		}
		.bar__menu-btn,
		.bar__sheet {
			display: none;
		}
	}

	/* ─── The statement ─── */
	.statement {
		padding-block: var(--d-s7);
	}
	.statement__text {
		max-width: 42ch;
		margin-inline: auto;
		text-align: center;
	}
	.practice {
		list-style: none;
		margin: var(--d-s6) auto 0;
		padding: 0;
		max-width: 64rem;
		display: grid;
		gap: var(--d-s3);
	}
	.practice__item {
		padding: var(--d-s3) var(--d-s3) var(--d-s3);
		background: var(--d-tint);
		border-radius: var(--d-radius);
	}
	.practice__item p {
		margin-top: var(--d-s1);
		color: var(--d-ink);
	}
	@media (min-width: 768px) {
		.practice {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* ─── The footer ─── */
	.foot {
		background: var(--d-ink);
		color: var(--d-on-dark);
		padding-block: var(--d-s8) var(--d-s4);
	}
	.foot__grid {
		display: grid;
		gap: var(--d-s5);
	}
	.foot__brand {
		display: flex;
		flex-direction: column;
	}
	.brand__name--foot {
		font-size: 1.5rem;
	}
	.brand__sub--foot {
		font-size: 1.125rem;
	}
	.foot__address {
		font-style: normal;
		display: grid;
		gap: var(--d-s1);
		margin-top: var(--d-s3);
		color: var(--d-on-dark-soft);
	}
	.foot__note {
		max-width: 36ch;
	}
	.foot a {
		color: var(--d-on-dark);
		text-decoration: none;
		border-bottom: 1px solid var(--d-line-dark);
		width: fit-content;
		transition: border-color 150ms var(--d-ease);
	}
	.foot a:hover,
	.foot a:focus-visible {
		border-bottom-color: var(--d-on-dark);
	}
	.foot__col {
		display: grid;
		gap: var(--d-s1);
		align-content: start;
	}
	.foot__col .eyebrow {
		margin-bottom: var(--d-s1);
	}
	.foot__kvk {
		color: var(--d-on-dark-soft);
	}
	.foot__bottom {
		margin-top: var(--d-s6);
		padding-top: var(--d-s3);
		border-top: 1px solid var(--d-line-dark);
		display: flex;
		flex-wrap: wrap;
		gap: var(--d-s2);
		justify-content: space-between;
		font-size: var(--d-fs-eyebrow);
		color: var(--d-on-dark-soft);
	}
	@media (min-width: 768px) {
		.foot__grid {
			grid-template-columns: 6fr 3fr 3fr;
		}
	}
</style>
