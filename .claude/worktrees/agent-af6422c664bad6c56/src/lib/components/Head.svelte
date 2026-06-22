<script lang="ts">
	/**
	 * Head — reusable head emitter.
	 * Emits all SEO tags via <svelte:head> from a typed PageMeta prop.
	 * No $state or $effect — all values derived from $props() and $derived (Pitfall #2).
	 * Requirements: SEO-01 (title+desc), SEO-04 (canonical), SEO-05 (hreflang), SEO-06 (OG+Twitter)
	 */
	import type { PageMeta } from '$lib/seo/types';
	import { SITE_URL } from '$lib/seo/defaults';

	let { meta }: { meta: PageMeta } = $props();

	// All derived values — no $state, no $effect (Pitfall #2 compliance)
	const titleFull = $derived(
		meta.path === '/' ? meta.title : `${meta.title} | TRINITY Breath & Healing`
	);
	const canonical = $derived(SITE_URL + meta.path);
	const ogImage = $derived(meta.og?.image ?? `${SITE_URL}/og-default.jpg`);
	const ogType = $derived(meta.og?.type ?? 'website');
</script>

<svelte:head>
	<title>{titleFull}</title>
	<meta name="description" content={meta.description} />

	<!-- Canonical + hreflang (SEO-04, SEO-05) -->
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="nl" href={canonical} />
	<link rel="alternate" hreflang="x-default" href={canonical} />

	<!-- Open Graph (SEO-06) — og:locale=nl_NL closes WARNING-3 -->
	<meta property="og:title" content={titleFull} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:type" content={ogType} />
	<meta property="og:locale" content="nl_NL" />

	<!-- Twitter Card (SEO-06) -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={titleFull} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- noindex for preview environments — Plan 08 wires the env-conditional (T-00-noindex-preview) -->
	{#if meta.noindex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
</svelte:head>
