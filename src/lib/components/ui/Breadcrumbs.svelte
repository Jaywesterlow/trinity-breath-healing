<script lang="ts">
	/**
	 * <Breadcrumbs items={...} /> — visible breadcrumb navigation.
	 *
	 * Renders a <nav aria-label="Breadcrumb"><ol>...</ol></nav> with visible links.
	 * The accompanying BreadcrumbList JSON-LD schema is wired via +page.ts load()
	 * into the page graph, NOT emitted here (Pitfall #6 single-graph rule).
	 *
	 * This <nav aria-label="Breadcrumb"> is distinct from <SiteNav aria-label="Hoofdnavigatie">
	 * (from Plan 02). Multiple <nav> elements per page are valid HTML when distinguished
	 * by aria-label. Plan 08's audit gate counts ANY <nav> presence (>=1), not ===1.
	 *
	 * SCH-06: BreadcrumbList enters the page graph via buildBreadcrumb() called in +page.ts,
	 * not via a second <JsonLd> script in this component.
	 */
	let { items }: { items: { name: string; path: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol>
		{#each items as item, i (item.path)}
			<li>
				{#if i < items.length - 1}
					<a href={item.path}>{item.name}</a>
					<span aria-hidden="true"> / </span>
				{:else}
					<span aria-current="page">{item.name}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	/* Was flush against the viewport edge on every subpage, because this sits
	   outside the page's own container and had no width of its own. One box for
	   every page: the same one the landing page's sections and the footer use,
	   with the gutter added to the max-width rather than eaten out of it
	   (box-sizing is border-box), so the content box is exactly --container-max.
	   This used to be switchable per page and the two settings disagreed by
	   256px, which is how a crumb ended up 256px right of the logo below it. */
	nav {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-4) 1.5rem 0;
		font-size: 0.875rem;
		color: var(--color-text-subtle);
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* 24px of height, not the 21 the type alone gives. WCAG 2.5.8 exempts targets
	   inside a sentence, and a breadcrumb trail is a navigation list rather than
	   prose, so it does not get to claim that exemption. The padding is vertical
	   only — horizontal padding would push the separators away from the words. */
	a {
		display: inline-block;
		padding-block: 0.125rem;
		color: var(--dark-green, #3a4530);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		a:hover {
			text-decoration: none;
		}
	}

	span[aria-current='page'] {
		color: inherit;
	}
</style>
