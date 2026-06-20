<script lang="ts">
	/**
	 * Landing page — Phase 0 skeleton.
	 *
	 * SEO-09 / BLOCKER-3: renders a visible <time datetime="YYYY-MM-DD"> recency block.
	 * The datetime attribute and text content both come from data.meta.dateModified,
	 * which is sourced from __BUILD_DATE__ (Vite define → +page.ts → here).
	 * Single source: UI date === JSON-LD WebPage.dateModified === __BUILD_DATE__.
	 *
	 * Phase 1 (LND-*) will replace the placeholder body sections with real landing content.
	 * The recency block (.page-meta) must survive Phase 1 edits — it is a permanent SEO signal.
	 */
	import PageTitle from '$lib/components/PageTitle.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageTitle>TRINITY Breath & Healing</PageTitle>

<section class="hero-placeholder">
	<p>
		Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie,
		ademwerk en energetische behandelingen in Amsterdam en de regio.
	</p>
	<p><em>Volledige landingspagina komt beschikbaar in Phase 1.</em></p>
</section>

<!--
	SEO-09 recency signal (BLOCKER-3).
	REQUIRED: this element must remain visible (not hidden via CSS).
	Phase 1 may restyle position/placement but must not remove this block.
	The <time datetime> attribute must always match the visible text content.
-->
<p class="page-meta">
	Laatst bijgewerkt:
	<time datetime={data.meta.dateModified}>{data.meta.dateModified}</time>
</p>

<style>
	.hero-placeholder {
		max-width: var(--content-max-width, 42rem);
		margin: 2rem auto;
		padding: 0 1rem;
		color: var(--color-fg-muted, #5a6a50);
		line-height: 1.6;
	}

	/* SEO-09: visible, not hidden. Phase 1 may adjust positioning. */
	.page-meta {
		max-width: var(--content-max-width, 42rem);
		margin: 2rem auto;
		padding: 0 1rem;
		font-size: 0.8125rem;
		color: var(--color-fg-muted, #5a6a50);
	}
</style>
