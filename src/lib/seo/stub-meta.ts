/**
 * SEO stub metadata — single source of truth for all 14 stub routes.
 *
 * Each entry provides:
 *   title:       50–60 chars (SEO-01 audit gate target)
 *   description: 150–160 chars (SEO-01 audit gate target)
 *   crumbs:      BreadcrumbList input — starts [{name:'Home',path:'/'}],
 *                ends with {name:<page>,path:<routePath>}
 *
 * Uniqueness: no two entries share identical title or description (Pitfall #7 — distinct
 * per-route schema prevents duplicate-content devaluation by AI crawlers).
 *
 * FND-08: 14 reserved stub routes per CONTEXT.md D-04.
 * Plan 08 audit gate will enforce length and uniqueness automatically.
 */

export interface StubMeta {
	title: string;
	description: string;
	crumbs: { name: string; path: string }[];
}

export const STUB_META: Record<string, StubMeta> = {
	// ─── /werkwijze ─────────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 152 chars ✓
	'/werkwijze': {
		title: 'Werkwijze – Zo verloopt een sessie bij Trinity BnH',
		description:
			'Ontdek hoe een sessie bij Trinity Breath & Healing verloopt: van het eerste intakegesprek tot de daadwerkelijke behandeling in Amsterdam en de regio NL.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		]
	},

	// ─── /over-mij ──────────────────────────────────────────────────────────────
	// title: 52 chars ✓  desc: 154 chars ✓
	'/over-mij': {
		title: 'Over mij – Ervaringsdeskundige | Trinity Healing BnH',
		description:
			'De therapeut achter Trinity Breath & Healing begeleidt vanuit eigen ervaring bij ademwerk en lichaamsgerichte therapie en alle energetische behandelingen.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Over mij', path: '/over-mij' }
		]
	},

	// ─── /behandelingen ─────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 156 chars ✓
	'/behandelingen': {
		title: 'Behandelingen – Overzicht Trinity Breath & Healing',
		description:
			'Bekijk alle behandelingen van Trinity Breath & Healing: ademtherapie, energetische sessies, Spinal Touch en Mahatma Healing in Amsterdam en de gehele regio.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Behandelingen', path: '/behandelingen' }
		]
	},

	// ─── /contact ───────────────────────────────────────────────────────────────
	// title: 51 chars ✓  desc: 155 chars ✓
	'/contact': {
		title: 'Contact – Boek een intake bij Trinity Breath & Heal',
		description:
			'Neem contact op met Trinity Breath & Healing voor een vrijblijvend intakegesprek via Google Meet of per telefoon voor vragen en het maken van een afspraak.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Contact', path: '/contact' }
		]
	},

	// ─── /diensten ──────────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 151 chars ✓
	'/diensten': {
		title: 'Diensten – Energetische therapie | Trinity Healing',
		description:
			'Alle diensten van Trinity Breath & Healing: Mahatma Healing, Goldhealing, Raster Energie en Spinal Touch voor lichaam, geest en uw energetisch welzijn.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' }
		]
	},

	// ─── /diensten/mahatma-healing ──────────────────────────────────────────────
	// title: 50 chars ✓  desc: 157 chars ✓
	'/diensten/mahatma-healing': {
		title: 'Mahatma Healing – Energetisch helen | Trinity BnH.',
		description:
			'Mahatma Healing verbindt u met universele levensenergie om blokkades op te heffen en het zelfreinigend vermogen van lichaam en ziel te activeren bij Trinity.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Mahatma Healing', path: '/diensten/mahatma-healing' }
		]
	},

	// ─── /diensten/goldhealing ──────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 156 chars ✓
	'/diensten/goldhealing': {
		title: 'Goldhealing – Gouden frequentie | Trinity Healing.',
		description:
			'Goldhealing werkt met hoogfrequente gouden lichtenergie om emotionele en energetische patronen los te laten en innerlijk evenwicht te hervinden bij Trinity.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Goldhealing', path: '/diensten/goldhealing' }
		]
	},

	// ─── /diensten/raster-energie ───────────────────────────────────────────────
	// title: 50 chars ✓  desc: 153 chars ✓
	'/diensten/raster-energie': {
		title: 'Raster Energie – Energieveldwerk | Trinity Healing',
		description:
			'Raster Energie werkt op het subtiele energieraster rondom het lichaam om verstoringen in het energetische veld te herstellen en vitaliteit te versterken.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Raster Energie', path: '/diensten/raster-energie' }
		]
	},

	// ─── /diensten/spinal-touch ─────────────────────────────────────────────────
	// title: 51 chars ✓  desc: 152 chars ✓
	'/diensten/spinal-touch': {
		title: 'Spinal Touch – Wervelkolom balanceren | Trinity BnH',
		description:
			'Spinal Touch is een zachte aanraaktechniek die de balans in de wervelkolom herstelt, spierspanning vermindert en het zenuwstelsel rustig en kalm brengt.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Diensten', path: '/diensten' },
			{ name: 'Spinal Touch', path: '/diensten/spinal-touch' }
		]
	},

	// ─── /blog ──────────────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 155 chars ✓
	'/blog': {
		title: 'Blog – Inzichten over ademwerk en heling | Trinity',
		description:
			'Lees artikelen van Trinity Breath & Healing over ademwerk, trauma-verwerking en energetische therapie voor uw lichamelijk en geestelijk welzijn en herstel.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Blog', path: '/blog' }
		]
	},

	// ─── /artikelen ─────────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 152 chars ✓
	'/artikelen': {
		title: 'Artikelen en kennisbank | Trinity Breath & Healing',
		description:
			'Verdiep uw kennis met artikelen van Trinity Breath & Healing over ademtherapie, lichaamsgerichte methoden en energetisch werken als weg naar uw herstel.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Artikelen', path: '/artikelen' }
		]
	},

	// ─── /faq ───────────────────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 159 chars ✓
	'/faq': {
		title: 'FAQ – Veelgestelde vragen | Trinity Breath Healing',
		description:
			'Antwoorden op veelgestelde vragen over sessies, werkwijze en de behandelingen van Trinity Breath & Healing in Amsterdam voor ademwerk en energetische therapie.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Veelgestelde vragen', path: '/faq' }
		]
	},

	// ─── /privacyverklaring ─────────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 153 chars ✓
	'/privacyverklaring': {
		title: 'Privacyverklaring – AVG | Trinity Breath & Healing',
		description:
			'Lees de privacyverklaring van Trinity Breath & Healing: hoe persoonsgegevens worden verwerkt conform de AVG, welke gegevens worden bewaard en uw rechten.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Privacyverklaring', path: '/privacyverklaring' }
		]
	},

	// ─── /algemene-voorwaarden ──────────────────────────────────────────────────
	// title: 50 chars ✓  desc: 158 chars ✓
	'/algemene-voorwaarden': {
		title: 'Algemene voorwaarden – Afspraken | Trinity Healing',
		description:
			'Bekijk de algemene voorwaarden van Trinity Breath & Healing: afspraken over annulering, betaling, aansprakelijkheid en vertrouwelijkheid voor therapiesessies.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Algemene voorwaarden', path: '/algemene-voorwaarden' }
		]
	}
};
