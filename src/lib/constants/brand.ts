/**
 * NAP SOURCE OF TRUTH (LGL-09).
 * Any change must propagate to:
 *   - SiteFooter content (Phase 1 LND-08)
 *   - Organization/ProfessionalService JSON-LD emitter (Plan 03)
 *   - Instagram bio + KvK record
 * NEVER hand-edit downstream copies — always update here first.
 *
 * TODO placeholders below are tracked in .planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md.
 * CI grep flags TODO_ values as warnings; Phase 5 launch gate blocks on residual TODO_ in this file.
 */

export const BRAND = {
	/** Legal business name — must match KvK registration */
	legalName: 'Trinity Breath & Healing',

	/** Display name used in UI, meta title prefix, og:site_name */
	shortName: 'TRINITY Breath & Healing',

	/** Practitioner's full legal name — required for Person schema + E-E-A-T */
	practitionerFullName: 'Brigitte Grohe',

	/** Primary contact email. Domain registered 2026-08-24; the mailbox itself
	    still has to be created (or forwarded) before this address receives. */
	email: 'info@trinitybreathhealing.nl',

	/** E.164 for the tel: link; `phoneDisplay` is what a visitor reads. */
	phone: '+31624244585',
	phoneDisplay: '06 24 24 45 85',
	/** PLACEHOLDER — the hours she actually wants to be called between. Shown in
	    the cursor over the footer's phone number and nowhere else yet, so this
	    is the one line to change. */
	phoneHours: '09:00 en 17:00',

	/** KvK and BTW, supplied 2026-08-24. Both belong on the legal pages and in
	    the Organization JSON-LD — a Dutch business is expected to publish them,
	    and they are a trust signal in a category where anyone can put up a site. */
	kvk: '97538159',
	vatId: 'NL005276270B90',

	/**
	 * THE PRACTICE ADDRESS, published on /werkwijze since 8-11.
	 *
	 * Her answer of 2026-11-08 (WhatsApp, 09:20): this is only the address for her
	 * work, her physio's room that she may use on Saturdays. She asked for it on
	 * /werkwijze ("Waar", 2-11), so it now renders there. The note of 31-08 below
	 * is kept for the history; it no longer holds.
	 *
	 * Clarified 31-08, and it reverses what this block used to assume. Reigersbos
	 * is where she lives and works from; it is not the address the business is
	 * registered at. The KvK registration sits on a different building — one she
	 * owns and rents out to tenants — so neither address belongs in the footer:
	 * the registered one would send a client to a stranger's door, and this one
	 * broadcasts a solo practitioner's home on a health site.
	 *
	 * Kept here because the booking flow and her own correspondence need it, and
	 * because a NAP source of truth that silently drops the address invites
	 * someone to retype it in a component later. Nothing renders it. The public
	 * answer to "where are you" is `workArea` below.
	 *
	 * The address the legal pages need is the KvK vestigingsadres — a different
	 * value, still outstanding, and marked TODO_ in `registeredAddress`.
	 */
	address: {
		street: 'Reigersbos 100 L',
		/* Third floor. Part of the address rather than a separate field: it is
		   what someone standing in the lobby needs, and Schema.org has no
		   better slot for it than streetAddress. */
		floor: '3e etage',
		postalCode: '1107 ES',
		city: 'Amsterdam',
		country: 'Nederland'
	},

	/**
	 * The KvK vestigingsadres, for the legal pages only.
	 *
	 * Article 3:15d BW requires a service provider to publish the geographic
	 * address where it is established, so this cannot simply be omitted — but it
	 * appears on ONE page, the algemene voorwaarden, in the "gevestigd te" line,
	 * and nowhere else.
	 *
	 * NOBODY WORKS HERE. It is a building she owns and rents out; the tenants
	 * have nothing to do with the practice. A client who reads this as a
	 * visiting address and turns up is knocking on a stranger's door, so
	 * wherever it renders it must be followed by the sentence saying it is a
	 * registration address and not a place to visit. That sentence is not
	 * decoration.
	 *
	 * The privacyverklaring deliberately does NOT repeat it. AVG art. 13(1)(a)
	 * asks for the controller's identity and contact details, and a name, KvK
	 * number, e-mail address and telephone number are contact details — a street
	 * is not required there. One page instead of two halves the exposure at no
	 * legal cost.
	 */
	registeredAddress: {
		street: 'Kantershof 7',
		postalCode: '1104 GA',
		city: 'Amsterdam'
	},

	/**
	 * What a visitor is told about location. No street, on purpose.
	 *
	 * She works from home, travels to clients, and treats remotely — so the
	 * honest answer to "where are you" is a region, not a doorway. This is also
	 * what the Google Business Profile is set up as: a service-area business
	 * with the address hidden, which is the right shape for a practice with no
	 * storefront and the wrong one to contradict on the site.
	 */
	workArea: {
		label: 'Amsterdam-Zuidoost',
		region: 'Amsterdam en omgeving'
	},

	/**
	 * How she actually works, supplied 2026-08-24 — and it is not "a practice
	 * you visit on weekdays".
	 *
	 * The Reigersbos address is a Saturday location. On other days she travels
	 * to the client, and several treatments can be given remotely. Publishing
	 * the address without that context would send someone to a closed door on a
	 * Tuesday, so anywhere the address appears, this has to appear with it.
	 */
	practice: {
		/** Weekday at the fixed location; ISO-8601, 6 = Saturday. */
		locationWeekday: 6,
		locationNote: 'Op zaterdag geef ik behandelingen op de praktijk in Amsterdam-Zuidoost.',
		homeVisits: true,
		homeVisitNote: 'Op andere dagen kom ik naar je toe.',
		remote: true,
		remoteNote: 'Een aantal behandelingen kan ook op afstand.'
	},

	/** Social media profiles */
	socials: {
		/** Instagram handle including @ — primary channel for existing audience */
		instagram: '@trinitybreath.and.healing',
		/** Facebook page URL — null until practitioner confirms presence */
		facebook: null as string | null,
		/** X (Twitter) handle — null; practitioner not active on X */
		x: null as string | null
	},

	/**
	 * Service area for Schema.org Service.areaServed + ProfessionalService.areaServed.
	 * Locked by CONTEXT.md D-04 (areaServed decision) + D-08 (Schema.org source-of-truth).
	 * Matches Figma copy and REQUIREMENTS LND-08 NAP block.
	 * NEVER edit here without updating JSON-LD emitters in Plan 03 and footer copy in LND-08.
	 */
	areaServed: [
		'Amsterdam',
		'Zaandam',
		'Almere',
		'Weesp',
		'Oostzaan',
		'Hoofddorp',
		'Badhoevedorp',
		'Utrecht'
	] as const,

	/**
	 * Services offered — slugs are the stable identifier for routing + schema @id.
	 * Eight real services (260810-mdl, Clearing & Ascensie 2026-11-01), practitioner-provided copy, owner-approved 2026-08-10.
	 * Do not embellish or translate this copy — it is final as given.
	 *
	 * `teaser` — one sentence, the Behandelingen card hover reveal. Was `description`
	 * (TODO_-prefixed placeholder copy, 260809-hov) — renamed now that real copy exists, since
	 * "description" no longer says what it is once there's also a modal `intro` paragraph.
	 * `intro` — the ServiceModal's paragraph under the title.
	 * `helpsWith` — the ServiceModal's "kan ondersteuning bieden bij" list. Where she sent
	 * a left and a right column (8-11), the first half is her left column: the page lays
	 * the list out in columns, top to bottom.
	 * `pageIntro` — the service page's longer "Wat is …?" text, where she sent one.
	 * `session` — her "Hoe een sessie verloopt" text (8-11); without it the page uses a
	 * general one.
	 * `healthCheck` — her "Gezondheidsverklaring" block (BRTT and TRB, 8-11).
	 *
	 * BRTT Body and Trauma Release Breathwork (`trb-breathwork`) are deliberately separate
	 * services with separate cards/modals/pages — an owner decision, not an oversight.
	 */
	services: [
		{
			slug: 'mahatma-healing',
			name: 'Mahatma Healing',
			duration: '30 minuten',
			remote: true,
			teaser:
				'Een zachte, harmoniserende energetische behandeling die gericht is op het ondersteunen van innerlijke balans, het loslaten van spanning en het creëren van ruimte voor rust en bewustwording.',
			intro:
				'Mahatma Healing is een energetische behandeling die gericht is op harmonie, balans en innerlijke bewustwording.\n\nAls Mahatma Coach verbind ik mij voorafgaand aan de sessie met jouw I AM Presence, jouw Hogere Zelf. Vanuit deze verbinding stem ik mij intuïtief af op wat jij op dat moment nodig hebt.\n\nBinnen deze energetische werkwijze staat het loslaten van oude energie en het herstellen van de innerlijke balans centraal. Zo ontstaat er ruimte voor ontspanning, bewustwording en een diepere verbinding met jezelf.',
			/* Her "Voor wie" opening (5-11), shown above the list on the service page. */
			helpsIntro:
				'Mahatma Healing is bedoeld voor iedereen die behoefte heeft aan meer rust, balans en verbinding met zichzelf. De behandeling kan als aanvullende ondersteuning worden ervaren bij:',
			helpsWith: [
				'stress en innerlijke onrust',
				'vermoeidheid en weinig energie',
				'moeite met ontspannen of slapen',
				'emotionele spanning en angsten',
				'rouw en verlies',
				'overbelasting en burn-outklachten',
				'behoefte aan meer innerlijke balans',
				'persoonlijke en spirituele groei'
			],
			/* "Wat brengt het jou?" (2-11, 23:03): a section of its own on the page. */
			benefits:
				'Mahatma Healing nodigt je uit om even stil te staan bij jezelf en de drukte van het dagelijks leven los te laten.\n\nDe behandeling kan bijdragen aan een gevoel van diepe ontspanning, innerlijke rust en meer verbinding met jezelf.\n\nHet biedt ruimte om bewust te worden van wat je bezighoudt, spanning los te laten en nieuwe inzichten te krijgen die je kunnen helpen om meer balans te ervaren.\n\nIedereen beleeft een sessie op zijn eigen manier. Wat je ervaart, mag er zijn.'
		},
		{
			slug: 'goldhealing',
			name: 'Gold Healing',
			duration: '30 minuten',
			remote: true,
			teaser:
				'Een zachte, transformerende behandeling met gouden lichtenergie, gericht op bescherming, emotionele balans en innerlijke rust.',
			intro:
				'Gold Healing is een energetische behandeling waarbij gewerkt wordt met gouden lichtenergie. Deze energie wordt binnen de methode geassocieerd met transformatie, bescherming en het loslaten van negatieve gedachten en gevoelens.\n\nIk combineer Gold Healing regelmatig met Mahatma- of Kundalini-energie, waarbij aandacht is voor zowel de ervaren klachten als de mogelijke onderliggende oorzaken.\n\nDe behandeling is ook geschikt voor kinderen.',
			/* The service page's longer text (6-11); the card and modal keep `intro` (1-11). */
			pageIntro:
				'Gold Healing is een energetische behandeling waarbij gewerkt wordt met gouden lichtenergie. Binnen deze werkwijze staat het transformeren van negatieve energie naar positieve energie centraal.\n\nDe behandeling richt zich vooral op het emotionele en psychische vlak en is bedoeld om innerlijke rust, balans en een gevoel van bescherming te ondersteunen.\n\nTijdens de sessie werk ik met zowel Mahatma-energie als Gold Healing. Deze energieën worden gecombineerd om harmonie, innerlijke balans en emotioneel welzijn te ondersteunen.',
			helpsWith: [
				'angstgevoelens en innerlijke onrust',
				'negatieve gedachten en sombere gevoelens',
				'stress en overprikkeling',
				'hooggevoeligheid bij kinderen',
				'behoefte aan rust en ontspanning bij ADHD of autisme'
			],
			session:
				'We beginnen met een kort gesprek om af te stemmen op wat jij op dat moment nodig hebt. Vervolgens ontvang je een Gold Healing in combinatie met Mahatma Healing, volledig afgestemd op jou.\n\nTijdens de behandeling mag je ontspannen en de energie rustig ontvangen. Na afloop is er ruimte om je ervaringen te delen.\n\nDe behandeling duurt ongeveer 30 minuten en kan zowel op locatie als op afstand plaatsvinden.'
		},
		{
			slug: 'raster-energie',
			name: 'Rasterenergie',
			duration: '30 minuten',
			remote: true,
			teaser:
				'Een energetische behandeling die gericht is op het opnieuw afstemmen van je persoonlijke energiesysteem op je Goddelijke blauwdruk, zodat je je kunt herinneren wie je in essentie bent.',
			/* Card and modal: the first and last paragraph of her page text (8-11). */
			intro:
				'Rasterenergie is een energetische behandeling die gericht is op het herstellen van de verbinding met je oorspronkelijke Goddelijke blauwdruk.\n\nRasterenergie richt zich op het reinigen van energetische blokkades en het opnieuw afstemmen van je persoonlijke energiesysteem op je Goddelijke blauwdruk. De behandeling is bedoeld om je intuïtie, innerlijke balans en verbinding met je Hogere Zelf te ondersteunen, zodat je je opnieuw kunt herinneren wie je in essentie bent.',
			pageIntro:
				'Rasterenergie is een energetische behandeling die gericht is op het herstellen van de verbinding met je oorspronkelijke Goddelijke blauwdruk.\n\nBinnen deze energetische visie bevindt zich rondom je auraveld een geometrische structuur, verbonden met axiatonale en galactonale lijnen. De axiatonale lijnen worden gezien als energetische meridianen die verder reiken dan je fysieke lichaam en je verbinden met het grotere kosmische raster en de aarde.\n\nSamen vormen deze lijnen een energetisch netwerk dat je verbindt met je Hogere Zelf.\n\nVolgens deze visie kunnen ervaringen en invloeden van buitenaf energetische stempels en blokkades achterlaten die deze verbinding verstoren.\n\nRasterenergie richt zich op het reinigen van deze blokkades en het opnieuw afstemmen van je persoonlijke energiesysteem op je Goddelijke blauwdruk. De behandeling is bedoeld om je intuïtie, innerlijke balans en verbinding met je Hogere Zelf te ondersteunen, zodat je je opnieuw kunt herinneren wie je in essentie bent.',
			helpsWith: [
				'energetische blokkades',
				'karmische belasting',
				'herstellen van je energetische balans',
				'heling op mentaal, emotioneel en fysiek niveau',
				'verbinding met je Goddelijke blauwdruk',
				'inzicht en bewustwording'
			],
			session:
				'We beginnen met een kort gesprek om af te stemmen op jouw wensen en behoeften. Vervolgens ontvang je een Rasterenergie-behandeling, waarbij ik mij richt op het reinigen van energetische blokkades en het opnieuw afstemmen van je persoonlijke energiesysteem.\n\nTijdens de behandeling mag je ontspannen en de energie rustig ontvangen. Na afloop is er ruimte om je ervaringen te delen.\n\nDe behandeling duurt ongeveer 30 minuten en kan zowel op locatie als op afstand plaatsvinden.'
		},
		{
			slug: 'cranio-fascia-unwinding',
			name: 'Cranio & Fascia Unwinding',
			duration: '60 minuten',
			remote: false,
			teaser:
				'Zacht, lichaamsgericht werk waarbij je lichaam het tempo bepaalt en de ruimte krijgt om opgebouwde spanning los te laten en diepe ontspanning te ervaren.',
			intro:
				'Cranio & Fascia Unwinding is een zachte, lichaamsgerichte behandeling waarbij met lichte aanrakingen en subtiele cranio-technieken het lichaam wordt uitgenodigd om opgebouwde spanning los te laten.\n\nTijdens de behandeling krijgt je lichaam de ruimte om op zijn eigen tempo te reageren. Dit kan zich uiten in spontane bewegingen, zuchten, trillen of juist diepe stilte en ontspanning.\n\nDit proces wordt ook wel fascia unwinding genoemd, waarbij het lichaam zonder forceren de ruimte krijgt om spanning te ontladen.\n\nEr is geen moeten, alleen uitnodiging.',
			helpsWith: [
				'langdurige stress en burn-outklachten',
				'spanning die niet verdwijnt met praten of sporten',
				'vermoeidheid, onrust en overprikkeling',
				'moeite met voelen of ontspannen',
				'emotionele belasting na ingrijpende ervaringen',
				'meer lichaamsbewustzijn en innerlijke rust'
			],
			session:
				'We beginnen met een kort gesprek om af te stemmen op jouw wensen en behoeften.\n\nTijdens de behandeling lig je ontspannen op een behandeltafel. Met zachte aanrakingen en subtiele technieken nodig ik je lichaam uit om opgebouwde spanning los te laten. Je lichaam bepaalt zelf het tempo en er hoeft niets geforceerd te worden.\n\nNa afloop is er ruimte om rustig bij te komen en je ervaringen te delen.\n\nEen sessie duurt ongeveer 60 minuten en vindt plaats op locatie of bij jou thuis.'
		},
		{
			slug: 'spinal-touch',
			name: 'Spinal Touch',
			duration: '60 minuten',
			remote: false,
			teaser:
				'Een zachte, lichaamsgerichte methode met subtiele aanrakingen langs de wervelkolom, gericht op het verminderen van spanning, het ondersteunen van de lichaamshouding en het bevorderen van diepe ontspanning en balans.',
			intro:
				"Spinal Touch is een zachte, lichaamsgerichte aanrakingsmethode waarbij ik werk met specifieke punten langs de wervelkolom.\n\nDoor middel van subtiele aanrakingen nodig ik het lichaam uit om tot rust te komen, spanning los te laten en de natuurlijke balans te hervinden.\n\nDe behandeling is gericht op diepe ontspanning en het ondersteunen van het zenuwstelsel. Spinal Touch is geschikt voor jong en oud, van baby's tot ouderen.",
			pageIntro:
				'Spinal Touch is een zachte, lichaamsgerichte methode waarbij met subtiele aanrakingen het lichaam wordt uitgenodigd om opgebouwde spanning los te laten en tot diepe ontspanning te komen.\n\nBinnen deze methode is er aandacht voor de wervelkolom, de dura mater (het beschermende vlies rondom het ruggenmerg) en het natuurlijke ritme van het lichaam. De behandeling is gericht op het verminderen van spanning en het ondersteunen van de natuurlijke balans.\n\nTijdens de behandeling stem ik mijn werkwijze af op wat jouw lichaam op dat moment laat zien. Wanneer het passend voelt, combineer ik Spinal Touch met energetisch werk.',
			/* Her own list of 8-11, which replaces the one we softened on 7-11. */
			helpsWith: [
				'rug-, nek- en schouderspanning',
				'hoofdpijn en spanningsklachten',
				'stress en emotionele onrust',
				'overbelasting en burn-outgerelateerde spanning',
				'spier- en gewrichtsspanning',
				'moeite met ontspannen',
				'vermoeidheid en weinig energie',
				'slaapproblemen',
				'lichaamshouding en lichaamsbewustzijn'
			],
			session:
				'We beginnen met een uitgebreid intakegesprek aan de hand van een vragenlijst. Hierbij kijken we samen naar waar je op dit moment tegenaan loopt en wat jouw wensen en behoeften zijn.\n\nVervolgens ontvang je een Spinal Touch-behandeling, waarbij ik met zachte, subtiele aanrakingen werk en mij afstem op de reacties van jouw lichaam. Wanneer het passend is, kan ik de behandeling aanvullen met energetisch werk.\n\nTijdens de sessie mag je ontspannen en je lichaam de ruimte geven om op zijn eigen tempo te reageren.\n\nNa afloop is er tijd om rustig bij te komen en je ervaringen te delen.\n\nDe eerste sessie duurt ongeveer 90 minuten, inclusief intake, en vindt plaats op locatie of bij jou thuis.'
		},
		{
			slug: 'brtt-body',
			name: 'BRTT Body',
			duration: '60 tot 90 minuten',
			remote: false,
			teaser:
				'Een krachtige, lichaamsgerichte methode die het lichaam uitnodigt om via natuurlijke trillingen en bewegingen opgebouwde spanning los te laten en diepe ontspanning te ervaren.',
			/* Her card text of 1-11 (missed in 261107-bwn), with "Remembers" (8-11). */
			intro:
				'BRTT (Body Remembers Trauma Therapy) is een krachtige, lichaamsgerichte methode die gericht is op het loslaten van opgebouwde spanning en het ondersteunen van emotionele verwerking.\n\nVia natuurlijke trillingen en bewegingen wordt het lichaam uitgenodigd om spanning te ontladen en diepe ontspanning te ervaren.',
			pageIntro:
				'BRTT (Body Remembers Trauma Therapy) is een krachtige, lichaamsgerichte methode die gericht is op het loslaten van diepgewortelde spanning en het ondersteunen van emotionele verwerking na stressvolle of ingrijpende ervaringen.\n\nWanneer je langdurig stress ervaart of iets ingrijpends meemaakt, kan je autonome zenuwstelsel in een verhoogde staat van alertheid blijven. Je lichaam blijft als het ware in de alarmstand staan, waarbij reacties zoals vechten, vluchten of bevriezen een rol kunnen spelen. Hierdoor kan het moeilijk zijn om volledig tot rust te komen.\n\nBinnen BRTT is er aandacht voor de psoas, een diepliggende spier die een belangrijke rol speelt bij houding, beweging en stabiliteit. Ook de fascia, het bindweefsel dat spieren en andere structuren in het lichaam omhult en verbindt, speelt binnen deze methode een rol.',
			/* Her left column (first four) and right column (8-11). */
			helpsWith: [
				'langdurige stress en overbelasting',
				'emotionele belasting na ingrijpende ervaringen',
				'onrust en verhoogde alertheid',
				'spanning die blijft ondanks gesprekken',
				'opgebouwde lichamelijke spanning',
				'moeite met voelen of uiten van emoties',
				'moeite met ontspannen en loslaten',
				'vermoeidheid en slaapproblemen'
			],
			session:
				'We beginnen met een kort gesprek waarin we bespreken waar je op dit moment tegenaan loopt en wat jouw behoeften zijn.\n\nTijdens de behandeling begeleid ik je met een lichaamsgerichte oefening die het lichaam uitnodigt om via natuurlijke trillingen en bewegingen opgebouwde spanning te ontladen. Hierbij krijgt je lichaam de ruimte om op zijn eigen tempo te reageren.\n\nJe hoeft niet alles opnieuw te vertellen of te analyseren. We richten ons op wat je in je lichaam ervaart, waarbij jouw grenzen en persoonlijke tempo worden gerespecteerd.\n\nNa afloop is er ruimte om rustig bij te komen en je ervaringen te delen.',
			healthCheck:
				'Voor jouw veiligheid is het belangrijk om vooraf te beoordelen of BRTT voor jou geschikt is.\n\nDaarom ontvang je vóór de behandeling een gezondheidsverklaring waarin je enkele vragen over je gezondheid beantwoordt. Deze verklaring wordt vooraf ingevuld en ondertekend.\n\nBij bepaalde medische of psychische aandoeningen kan BRTT worden afgeraden of is vooraf overleg met een arts noodzakelijk.'
		},
		{
			slug: 'trb-breathwork',
			name: 'Trauma Release Breathwork',
			duration: '60 tot 90 minuten',
			remote: false,
			teaser:
				'Een diepgaande ademmethode waarin zeven ademprincipes samenkomen, gericht op het loslaten van opgebouwde spanning en het ondersteunen van emotionele verwerking.',
			intro:
				'TRB is een diepgaande vorm van ademwerk waarbij zeven ademtechnieken worden toegepast. Tijdens de sessie richt je de aandacht op je ademhaling en maak je ruimte om contact te maken met je gevoelens, overtuigingen en ervaringen.\n\nHet ademproces kan verschillende lichamelijke en emotionele reacties oproepen en bijdragen aan bewustwording, emotionele verwerking en het loslaten van spanning.',
			pageIntro:
				'TRB® (Trauma Release Breathwork) is een diepgaande, lichaamsgerichte ademmethode waarin zeven verschillende ademprincipes samenkomen.\n\nDe methode richt zich op het verminderen van opgebouwde spanning, het ondersteunen van emotionele verwerking en het versterken van de verbinding met jezelf.\n\nOnze ademhaling staat in nauwe verbinding met het autonome zenuwstelsel en wordt beïnvloed door stress, emoties en ingrijpende ervaringen. Hierdoor kunnen ademhalingspatronen veranderen en kan het soms moeilijk zijn om volledig tot rust te komen.\n\nTRB kan als zelfstandige behandeling worden aangeboden of worden gecombineerd met BRTT (Body Remembers Trauma Therapy), afhankelijk van jouw behoeften.',
			/* Her left column (first three) and right column (8-11). */
			helpsWith: [
				'emotionele belasting na ingrijpende ervaringen',
				'angstgevoelens en innerlijke onrust',
				'meer lichaamsbewustzijn en verbinding met jezelf',
				'moeite met voelen of uiten van emoties',
				'opgebouwde lichamelijke spanning',
				'ontspanning en innerlijke rust'
			],
			session:
				'We beginnen met een kort gesprek waarin we bespreken waar je op dit moment tegenaan loopt en wat jouw wensen en behoeften zijn.\n\nTijdens de sessie werken we bewust met de ademhaling, waarbij aandacht is voor lichamelijke sensaties, gevoelens en wat zich op dat moment aandient. De ademprincipes worden afgestemd op jouw lichaam en persoonlijke behoeften.\n\nJe wordt hierin zorgvuldig begeleid, met respect voor jouw grenzen en eigen tempo. De sessie biedt ruimte voor ontspanning, lichaamsbewustzijn, emotionele verwerking en nieuwe inzichten.\n\nNa afloop nemen we de tijd om rustig bij te komen en je ervaringen te delen.\n\nEen TRB-sessie duurt ongeveer 60 tot 90 minuten en vindt plaats op locatie of bij jou thuis.',
			/* Her text says "BRTT" in the first sentence, a copy slip: it is the TRB block. */
			healthCheck:
				'Voor jouw veiligheid is het belangrijk om vooraf te beoordelen of TRB voor jou geschikt is.\n\nDaarom ontvang je vóór de behandeling een gezondheidsverklaring waarin je enkele vragen over je gezondheid beantwoordt. Deze verklaring wordt vooraf ingevuld en ondertekend.\n\nBij bepaalde medische of psychische aandoeningen kan TRB worden afgeraden of is vooraf overleg met een arts noodzakelijk.'
		},
		{
			slug: 'clearing-ascensie',
			name: 'Clearing & Ascensie-activatie',
			duration: '60 minuten',
			remote: false,
			/* Her card text of 1-11, 20:53 (missed in 261107-bwn). */
			teaser:
				'Een energetisch proces waarbij je ruimte maakt om oude patronen en blokkades los te laten en je bewustzijn en innerlijke groei te ondersteunen.',
			intro:
				"Tijdens een clearing werk ik op diep energetisch niveau: we reinigen wat zich in jouw systeem heeft vastgezet. Daarna worden je chakra's tijdens de ascensie-activaties uitgenodigd om weer in balans te komen en zich verder te openen voor hun natuurlijke stroom van levensenergie. De Clearing vormt altijd de eerste stap.",
			helpsWith: [
				'onrust in je hoofd',
				'vermoeidheid zonder duidelijke oorzaak',
				'terugkerende gedachten of zorgen',
				'moeite met loslaten',
				'lichamelijke spanning',
				'het gevoel “niet helemaal jezelf” te zijn'
			]
		}
	] as const,

	/**
	 * Shared disclaimer — rendered once in ServiceModal's footer (260810-mdl) and, later, once
	 * per service page once those graduate from stubs. A single constant, not seven copies, so
	 * it can never drift between services. Her words, condensed.
	 */
	disclaimer:
		'Mijn behandelingen zijn aanvullend op de reguliere gezondheidszorg en vervangen geen medische zorg. Ik stel geen diagnoses. Raadpleeg bij gezondheidsklachten altijd een arts.',

	stats: {
		yearsExperience: '8+',
		clientsHelped: '65+',
		satisfaction: '∞'
	} as const
} as const;
