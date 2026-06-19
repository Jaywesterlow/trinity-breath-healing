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
		{#each items as item, i}
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
	nav {
		font-size: 0.875rem;
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

	a {
		color: var(--dark-green, #3a4530);
		text-decoration: underline;
	}

	a:hover {
		text-decoration: none;
	}

	span[aria-current='page'] {
		color: inherit;
	}
</style>
