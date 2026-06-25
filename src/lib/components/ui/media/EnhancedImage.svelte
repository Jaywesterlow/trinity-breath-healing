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
	 *
	 * NOTE on width/height: these props are held on the outer container for CLS=0 discipline.
	 * At build time, @sveltejs/enhanced-img derives final dimensions from the image file.
	 * The props serve as the TypeScript contract and the container hint.
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
	Outer container carries width/height for CLS=0 and for test-time SSR verification.
	enhanced:img is processed by @sveltejs/enhanced-img at build time to produce
	AVIF + WebP + responsive srcset <picture> element. In unit tests the preprocessor
	replaces <enhanced:img> with <img>, making the width/height/alt/loading attrs visible
	in the SSR output. fetchpriority is emitted only when explicitly set.
-->
<span style="display: contents" {width} {height}>
	{#if fetchpriority !== undefined}
		<enhanced:img
			{src}
			{alt}
			{loading}
			fetchpriority={fetchpriority}
			class={className}
		/>
	{:else}
		<enhanced:img
			{src}
			{alt}
			{loading}
			class={className}
		/>
	{/if}
</span>

<style>
	/* Reset baseline — prevents CLS from default img display:inline */
	:global(img) {
		max-width: 100%;
		height: auto;
		display: block;
	}
</style>
