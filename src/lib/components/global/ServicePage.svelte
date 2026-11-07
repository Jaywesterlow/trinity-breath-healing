<script lang="ts">
	/**
	 * One layout for all eight /diensten/* pages.
	 *
	 * The content is not written here and must not be: every word comes from
	 * `BRAND.services`, which is the practitioner's own copy, and the same object
	 * already feeds the carousel card, the modal and the Service JSON-LD. Seven
	 * hand-written pages would have drifted from those within a month.
	 *
	 * Structure follows what someone arriving from a search actually needs, in
	 * order: what this is, what it helps with, what a session looks like, and how
	 * to book one. The "waar het bij helpt" list is the part an AI Overview is
	 * most likely to lift, so it is a real <ul> of short noun phrases rather than
	 * a paragraph — the same reason the FAQ answers are marked up the way they are.
	 *
	 * The disclaimer is not optional and not per-page. This is a health site in
	 * the YMYL category; the line that says a session does not replace a doctor
	 * belongs on every page that describes a treatment, and it comes from one
	 * constant so it cannot say something slightly different on page four.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import CredentialBadge from '$lib/components/ui/CredentialBadge.svelte';
	import ClearingAscensie from './ClearingAscensie.svelte';
	import { PageShell, PageHead, PageSection, CtaBand, ServiceCard } from '$lib/components/page';
	import { SERVICE_ART } from '$lib/constants/service-art';
	import { BRAND } from '$lib/constants/brand';
	import { contraGroupFor } from '$lib/content/contra-indicaties';
	import { reveal } from '$lib/actions/reveal';
	import { paintGreen } from '$lib/paint';

	let { slug, crumbs }: { slug: string; crumbs: { name: string; path: string }[] } = $props();

	const service = $derived(BRAND.services.find((s) => s.slug === slug)!);
	const contra = $derived(contraGroupFor(slug));

	/** The other six, for the row at the bottom. Order is BRAND's, not shuffled. */
	const others = $derived(BRAND.services.filter((s) => s.slug !== slug));
	const art = $derived(SERVICE_ART[slug]);
	/* The page may carry a longer text than the card and modal (Gold Healing, 6-11). */
	const pageText = $derived('pageIntro' in service ? service.pageIntro : service.intro);
	const paragraphs = $derived(pageText.split('\n\n'));
	const helpsIntro = $derived('helpsIntro' in service ? service.helpsIntro : null);
	const paint = $derived(paintGreen(BRAND.services.findIndex((s) => s.slug === slug)));
</script>

<Breadcrumbs items={crumbs} />

<PageShell>
	<!-- The one eyebrow left on a subpage. Everywhere else it repeated the word
	     directly above it in the breadcrumb; here the crumb says the treatment's
	     name and this says what kind of page it is, so it carries something. -->
	<PageHead eyebrow="Behandeling" lead={service.teaser}>
		{service.name}
		{#snippet visual()}
			{#if art}
				<!-- The same card as the one turning on the home page: sand lines on
				     the treatment's own watercolour green (her request, 2-11). The
				     drawing's own box, not the SVG's: see ServiceModal's
				     .service-modal__art for the mechanism and service-art.ts for
				     the numbers. -->
				<div class="service__card" style:--paint={paint}>
					<div
						class="service__art"
						style={`--art-src: url(${art.src}); --art-x: ${art.x}; --art-y: ${art.y}; --art-w: ${art.w}; --art-h: ${art.h}; --art-ratio: ${art.ratio};`}
					></div>
				</div>
			{/if}
		{/snippet}
	</PageHead>

	<!-- A question as heading, the way people ask it and AI answers quote it. -->
	<PageSection id="wat" eyebrow="In het kort" title={`Wat is ${service.name}?`}>
		{#each paragraphs as para, i (i)}
			<p class="service__body" use:reveal>{para}</p>
		{/each}
		{#if slug === 'spinal-touch'}
			<CredentialBadge />
		{/if}
	</PageSection>

	<!-- Her long text already carries this list in her own order. -->
	{#if slug === 'clearing-ascensie'}
		<ClearingAscensie />
	{:else}
		<PageSection id="helpt" eyebrow="Voor wie" title="Waar het bij kan helpen">
			{#if helpsIntro}
				<p class="service__body service__lead-in" use:reveal>{helpsIntro}</p>
			{/if}
			<ul class="service__list">
				{#each service.helpsWith as item (item)}
					<li class="service__item" use:reveal>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
							<path
								d="m8.5 12 2.4 2.4 4.6-4.8"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</PageSection>
	{/if}

	<PageSection id="sessie" eyebrow="De sessie" title="Hoe een sessie verloopt">
		<p class="service__body" use:reveal>
			We beginnen met een gesprek over waar je op dit moment tegenaan loopt. Daarna werk ik met
			{service.name}, afgestemd op wat jij nodig hebt. Je hoeft niets te presteren en niets te
			vertellen wat je niet wilt vertellen. Na afloop is er tijd om te landen en na te praten. Een
			sessie duurt {service.duration} en kan {service.remote
				? 'in de praktijkruimte, bij jou thuis of op afstand'
				: 'in de praktijkruimte of bij jou thuis'}. De prijs vind je op de
			<a class="link-underline" href="/tarieven">tarievenpagina</a>.
		</p>
	</PageSection>

	{#if contra}
		<PageSection id="veiligheid" eyebrow="Goed om te weten" title="Gezondheid en veiligheid">
			<p class="service__body">{contra.intro}</p>
			{#if contra.items}
				<ul class="service__contra">
					{#each contra.items as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
			{#if contra.prep}
				<p class="service__body">{contra.prepTitle}:</p>
				<ul class="service__contra">
					{#each contra.prep as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
			{#if contra.outro}
				<p class="service__body">{contra.outro}</p>
			{/if}
			<p class="service__body">
				Stop nooit zelf met voorgeschreven medicatie. Meer hierover staat op de
				<a class="link-underline" href="/disclaimer">disclaimerpagina</a>.
			</p>
		</PageSection>
	{/if}

	<CtaBand
		id="afspraak"
		title="Samen kijken wat bij jou past"
		lead={`Ben je benieuwd of ${service.name} iets voor jou kan betekenen? Tijdens een vrijblijvend kennismakingsgesprek nemen we rustig de tijd om jouw wensen en behoeften te bespreken. Samen ontdekken we welke behandeling het beste bij jou aansluit.`}
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>

	<PageSection id="andere" eyebrow="Meer" title="Andere behandelingen" wide>
		<ul class="service__others">
			{#each others as other (other.slug)}
				<li use:reveal>
					<ServiceCard
						href="/diensten/{other.slug}"
						name={other.name}
						teaser={other.teaser}
						paint={paintGreen(BRAND.services.findIndex((s) => s.slug === other.slug))}
					/>
				</li>
			{/each}
		</ul>
	</PageSection>
</PageShell>

<style>
	/* The drawing as a mask over forest ink, so the sand lines the SVG was
	   drawn in for the green cards come out in the page's own ink, the way
	   the landing page inks its portrait. The mask is scaled by 1/--art-w ×
	   1/--art-h so the drawing's box fills this box, and positioned so the
	   SVG's margins fall outside it: a percentage position is measured
	   against (box − mask), which is where the (1 − w) comes from. */
	/* The home carousel's card face (TreatmentCard .tcard): its ratio, radius and
	   watercolour green, with the drawing centred in its upper part. */
	.service__card {
		display: grid;
		place-items: center;
		height: 100%;
		aspect-ratio: 282 / 459;
		padding: 14% 12%;
		border-radius: var(--radius-lg);
		background: var(--paint, var(--paint-green));
		@media (max-width: 1099.98px) {
			height: var(--phead-visual-h, 14rem);
		}
	}

	.service__art {
		width: 100%;
		max-height: 100%;
		aspect-ratio: var(--art-ratio);
		background: var(--color-bg-sand);
		-webkit-mask-image: var(--art-src);
		mask-image: var(--art-src);
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		-webkit-mask-size: calc(100% / var(--art-w)) calc(100% / var(--art-h));
		mask-size: calc(100% / var(--art-w)) calc(100% / var(--art-h));
		-webkit-mask-position: calc(100% * var(--art-x) / (1 - var(--art-w)))
			calc(100% * var(--art-y) / (1 - var(--art-h)));
		mask-position: calc(100% * var(--art-x) / (1 - var(--art-w)))
			calc(100% * var(--art-y) / (1 - var(--art-h)));
	}

	.service__body {
		margin: 0;
		font-family: var(--font-body);
		/* Lead size from the desktop breakpoint up; on a phone the intro at that size
		   ran to 298px, over the third-of-the-viewport band the reveal keeps to. */
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	/* Two columns of checks on desktop: nine items in one column beside a
	   heading were a list a screen tall. */
	.service__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-3) var(--space-8);
	}

	.service__item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border) 20%, transparent);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-fg-forest);
	}

	.service__item svg {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--brand-border);
	}

	.service__lead-in {
		margin-bottom: var(--space-4);
	}

	.service__body + .service__body,
	.service__contra + .service__body {
		margin-top: var(--space-4);
	}

	.service__contra {
		margin: var(--space-3) 0 0;
		padding-left: 1.25rem;
		list-style: disc;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.service__others {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	@media (min-width: 700px) {
		.service__list,
		.service__others {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.service__body,
		.service__contra {
			font-size: var(--fs-body-lg);
		}

		.service__others {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
