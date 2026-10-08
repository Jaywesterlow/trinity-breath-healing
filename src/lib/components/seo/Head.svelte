<script lang="ts">
	/**
	 * Head — reusable head emitter.
	 * Emits all SEO tags via <svelte:head> from a typed PageMeta prop.
	 * No $state or $effect — all values derived from $props() and $derived (Pitfall #2).
	 * Requirements: SEO-01 (title+desc), SEO-04 (canonical), SEO-05 (hreflang), SEO-06 (OG+Twitter)
	 */
	import type { PageMeta } from '$lib/seo/types';
	import { SITE_URL } from '$lib/seo/defaults';
	import { BRAND } from '$lib/constants/brand';

	let { meta }: { meta: PageMeta } = $props();

	// All derived values — no $state, no $effect (Pitfall #2 compliance)

	/* The brand goes on once. This used to append unconditionally, and every page
	   whose own TITLE already ended in the practice name shipped it twice —
	   "Spinal Touch in Amsterdam – Trinity Breath & Healing | TRINITY Breath &
	   Healing", 79 characters, of which Google shows about 60. The page titles
	   were trimmed in the same pass, but the guard stays: this component is the
	   one place the suffix is decided, and it should not be possible to defeat it
	   from a route file. Matched case-insensitively because the two spellings in
	   the tree differ only in case. */
	const BRAND_SUFFIX = BRAND.shortName;
	const hasBrand = $derived(meta.title.toLowerCase().includes(BRAND_SUFFIX.toLowerCase()));
	const titleFull = $derived(
		meta.path === '/' || hasBrand ? meta.title : `${meta.title} | ${BRAND_SUFFIX}`
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

	<!-- noindex for preview environments and for reserved stubs.
	     `follow`, not `nofollow`: keeping a placeholder out of the index is the
	     point, but the page still links back to the landing page and the
	     footer, and nofollow would throw that internal link equity away for no
	     gain. Nothing here needs its outbound links suppressed. -->
	{#if meta.noindex}
		<meta name="robots" content="noindex,follow" />
	{/if}
</svelte:head>
