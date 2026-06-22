<script lang="ts">
	/**
	 * StubLayout — shared layout for all 14 Phase 0 stub pages.
	 * Renders per-route breadcrumbs + H1 title + description + "Komt binnenkort" UX.
	 * Reuses <Breadcrumbs> and <PageTitle> primitives from Plans 02-03 (no UI duplication).
	 * Requirements: FND-08 (stub UX), RESEARCH Pattern 9 (static stubs, not dynamic [stub])
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

<article class="stub-page">
	<PageTitle>{title}</PageTitle>
	<p class="stub-description">{description}</p>
	<p class="stub-notice">
		Deze pagina komt binnenkort beschikbaar.
		<a href="/">Terug naar de hoofdpagina →</a>
	</p>
</article>

<style>
	.stub-page {
		max-width: var(--content-max-width, 720px);
		margin: var(--space-8, 2rem) auto;
		padding: 0 var(--space-4, 1rem);
	}

	.stub-description {
		color: var(--color-fg-muted, #6b7280);
		font-size: var(--font-size-base, 1rem);
		line-height: var(--line-height-relaxed, 1.6);
		margin-top: var(--space-4, 1rem);
	}

	.stub-notice {
		margin-top: var(--space-6, 1.5rem);
		font-style: italic;
		color: var(--color-fg-muted, #6b7280);
	}

	.stub-notice a {
		color: var(--color-fg-forest, #3a4530);
		text-decoration: underline;
	}

	.stub-notice a:hover {
		text-decoration: none;
	}
</style>
