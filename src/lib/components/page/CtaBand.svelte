<script lang="ts">
	/**
	 * The closing block of a subpage: the question, the line under it and the
	 * button, on a green watercolour card like the home page's contact cards, and
	 * the disclaimer under the card on the sand. The same ButtonLink as everywhere
	 * else on the site. Centred and stacked: the button belongs to the sentence
	 * above it, so it sits under it.
	 */
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { reveal } from '$lib/actions/reveal';
	import { paintGreen } from '$lib/paint';

	interface Props {
		id: string;
		title: string;
		lead: string;
		label: string;
		href: string;
		/** The one line under everything, usually BRAND.disclaimer. */
		note?: string;
		/** Small line over the title, the home page's eyebrow. */
		eyebrow?: string;
	}
	let { id, title, lead, label, href, note, eyebrow = 'Kennismaken' }: Props = $props();
</script>

<!-- The card itself does not fade: it is over a third of a phone screen, the most
     one revealed block may be (reveal-audit.spec.ts). Its words and its button do,
     and the note under it. -->
<section class="cta" aria-labelledby={id}>
	<div class="cta__card" style:--paint={paintGreen(4)}>
		<div class="cta__text" use:reveal>
			<p class="cta__eyebrow">{eyebrow}</p>
			<h2 {id} class="cta__h2">{title}</h2>
			<p class="cta__lead">{lead}</p>
		</div>
		<div class="cta__button" use:reveal>
			<ButtonLink {label} {href} />
		</div>
	</div>
	{#if note}
		<p class="cta__note" use:reveal>{note}</p>
	{/if}
</section>

<style>
	.cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding-top: var(--block-gap);
	}

	/* Mid-page (the service pages close with other treatments after it) it
	   needs its own air before the next section. */
	.cta:not(:last-child) {
		padding-bottom: var(--block-gap);
	}

	.cta__card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		max-width: 52rem;
		padding: clamp(2.5rem, 6vw, 4rem) clamp(1.5rem, 5vw, 4rem);
		border-radius: 1.125rem; /* the contact cards' 18px */
		background: var(--paint, var(--paint-green));
		color: var(--color-bg-sand);
		text-align: center;
	}

	.cta__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.cta__eyebrow {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--color-bg-sand);
	}

	.cta__h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-bg-sand);
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
		color: var(--color-bg-sand);
		text-wrap: pretty;
	}

	.cta__button {
		margin-top: var(--space-4);
	}

	/* Set apart from the block without being a warning box. */
	.cta__note {
		margin: 0;
		max-width: 60ch;
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
		text-align: center;
	}
</style>
