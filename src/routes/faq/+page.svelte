<script lang="ts">
	/**
	 * /faq — real content, not `StubLayout`.
	 *
	 * Reuses `<Faq>` (the same landing-page section, same `faqItems` source of truth) rather
	 * than duplicating its markup. `showHeading={false}` suppresses its internal eyebrow+h2 —
	 * this page's own <h1> already introduces the content, so a second "Veelgestelde vragen"
	 * heading directly beneath it would be redundant noise, not a hierarchy violation, but
	 * worth avoiding regardless.
	 *
	 * The FAQPage JSON-LD lives in this route's +page.ts, not the landing page's — see the
	 * comment there for why.
	 */
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { Faq } from '$lib/components/global';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumbs items={data.crumbs} />

<article class="faq-intro">
	<PageTitle>Veelgestelde vragen</PageTitle>
	<p class="faq-intro__text">
		Antwoorden op de vragen die we het vaakst horen over ademwerk, de energetische behandelingen en
		de praktische kant van een sessie. Staat jouw vraag er niet bij? Neem gerust <a href="/contact"
			>contact</a
		> op.
	</p>
</article>

<Faq showHeading={false} />

<style>
	.faq-intro {
		max-width: var(--content-max-width, 42rem);
		margin: 0 auto;
		padding: var(--space-8, 2rem) var(--space-4, 1rem) 0;
	}

	.faq-intro__text {
		color: var(--color-fg-muted, #5a6a50);
		font-size: var(--font-size-base, 1rem);
		line-height: var(--line-height-relaxed, 1.625);
	}

	.faq-intro__text a {
		color: var(--color-fg-forest, #3a4530);
		text-decoration: underline;
	}

	.faq-intro__text a:hover {
		text-decoration: none;
	}
</style>
