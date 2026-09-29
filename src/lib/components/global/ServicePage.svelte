<script lang="ts">
	/**
	 * One layout for all seven /diensten/* pages.
	 *
	 * The content is not written here and must not be: every word comes from
	 * `BRAND.services`, which is the practitioner's own copy, and the same object
	 * already feeds the carousel card, the modal and the Service JSON-LD. Seven
	 * hand-written pages would have drifted from those within a month. The
	 * session sentences below are the one shared paragraph every service page
	 * had, now set as steps; the words are unchanged.
	 *
	 * Order, as the owner set it (2026-09-27): the opening with the drawing on
	 * the right; what it is; a quiet band with the invitation; how a session
	 * goes, as a line that draws itself; what it can help with; the other
	 * treatments; the closing card. The two quiet blocks (the band and the
	 * chips) are kept apart on purpose.
	 *
	 * The "waar het bij helpt" list is the part an AI Overview is most likely to
	 * lift, so it stays a real <ul> of short noun phrases.
	 *
	 * The disclaimer is not optional and not per-page. This is a health site in
	 * the YMYL category; the line that says a session does not replace a doctor
	 * belongs on every page that describes a treatment, and it comes from one
	 * constant so it cannot say something slightly different on page four.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { PageShell, PageHead, PageSection, ServiceCard } from '$lib/components/page';
	import { SERVICE_ART } from '$lib/constants/service-art';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';

	let { slug, crumbs }: { slug: string; crumbs: { name: string; path: string }[] } = $props();

	const service = $derived(BRAND.services.find((s) => s.slug === slug)!);

	/** The other six, for the row at the bottom. Order is BRAND's, not shuffled. */
	const others = $derived(BRAND.services.filter((s) => s.slug !== slug));
	const art = $derived(SERVICE_ART[slug]);

	/** The shared session paragraph, sentence by sentence. The middle sentence
	 *  ("je hoeft niets te presteren…") is the band further up the page. */
	const steps = $derived([
		'We beginnen met een gesprek over waar je op dit moment tegenaan loopt.',
		`Daarna werk ik met ${service.name}, afgestemd op wat jij nodig hebt.`,
		'Na afloop is er tijd om te landen en na te praten.'
	]);
</script>

<Breadcrumbs items={crumbs} />

<PageShell>
	<!-- The one eyebrow left on a subpage. Everywhere else it repeated the word
	     directly above it in the breadcrumb; here the crumb says the treatment's
	     name and this says what kind of page it is, so it carries something. -->
	<PageHead eyebrow="Behandeling" lead={service.teaser} spread>
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

	<PageSection id="wat" title="Wat het is" centered>
		<p class="service__body" use:reveal>{service.intro}</p>
	</PageSection>

	<!-- The quiet band: one sentence from the session paragraph, and the
	     invitation under it. Full-bleed colour without a 100vw box (which
	     would add a scrollbar's width of sideways scroll): the shadow paints
	     the ground out to the viewport edges and the clip-path keeps it from
	     spilling up or down. -->
	<section class="service__band" aria-label="Uitnodiging">
		<p class="service__band-line" use:reveal>
			Je hoeft niets te presteren en niets te vertellen wat je niet wilt vertellen.
		</p>
		<div class="service__band-cta" use:reveal>
			<ButtonLink label="Plan een kennismaking" href="/contact" />
		</div>
	</section>

	<PageSection id="sessie" title="Hoe een sessie verloopt" centered>
		<ol class="steps">
			{#each steps as step, i (i)}
				<li class="steps__item" class:steps__item--left={i % 2 === 1}>
					<span class="steps__rail" aria-hidden="true">
						<span class="steps__node"></span>
						{#if i < steps.length - 1}
							<!-- One segment of the line per gap, each drawn as it scrolls
							     into view (animation 23 from the library, rebuilt on a CSS
							     view timeline instead of GSAP). pathLength="1" makes the
							     dash maths independent of the drawn length. -->
							<svg class="steps__line" viewBox="0 0 40 120" preserveAspectRatio="xMidYMid meet">
								<path
									pathLength="1"
									d={i % 2 === 0
										? 'M20 2 C36 30 36 50 20 60 C4 70 4 90 20 118'
										: 'M20 2 C4 30 4 50 20 60 C36 70 36 90 20 118'}
								/>
							</svg>
						{/if}
					</span>
					<p class="steps__text" use:reveal>{step}</p>
				</li>
			{/each}
		</ol>
		<p class="steps__after" use:reveal>
			Een sessie duurt ongeveer een uur en kan bij jou thuis of op afstand.
		</p>
	</PageSection>

	<PageSection id="helpt" title="Waar het bij kan helpen" centered>
		<ul class="service__chips">
			<!-- No reveal per chip: nine small fades would spend most of the
			     page's reveal budget (tests/integration/reveal-audit.spec.ts) on
			     the quietest block. They simply stand. -->
			{#each service.helpsWith as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</PageSection>

	<PageSection id="andere" title="Andere behandelingen" wide>
		<ul class="service__others">
			{#each others as other (other.slug)}
				<li use:reveal>
					<ServiceCard href="/diensten/{other.slug}" name={other.name} teaser={other.teaser} />
				</li>
			{/each}
		</ul>
	</PageSection>

	<section class="service__close" aria-labelledby="afspraak">
		<div class="service__card">
			<h2 id="afspraak" class="service__card-title" use:reveal>
				Je hoeft niet te weten of dit de juiste behandeling voor je is.
			</h2>
			<p class="service__card-lead" use:reveal>Dat zoeken we in het eerste gesprek samen uit.</p>
			<div class="service__card-cta" use:reveal>
				<ButtonLink label="Plan een kennismaking" href="/contact" />
			</div>
		</div>
		<p class="service__note" use:reveal>{BRAND.disclaimer}</p>
	</section>
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
		/* Below the side-by-side layout the drawing has the column's full width:
		   a wide one (BRTT Body's lying figure, 2.4:1) would otherwise run past it
		   at the slot's full height. Width first, height from the ratio. */
		@media (max-width: 1099.98px) {
			height: auto;
			width: min(100%, calc(var(--phead-visual-h, 14rem) * var(--art-ratio)));
		}
		/* Beside the text the slot's width is its content's, so no percentage
		   here: a wide drawing is capped in rem instead and keeps its ratio. */
		@media (min-width: 1100px) {
			height: auto;
			width: min(calc(var(--phead-visual-h, 16rem) * var(--art-ratio)), 30rem);
		}
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
		margin: 0 auto;
		max-width: 46rem;
		font-family: var(--font-body);
		/* Lead size from the desktop breakpoint up; on a phone the intro at that size
		   ran to 298px, over the third-of-the-viewport band the reveal keeps to. */
		font-size: var(--fs-body);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	/* ─── The quiet band ─── */
	.service__band {
		--band: var(--color-fg-forest);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		padding-block: var(--section-pad);
		text-align: center;
		background: var(--band);
		box-shadow: 0 0 0 100vmax var(--band);
		clip-path: inset(0 -100vmax);
		color: var(--color-bg-sand);
	}

	.service__band-line {
		margin: 0;
		max-width: 24ch;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-tight);
		text-wrap: balance;
	}

	/* The site's button, turned for a dark ground: pill and ring in sand with
	   forest ink, the same swap the modal makes on its green. ButtonLink itself
	   is untouched; the extra class in front is specificity against its own
	   hover rule. */
	.service__band .service__band-cta :global(.btn-host),
	.service__band .service__band-cta :global(.btn-pill),
	.service__close .service__card-cta :global(.btn-host),
	.service__close .service__card-cta :global(.btn-pill) {
		--btn-fill: var(--color-bg-sand);
		--btn-ink: var(--color-fg-forest);
	}

	.service__band .service__band-cta :global(.btn-link__circle),
	.service__close .service__card-cta :global(.btn-link__circle) {
		background: var(--btn-fill);
		color: var(--btn-ink);
	}

	.service__band .service__band-cta :global(.btn-link:focus-visible .btn-link__circle),
	.service__close .service__card-cta :global(.btn-link:focus-visible .btn-link__circle) {
		background: var(--btn-ink);
		color: var(--btn-fill);
	}

	@media (hover: hover) and (pointer: fine) {
		.service__band .service__band-cta :global(.btn-link:hover .btn-link__circle),
		.service__close .service__card-cta :global(.btn-link:hover .btn-link__circle) {
			background: var(--btn-ink);
			color: var(--btn-fill);
		}
	}

	/* The rule the next section draws on top would sit on the band's edge. */
	.service__band + :global(.psec) {
		border-top: 0;
	}

	/* ─── How a session goes: steps along a line that draws itself ─── */
	.steps {
		list-style: none;
		margin: 0 auto;
		padding: 0;
		max-width: 46rem;
		display: flex;
		flex-direction: column;
	}

	.steps__node {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		border: 1.5px solid var(--brand-border);
		background: var(--color-bg-sand);
	}

	.steps__line {
		display: block;
		width: 2.5rem;
		height: 6rem;
		margin-top: var(--space-2);
		overflow: visible;
	}

	.steps__line path {
		fill: none;
		stroke: var(--color-brand-green);
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
	}

	.steps__text {
		margin: 0;
		max-width: 26ch;
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		text-wrap: balance;
	}

	/* Phone: everything on the centre line, node, sentence, then the line
	   down to the next one. The rail holds node and line in the markup, so it
	   steps aside (display: contents) and the grid places all three. */
	.steps__item {
		display: grid;
		grid-template-areas: 'node' 'text' 'line';
		justify-items: center;
		gap: var(--space-3);
	}

	.steps__rail {
		display: contents;
	}

	.steps__node {
		grid-area: node;
	}

	.steps__line {
		grid-area: line;
	}

	.steps__text {
		grid-area: text;
	}

	.steps__after {
		margin: var(--space-8) auto 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	/* Desktop: the line runs down the middle and the sentences sit either
	   side of it in turn, right, left, right. */
	@media (min-width: 900px) {
		.steps__item {
			grid-template-columns: minmax(0, 1fr) 4rem minmax(0, 1fr);
			/* The sentence spans both rows, so the line starts right under its
			   node and runs on to the next one instead of waiting for the text. */
			grid-template-areas: '. node text' '. line text';
			align-items: start;
			justify-items: stretch;
			column-gap: var(--space-6);
			row-gap: 0;
		}

		.steps__item--left {
			grid-template-areas: 'text node .' 'text line .';
		}

		.steps__node,
		.steps__line {
			justify-self: center;
		}

		.steps__node {
			margin-top: 0.75rem;
		}

		.steps__text {
			text-align: left;
		}

		.steps__item--left .steps__text {
			justify-self: end;
			text-align: right;
		}

		.steps__line {
			height: 7.5rem;
			margin-top: 0;
		}

		.steps__text {
			max-width: 30ch;
		}
	}

	/* Drawn by scrolling where the browser can tie an animation to the scroll
	   position; everywhere else, and under reduced motion, simply drawn. */
	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.steps__line path {
				animation: steps-draw linear both;
				animation-timeline: view();
				animation-range: entry 40% cover 55%;
			}
		}
	}

	@keyframes steps-draw {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	/* ─── What it can help with ─── */
	.service__chips {
		list-style: none;
		margin: 0 auto;
		padding: 0;
		max-width: 46rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-3);
	}

	.service__chips li {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-fg-forest);
	}

	/* ─── Other treatments (unchanged) ─── */
	.service__others {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	@media (min-width: 700px) {
		.service__others {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.service__body {
			font-size: var(--fs-body-lg);
		}

		.service__others {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	/* ─── The closing card ─── */
	.service__close {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding-top: var(--block-gap);
	}

	.service__card {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
		padding: clamp(2.5rem, 6vw, 4.5rem) var(--space-6);
		border-radius: var(--radius-lg);
		background: var(--color-brand-green);
		color: var(--color-bg-sand);
		text-align: center;
	}

	.service__card-title {
		margin: 0;
		max-width: 22ch;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		text-wrap: balance;
	}

	.service__card-lead {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-normal);
	}

	.service__card-cta {
		margin-top: var(--space-2);
	}

	.service__note {
		margin: 0;
		max-width: 60ch;
		text-align: center;
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}
</style>
