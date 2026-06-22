<script lang="ts">
	/**
	 * Landing page — Phase 0 skeleton.
	 * Phase 1 (LND sub-units) replaces the placeholder body with real content sections.
	 * The recency block (SEO-09) MUST persist through Phase 1 rewrites.
	 *
	 * SEO-09: visible <time datetime="YYYY-MM-DD"> keeps AI freshness-ranking signals active.
	 * data.meta.dateModified === __BUILD_DATE__ (wired in +page.ts — single source).
	 */
	import PageTitle from '$lib/components/PageTitle.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageTitle>TRINITY Breath & Healing</PageTitle>

<p class="landing-intro">
	Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie,
	ademwerk en energetische behandelingen in Almere en de wijde regio.
</p>

<!-- SEO-09 recency signal: visible dateModified for AI freshness-ranking.
     datetime attribute + visible text content match exactly (BLOCKER-3 closure). -->
<p class="page-meta">
	Laatst bijgewerkt: <time datetime={data.meta.dateModified}>{data.meta.dateModified}</time>
</p>

<style>
	.landing-intro {
		font-size: var(--font-size-lg, 1.125rem);
		line-height: var(--line-height-relaxed, 1.6);
		color: var(--color-fg-base, #1a1a1a);
		max-width: var(--content-max-width, 720px);
		margin: var(--space-6, 1.5rem) auto;
		padding: 0 var(--space-4, 1rem);
	}

	.page-meta {
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-fg-muted, #6b7280);
		max-width: var(--content-max-width, 720px);
		margin: var(--space-4, 1rem) auto;
		padding: 0 var(--space-4, 1rem);
	}
</style>
