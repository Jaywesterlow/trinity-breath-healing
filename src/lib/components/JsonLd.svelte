<script lang="ts">
	/**
	 * <JsonLd graph={...} /> — Single mount point for JSON-LD emission on every page.
	 * Mounted ONCE in src/routes/+layout.svelte. Never mounted in individual routes.
	 * (Pitfall #6: one <script type="application/ld+json"> per page — never two)
	 *
	 * SCH-01: emits @graph composed by buildGraph() in +page.ts load()
	 * T-00-jsonld defense in depth: escapes </script in serialized JSON before {@html}
	 *   - Source data is schema-dts typed — no untrusted strings at this stage
	 *   - .replace(/<\/script/gi, '<\\/script') prevents </script injection in JSON values
	 *   - Test 2 (jsonld.test.ts) verifies this escape fires when malicious string in graph
	 */
	let { graph }: { graph: object[] } = $props();

	const serialized = $derived(
		JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
			/<\/script/gi,
			'<\\/script'
		)
	);

	// Avoid template literal with literal <script — confuses ESLint Svelte parser
	const jsonLdHtml = $derived(
		'<script type="application/ld+json">' + serialized + '<' + '/script>'
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdHtml}
</svelte:head>
