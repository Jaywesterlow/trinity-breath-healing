<script lang="ts">
	/**
	 * Privacyverklaring.
	 *
	 * Written against the AVG (GDPR) as it applies to this practice specifically,
	 * not from a generic template: the form collects klachten — health data —
	 * which is a bijzonder persoonsgegeven under Art. 9, so the lawful basis is
	 * uitdrukkelijke toestemming and it has to be named as such. A template that
	 * only mentions "naam en e-mailadres" would understate what actually happens
	 * here.
	 *
	 * Everything the practitioner still has to supply is marked with <Todo>, in
	 * red, rather than guessed at.
	 */
	import { LegalDoc, Todo } from '$lib/components/ui';
	import { BRAND } from '$lib/constants/brand';
	import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDoc
	title="Privacyverklaring"
	lead="Je vertrouwt me met gevoelige informatie. Hieronder staat precies welke gegevens ik verwerk, waarom, hoe lang ik ze bewaar en wat je rechten zijn."
	lastUpdated={LEGAL_LAST_UPDATED}
	crumbs={data.crumbs}
>
	<h2>1. Wie is verantwoordelijk voor jouw gegevens?</h2>
	<p>
		De verwerkingsverantwoordelijke is {BRAND.legalName}, ingeschreven bij de Kamer van Koophandel
		onder nummer {BRAND.kvk}. De praktijk wordt gevoerd door {BRAND.practitionerFullName}. Je
		bereikt mij op <a href="mailto:{BRAND.email}">{BRAND.email}</a> en op
		{BRAND.phoneDisplay}; het inschrijvingsadres van de onderneming staat in de
		<a href="/algemene-voorwaarden">algemene voorwaarden</a>.
	</p>
	<p>
		Heb je een vraag over je gegevens? Mail dan naar
		<a href="mailto:{BRAND.email}">{BRAND.email}</a>. Ik beantwoord privacyvragen zelf; er is geen
		aparte functionaris voor gegevensbescherming, omdat de praktijk daar niet toe verplicht is.
	</p>

	<h2>2. Welke gegevens verwerk ik?</h2>

	<h3>Contactformulier</h3>
	<p>
		Wanneer je het contactformulier invult, verwerk ik je naam, e-mailadres, het telefoonnummer dat
		je eventueel achterlaat, en de inhoud van je bericht.
	</p>

	<h3>Het plannen van een kennismaking</h3>
	<p>
		Bij het plannen van een afspraak verwerk ik je naam, e-mailadres, de gekozen datum en tijd, en
		de klachten of hulpvraag die je zelf omschrijft.
	</p>

	<h3>Tijdens en na een behandeling</h3>
	<p>
		Voor een behandeling heb ik gegevens over je gezondheid nodig: je klachten, relevante medische
		voorgeschiedenis, medicijngebruik en hoe je op eerdere sessies hebt gereageerd. Ik leg hiervan
		beknopte aantekeningen vast, zodat een vervolgsessie op de vorige kan aansluiten.
	</p>

	<h3>Websitebezoek</h3>
	<p>
		Deze website plaatst geen cookies en gebruikt geen trackers die jou als persoon herkennen. Om te
		zien welke pagina's bezocht worden gebruik ik Plausible Analytics: dat meet zonder cookies en
		zonder een individueel bezoekersprofiel op te bouwen. Daarom vind je op deze site ook geen
		cookiebanner.
	</p>

	<h2>3. Gegevens over je gezondheid</h2>
	<p>
		Klachten, medicijngebruik en alles wat je me over je lichaam of je geschiedenis vertelt, zijn
		<strong>bijzondere persoonsgegevens</strong> in de zin van artikel 9 AVG. Daar geldt een strenger
		regime voor, en dat neem ik serieus:
	</p>
	<ul>
		<li>
			Ik verwerk ze uitsluitend op basis van jouw <strong>uitdrukkelijke toestemming</strong>, die
			je geeft door ze aan mij te verstrekken en die je op elk moment weer kunt intrekken.
		</li>
		<li>Ik deel ze niet met derden, tenzij jij daar zelf schriftelijk om vraagt.</li>
		<li>
			Ik bewaar ze gescheiden van gewone contactgegevens en niet langer dan nodig is (zie punt 6).
		</li>
	</ul>
	<p>
		Vul in het formulier alleen in wat je op dat moment kwijt wilt. De rest bespreken we liever
		persoonlijk dan per e-mail.
	</p>

	<h2>4. Waarom verwerk ik ze, en op welke grondslag?</h2>
	<div class="legal-table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">Doel</th>
					<th scope="col">Gegevens</th>
					<th scope="col">Grondslag (AVG)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Reageren op je bericht</td>
					<td>Naam, e-mail, telefoon, bericht</td>
					<td>Toestemming (art. 6 lid 1 sub a)</td>
				</tr>
				<tr>
					<td>Een afspraak inplannen en bevestigen</td>
					<td>Naam, e-mail, datum en tijd</td>
					<td>Uitvoering van de overeenkomst (art. 6 lid 1 sub b)</td>
				</tr>
				<tr>
					<td>Een behandeling veilig en passend uitvoeren</td>
					<td>Gezondheidsgegevens, aantekeningen</td>
					<td>Uitdrukkelijke toestemming (art. 9 lid 2 sub a)</td>
				</tr>
				<tr>
					<td>Facturatie en administratie</td>
					<td>Naam, adres, factuurgegevens</td>
					<td>Wettelijke verplichting (art. 6 lid 1 sub c)</td>
				</tr>
				<tr>
					<td>De website verbeteren</td>
					<td>Geaggregeerde bezoekstatistieken</td>
					<td>Gerechtvaardigd belang (art. 6 lid 1 sub f)</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>5. Wie krijgt jouw gegevens nog meer te zien?</h2>
	<p>
		Ik verkoop je gegevens niet en gebruik ze niet voor reclame. Voor het draaien van de website en
		het versturen van e-mail schakel ik een klein aantal dienstverleners in. Met elk van hen is een
		verwerkersovereenkomst gesloten, en ze verwerken je gegevens uitsluitend in mijn opdracht.
	</p>
	<div class="legal-table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">Verwerker</th>
					<th scope="col">Waarvoor</th>
					<th scope="col">Waar staan de gegevens</th>
					<th scope="col">Toegang van buiten de EU</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Vercel</td>
					<td>Hosting van de website en het formulierverkeer</td>
					<td>Europese Unie (regio Frankfurt)</td>
					<td>Ja — Verenigde Staten</td>
				</tr>
				<tr>
					<td>Resend</td>
					<td>Afleveren van formulierinzendingen en bevestigingsmails</td>
					<td>Europese Unie (regio Ierland)</td>
					<td>Ja — Verenigde Staten</td>
				</tr>
				<tr>
					<td>Supabase</td>
					<td>
						Het vastleggen van bezette afspraakmomenten. Hierin staan alleen de datum, de tijd en de
						status van een aanvraag — geen naam, geen e-mailadres en niets over je klacht.
					</td>
					<td>Europese Unie (regio Ierland)</td>
					<td>Ja — Verenigde Staten</td>
				</tr>
				<tr>
					<td>Plausible Analytics</td>
					<td>Bezoekstatistieken zonder cookies</td>
					<td>Europese Unie</td>
					<td>Nee</td>
				</tr>
				<tr>
					<td><Todo>e-mailprovider</Todo></td>
					<td>De mailbox waarin je bericht binnenkomt</td>
					<td><Todo>land</Todo></td>
					<td><Todo>ja of nee</Todo></td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		Buiten deze partijen deel ik gegevens alleen wanneer ik daar wettelijk toe verplicht word,
		bijvoorbeeld door de Belastingdienst.
	</p>

	<h3>Doorgifte buiten de Europese Unie</h3>
	<p>
		De opslag gebeurt in de Europese Unie, in de regio's die hierboven staan. Toch is dat niet het
		hele verhaal, en ik vind dat je het volledige verhaal hoort te krijgen: Vercel, Resend en
		Supabase zijn bedrijven van buiten de EU. Voor onderhoud, ondersteuning en storingen kunnen zij
		vanuit de Verenigde Staten bij gegevens komen. Dat is een doorgifte naar een land buiten de EU.
	</p>
	<p>
		Voor elk van deze partijen gelden de <strong
			>modelcontractbepalingen van de Europese Commissie</strong
		>
		(de standaardcontractbepalingen uit besluit 2021/914). Dat is het instrument dat de AVG hiervoor voorschrijft:
		het verplicht de partij in het buitenland tot hetzelfde beschermingsniveau als hier geldt, en geeft
		jou rechten die je ook tegenover die partij kunt inroepen.
	</p>
	<p>
		Om die reden staat er in de database die de afspraakmomenten bijhoudt <strong
			>bewust niets persoonlijks</strong
		>. Je naam, je e-mailadres en je omschrijving van je klacht worden daar niet opgeslagen — die
		reizen alleen mee in de e-mail naar mij. Wat je over je gezondheid schrijft is een bijzonder
		persoonsgegeven, en daar hoort de kortste weg bij.
	</p>

	<h2>6. Hoe lang bewaar ik ze?</h2>
	<dl>
		<dt>Berichten via het contactformulier</dt>
		<dd>Tot maximaal 12 maanden nadat het contact is afgerond.</dd>

		<dt>Afspraakgegevens van een kennismaking die niet doorging</dt>
		<dd>Tot maximaal 6 maanden na de geplande datum.</dd>

		<dt>Behandelaantekeningen en gezondheidsgegevens</dt>
		<dd>
			<Todo>bewaartermijn vaststellen</Todo> — hoe lang dit moet zijn, hangt af van de beroepsvereniging
			waarbij de praktijk is aangesloten; sommige verenigingen schrijven een termijn van 20 jaar voor.
			Zolang die keuze niet vaststaat, worden deze gegevens niet langer bewaard dan noodzakelijk voor
			een lopend behandeltraject.
		</dd>

		<dt>Facturen en administratie</dt>
		<dd>7 jaar, op grond van de fiscale bewaarplicht.</dd>

		<dt>Bezoekstatistieken</dt>
		<dd>Geaggregeerd en niet herleidbaar tot een persoon, dus zonder bewaartermijn.</dd>
	</dl>

	<h2>7. Hoe zijn ze beveiligd?</h2>
	<p>
		De website is uitsluitend via een versleutelde verbinding (HTTPS) bereikbaar en dwingt dat ook
		af. Formulierinzendingen worden versleuteld verzonden. Aantekeningen op papier bewaar ik achter
		slot; digitale bestanden staan op een apparaat met schijfversleuteling en een wachtwoord. Ik ben
		de enige die er toegang toe heeft.
	</p>

	<h2>8. Welke rechten heb je?</h2>
	<p>Op grond van de AVG heb je het recht om:</p>
	<ul>
		<li>in te zien welke gegevens ik van je heb;</li>
		<li>onjuiste gegevens te laten corrigeren;</li>
		<li>je gegevens te laten verwijderen;</li>
		<li>de verwerking te laten beperken;</li>
		<li>je gegevens in een gangbaar bestandsformaat te ontvangen of over te laten dragen;</li>
		<li>bezwaar te maken tegen de verwerking;</li>
		<li>
			een eerder gegeven toestemming in te trekken — dat kan altijd, en het raakt niet aan de
			rechtmatigheid van wat daarvoor al is verwerkt.
		</li>
	</ul>
	<p>
		Een verzoek stuur je naar <a href="mailto:{BRAND.email}">{BRAND.email}</a>. Ik reageer binnen
		vier weken. Om te voorkomen dat ik gegevens aan de verkeerde persoon geef, kan ik je vragen je
		te identificeren.
	</p>

	<h2>9. Klachten</h2>
	<p>
		Vind je dat ik niet zorgvuldig met je gegevens omga, laat het me dan eerst weten — dan los ik
		het liefst zelf op. Je hebt daarnaast altijd het recht een klacht in te dienen bij de Autoriteit
		Persoonsgegevens via
		<a href="https://autoriteitpersoonsgegevens.nl" rel="noopener">autoriteitpersoonsgegevens.nl</a
		>.
	</p>

	<h2>10. Wijzigingen</h2>
	<p>
		Verandert de praktijk of de manier waarop gegevens verwerkt worden, dan pas ik deze verklaring
		aan. De datum bovenaan deze pagina geeft aan wanneer de tekst voor het laatst is gewijzigd.
	</p>
</LegalDoc>
