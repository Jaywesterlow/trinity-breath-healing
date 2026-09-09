/**
 * The complaint-first index behind /behandelingen.
 *
 * Nothing here is a new claim. Every group is a rewording of entries that
 * already appear in a service's own `helpsWith` list in `brand.ts`, which is
 * the practitioner's copy; `sources` names the exact entries each group was
 * built from, so the two can be checked against each other and neither can
 * quietly drift. If a service's `helpsWith` changes, come back here.
 *
 * Why this exists at all: /diensten lists the seven treatments by name, which
 * only helps a reader who already knows the name. Most people arrive with a
 * complaint, not a modality — "ik slaap slecht", not "ik zoek Spinal Touch" —
 * and that is also how the question reaches an AI assistant. This page answers
 * that phrasing, and it is the reason the two routes are not duplicates of one
 * another.
 *
 * Ordering is deliberate: the four most-common reasons people get in touch come
 * first, and the more specific ones follow.
 */

export interface Klacht {
	/** Used as the anchor id, so it ends up in the URL and can be linked to. */
	id: string;
	/** How someone would say it themselves, not the clinical name. */
	title: string;
	/** One or two sentences. No promise of a cure — this is what the work does. */
	body: string;
	/** Service slugs, in the order they are most likely to be reached for. */
	services: string[];
	/** The `helpsWith` entries this group was built from. Audit trail, not shown. */
	sources: string[];
}

export const KLACHTEN: Klacht[] = [
	{
		id: 'stress-en-burn-out',
		title: 'Stress en burn-out',
		body: 'Spanning die niet meer weggaat met een weekend rust, en een hoofd dat niet stopt. We werken aan de plek waar die spanning vastzit, niet alleen aan het gevoel erover.',
		services: ['cranio-fascia-unwinding', 'brtt-body', 'mahatma-healing', 'spinal-touch'],
		sources: [
			'langdurige stress en burn-outklachten',
			'spanning die niet verdwijnt met praten of sporten',
			'chronische spanning en pantsering',
			'burn-outklachten',
			'stress',
			'burn-out'
		]
	},
	{
		id: 'slecht-slapen-en-vermoeidheid',
		title: 'Slecht slapen en vermoeidheid',
		body: 'Wakker liggen, of wakker worden en nog steeds moe zijn. Vaak staat het zenuwstelsel nog aan terwijl jij allang wilt uitrusten.',
		services: ['spinal-touch', 'mahatma-healing', 'brtt-body', 'cranio-fascia-unwinding'],
		sources: [
			'slaapproblemen',
			'(chronische) vermoeidheid',
			'vermoeidheidsklachten',
			'slaapkwaliteit',
			'vermoeidheid, onrust en overprikkeling'
		]
	},
	{
		id: 'angst-en-somberheid',
		title: 'Angst en somberheid',
		body: 'Angstgevoelens, piekeren, of een zwaarte die er al een tijd is. Dit is aanvullend op reguliere zorg, niet in plaats daarvan.',
		services: ['goldhealing', 'trb-breathwork', 'mahatma-healing', 'spinal-touch'],
		sources: [
			'angstgevoelens',
			'negativiteit en depressieve klachten',
			'angst en depressieve gevoelens',
			'angsten en depressieve klachten',
			'angsten'
		]
	},
	{
		id: 'trauma-en-verwerking',
		title: 'Trauma en onverwerkte ervaringen',
		body: 'Gebeurtenissen die het lichaam heeft vastgehouden, ook als je er geen bewuste herinnering meer aan hebt. Er wordt niets opengebroken wat niet los wil.',
		services: ['trb-breathwork', 'brtt-body', 'mahatma-healing'],
		sources: [
			"onverwerkte trauma's",
			'trauma',
			'PTSS-symptomen',
			'onderdrukte emoties',
			'rouwverwerking',
			'emotionele verwerking na intensieve periodes'
		]
	},
	{
		id: 'pijn-en-lichamelijke-klachten',
		title: 'Pijn en lichamelijke klachten',
		body: 'Rug, nek, schouders, hoofdpijn of migraine. Bij fysieke klachten ga je altijd eerst naar de huisarts; dit werk komt daarnaast.',
		services: ['spinal-touch', 'brtt-body', 'cranio-fascia-unwinding'],
		sources: [
			'rugpijn en hernia',
			'hoofdpijn en migraine',
			'gewrichtspijn en fibromyalgie',
			'migraine, rug-, nek- en schouderklachten',
			'spijsverteringsklachten',
			'tinnitus'
		]
	},
	{
		id: 'overprikkeling-en-hooggevoeligheid',
		title: 'Overprikkeling en hooggevoeligheid',
		body: 'Te veel binnenkrijgen en het niet kwijt kunnen. Ook voor kinderen: Goldhealing is daar zacht genoeg voor.',
		services: ['goldhealing', 'cranio-fascia-unwinding', 'mahatma-healing'],
		sources: [
			'stress en overprikkeling',
			'hooggevoeligheid bij kinderen',
			'ADHD',
			'autisme en PDD-NOS',
			'vermoeidheid, onrust en overprikkeling'
		]
	},
	{
		id: 'vastzitten-zonder-duidelijke-klacht',
		title: 'Vastzitten, zonder dat je het kunt benoemen',
		body: 'Geen diagnose, geen duidelijke aanleiding, wel het gevoel dat er iets niet stroomt. Dat is een geldige reden om te komen.',
		services: ['raster-energie', 'mahatma-healing', 'trb-breathwork'],
		sources: [
			'energetische blokkades',
			'inzicht en bewustwording',
			'activeren van je zelfgenezend vermogen',
			'moeite met voelen of ontspannen',
			'verankering en aarding'
		]
	}
];
