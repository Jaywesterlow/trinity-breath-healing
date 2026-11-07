<script lang="ts">
	/**
	 * The long text of /diensten/clearing-ascensie, her words (WhatsApp 2026-10-31,
	 * 20:28). One change, approved by Jaymar: "Wat ontstaat is" became "Wat kan
	 * ontstaan" with "Dit verschilt per persoon." after the list, because the text
	 * names symptoms and a result stated as certain is a claim the Reclame Code
	 * asks evidence for (checklist §4.1).
	 */
	import { PageSection } from '$lib/components/page';
	import Quote from '$lib/components/ui/Quote.svelte';

	const FEELS = [
		'onrust in je hoofd',
		'vermoeidheid zonder duidelijke oorzaak',
		'terugkerende gedachten of zorgen',
		'moeite met loslaten',
		'lichamelijke spanning',
		'het gevoel “niet helemaal jezelf” te zijn'
	];
	const RESULTS = [
		'meer rust in het hoofd',
		'zachtheid in het lichaam',
		'helderheid',
		'emotionele ruimte',
		'terugkeer naar jouw eigen energie'
	];
	const SUPPORTS = [
		'meer in verbinding te komen met je hart en intuïtie',
		'oude energie en beperkende overtuigingen los te laten',
		'meer balans te ervaren tussen lichaam, geest en ziel',
		'je bewustzijn verder te ontwikkelen',
		'je eigen innerlijke kracht en essentie te herinneren'
	];
</script>

<PageSection id="clearing" eyebrow="Eerste stap" title="Clearing">
	<div class="long">
		<p>Energetische opschoning van lichaam, energieveld en onderbewuste lagen.</p>
		<p>
			Tijdens een clearing werk ik op diep energetisch niveau. We reinigen wat zich in jouw systeem
			heeft vastgezet — dit kunnen oude emoties zijn, onbewuste patronen, energetische verbindingen,
			stresslagen of overgenomen energie van anderen. Veel mensen dragen ongemerkt spanning met zich
			mee.
		</p>
		<p>Soms voel je dit als:</p>
		<ul>
			{#each FEELS as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
		<p>
			Tijdens de clearing wordt jouw energieveld als het ware opgeschoond. Oude lagen mogen
			loskomen, zonder dat je alles opnieuw hoeft te doorleven.
		</p>
		<p>Wat kan ontstaan:</p>
		<ul>
			{#each RESULTS as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
		<p>Dit verschilt per persoon.</p>
		<p>
			Een clearing werkt diep door in de dagen erna. Het lichaam kan ontladen (bijvoorbeeld via
			warmte, kou, vermoeidheid, dromen of emoties). Dit is een natuurlijk integratieproces.
		</p>
		<p>De intentie is altijd: terug naar jouw essentie.</p>
	</div>
</PageSection>

<PageSection id="ascensie" eyebrow="Daarna" title="Ascensie-activatie van de chakra's">
	<div class="long">
		<p>
			Een ascensie-activatie is een energetische behandeling waarbij de chakra's worden uitgenodigd
			om weer in balans te komen en zich verder te openen voor hun natuurlijke stroom van
			levensenergie.
		</p>
		<p>
			Tijdens de sessie werk ik met hoge frequentie-energie om blokkades, oude patronen en
			opgeslagen spanning zachtjes los te laten. Hierdoor kan er meer ruimte ontstaan voor rust,
			helderheid, intuïtie en verbinding met jezelf.
		</p>
		<p>
			Iedereen ervaart een ascensie-activatie anders. Sommigen voelen warmte, tintelingen, emoties
			die vrijkomen, diepe ontspanning of juist een gevoel van lichtheid en verruiming. Er is geen
			goed of fout; het lichaam en het energiesysteem ontvangen precies wat op dat moment passend
			is.
		</p>
		<p>De activatie ondersteunt je om:</p>
		<ul>
			{#each SUPPORTS as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
		<p>
			Je hoeft hier niets voor te doen. Je mag ontspannen liggen en ontvangen. De energie werkt op
			een diep niveau door, ook na de sessie. Daarom is het fijn om na afloop voldoende water te
			drinken en ruimte te nemen voor rust en integratie.
		</p>
	</div>
</PageSection>

<Quote
	text="Ascensie betekent voor mij het verhogen van je bewustzijn en frequentie, zodat je meer vanuit liefde, vertrouwen en authenticiteit kunt leven. Je blijft met beide voeten op de grond, maar komt dichter bij je ware essentie."
	author="Brigitte"
/>

<style>
	.long p,
	.long ul {
		margin: 0 0 var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.long ul {
		padding-left: 1.25rem;
		list-style: disc;
	}

	.long p:last-child {
		margin-bottom: 0;
	}

	@media (min-width: 1100px) {
		.long p,
		.long ul {
			font-size: var(--fs-body-lg);
		}
	}
</style>
