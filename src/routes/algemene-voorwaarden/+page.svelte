<script lang="ts">
	/**
	 * Algemene voorwaarden.
	 *
	 * Scoped to how this practice actually works — een kennismaking van 30
	 * minuten, losse sessies, één behandelaar, geen vergoeding via de
	 * zorgverzekeraar — in plaats van een generiek model dat over personeel,
	 * levering en garantie praat.
	 *
	 * De bedragen en termijnen die de praktijk zelf bepaalt (tarief,
	 * annuleringstermijn) staan als <Todo> gemarkeerd: een voorwaarde met een
	 * verzonnen bedrag erin is erger dan een zichtbaar open plek.
	 */
	import { LegalDoc, Todo } from '$lib/components/ui';
	import { BRAND } from '$lib/constants/brand';
	import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDoc
	title="Algemene voorwaarden"
	lead="De afspraken die gelden zodra je een sessie boekt. Kort gehouden, in gewone taal, zodat je ze ook echt kunt lezen."
	lastUpdated={LEGAL_LAST_UPDATED}
	crumbs={data.crumbs}
>
	<h2>Artikel 1 — Definities</h2>
	<dl>
		<dt>Praktijk</dt>
		<dd>
			{BRAND.legalName}, gevestigd te {BRAND.registeredAddress.street},
			{BRAND.registeredAddress.postalCode}
			{BRAND.registeredAddress.city}, ingeschreven bij de Kamer van Koophandel onder nummer
			{BRAND.kvk}, btw-identificatienummer {BRAND.vatId}, vertegenwoordigd door
			{BRAND.practitionerFullName}.
			<!-- The sentence below is not decoration. This is the registered
			     address of the business, a building she owns and rents out; the
			     people living there have nothing to do with the practice. It is
			     published because art. 3:15d BW requires an establishment
			     address, and it appears on this page only. Anyone reading it as
			     "where the treatments are" and turning up is knocking on a
			     stranger's door. -->
			<br /><span class="legal-note"
				>Dit is het inschrijvingsadres van de onderneming, geen bezoekadres: er worden hier geen
				behandelingen gegeven en je kunt er niet terecht. Behandelingen vinden bij jou thuis plaats,
				op afspraak op de praktijk, of op afstand.</span
			>
		</dd>
		<dt>Cliënt</dt>
		<dd>De persoon die een sessie of behandeling afneemt of daarvoor een afspraak maakt.</dd>
		<dt>Sessie</dt>
		<dd>
			Een afspraak voor ademwerk, lichaamswerk of een energetische behandeling, inclusief een
			vrijblijvende kennismaking.
		</dd>
	</dl>

	<h2>Artikel 2 — Toepasselijkheid</h2>
	<p>
		Deze voorwaarden gelden voor iedere afspraak, sessie en behandeling van de praktijk, en voor elk
		aanbod dat daaraan voorafgaat. Afwijkingen gelden alleen wanneer ze vooraf schriftelijk zijn
		vastgelegd. Door een afspraak te maken geef je aan deze voorwaarden en het
		<a href="/disclaimer">medisch voorbehoud</a> te hebben gelezen en te aanvaarden.
	</p>

	<h2>Artikel 3 — Hoe een afspraak tot stand komt</h2>
	<p>
		Een afspraak komt tot stand op het moment dat de praktijk jouw aanvraag per e-mail bevestigt.
		Een aanvraag via de website is dus nog geen afspraak; de bevestiging is dat wel.
	</p>
	<p>
		Een kennismakingsgesprek van 30 minuten is vrijblijvend en kosteloos, en verplicht je tot niets.
	</p>

	<h2>Artikel 4 — Tarieven en betaling</h2>
	<p>
		Het tarief voor een sessie bedraagt <Todo>tarief per sessie</Todo>. Tarieven worden vóór de
		afspraak kenbaar gemaakt; het tarief dat bij de bevestiging is genoemd, is het tarief dat geldt.
	</p>
	<p>
		Betaling vindt plaats <Todo>betaalmoment en -wijze</Todo>. De praktijk is
		<Todo>wel/niet</Todo> btw-plichtig. Bij een factuur geldt een betaaltermijn van 14 dagen.
	</p>
	<p>
		Sessies worden niet vergoed door de zorgverzekeraar, tenzij dit uitdrukkelijk anders met je is
		besproken. Ga hier niet vanuit zonder het bij je verzekeraar na te vragen.
	</p>

	<h2>Artikel 5 — Verzetten en annuleren</h2>
	<p>
		Kun je niet komen, laat het dan zo snel mogelijk weten. Tot
		<Todo>annuleringstermijn, bijv. 24 uur</Todo> voor de afspraak kun je kosteloos verzetten of annuleren.
	</p>
	<p>
		Bij annulering binnen die termijn, of wanneer je zonder bericht niet verschijnt, brengt de
		praktijk <Todo>percentage of bedrag</Todo> van het tarief in rekening. De gereserveerde tijd kan dan
		immers niet meer aan iemand anders worden gegeven.
	</p>
	<p>
		Moet de praktijk zelf een afspraak afzeggen, dan wordt in overleg een nieuwe datum gepland en
		zijn daar geen kosten aan verbonden. Al betaalde bedragen worden terugbetaald als er geen nieuwe
		afspraak komt.
	</p>

	<h2>Artikel 6 — Wat ik van jou verwacht</h2>
	<ul>
		<li>
			Dat je vóór de eerste sessie eerlijk vertelt wat er speelt: klachten, medicijngebruik,
			zwangerschap, een recente operatie of ingrijpende gebeurtenis, en of je onder behandeling bent
			van een arts of therapeut. Zonder die informatie kan ik niet inschatten of een sessie veilig
			voor je is.
		</li>
		<li>
			Dat je het meteen zegt als er tijdens een sessie iets verandert in wat je voelt. Er is niets
			dat je moet doorstaan.
		</li>
		<li>Dat je op tijd komt. Tijd die verloren gaat, kan niet aan het einde worden aangeplakt.</li>
	</ul>

	<h2>Artikel 7 — Geen medische behandeling</h2>
	<p>{BRAND.disclaimer}</p>
	<p>
		De praktijk stelt geen diagnose, schrijft geen medicatie voor en adviseert je nooit om met
		voorgeschreven medicatie te stoppen of een medische behandeling af te breken. Wat een sessie wel
		en niet is, staat uitgebreider beschreven op de <a href="/disclaimer">disclaimerpagina</a>.
	</p>

	<h2>Artikel 8 — Aansprakelijkheid</h2>
	<p>
		Je neemt op eigen initiatief en eigen verantwoordelijkheid deel aan een sessie. De praktijk is
		niet aansprakelijk voor schade die voortkomt uit het achterhouden of onjuist opgeven van
		informatie over je gezondheid.
	</p>
	<p>
		De aansprakelijkheid van de praktijk is in alle gevallen beperkt tot het bedrag dat de
		aansprakelijkheidsverzekering in het betreffende geval uitkeert. Keert die niet uit, dan is de
		aansprakelijkheid beperkt tot het bedrag dat voor de betreffende sessie in rekening is gebracht.
		De praktijk is nooit aansprakelijk voor indirecte schade, zoals gederfde inkomsten.
	</p>
	<p>
		De praktijk is niet aansprakelijk voor verlies of beschadiging van je eigendommen in of rond de
		praktijkruimte.
	</p>

	<h2>Artikel 9 — Vertrouwelijkheid en privacy</h2>
	<p>
		Alles wat je tijdens een sessie vertelt, blijft tussen ons. Er wordt niets met derden gedeeld
		zonder jouw schriftelijke toestemming, tenzij de wet daartoe verplicht. Hoe je gegevens verwerkt
		en bewaard worden, staat in de
		<a href="/privacyverklaring">privacyverklaring</a>.
	</p>

	<h2>Artikel 10 — Klachten</h2>
	<p>
		Ben je ergens niet tevreden over, zeg het dan alsjeblieft — het liefst rechtstreeks, via
		<a href="mailto:{BRAND.email}">{BRAND.email}</a>. Ik reageer binnen 14 dagen en zoek samen met
		je naar een oplossing. Komen we er onderling niet uit, dan kun je je wenden tot
		<Todo>klachtenregeling of beroepsvereniging</Todo>.
	</p>

	<h2>Artikel 11 — Toepasselijk recht</h2>
	<p>
		Op alle afspraken met de praktijk is Nederlands recht van toepassing. Geschillen worden
		voorgelegd aan de bevoegde rechter in het arrondissement waar de praktijk is gevestigd.
	</p>
</LegalDoc>

<style>
	/* Quieter than the definition it qualifies, but never hidden: the whole
	   point of the line is that someone skimming for an address reads it. */
	.legal-note {
		display: inline-block;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.55;
		opacity: 0.85;
	}
</style>
