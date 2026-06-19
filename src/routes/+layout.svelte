<script lang="ts">
	/**
	 * Root layout — mounts SEO primitives + JSON-LD + semantic landmark skeleton on every route.
	 * Source order: <Head> (in svelte:head) → <JsonLd> (in svelte:head) → <SiteNav> → <main> → <SiteFooter>
	 * SEO-01..06: <Head> emits title, meta, canonical, hreflang, OG, Twitter for every prerendered route.
	 * SCH-01: <JsonLd> is the SINGLE mount point for JSON-LD — one <script type="application/ld+json"> per page.
	 * SEO-03: <SiteNav> + <main> + <SiteFooter> are in initial HTML for every prerendered route (BLOCKER-5).
	 *
	 * Note: <html lang="nl"> is set on src/app.html (Plan 01) — NOT here.
	 * Note: page.data.graph is composed by buildGraph() in each route's +page.ts load().
	 */
	import '../../static/global.css';
	import { page } from '$app/state';
	import Head from '$lib/components/Head.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	let { children } = $props();
</script>

<Head meta={page.data.meta} />
<JsonLd graph={page.data.graph} />
<SiteNav />
<main>{@render children()}</main>
<SiteFooter />
