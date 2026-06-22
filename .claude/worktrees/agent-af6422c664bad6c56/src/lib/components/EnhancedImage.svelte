<script lang="ts">
	// PRF-01: type-safe wrapper around <enhanced:img>.
	// All images default to loading="lazy" (below-fold-safe).
	//
	// HERO LCP USAGE — MUST pass loading="eager" fetchpriority="high":
	//   <EnhancedImage src={HeroImg} alt="..." width={1200} height={800} loading="eager" fetchpriority="high" />
	// See Pitfall #6: lazy-loading a hero image kills LCP scores.
	//
	// BELOW-FOLD USAGE (omit loading and fetchpriority for safe defaults):
	//   <EnhancedImage src={IconImg} alt="Service icon" width={48} height={48} />

	type Props = {
		/** Import path via ?enhanced or plain URL. Required. */
		src: string;
		/** Alt text — required for A11Y-04 AND PRF-01 (missing → TS compile error). */
		alt: string;
		/** Explicit width in px — required for CLS=0 (missing → TS compile error). */
		width: number;
		/** Explicit height in px — required for CLS=0 (missing → TS compile error). */
		height: number;
		/**
		 * loading strategy.
		 * Default: 'lazy' (below-fold-safe).
		 * Hero LCP image MUST use 'eager' — see Pitfall #6.
		 */
		loading?: 'eager' | 'lazy';
		/**
		 * fetchpriority hint.
		 * Default: omitted (browser decides).
		 * Hero LCP image MUST use 'high' — see Pitfall #6.
		 * When undefined, Svelte omits the attribute entirely (browser default).
		 */
		fetchpriority?: 'high' | 'low' | 'auto';
		/** Optional CSS class forwarded to the image element. */
		class?: string;
	};

	let {
		src,
		alt,
		width,
		height,
		loading = 'lazy',
		fetchpriority = undefined,
		class: className = ''
	}: Props = $props();
</script>

<!--
  fetchpriority={fetchpriority ?? undefined}: Svelte 5 omits attributes whose value is
  `undefined`, so when fetchpriority is not passed the attribute is absent from the HTML
  (browser default). This is preferred over conditional rendering for a single attribute.
  See Plan 00-07 SUMMARY.md for decision rationale.
-->
<enhanced:img
	{src}
	{alt}
	{width}
	{height}
	{loading}
	fetchpriority={fetchpriority ?? undefined}
	class={className}
/>

<style>
	/* Reset baseline: image fills its container, no CLS-inducing reflow.
	   The selector targets the enhanced:img element (which becomes <img> at build time).
	   `img` selector omitted here — Svelte's unused-CSS check would flag it because the
	   component template uses <enhanced:img>, not <img>. The :global(img) pattern would
	   leak styles; rely on the project-level CSS reset for img baseline instead. */
	enhanced\:img {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
