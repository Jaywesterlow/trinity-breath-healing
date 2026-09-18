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
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';

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

<PageShell>
	<PageHead {lead}>{title}</PageHead>

	<!-- The document beside a narrow column that stays put: when it was last
	     changed, and who to ask. The text itself keeps a reading measure; the
	     page no longer leaves two thirds of a wide screen empty for it. -->
	<div class="legal">
		<aside class="legal__aside">
			<p class="legal__meta">
				<span class="legal__meta-label">Laatst bijgewerkt</span>
				<time datetime={lastUpdated}>{printed}</time>
			</p>
			<p class="legal__meta">
				<span class="legal__meta-label">Vragen hierover</span>
				<a class="link-underline" href="mailto:{BRAND.email}">{BRAND.email}</a>
			</p>
		</aside>
		<div class="legal__body">
			{@render children()}
		</div>
	</div>
</PageShell>

<style>
	.legal {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding-top: var(--block-gap);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
		color: var(--color-fg-forest);
	}

	.legal__aside {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.legal__meta {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		color: var(--color-text-subtle);
	}

	.legal__meta-label {
		font-family: var(--font-display);
		font-size: var(--fs-body-lg);
		color: var(--color-fg-forest);
	}

	.legal__body {
		min-width: 0;
		max-width: 70ch;
	}

	/* Descendant selectors, so the pages can write plain semantic markup instead
	   of carrying a class on every paragraph. :global is required because the
	   content is passed in as a snippet and compiled in the parent's scope. */
	.legal__body :global(h2) {
		margin: var(--space-10) 0 var(--space-3);
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.legal__body :global(h2:first-child) {
		margin-top: 0;
	}

	.legal__body :global(h3) {
		margin: var(--space-6) 0 var(--space-2);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
	}

	.legal__body :global(p),
	.legal__body :global(li) {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.legal__body :global(p) {
		margin: 0 0 var(--space-4);
	}

	.legal__body :global(ul),
	.legal__body :global(ol) {
		margin: 0 0 var(--space-4) var(--space-5);
		padding: 0;
	}

	.legal__body :global(ul) {
		list-style: disc;
	}

	.legal__body :global(ol) {
		list-style: decimal;
	}

	.legal__body :global(li) {
		margin-bottom: var(--space-2);
	}

	.legal__body :global(a) {
		color: var(--brand-border);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.legal__body :global(a:hover) {
		text-decoration: none;
	}

	.legal__body :global(dl) {
		margin: 0 0 var(--space-4);
	}

	.legal__body :global(dt) {
		margin-top: var(--space-3);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
	}

	.legal__body :global(dd) {
		margin: var(--space-1) 0 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	/* Tables carry the processor list, which is the one place these documents
	   genuinely need columns. They must not push the page sideways on a phone. */
	.legal__body :global(.legal-table-wrap) {
		overflow-x: auto;
		margin-bottom: var(--space-4);
	}

	.legal__body :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		min-width: 30rem;
	}

	.legal__body :global(th),
	.legal__body :global(td) {
		text-align: left;
		vertical-align: top;
		padding: var(--space-3) var(--space-4) var(--space-3) 0;
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border) 30%, transparent);
		color: var(--color-text-subtle);
		line-height: var(--line-height-normal);
	}

	.legal__body :global(th) {
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1100px) {
		.legal {
			display: grid;
			grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
			column-gap: var(--space-12);
			align-items: start;
		}

		.legal__aside {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-8));
		}
	}
</style>
