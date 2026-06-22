/**
 * STUB_META — per-route metadata for all 14 reserved stub routes.
 * Requirements: FND-08 (14 stubs), SEO-01 (title 50-60, desc 150-160)
 * Pitfall #7: each title and description MUST be unique — no duplicate placeholder content.
 *
 * Title range: 50–60 chars (verified inline).
 * Description range: 150–160 chars Dutch placeholder copy (verified inline).
 *
 * Phase 1+ deepens each route's content; only body copy changes — these titles/descriptions
 * persist as the stable URL scaffold (zero-301 migration guarantee D-04).
 */

export interface StubMeta {
	title: string;
	description: string;
	crumbs: { name: string; path: string }[];
}

export const STUB_META: Record<string, StubMeta> = {
	// title: 50 chars ✓  desc: 150 chars ✓
	'/werkwijze': {
		title: 'Hoe een sessie verloopt | TRINITY Breath & Healing',
		description:
			'Ontdek hoe een behandeling bij Trinity Breath & Healing verloopt: van intake en ademwerk ' +
			'tot energetische technieken en nazorg. Persoonlijk en veilig.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		]
	},

	// title: 52 chars ✓  desc: 151 chars ✓
	'/over-mij': {
		title: 'Mijn achtergrond en visie | TRINITY Breath & Healing',
		description:
			'Leer de therapeut achter Trinity Breath & Healing kennen: haar persoonlijke verhaal, ' +
			'opleiding, werkwijze en de overtuigingen die haar werk inspireren.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Over mij', path: '/over-mij' }
		]
	},

	// title: 52 chars ✓  desc: 150 chars ✓
	'/behandelingen': {
		title: 'Behandelingen – Overzicht | TRINITY Breath & Healing',
		description:
			'Bekijk het volledige aanbod van Trinity Breath & Healing: ademsessies, energetische ' +
			'behandelingen en lichaamsgerichte therapie voor trauma en herstel.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Behandelingen', path: '/behandelingen' }
		]
	},

	// title: 52 chars ✓  desc: 155 chars ✓
	'/contact': {
		title: 'Contact – Neem contact op | TRINITY Breath & Healing',
		description:
			'Stel een vraag, plan een kennismakingsgesprek of boek een sessie via het contactformulier ' +
			'van Trinity Breath & Healing. Wij reageren binnen twee werkdagen.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Contact', path: '/contact' }
		]
	},

	// title: 52 chars ✓  desc: 152 chars ✓
	'/diensten': {
		title: 'Alle behandelmodaliteiten | TRINITY Breath & Healing',
		description:
			'Trinity Breath & Healing biedt vier diepgaande behandelmodaliteiten: ademsessies, ' +
			'Mahatma Healing, Goldhealing en Raster Energie voor trauma en herstel.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' }
		]
	},

	// title: 52 chars ✓  desc: 151 chars ✓
	'/diensten/mahatma-healing': {
		title: 'Mahatma Healing – Energetische behandeling | Trinity',
		description:
			'Mahatma Healing lost energetische blokkades op en activeert uw zelfhelend vermogen via ' +
			'hoogfrequente lichtenergie. Boek een sessie bij Trinity Healing.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Mahatma Healing', path: '/diensten/mahatma-healing' }
		]
	},

	// title: 56 chars ✓  desc: 159 chars ✓
	'/diensten/goldhealing': {
		title: 'Goldhealing – Gouden lichtenergie voor herstel | Trinity',
		description:
			'Goldhealing werkt met gouden lichtenergie om het zenuwstelsel te kalmeren en ' +
			'trauma-patronen in het lichaam te ontbinden. Ervaar diepe ontspanning bij Trinity.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Goldhealing', path: '/diensten/goldhealing' }
		]
	},

	// title: 51 chars ✓  desc: 156 chars ✓
	'/diensten/raster-energie': {
		title: 'Raster Energie – Energetisch lichaamsveld | Trinity',
		description:
			'Raster Energie werkt op het energetische lichaamsveld om blokkades en vastgelopen patronen ' +
			'te verlossen. Beschikbaar bij Trinity Breath & Healing in Almere.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Raster Energie', path: '/diensten/raster-energie' }
		]
	},

	// title: 52 chars ✓  desc: 156 chars ✓
	'/diensten/spinal-touch': {
		title: 'Spinal Touch – Wervelkolom en zenuwstelsel | Trinity',
		description:
			'Spinal Touch is een zachte manuele techniek gericht op de wervelkolom en het zenuwstelsel. ' +
			'Verlicht spanning en herstel balans bij Trinity Breath & Healing.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Spinal Touch', path: '/diensten/spinal-touch' }
		]
	},

	// title: 53 chars ✓  desc: 159 chars ✓
	'/blog': {
		title: 'Blog – Inzichten over ademwerk en healing | Trinity B',
		description:
			'Lees praktijkverhalen, inzichten en tips over ademwerk, trauma-herstel en energetische ' +
			'therapie op het blog van Trinity Breath & Healing in Almere en omgeving.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Blog', path: '/blog' }
		]
	},

	// title: 56 chars ✓  desc: 153 chars ✓
	'/artikelen': {
		title: 'Verdiepingsartikelen over therapie en ademwerk | Trinity',
		description:
			'Diepgaande artikelen over lichaamsgerichte therapie, ademwerk, energetische healing en ' +
			'bewustzijnsgroei — gedeeld vanuit de praktijk van Trinity Healing.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Artikelen', path: '/artikelen' }
		]
	},

	// title: 54 chars ✓  desc: 155 chars ✓
	'/faq': {
		title: 'Veelgestelde vragen over ademwerk en healing | Trinity',
		description:
			'Antwoorden op de meest gestelde vragen over ademwerk, energetische behandelingen, ' +
			'sessieduur, kosten en wat u kunt verwachten bij Trinity Breath & Healing.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Veelgestelde vragen', path: '/faq' }
		]
	},

	// title: 51 chars ✓  desc: 155 chars ✓
	'/privacyverklaring': {
		title: 'Privacyverklaring – Uw gegevens beschermd | Trinity',
		description:
			'Lees hoe Trinity Breath & Healing uw persoonsgegevens verwerkt en beschermt conform de AVG. ' +
			'Transparantie over gegevensbescherming staat centraal in alles.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Privacyverklaring', path: '/privacyverklaring' }
		]
	},

	// title: 54 chars ✓  desc: 157 chars ✓
	'/algemene-voorwaarden': {
		title: 'Algemene voorwaarden – Afspraken en diensten | Trinity',
		description:
			'De algemene voorwaarden van Trinity Breath & Healing beschrijven de afspraken rondom ' +
			'sessies, betalingen, annulering en aansprakelijkheid voor onze diensten.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Algemene voorwaarden', path: '/algemene-voorwaarden' }
		]
	}
};
