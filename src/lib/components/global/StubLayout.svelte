<script lang="ts">
	/**
	 * Shared layout for the routes that are reserved but have nothing to say yet:
	 * /blog and /artikelen have no posts, /reviews has no reviews, /over-mij is
	 * waiting on the practitioner's own words.
	 *
	 * It used to print the SEO <title> as the <h1>, so /blog opened with
	 * "Blog – Inzichten over ademwerk en heling | Trinity" set in display type,
	 * pipe and all. A title tag is written for a search result and a heading is
	 * written for a reader; STUB_META now carries both, plus a `lead` that says
	 * what the page will be rather than repeating the meta description at the
	 * visitor.
	 *
	 * These pages stay out of the sitemap and stay `noindex` while they are empty.
	 * That is not an oversight to fix later — thin content submitted at this ratio
	 * is judged against the whole domain, and the whole point of the site is being
	 * found. They rejoin by flipping `kind` in routes.ts once they carry something.
	 *
	 * Typography matches the real content pages deliberately. An empty page laid
	 * out like the rest of the site reads as one that is coming; an empty page
	 * with its own layout reads as one that is broken. No eyebrow, though — these
	 * are all top-level routes, so it would have read "Home" directly under a
	 * breadcrumb that already says Home.
	 */
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { reveal } from '$lib/actions/reveal';

	let {
		heading,
		lead,
		crumbs
	}: {
		heading: string;
		lead: string;
		crumbs: { name: string; path: string }[];
	} = $props();

	/** The crumb before the current page — where "terug" actually goes. */
	const parent = $derived(crumbs[crumbs.length - 2] ?? { name: 'Home', path: '/' });
</script>

<Breadcrumbs items={crumbs} />

<article class="stub">
	<header class="stub__head">
		<PageTitle>{heading}</PageTitle>
		<p class="stub__lead" use:reveal>{lead}</p>
	</header>

	<section class="stub__empty" aria-labelledby="binnenkort">
		<h2 id="binnenkort" class="stub__h2" use:reveal>Nog niets te lezen</h2>
		<p class="stub__body" use:reveal>
			Deze pagina bestaat al, maar staat nog leeg. Er is intussen genoeg te vinden over de
			behandelingen en hoe een sessie verloopt.
		</p>
		<div class="stub__buttons" use:reveal>
			<ButtonLink label="Bekijk de behandelingen" href="/behandelingen" />
		</div>
		<p class="stub__alt" use:reveal>
			Of ga <a href={parent.path}>terug naar {parent.name.toLowerCase()}</a>.
		</p>
	</section>
</article>

<style>
	.stub {
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-8) var(--space-6) var(--space-16);
	}

	.stub__head {
		margin-bottom: var(--space-10);
	}

	.stub__lead {
		margin-top: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.stub__empty {
		margin-top: var(--space-12);
	}

	.stub__h2 {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-4);
	}

	.stub__body,
	.stub__alt {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.stub__buttons {
		margin-top: var(--space-6);
	}

	.stub__alt {
		margin-top: var(--space-6);
	}

	.stub__alt a {
		color: var(--color-fg-forest);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (hover: hover) and (pointer: fine) {
		.stub__alt a:hover {
			text-decoration: none;
		}
	}
</style>
