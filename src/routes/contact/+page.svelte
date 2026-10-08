<script lang="ts">
	/**
	 * /contact — the same three-step planner as the landing page, under a page
	 * head, and the FAQ under that. The FAQ used to be its own page; it is the
	 * set of questions people have right before they get in touch, so it lives
	 * here now, and /faq redirects to #faq (vercel.json). The FAQPage JSON-LD
	 * moved with it, see +page.ts.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead } from '$lib/components/page';
	import { Contact, Faq } from '$lib/components/global';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		lead="Plan een kennismaking van dertig minuten, stuur een bericht, of app gerust. Je hoeft nog niet te weten wat je nodig hebt."
	>
		Contact
	</PageHead>
</PageShell>

<Contact showHeading={false} />

<Faq />

<style>
	/* The shell here holds only the head; the two sections under it bring
	   their own container and spacing. :global because .page belongs to
	   PageShell and .contact to Contact.svelte. */
	:global(.page:has(> .phead:last-child)) {
		padding-bottom: 0;
	}

	:global(.page > .phead:last-child) {
		padding-bottom: 0;
	}
</style>
