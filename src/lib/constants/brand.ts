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

	/** KvK and BTW, supplied 2026-08-24. Both belong on the legal pages and in
	    the Organization JSON-LD — a Dutch business is expected to publish them,
	    and they are a trust signal in a category where anyone can put up a site. */
	kvk: '97538159',
	vatId: 'NL005276270B90',

	/**
	 * Practice address. Part of the NAP triplet and therefore a local-SEO
	 * signal, so it must match KvK and Google Business Profile exactly.
	 *
	 * The footer used to hard-code "Stationsstraat 45 A, 1315 KS Almere" and a
	 * phone number of "(+31) 6 123 456 78" — neither confirmed by the
	 * practitioner, and the second obviously a placeholder. Publishing an
	 * unverified street address for a real health practice is worse than
	 * publishing none, so both now live here and the footer renders them only
	 * once they stop being TODO_.
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
		'Badhoevedorp'
	] as const,

	/**
	 * Services offered — slugs are the stable identifier for routing + schema @id.
	 * Seven real services (260810-mdl), practitioner-provided copy, owner-approved 2026-08-10.
	 * Do not embellish or translate this copy — it is final as given.
	 *
	 * `teaser` — one sentence, the Behandelingen card hover reveal. Was `description`
	 * (TODO_-prefixed placeholder copy, 260809-hov) — renamed now that real copy exists, since
	 * "description" no longer says what it is once there's also a modal `intro` paragraph.
	 * `intro` — the ServiceModal's paragraph under the title.
	 * `helpsWith` — the ServiceModal's "helpt bij" list.
	 *
	 * BRTT Body and Trauma Release Breathwork (`trb-breathwork`) are deliberately separate
	 * services with separate cards/modals/pages — an owner decision, not an oversight.
	 */
	services: [
		{
			slug: 'mahatma-healing',
			name: 'Mahatma Healing',
			teaser:
				'Krachtige, harmoniserende energie die blokkades opheft en je energetisch systeem opschoont.',
			intro:
				'Voorafgaand aan een sessie stem ik af op jouw I AM Presence, jouw Hogere Zelf, zodat ik intuïtief weet welke energie nodig is. Als Mahatma Coach faciliteer ik de Mahatma energie, die harmoniserend en balancerend werkt. Oude energie mag los, zodat er ruimte komt voor nieuwe energie en alles weer kan stromen vanuit je eigen kracht.',
			helpsWith: [
				'stress',
				'burn-out',
				'vermoeidheidsklachten',
				'angsten',
				'slaapproblemen',
				'ADHD',
				'trauma',
				'allergieën',
				'rouwverwerking'
			]
		},
		{
			slug: 'goldhealing',
			name: 'Goldhealing',
			teaser:
				'Gouden lichtenergie die negativiteit omzet, beschermt en vooral op het psychische vlak werkt.',
			intro:
				'Goldhealing stemt je af op een van de sterkst transformerende energiestralen uit de kosmos. Het gouden licht zet negatieve gevoelens en gedachten om en blijft je na de behandeling omringen als bescherming. Ik combineer het vaak met de Mahatma of Kundalini energie, zodat zowel de bron als de klacht wordt aangeraakt. Ook heel geschikt voor kinderen.',
			helpsWith: [
				'angstgevoelens',
				'negativiteit en depressieve klachten',
				'stress en overprikkeling',
				'hooggevoeligheid bij kinderen',
				'ADHD',
				'autisme en PDD-NOS'
			]
		},
		{
			slug: 'raster-energie',
			name: 'Raster Energie',
			teaser:
				'Herstel van je Goddelijke blauwdruk — energetische stempels en blokkades worden gereinigd.',
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
			teaser:
				'Zachte methode langs de wervelkolom die je centrale zenuwstelsel weer laat doorstromen.',
			intro:
				'Stress en trauma slaan zich op aan de achterzijde van je lichaam en kunnen zich daar inkapselen. De blokkades die zo ontstaan houden signalen tussen je centrale zenuwstelsel en je organen, spieren en weefsels tegen. Via lichte aanraking op specifieke punten langs je wervelkolom geef ik subtiele signalen aan dat zenuwstelsel. Geschikt voor alle leeftijden, van pasgeborenen tot ouderen.',
			helpsWith: [
				'rugpijn en hernia',
				'hoofdpijn en migraine',
				'angsten en depressieve klachten',
				'burn-outklachten',
				'gewrichtspijn en fibromyalgie',
				'spijsverteringsklachten',
				'(chronische) vermoeidheid',
				'slaapproblemen',
				'tinnitus'
			]
		},
		{
			slug: 'brtt-body',
			name: 'BRTT Body',
			teaser:
				'Lichaamsgericht proces dat via de psoas — de spier van de ziel — opgeslagen trauma bevrijdt.',
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
			teaser:
				'Zeven ademtechnieken die de poort naar je onderbewuste openen en oude lading loslaten.',
			intro:
				"TRB is een diepgaande vorm van ademwerk. Via zeven ademtechnieken maak je verbinding met de kern van je overtuigingen en ervaringen. De sessie brengt je in een diepe, soms trance-achtige staat waarin opgeslagen emoties en trauma's veilig losgelaten of gereset mogen worden — ook ervaringen waar je geen bewuste herinnering meer aan hebt.",
			helpsWith: [
				"onverwerkte trauma's",
				'onderdrukte emoties',
				'angst en depressieve gevoelens',
				'spanning vastgezet in het lichaam',
				'verankering en aarding',
				'diepe ontspanning en rust'
			]
		}
	] as const,

	/**
	 * Shared disclaimer — rendered once in ServiceModal's footer (260810-mdl) and, later, once
	 * per service page once those graduate from stubs. A single constant, not seven copies, so
	 * it can never drift between services. Her words, condensed.
	 */
	disclaimer:
		'Een behandeling vervangt nooit reguliere zorg en ik stel geen diagnose. Bij fysieke klachten ga je altijd eerst naar de huisarts.',

	stats: {
		yearsExperience: '8+',
		clientsHelped: '65+',
		satisfaction: '∞'
	} as const
} as const;
