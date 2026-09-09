<script lang="ts">
	/**
	 * /behandelingen — the same seven treatments, reached from the other end.
	 *
	 * /diensten lists them by name. This page lists what people actually arrive
	 * with and routes each complaint to the treatments that address it, because
	 * "ik slaap al maanden slecht" is how the question gets asked, both to a
	 * person and to a search box. Content comes from `$lib/content/klachten`,
	 * which is built from the practitioner's own helpsWith lists — see the note
	 * at the top of that file.
	 *
	 * The two pages are linked to each other rather than competing: this one ends
	 * by pointing at /diensten, and every group links into the individual pages.
	 */
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { BRAND } from '$lib/constants/brand';
	import { KLACHTEN } from '$lib/content/klachten';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const nameOf = (slug: string) => BRAND.services.find((s) => s.slug === slug)?.name ?? slug;
</script>

<Breadcrumbs items={data.crumbs} />

<article class="klachten">
	<header class="klachten__head">
		<PageTitle>Waar kom je mee?</PageTitle>
		<p class="klachten__lead" use:reveal>
			De meeste mensen komen niet binnen met de naam van een behandeling, maar met een klacht.
			Hieronder staat waar mensen mee komen en welke behandelingen daarbij horen. Je hoeft zelf niet
			te kiezen.
		</p>
	</header>

	<ul class="klachten__list">
		{#each KLACHTEN as klacht (klacht.id)}
			<li class="klacht" id={klacht.id} use:reveal>
				<h2 class="klacht__title">{klacht.title}</h2>
				<p class="klacht__body">{klacht.body}</p>
				<ul class="klacht__services">
					{#each klacht.services as slug (slug)}
						<li>
							<a class="chip" href="/diensten/{slug}">{nameOf(slug)}</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>

	<section class="klachten__cta" aria-labelledby="verder">
		<h2 id="verder" class="klachten__h2" use:reveal>Staat jouw klacht er niet bij?</h2>
		<p class="klachten__body" use:reveal>
			Dat komt vaker voor dan je denkt, en het betekent niet dat er niets te doen is. In een
			kennismaking van dertig minuten kijken we samen wat er speelt.
		</p>
		<div class="klachten__buttons" use:reveal>
			<ButtonLink label="Plan een kennismaking" href="/contact" />
		</div>
		<p class="klachten__alt" use:reveal>
			Liever eerst lezen wat elke behandeling precies is?
			<a href="/diensten">Bekijk alle diensten op naam</a>.
		</p>
		<p class="klachten__note" use:reveal>{BRAND.disclaimer}</p>
	</section>
</article>

<style>
	/* Every page sits in the same box as the landing page's sections and the
	   footer below it, so a heading never starts 256px to the right of the logo
	   directly underneath it. The gutter is added to the max-width rather than
	   taken out of it (box-sizing is border-box), so the content box is exactly
	   --container-max. Reading measure is restored on the children, not by
	   narrowing the box — otherwise the whole page slides right again. */
	.klachten {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem var(--space-16);
	}

	/* Reading measure. Direct children only, so a section can opt out by
	   nesting if it ever needs the full container. */
	.klachten > * {
		max-width: var(--content-max-width);
	}

	.klachten__head {
		margin-bottom: var(--space-10);
	}

	.klachten__lead {
		margin-top: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.klachten__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	/* scroll-margin-top, because every group is an anchor target and the nav is
	   fixed — without it a linked group lands underneath the header. */
	.klacht {
		scroll-margin-top: calc(var(--nav-height) + var(--space-6));
	}

	.klacht__title {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-3);
	}

	.klacht__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.klacht__services {
		list-style: none;
		margin: var(--space-4) 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem; /* 36px — comfortably over the 24px target minimum */
		padding: 0 var(--space-4);
		border: 1px solid color-mix(in srgb, var(--brand-border) 40%, transparent);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		color: var(--color-fg-forest);
		text-decoration: none;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.chip:hover {
			background: var(--brand-border);
			border-color: var(--brand-border);
			color: var(--color-bg-sand);
		}
	}

	.chip:focus-visible {
		background: var(--brand-border);
		border-color: var(--brand-border);
		color: var(--color-bg-sand);
	}

	.klachten__cta {
		margin-top: var(--space-16);
	}

	.klachten__h2 {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-4);
	}

	.klachten__body,
	.klachten__alt {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.klachten__buttons {
		margin-top: var(--space-6);
	}

	.klachten__alt {
		margin-top: var(--space-6);
	}

	.klachten__alt a {
		color: var(--color-fg-forest);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (hover: hover) and (pointer: fine) {
		.klachten__alt a:hover {
			text-decoration: none;
		}
	}

	.klachten__note {
		margin-top: var(--space-8);
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}
</style>
