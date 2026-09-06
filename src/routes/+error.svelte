<script lang="ts">
	/**
	 * Error page, which in practice is the 404. SvelteKit's default is an
	 * unstyled black-on-white stack of text — on a site whose whole argument is
	 * that it feels calm and looked after, that page undoes it.
	 *
	 * Deliberately offers a way onward rather than only an apology: a dead end
	 * on a marketing site is a lost enquiry.
	 */
	import { page } from '$app/state';
	import { BRAND } from '$lib/constants/brand';

	const isMissing = $derived(page.status === 404);
	const heading = $derived(isMissing ? 'Deze pagina bestaat niet' : 'Er ging iets mis');
	const body = $derived(
		isMissing
			? 'De link klopt niet meer, of de pagina is verplaatst. Hieronder kom je verder.'
			: 'Probeer het zo nog eens. Blijft het misgaan, laat het me dan gerust weten.'
	);
</script>

<svelte:head>
	<title>{heading} | {BRAND.shortName}</title>
	<meta name="robots" content="noindex,follow" />
</svelte:head>

<main class="error" id="main">
	<p class="error__code">{page.status}</p>
	<h1 class="error__heading">{heading}</h1>
	<p class="error__body">{body}</p>

	<nav class="error__links" aria-label="Verder op de site">
		<a class="error__cta" href="/">Naar de homepage</a>
		<a class="error__link" href="/#contact">Contact opnemen</a>
	</nav>
</main>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(0.5rem, 2vw, 0.75rem);
		min-height: 60vh;
		padding: clamp(3rem, 10vw, 6rem) 1.5rem;
		text-align: center;
		color: var(--color-fg-forest);
	}

	.error__code {
		font-family: var(--font-body);
		font-size: clamp(0.75rem, 3.2vw, 0.875rem);
		letter-spacing: 0.08em;
		color: var(--brand-muted);
	}

	.error__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		max-width: 20ch;
	}

	.error__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
		max-width: 46ch;
	}

	.error__links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: clamp(0.75rem, 3vw, 1.25rem);
		margin-top: clamp(0.5rem, 2vw, 1rem);
	}

	.error__cta {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding: 0 1.5rem;
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		font-size: var(--fs-cta);
		text-decoration: none;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.error__cta:hover {
			transform: translateY(var(--lift-hover));
			box-shadow: var(--shadow-hover);
		}
	}

	.error__link {
		position: relative;
		font-family: var(--font-body);
		font-size: var(--fs-cta);
		color: var(--color-fg-forest);
		text-decoration: none;
	}

	.error__link::after {
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

	.error__link:focus-visible::after {
		transform: scaleX(1);
	}

	@media (hover: hover) and (pointer: fine) {
		.error__link:hover::after {
			transform: scaleX(1);
		}
	}
</style>
