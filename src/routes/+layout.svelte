<script lang="ts">
	import '../app.css';
	import { Nav, Footer, Head, JsonLd, CursorTooltip } from '$lib/components';
	import Analytics from '$lib/analytics/Analytics.svelte';
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

	// A route that carries its own chrome (the /demo page) sets `bare: true`
	// in its load and gets the head, the analytics and the JSON-LD from here,
	// and nothing else: no Nav, no Footer, no cursor tooltip, no nav offset.
	const bare = $derived(Boolean($page.data.bare));

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
	<!-- Preload self-hosted fonts (FND-06). Cinzel is the wordmark and sits in the
	     first paint, so it is preloaded too; Montserrat is the smaller subtitle
	     line and loads normally. No Google Fonts <link> anywhere: that request
	     hands every visitor's IP to Google and is exactly what would drag a
	     cookie question onto a site that currently needs none. -->
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
	<link
		rel="preload"
		href="/fonts/cinzel/cinzel-400.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

<Head {meta} />
<Analytics />
<JsonLd {graph} />
{#if !bare}
	<Nav />
{/if}
<main
	class="page-content"
	class:page-content--bare={bare}
	style="view-transition-name: page-content"
>
	{@render children()}
</main>
{#if !bare}
	<Footer />
	<CursorTooltip />
{/if}

<style>
	.page-content {
		padding-top: var(--nav-height);
	}

	.page-content--bare {
		padding-top: 0;
	}
</style>
