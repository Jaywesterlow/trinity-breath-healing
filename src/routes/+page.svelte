<script lang="ts">
	/**
	 * Landing page — Trinity Breath & Healing
	 *
	 * SEO-09 / BLOCKER-3: visible <time datetime> element must match JSON-LD WebPage.dateModified.
	 * Both are driven by __BUILD_DATE__ (injected by vite.config.ts define block) via +page.ts load().
	 * data.meta.dateModified is the single source of truth — never use __BUILD_DATE__ directly here.
	 */
	import { Hero, Proof, Werkwijze, Behandelingen, OverMij, Contact, Faq } from '$lib/components';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Hero />
<!-- The hero stays put and the rest of the page scrolls up over it (owner, 2026-10-28):
     the hero is sticky (Hero.svelte), this sheet sits above it on the sand ground. -->
<div class="over-hero">
	<Proof />
	<Werkwijze />
	<OverMij />
	<Behandelingen />
	<Contact />
	<Faq />
</div>

<!--
	SEO-09 / BLOCKER-3: Visible dateModified element.
	datetime attribute and text content must be identical YYYY-MM-DD strings.
	JSON-LD WebPage.dateModified is set to the same value in +page.ts → buildWebPage().
	Single source: both flow from data.meta.dateModified (__BUILD_DATE__ at build time).
-->
{#if data.meta.dateModified}
	<time datetime={data.meta.dateModified} class="visually-hidden">{data.meta.dateModified}</time>
{/if}

<style>
	.over-hero {
		position: relative;
		z-index: 1;
		background: var(--color-bg-sand);
	}
</style>
