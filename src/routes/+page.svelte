<script lang="ts">
	/**
	 * Landing page — Trinity Breath & Healing
	 *
	 * SEO-09 / BLOCKER-3: visible <time datetime> element must match JSON-LD WebPage.dateModified.
	 * Both are driven by __BUILD_DATE__ (injected by vite.config.ts define block) via +page.ts load().
	 * data.meta.dateModified is the single source of truth — never use __BUILD_DATE__ directly here.
	 */
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main>
	<!-- Landing page content (Phase 1 sections will be added here) -->

	<!--
		SEO-09 / BLOCKER-3: Visible dateModified element.
		datetime attribute and text content must be identical YYYY-MM-DD strings.
		JSON-LD WebPage.dateModified is set to the same value in +page.ts → buildWebPage().
		Single source: both flow from data.meta.dateModified (__BUILD_DATE__ at build time).
	-->
	<footer>
		{#if data.meta.dateModified}
			<time datetime={data.meta.dateModified}>{data.meta.dateModified}</time>
		{/if}
	</footer>
</main>
