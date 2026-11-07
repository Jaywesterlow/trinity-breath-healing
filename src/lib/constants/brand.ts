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
	 * HER HOME ADDRESS. NOT FOR PUBLICATION.
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
	 * `helpsWith` — the ServiceModal's "kan ondersteuning bieden bij" list.
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
			]
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
			]
		},
		{
			slug: 'raster-energie',
			name: 'Rasterenergie',
			duration: '30 minuten',
			remote: true,
			teaser: 'Herstel van je Goddelijke blauwdruk en het loslaten van energetische blokkades.',
			intro:
				'Rond je auraveld ligt een geometrische structuur, verbonden met de axitonale en galaxitonale lijnen. Samen vormen die je blauwdruk, en daarmee je verbinding met je Hogere Zelf. Invloeden van buitenaf kunnen daar stempels en blokkades op achterlaten. De rasterenergie heeft een hoge trillingsfrequentie en herbedraadt je als het ware, zodat je originele blauwdruk hersteld wordt.',
			helpsWith: [
				'energetische blokkades',
				'karmische belasting',
				'herstel van je aura',
				'heling op mentaal, emotioneel en fysiek niveau',
				'activeren van je zelfgenezend vermogen',
				'inzicht en bewustwording'
			]
		},
		{
			slug: 'cranio-fascia-unwinding',
			name: 'Cranio & Fascia Unwinding',
			duration: '60 minuten',
			remote: false,
			teaser:
				'Zacht lichaamswerk waarbij je lichaam zelf het tempo bepaalt en opgeslagen spanning loslaat.',
			intro:
				'Met lichte aanraking en subtiele cranio-technieken nodig ik je zenuwstelsel en je fascia uit om spanning los te laten die er vaak al langer zit. Je lichaam kan spontaan gaan bewegen, zuchten, trillen of juist heel stil worden: fascia unwinding, een natuurlijk ontladingsproces waarbij oude spanning veilig losgelaten wordt, zonder forceren. Er is geen moeten, alleen uitnodiging.',
			helpsWith: [
				'langdurige stress en burn-outklachten',
				'spanning die niet verdwijnt met praten of sporten',
				'vermoeidheid, onrust en overprikkeling',
				'moeite met voelen of ontspannen',
				'emotionele verwerking na intensieve periodes'
			]
		},
		{
			slug: 'spinal-touch',
			name: 'Spinal Touch',
			duration: '60 minuten',
			remote: false,
			teaser:
				'Een zachte aanrakingsmethode langs de wervelkolom, gericht op ontspanning en het ondersteunen van de balans in het zenuwstelsel.',
			intro:
				"Spinal Touch is een zachte, lichaamsgerichte aanrakingsmethode waarbij ik werk met specifieke punten langs de wervelkolom.\n\nDoor middel van subtiele aanrakingen nodig ik het lichaam uit om tot rust te komen, spanning los te laten en de natuurlijke balans te hervinden.\n\nDe behandeling is gericht op diepe ontspanning en het ondersteunen van het zenuwstelsel. Spinal Touch is geschikt voor jong en oud, van baby's tot ouderen.",
			/* Softened 7-11 in the style of her own new lists (no hernia, migraine,
			   fibromyalgie, tinnitus); sent to her to check, TODO.md §0a. */
			helpsWith: [
				'stress en opgebouwde spanning',
				'spanning in rug, nek en schouders',
				'angstgevoelens en sombere gevoelens',
				'overbelasting en burn-outklachten',
				'vermoeidheid en weinig energie',
				'moeite met ontspannen of slapen',
				'behoefte aan rust en balans in je lichaam'
			]
		},
		{
			slug: 'brtt-body',
			name: 'BRTT Body',
			duration: '60 tot 90 minuten',
			remote: false,
			teaser:
				'Een lichaamsgerichte methode waarbij je via natuurlijke lichaamsreacties spanning kunt loslaten en diepe ontspanning kunt ervaren.',
			intro:
				'BRTT, Body Release Trauma Therapy, is een krachtig lichaamsgericht proces dat opgeslagen trauma, heftige gebeurtenissen en stress uit je lichaam bevrijdt. Met gevarieerde technieken activeren we de psoas-spier, ook wel de spier van de ziel genoemd. Het lichaam mag ontladen, je zenuwstelsel kalmeert en lagen van lichaamspantsering laten los.',
			helpsWith: [
				'PTSS-symptomen',
				'chronische spanning en pantsering',
				'burn-outklachten en depressieve gevoelens',
				'migraine, rug-, nek- en schouderklachten',
				'ontspanning van de bekkenbodem',
				'slaapkwaliteit',
				'veerkracht'
			]
		},
		{
			slug: 'trb-breathwork',
			name: 'Trauma Release Breathwork',
			duration: '60 tot 90 minuten',
			remote: false,
			teaser:
				'Een diepgaand ademproces met zeven ademtechnieken, gericht op bewustwording en het loslaten van emotionele spanning en oude patronen.',
			intro:
				'TRB is een diepgaande vorm van ademwerk waarbij zeven ademtechnieken worden toegepast. Tijdens de sessie richt je de aandacht op je ademhaling en maak je ruimte om contact te maken met je gevoelens, overtuigingen en ervaringen.\n\nHet ademproces kan verschillende lichamelijke en emotionele reacties oproepen en bijdragen aan bewustwording, emotionele verwerking en het loslaten van spanning.',
			helpsWith: [
				'stress en opgebouwde spanning',
				'onderdrukte gevoelens en emotionele blokkades',
				'angstgevoelens en innerlijke onrust',
				'bewustwording van oude patronen',
				'lichaamsbewustzijn',
				'behoefte aan ontspanning en verbinding met jezelf'
			]
		},
		{
			slug: 'clearing-ascensie',
			name: 'Clearing & Ascensie-activatie',
			duration: '60 minuten',
			remote: false,
			teaser:
				"Energetische opschoning van lichaam, energieveld en onderbewuste lagen, gevolgd door twee activaties van je chakra's.",
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
