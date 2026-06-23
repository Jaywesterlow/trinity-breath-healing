<script lang="ts">
	/**
	 * Landing page — Phase 1 Plan 01.
	 *
	 * HeroSection replaces the Phase 0 placeholder. It owns the H1.
	 * SEO-09 / BLOCKER-3: visible <time datetime="YYYY-MM-DD"> recency block preserved below.
	 * The datetime attribute and text content both come from data.meta.dateModified,
	 * which is sourced from __BUILD_DATE__ (Vite define → +page.ts → here).
	 * Single source: UI date === JSON-LD WebPage.dateModified === __BUILD_DATE__.
	 */
	import HeroSection from '$lib/components/HeroSection.svelte';
	import WerkwijzeSection from '$lib/components/WerkwijzeSection.svelte';
	import AboutSection from '$lib/components/AboutSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<HeroSection />

<WerkwijzeSection />

<AboutSection />

<!--
	SEO-09 recency signal (BLOCKER-3).
	REQUIRED: this element must remain visible (not hidden via CSS).
	The <time datetime> attribute must always match the visible text content.
-->
<p class="page-meta">
	Laatst bijgewerkt:
	<time datetime={data.meta.dateModified}>{data.meta.dateModified}</time>
</p>

<style>
	/* SEO-09: visible, not hidden. */
	.page-meta {
		max-width: var(--container-max);
		margin-inline: auto;
		margin-block: var(--space-4);
		padding-inline: var(--space-6);
		font-size: var(--font-size-sm);
		color: var(--color-muted);
	}
</style>
