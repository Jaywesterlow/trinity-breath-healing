<script lang="ts">
	/**
	 * Medisch voorbehoud.
	 *
	 * De contra-indicaties zijn de reden dat deze pagina meer is dan een
	 * juridische formaliteit: ze horen vindbaar te zijn vóór iemand boekt in
	 * plaats van pas in de intake. Ze verschillen per behandeling en komen van de
	 * behandelaar zelf, zie $lib/content/contra-indicaties.
	 */
	import { LegalDoc } from '$lib/components/ui';
	import { BRAND } from '$lib/constants/brand';
	import { CONTRA_GROUPS } from '$lib/content/contra-indicaties';
	import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDoc
	title="Disclaimer"
	lead="Wat een sessie bij mij wel is, en wat het uitdrukkelijk niet is. Lees dit even, ook als je haast hebt."
	lastUpdated={LEGAL_LAST_UPDATED}
	crumbs={data.crumbs}
>
	<h2>Geen medische zorg</h2>
	<p>{BRAND.disclaimer}</p>
	<p>
		Ik ben geen arts en geen psycholoog. Ik stel geen diagnose, schrijf geen medicijnen voor en
		behandel geen ziektes. Wat ik doe is met je lichaam en je adem werken, zodat spanning die
		vastzit los kan komen. Dat kan veel doen, maar het is iets anders dan medische of psychiatrische
		zorg, en het komt daar ook niet voor in de plaats.
	</p>

	<h2>Ga altijd eerst naar je huisarts</h2>
	<p>
		Heb je lichamelijke klachten, laat die dan eerst door je huisarts beoordelen. Een klacht die
		energetisch aanvoelt kan een medische oorzaak hebben, en die wil je niet missen omdat je met
		ademwerk begonnen bent.
	</p>
	<p>
		<strong>
			Stop nooit met voorgeschreven medicatie en breek nooit een lopende medische of psychologische
			behandeling af vanwege een sessie bij mij.
		</strong>
		Wil je daar iets in veranderen, bespreek dat dan met de arts of behandelaar die het heeft voorgeschreven.
	</p>

	<h2>Wanneer eerst overleggen</h2>
	<p>
		Niet elke behandeling past bij iedereen, en wat geldt verschilt per behandeling. Meld het daarom
		altijd vooraf wanneer een van deze dingen op je van toepassing is.
	</p>
	{#each CONTRA_GROUPS as group (group.id)}
		<h3>{group.title}</h3>
		{#if group.treatments !== group.title}
			<p>Dit geldt voor {group.treatments}.</p>
		{/if}
		<p>{group.intro}</p>
		{#if group.items}
			<ul>
				{#each group.items as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		{/if}
		{#if group.prep}
			<p>{group.prepTitle}:</p>
			<ul>
				{#each group.prep as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		{/if}
		{#if group.outro}
			<p>{group.outro}</p>
		{/if}
	{/each}
	<h3>Cranio &amp; Fascia Unwinding en BRTT Body</h3>
	<p>Voor deze behandelingen bespreken we tijdens de kennismaking wat voor jou verantwoord is.</p>

	<h2>Wat je van een sessie kunt verwachten</h2>
	<p>
		Er komen tijdens en na een sessie emoties, herinneringen of lichamelijke reacties los. Dat hoort
		erbij, maar het kan de dagen erna nog nawerken. Plan na een intensieve sessie daarom geen
		veeleisende afspraken en zorg dat je rust hebt.
	</p>
	<p>
		Hoe iemand op een behandeling reageert verschilt per persoon en per keer. Ervaringen van
		anderen, en de klachten die op deze site bij een behandeling genoemd worden, zijn een
		beschrijving van waar die vorm van werken zich op richt — geen belofte, geen garantie en geen
		voorspelling van jouw resultaat.
	</p>

	<h2>Bel 112 bij nood</h2>
	<p>
		Deze website is niet bedoeld voor spoedeisende situaties. Is er acuut gevaar, bel dan 112. Zit
		je in een crisis of heb je gedachten aan zelfdoding, bel dan je huisarts, de huisartsenpost, of
		<a href="https://www.113.nl" rel="noopener">113 Zelfmoordpreventie</a> via 0800-0113. Dat is daar
		gratis en dag en nacht bereikbaar.
	</p>

	<h2>Over de informatie op deze site</h2>
	<p>
		De teksten op deze website zijn algemeen van aard en met zorg opgesteld, maar ze zijn niet
		toegesneden op jouw situatie. Er kunnen geen rechten aan worden ontleend. Ik doe mijn best de
		informatie actueel te houden; de datum bovenaan deze pagina laat zien wanneer deze tekst voor
		het laatst is bijgewerkt.
	</p>
	<p>
		Waar deze site naar andere websites verwijst, is dat ter informatie. Over de inhoud van die
		websites heb ik geen zeggenschap en daarvoor draag ik geen verantwoordelijkheid.
	</p>

	<h2>Vragen</h2>
	<p>
		Twijfel je of een sessie iets voor je is, stel die vraag dan gerust vóórdat je boekt, via
		<a href="mailto:{BRAND.email}">{BRAND.email}</a>. Een kennismaking van 30 minuten is er precies
		voor om dit soort dingen uit te zoeken en verplicht je tot niets.
	</p>
</LegalDoc>
