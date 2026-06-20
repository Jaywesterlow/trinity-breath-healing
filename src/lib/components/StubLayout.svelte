<script lang="ts">
	/**
	 * StubLayout — shared layout for all 14 stub routes.
	 *
	 * Renders:
	 *   - <Breadcrumbs> navigation from Plan 02 (reused, no duplication)
	 *   - <PageTitle> h1 from Plan 02 (reused, no duplication)
	 *   - Description paragraph (per-route distinct — Pitfall #7)
	 *   - "Komt binnenkort" availability message with home link
	 *
	 * FND-08: 14 reserved stubs; Phase 2+ deepens content without changing structure.
	 * RESEARCH Pattern 9: "Komt binnenkort beschikbaar" UX for stub routes.
	 */
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import PageTitle from '$lib/components/PageTitle.svelte';

	let {
		title,
		description,
		crumbs
	}: {
		title: string;
		description: string;
		crumbs: { name: string; path: string }[];
	} = $props();
</script>

<Breadcrumbs items={crumbs} />

<article class="stub-article">
	<PageTitle>{title}</PageTitle>
	<p class="stub-description">{description}</p>
	<p class="stub-coming-soon">
		Deze pagina komt binnenkort beschikbaar.
		<a href="/">Terug naar de hoofdpagina &rarr;</a>
	</p>
</article>

<style>
	.stub-article {
		max-width: var(--content-max-width, 42rem);
		margin: 0 auto;
		padding: var(--space-8, 2rem) var(--space-4, 1rem);
	}

	.stub-description {
		color: var(--color-fg-muted, #5a6a50);
		font-size: var(--font-size-base, 1rem);
		line-height: var(--line-height-relaxed, 1.625);
		margin-bottom: var(--space-4, 1rem);
	}

	.stub-coming-soon {
		color: var(--color-fg-muted, #5a6a50);
		font-size: var(--font-size-sm, 0.875rem);
	}

	.stub-coming-soon a {
		color: var(--color-fg-forest, #3a4530);
		text-decoration: underline;
	}

	.stub-coming-soon a:hover {
		text-decoration: none;
	}
</style>
