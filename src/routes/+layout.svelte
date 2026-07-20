<script lang="ts">
	import '../app.css';
	import { Nav, Footer, Head, JsonLd } from '$lib/components';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// SCH-01: Use $page.data.graph instead of data.graph so that page-specific JSON-LD nodes
	// (WebPage, FAQPage etc.) returned by individual +page.ts load functions are included.
	// data.graph contains only the base shared nodes (Organization, WebSite, etc.) from the
	// layout load; $page.data.graph contains the fully merged graph where the page's data wins.
	// This ensures a single JSON-LD script per page with all required nodes (Pitfall #6).
	const graph = $derived($page.data.graph ?? data.graph);

	// SEO fix: same pattern as SCH-01 above. data.meta is the LAYOUT's own load data (root
	// defaults only); $page.data.meta is the merged store where the route's +page.ts meta wins.
	// Without this, every route rendered the same layout-default title/description regardless
	// of the per-page meta each +page.ts already computes from stub-meta.ts.
	const meta = $derived($page.data.meta ?? data.meta);

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
	<!-- Preload self-hosted primary fonts (FND-06) — body (DM Sans) + display (Cormorant Garamond) -->
	<link
		rel="preload"
		href="/fonts/dm-sans/dm-sans-regular.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="/fonts/cormorant-garamond/cormorant-garamond-regular.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<!-- Cinzel + Montserrat via Google Fonts — TODO: self-host woff2 (FND-06) -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cinzel&family=Montserrat:wght@300;400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Head {meta} />
<JsonLd {graph} />
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
