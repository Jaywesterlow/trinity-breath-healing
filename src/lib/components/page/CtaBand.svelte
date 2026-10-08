<script lang="ts">
	/**
	 * The closing block of a subpage, top to bottom: the question, the line
	 * under it, the button, and the disclaimer under everything. The same
	 * ButtonLink as everywhere else on the site. Stacked on every width: the
	 * button belongs to the sentence above it, so it sits under it.
	 */
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		id: string;
		title: string;
		lead: string;
		label: string;
		href: string;
		/** The one line under everything, usually BRAND.disclaimer. */
		note?: string;
	}
	let { id, title, lead, label, href, note }: Props = $props();
</script>

<!-- Three reveals, not one: the block is over a third of a phone screen. -->
<section class="cta" aria-labelledby={id}>
	<div class="cta__text" use:reveal>
		<h2 {id} class="cta__h2">{title}</h2>
		<p class="cta__lead">{lead}</p>
	</div>
	<div class="cta__button" use:reveal>
		<ButtonLink {label} {href} />
	</div>
	{#if note}
		<p class="cta__note" use:reveal>{note}</p>
	{/if}
</section>

<style>
	.cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-6);
		padding-top: var(--block-gap);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	/* Mid-page (the service pages close with other treatments after it) it
	   needs its own air before the next section's rule. */
	.cta:not(:last-child) {
		padding-bottom: var(--block-gap);
	}

	.cta__h2 {
		margin: 0 0 var(--space-4);
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 22ch;
		text-wrap: balance;
	}

	.cta__lead {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	/* Set apart from the block without being a warning box, the way the
	   service pages and the note under the carousel set the same line. */
	.cta__note {
		margin: var(--space-4) 0 0;
		max-width: 60ch;
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}
</style>
