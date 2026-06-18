<script lang="ts">
	/**
	 * Root layout — mounts SEO primitives + semantic landmark skeleton on every route.
	 * Source order: <Head> (in svelte:head) → <SiteNav> → <main> → <SiteFooter>
	 * SEO-01..06: <Head> emits title, meta, canonical, hreflang, OG, Twitter for every prerendered route.
	 * SEO-03: <SiteNav> + <main> + <SiteFooter> are in initial HTML for every prerendered route (BLOCKER-5).
	 *
	 * Note: <html lang="nl"> is set on src/app.html (Plan 01) — NOT here.
	 * Note: <JsonLd> is mounted by Plan 03 — not in scope for Plan 02.
	 */
	import '../../static/global.css';
	import { page } from '$app/state';
	import Head from '$lib/components/Head.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	let { children } = $props();
</script>

<Head meta={page.data.meta} />
<SiteNav />
<main>{@render children()}</main>
<SiteFooter />
