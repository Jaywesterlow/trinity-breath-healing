<script lang="ts">
	/**
	 * A certificate mark she is entitled to show — so far the Spinal Touch
	 * "official facilitator" logo she sent on 2026-10-30. A trust signal on a
	 * health page, which is why it carries real alt text instead of being
	 * decorative. The file has a white background, so it sits on a white tile
	 * rather than straight on the sand.
	 */
	import badge from '$lib/images/credentials/spinal-touch-official-facilitator.png?w=144;288;432&enhanced';
	import { reveal } from '$lib/actions/reveal';
</script>

<figure class="badge" use:reveal>
	<picture>
		{#each Object.entries(badge.sources) as [format, srcset] (format)}
			<source type="image/{format}" {srcset} sizes="144px" />
		{/each}
		<img
			src={badge.img.src}
			width="144"
			height="144"
			alt="Spinal Touch official facilitator"
			loading="lazy"
			decoding="async"
		/>
	</picture>
</figure>

<style>
	.badge {
		margin: var(--space-4) 0;
		width: 9rem;
		padding: var(--space-2);
		border-radius: 1rem;
		background: #fff;
	}

	.badge img {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
