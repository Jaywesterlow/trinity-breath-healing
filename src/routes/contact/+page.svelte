<script lang="ts">
	/**
	 * /contact — the same Contact section the landing page uses, on its own URL.
	 *
	 * Reuses the component rather than rebuilding the form and the planner, for
	 * the same reason /faq reuses <Faq>: two copies of a booking flow is two
	 * things to keep in sync and one of them will lose. `showHeading={false}`
	 * suppresses the section's own eyebrow and h2, because this page's <h1>
	 * already introduces it.
	 *
	 * Every CTA on the site points here, so this page has to work before any of
	 * them mean anything.
	 */
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { Contact } from '$lib/components/global';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumbs items={data.crumbs} />

<article class="contact-intro contact-page-intro">
	<PageTitle>Contact</PageTitle>
	<p class="contact-intro__text" use:reveal>
		Plan een kennismaking van dertig minuten, stuur een bericht, of app gerust. Je hoeft nog niet te
		weten wat je nodig hebt.
	</p>
</article>

<Contact showHeading={false} />

<style>
	/* --container-max, not the text measure: <Contact> below is the full container
	   width, and a heading centred in 46rem sat visibly to the right of the cards
	   it introduces. The horizontal padding is the section's own 1.5rem so the h1
	   starts on the same vertical line as the first card. */
	.contact-intro {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem 0;
	}

	/* The intro supplies the space above the cards; the section's own --space-16 on
	   top of that left a visible hole between the heading and the first card.
	   :global because .contact belongs to Contact.svelte, not to this file. */
	:global(.contact-page-intro + section.contact) {
		padding-top: var(--space-8);
	}

	.contact-intro__text {
		max-width: var(--content-max-width);
		margin-top: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}
</style>
