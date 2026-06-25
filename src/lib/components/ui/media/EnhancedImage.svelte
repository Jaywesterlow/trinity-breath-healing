<script lang="ts">
	/**
	 * EnhancedImage — Type-safe wrapper around <enhanced:img> (PRF-01).
	 *
	 * REQUIRED props: src, alt, width, height — missing any causes a TypeScript compile error.
	 * This enforces CLS=0 (explicit dimensions) and accessibility (non-empty alt) at the type level.
	 *
	 * OPTIONAL props:
	 *   loading  — default 'lazy' (below-fold safe). Hero images MUST pass loading="eager".
	 *   fetchpriority — omit attribute entirely when not provided (browser default).
	 *              Hero images MUST pass fetchpriority="high" (Pitfall #6 / SEO §B).
	 *
	 * Usage:
	 *   Hero:       <EnhancedImage src={HeroImg} alt="..." width={1200} height={800} loading="eager" fetchpriority="high" />
	 *   Below-fold: <EnhancedImage src={IconImg} alt="..." width={48} height={48} />
	 */

	type Props = {
		src: string;
		alt: string;
		width: number;
		height: number;
		loading?: 'eager' | 'lazy';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
	};

	let {
		src,
		alt,
		width,
		height,
		loading = 'lazy',
		fetchpriority,
		class: className
	}: Props = $props();
</script>

<!--
	enhanced:img is processed by @sveltejs/enhanced-img at build time.
	It generates AVIF + WebP + responsive srcset + explicit width/height → CLS=0.
	fetchpriority is omitted when undefined so the attribute is not rendered at all.
-->
{#if fetchpriority !== undefined}
	<enhanced:img
		{src}
		{alt}
		{width}
		{height}
		{loading}
		fetchpriority={fetchpriority}
		class={className}
	/>
{:else}
	<enhanced:img
		{src}
		{alt}
		{width}
		{height}
		{loading}
		class={className}
	/>
{/if}

<style>
	/* Reset baseline — prevents CLS from default img display:inline */
	:global(img) {
		max-width: 100%;
		height: auto;
		display: block;
	}
</style>
