<script lang="ts">
	/**
	 * The closing block of a subpage: a question, one line under it, the
	 * button, and the disclaimer under everything. The same ButtonLink as
	 * everywhere else on the site; the button sits on the right on desktop so
	 * the block reads as a row, not a third column of text.
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

<section class="cta" aria-labelledby={id} use:reveal>
	<div class="cta__text">
		<h2 {id} class="cta__h2">{title}</h2>
		<p class="cta__lead">{lead}</p>
	</div>
	<div class="cta__button">
		<ButtonLink {label} {href} />
	</div>
	{#if note}
		<p class="cta__note">{note}</p>
	{/if}
</section>

<style>
	.cta {
		display: grid;
		gap: var(--space-6);
		padding-top: var(--block-gap);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.cta__h2 {
		margin: 0 0 var(--space-4);
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 20ch;
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

	@media (min-width: 1100px) {
		.cta {
			grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
			grid-template-areas:
				'text button'
				'note note';
			column-gap: var(--space-12);
			align-items: center;
		}

		.cta__text {
			grid-area: text;
		}

		.cta__button {
			grid-area: button;
			justify-self: start;
		}

		.cta__note {
			grid-area: note;
		}
	}
</style>
