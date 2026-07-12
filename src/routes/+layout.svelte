<script lang="ts">
	import '../app.css';
	import { Nav, Footer, Head, JsonLd } from '$lib/components';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// SCH-01: Use $page.data.graph instead of data.graph so that page-specific JSON-LD nodes
	// (WebPage, FAQPage etc.) returned by individual +page.ts load functions are included.
	// data.graph contains only the base shared nodes (Organization, WebSite, etc.) from the
	// layout load; $page.data.graph contains the fully merged graph where the page's data wins.
	// This ensures a single JSON-LD script per page with all required nodes (Pitfall #6).
	const graph = $derived($page.data.graph ?? data.graph);

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<!-- Cinzel + Montserrat via Google Fonts — TODO: self-host woff2 (FND-06) -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cinzel&family=Montserrat:wght@300;400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Head meta={data.meta} />
<JsonLd graph={graph} />
<Nav />
<main class="page-content" style="view-transition-name: page-content">
	{@render children()}
</main>
<Footer />

<style>
	.page-content {
		padding-top: var(--nav-height);
	}
</style>
