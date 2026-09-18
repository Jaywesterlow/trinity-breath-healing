<script lang="ts">
	/**
	 * One layout for all seven /diensten/* pages.
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
	import { PageShell, PageHead, PageSection, CtaBand, ServiceCard } from '$lib/components/page';
	import { SERVICE_ART } from '$lib/constants/service-art';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';

	let { slug, crumbs }: { slug: string; crumbs: { name: string; path: string }[] } = $props();

	const service = $derived(BRAND.services.find((s) => s.slug === slug)!);

	/** The other six, for the row at the bottom. Order is BRAND's, not shuffled. */
	const others = $derived(
		BRAND.services.map((s, i) => ({ ...s, number: i + 1 })).filter((s) => s.slug !== slug)
	);
	const art = $derived(SERVICE_ART[slug]);
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
				<!-- The drawing's own box, not the SVG's: see ServiceModal's
				     .service-modal__art for the mechanism and service-art.ts for
				     the numbers. Forest ink on sand, like the portrait on the
				     landing page. -->
				<div
					class="service__art"
					style={`--art-src: url(${art.src}); --art-x: ${art.x}; --art-y: ${art.y}; --art-w: ${art.w}; --art-h: ${art.h}; --art-ratio: ${art.ratio};`}
				></div>
			{/if}
		{/snippet}
	</PageHead>

	<PageSection id="wat" title="Wat het is">
		<p class="service__body" use:reveal>{service.intro}</p>
	</PageSection>

	<PageSection id="helpt" title="Waar het bij kan helpen">
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

	<PageSection id="sessie" title="Hoe een sessie verloopt">
		<p class="service__body" use:reveal>
			We beginnen met een gesprek over waar je op dit moment tegenaan loopt. Daarna werk ik met
			{service.name}, afgestemd op wat jij nodig hebt. Je hoeft niets te presteren en niets te
			vertellen wat je niet wilt vertellen. Na afloop is er tijd om te landen en na te praten. Een
			sessie duurt ongeveer een uur en kan bij jou thuis of op afstand.
		</p>
	</PageSection>

	<CtaBand
		id="afspraak"
		title="Een afspraak maken"
		lead="Je hoeft niet te weten of dit de juiste behandeling voor je is. Dat zoeken we in het eerste gesprek samen uit."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>

	<PageSection id="andere" title="Andere behandelingen" wide>
		<ul class="service__others">
			{#each others as other (other.slug)}
				<li use:reveal>
					<ServiceCard
						href="/diensten/{other.slug}"
						name={other.name}
						teaser={other.teaser}
						number={other.number}
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
	.service__art {
		height: 100%;
		aspect-ratio: var(--art-ratio);
		background: var(--color-fg-forest);
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
		font-size: var(--fs-body-lg);
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
		.service__others {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
