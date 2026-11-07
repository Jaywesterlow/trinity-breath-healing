<script lang="ts">
	/**
	 * /tarieven — her text, WhatsApp 2026-10-31, 20:24. Real tables, because a
	 * price next to a treatment and a duration is what a crawler lifts from a page.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead, PageSection, CtaBand } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';
	import { PRICE_GROUPS } from '$lib/content/tarieven';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const nameOf = (slug: string) => BRAND.services.find((s) => s.slug === slug)?.name ?? slug;
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		eyebrow="Tarieven"
		lead="Alle behandelingen, hun duur en hun tarief op een rij. De tarieven zijn inclusief btw."
	>
		Tarieven en behandelingen
	</PageHead>

	{#each PRICE_GROUPS as group (group.id)}
		<PageSection id={group.id} title={group.title}>
			<table class="prices">
				<thead>
					<tr>
						<th scope="col">Behandeling</th>
						<th scope="col">Duur</th>
						<th scope="col">Tarief</th>
					</tr>
				</thead>
				<tbody>
					{#each group.rows as row (row.label ?? row.slug)}
						<tr>
							<th scope="row">
								<a class="link-underline" href="/diensten/{row.slug}">
									{row.label ?? nameOf(row.slug)}
								</a>
							</th>
							<td>{row.duration}</td>
							<td>€{row.price}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if group.note}
				<p class="tarieven__body" use:reveal>{group.note}</p>
			{/if}
			{#if group.id === 'clearing'}
				<div class="tarieven__stack" use:reveal>
					<p class="tarieven__body">
						Het complete traject bestaat uit een Clearing, gevolgd door twee activaties.
					</p>
					<p class="tarieven__body">
						De Clearing vormt altijd de eerste stap. De sessies kunnen afzonderlijk worden geboekt
						of als compleet traject worden afgenomen.
					</p>
					<p class="tarieven__body">
						Het volledige traject kan op één dag plaatsvinden of worden verdeeld over meerdere
						afspraken.
					</p>
					<p class="tarieven__body">
						Bij het boeken van het complete traject ontvang je €30 voordeel ten opzichte van drie
						losse sessies.
					</p>
				</div>
			{/if}
		</PageSection>
	{/each}

	<PageSection id="aan-huis" title="Behandelingen aan huis">
		<div class="tarieven__stack" use:reveal>
			<p class="tarieven__body">
				Naast behandelingen in de praktijkruimte zijn ook sessies aan huis mogelijk.
			</p>
			<p class="tarieven__body">
				Hiervoor worden reiskosten van €0,35 per gereden kilometer berekend, inclusief de heen- en
				terugreis.
			</p>
			<p class="tarieven__body">De totale kosten worden vooraf afgestemd.</p>
		</div>
	</PageSection>

	<PageSection id="btw" title="Btw">
		<p class="tarieven__body" use:reveal>
			De genoemde tarieven zijn consumentenprijzen inclusief btw, uitgaande van het reguliere
			btw-tarief van 21%.
		</p>
	</PageSection>

	<CtaBand
		id="kennismaken"
		title="Vrijblijvende kennismaking"
		lead="Een kennismakingsgesprek van 30 minuten is kosteloos en vrijblijvend. Tijdens dit gesprek bespreken we jouw wensen en kijken we samen welke behandeling bij jou past."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>
</PageShell>

<style>
	.prices {
		width: 100%;
		table-layout: fixed; /* the same columns in all three tables */
		border-collapse: collapse;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-fg-forest);
	}

	.prices th,
	.prices td {
		padding: var(--space-3) 0;
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border) 20%, transparent);
		font-weight: var(--font-weight-light);
		text-align: left;
		vertical-align: top;
	}

	.prices thead th {
		font-size: var(--fs-body-sm);
		color: var(--color-text-subtle);
	}

	.prices thead th:nth-child(2) {
		width: 9rem;
	}

	.prices thead th:nth-child(3) {
		width: 3.5rem;
	}

	.prices td,
	.prices thead th + th {
		padding-left: var(--space-4);
		white-space: nowrap;
	}

	.prices td:last-child,
	.prices thead th:last-child {
		text-align: right;
	}

	.prices + .tarieven__body,
	.prices + .tarieven__stack {
		margin-top: var(--space-5);
	}

	.tarieven__body {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.tarieven__stack {
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 1100px) {
		.prices,
		.tarieven__body {
			font-size: var(--fs-body-lg);
		}
	}
</style>
