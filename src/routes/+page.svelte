<script lang="ts">
	/**
	 * Landing page — Trinity Breath & Healing
	 *
	 * SEO-09 / BLOCKER-3: visible <time datetime> element must match JSON-LD WebPage.dateModified.
	 * Both are driven by __BUILD_DATE__ (injected by vite.config.ts define block) via +page.ts load().
	 * data.meta.dateModified is the single source of truth — never use __BUILD_DATE__ directly here.
	 */
	import { Hero, Werkwijze, Behandelingen, OverMij } from '$lib/components';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Hero />
<Werkwijze />
<OverMij />
<Behandelingen />

<!--
	SEO-09 / BLOCKER-3: Visible dateModified element.
	datetime attribute and text content must be identical YYYY-MM-DD strings.
	JSON-LD WebPage.dateModified is set to the same value in +page.ts → buildWebPage().
	Single source: both flow from data.meta.dateModified (__BUILD_DATE__ at build time).
-->
{#if data.meta.dateModified}
	<time datetime={data.meta.dateModified} class="visually-hidden">{data.meta.dateModified}</time>
{/if}
