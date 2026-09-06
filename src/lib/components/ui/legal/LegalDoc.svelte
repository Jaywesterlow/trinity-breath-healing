<script lang="ts">
	/**
	 * Shared shell for the three legal pages (privacyverklaring, algemene
	 * voorwaarden, disclaimer).
	 *
	 * One component rather than three copies of the same prose CSS, because
	 * these pages will be edited by whoever ends up owning the legal text and
	 * they should not each drift into their own typography.
	 *
	 * The `lastUpdated` <time datetime> is not decoration: a legal document with
	 * no visible date is worth very little if it is ever disputed, and Google
	 * reads the same element for freshness on exactly the YMYL pages where it
	 * weighs it most.
	 */
	import type { Snippet } from 'svelte';
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';

	let {
		title,
		lead,
		lastUpdated,
		crumbs,
		children
	}: {
		title: string;
		lead: string;
		/** ISO yyyy-mm-dd. Drives both the <time datetime> and the printed date. */
		lastUpdated: string;
		crumbs: { name: string; path: string }[];
		children: Snippet;
	} = $props();

	const printed = $derived(
		new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
			new Date(`${lastUpdated}T00:00:00Z`)
		)
	);
</script>

<Breadcrumbs items={crumbs} />

<article class="legal">
	<header class="legal__header">
		<PageTitle>{title}</PageTitle>
		<p class="legal__lead">{lead}</p>
		<p class="legal__meta">
			Laatst bijgewerkt op <time datetime={lastUpdated}>{printed}</time>
		</p>
	</header>

	<div class="legal__body">
		{@render children()}
	</div>
</article>

<style>
	.legal {
		max-width: var(--content-max-width, 42rem);
		margin: 0 auto;
		padding: clamp(1.5rem, 6vw, 3rem) clamp(1rem, 5vw, 1.5rem) clamp(3rem, 10vw, 5rem);
		color: var(--color-fg-forest, #3a4530);
	}

	.legal__header {
		padding-bottom: clamp(1rem, 4vw, 1.5rem);
		border-bottom: 1px solid var(--brand-border, #7c5e49);
		margin-bottom: clamp(1.5rem, 5vw, 2.5rem);
	}

	.legal__lead {
		margin-top: 0.75rem;
		font-size: 1.0625rem;
		line-height: 1.65;
		color: var(--brand-muted, #5f6d56);
	}

	.legal__meta {
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: var(--brand-muted, #5f6d56);
	}

	/* Descendant selectors, so the pages can write plain semantic markup instead
	   of carrying a class on every paragraph. :global is required because the
	   content is passed in as a snippet and compiled in the parent's scope. */
	.legal__body :global(h2) {
		font-family: var(--font-display, serif);
		font-size: clamp(1.25rem, 4vw, 1.5rem);
		line-height: 1.25;
		margin: clamp(2rem, 6vw, 2.75rem) 0 0.75rem;
	}

	.legal__body :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 1.5rem 0 0.5rem;
	}

	.legal__body :global(p),
	.legal__body :global(li) {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--brand-muted, #5f6d56);
	}

	.legal__body :global(p) {
		margin-bottom: 1rem;
	}

	.legal__body :global(ul),
	.legal__body :global(ol) {
		margin: 0 0 1rem 1.25rem;
		padding: 0;
	}

	.legal__body :global(ul) {
		list-style: disc;
	}

	.legal__body :global(ol) {
		list-style: decimal;
	}

	.legal__body :global(li) {
		margin-bottom: 0.375rem;
	}

	.legal__body :global(a) {
		color: var(--color-fg-forest, #3a4530);
		text-decoration: underline;
	}

	@media (hover: hover) and (pointer: fine) {
		.legal__body :global(a:hover) {
			text-decoration: none;
		}
	}

	.legal__body :global(dl) {
		margin: 0 0 1rem;
	}

	.legal__body :global(dt) {
		font-weight: 600;
		font-size: 0.9375rem;
		margin-top: 0.75rem;
	}

	.legal__body :global(dd) {
		margin: 0.125rem 0 0;
		font-size: 1rem;
		line-height: 1.7;
		color: var(--brand-muted, #5f6d56);
	}

	/* Tables carry the processor list, which is the one place these documents
	   genuinely need columns. They must not push the page sideways on a phone. */
	.legal__body :global(.legal-table-wrap) {
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.legal__body :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9375rem;
		min-width: 30rem;
	}

	.legal__body :global(th),
	.legal__body :global(td) {
		text-align: left;
		vertical-align: top;
		padding: 0.5rem 0.75rem 0.5rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border, #7c5e49) 30%, transparent);
		color: var(--brand-muted, #5f6d56);
		line-height: 1.55;
	}

	.legal__body :global(th) {
		color: var(--color-fg-forest, #3a4530);
		font-weight: 600;
	}
</style>
