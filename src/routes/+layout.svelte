<script lang="ts">
	import { Nav, Footer, Head, JsonLd } from '$lib/components';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// SCH-01: Use $page.data.graph instead of data.graph so that page-specific JSON-LD nodes
	// (WebPage, FAQPage etc.) returned by individual +page.ts load functions are included.
	// data.graph contains only the base shared nodes (Organization, WebSite, etc.) from the
	// layout load; $page.data.graph contains the fully merged graph where the page's data wins.
	// This ensures a single JSON-LD script per page with all required nodes (Pitfall #6).
	const graph = $derived($page.data.graph ?? data.graph);
</script>

<Head meta={data.meta} />
<JsonLd graph={graph} />
<Nav />
{@render children()}
<Footer />
