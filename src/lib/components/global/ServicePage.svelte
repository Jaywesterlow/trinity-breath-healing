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
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';

	let { slug, crumbs }: { slug: string; crumbs: { name: string; path: string }[] } = $props();

	const service = $derived(BRAND.services.find((s) => s.slug === slug)!);

	/** The other six, for the row at the bottom. Order is BRAND's, not shuffled. */
	const others = $derived(BRAND.services.filter((s) => s.slug !== slug));
</script>

<Breadcrumbs items={crumbs} />

<article class="service">
	<header class="service__head">
		<!-- The one eyebrow left on a subpage. Everywhere else it repeated the word
		     directly above it in the breadcrumb; here the crumb says the treatment's
		     name and this says what kind of page it is, so it carries something. -->
		<p class="service__eyebrow" use:reveal>Behandeling</p>
		<PageTitle>{service.name}</PageTitle>
		<p class="service__teaser" use:reveal>{service.teaser}</p>
	</header>

	<section class="service__block" aria-labelledby="wat">
		<h2 id="wat" class="service__h2" use:reveal>Wat het is</h2>
		<p class="service__body" use:reveal>{service.intro}</p>
	</section>

	<section class="service__block" aria-labelledby="helpt">
		<h2 id="helpt" class="service__h2" use:reveal>Waar het bij kan helpen</h2>
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
	</section>

	<section class="service__block" aria-labelledby="sessie">
		<h2 id="sessie" class="service__h2" use:reveal>Hoe een sessie verloopt</h2>
		<p class="service__body" use:reveal>
			We beginnen met een gesprek over waar je op dit moment tegenaan loopt. Daarna werk ik met
			{service.name}, afgestemd op wat jij nodig hebt. Je hoeft niets te presteren en niets te
			vertellen wat je niet wilt vertellen. Na afloop is er tijd om te landen en na te praten. Een
			sessie duurt ongeveer een uur en kan bij jou thuis of op afstand.
		</p>
		<p class="service__note" use:reveal>{BRAND.disclaimer}</p>
	</section>

	<section class="service__cta" aria-labelledby="afspraak">
		<h2 id="afspraak" class="service__h2" use:reveal>Een afspraak maken</h2>
		<p class="service__body" use:reveal>
			Je hoeft niet te weten of dit de juiste behandeling voor je is. Dat zoeken we in het eerste
			gesprek samen uit.
		</p>
		<div class="service__button" use:reveal>
			<ButtonLink label="Plan een kennismaking" href="/contact" />
		</div>
	</section>

	<nav class="service__more" aria-labelledby="andere">
		<h2 id="andere" class="service__h2" use:reveal>Andere behandelingen</h2>
		<ul class="service__others">
			{#each others as other (other.slug)}
				<li use:reveal>
					<a class="service__other" href="/diensten/{other.slug}">
						<span class="service__other-name">{other.name}</span>
						<span class="service__other-teaser">{other.teaser}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</article>

<style>
	/* Every page sits in the same box as the landing page's sections and the
	   footer below it, so a heading never starts 256px to the right of the logo
	   directly underneath it. The gutter is added to the max-width rather than
	   taken out of it (box-sizing is border-box), so the content box is exactly
	   --container-max. Reading measure is restored on the children, not by
	   narrowing the box — otherwise the whole page slides right again. */
	.service {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem var(--space-16);
	}

	/* Reading measure. Direct children only, so a section can opt out by
	   nesting if it ever needs the full container. */
	.service > * {
		max-width: var(--content-max-width);
	}

	.service__head {
		margin-bottom: var(--space-10);
	}

	.service__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.service__teaser {
		margin-top: var(--space-4);
		font-family: var(--font-display);
		font-size: clamp(1.25rem, 1.05rem + 0.9vw, 1.625rem);
		font-weight: var(--font-weight-light);
		line-height: 1.5;
		color: var(--color-fg-forest);
		text-wrap: balance;
	}

	.service__block,
	.service__cta,
	.service__more {
		margin-top: var(--space-12);
	}

	.service__h2 {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-4);
	}

	.service__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	/* Set apart from the body copy without being a warning box: this is a
	   qualification of what was just said, not an alert. */
	.service__note {
		margin-top: var(--space-5);
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.service__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.service__item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.service__item svg {
		flex: none;
		width: 20px;
		height: 20px;
		/* Optical centring on the first line rather than the box, which at this
		   line-height sits the tick noticeably high. */
		margin-top: 0.15em;
		color: var(--brand-border);
	}

	.service__button {
		margin-top: var(--space-6);
	}

	.service__others {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-3);
	}

	.service__other {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4) var(--space-5);
		border: 1px solid color-mix(in srgb, var(--brand-border) 30%, transparent);
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.service__other:hover {
			background: color-mix(in srgb, var(--brand-border) 7%, transparent);
			border-color: var(--brand-border);
		}
	}

	.service__other:focus-visible {
		background: color-mix(in srgb, var(--brand-border) 7%, transparent);
		border-color: var(--brand-border);
	}

	.service__other-name {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		color: var(--color-fg-forest);
	}

	.service__other-teaser {
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	@media (min-width: 768px) {
		.service__others {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
