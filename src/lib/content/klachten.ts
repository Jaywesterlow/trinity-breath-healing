/**
 * The complaint-first index behind /behandelingen.
 *
 * Nothing here is a new claim. Every group is a rewording of entries that
 * already appear in a service's own `helpsWith` list in `brand.ts`, which is
 * the practitioner's copy; `sources` names the exact entries each group was
 * built from, so the two can be checked against each other and neither can
 * quietly drift. If a service's `helpsWith` changes, come back here.
 *
 * Why this exists at all: /diensten lists the treatments by name, which
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
		title: 'Stress en spanning',
		body: 'Langdurige stress kan zich uiten in een vol hoofd, lichamelijke spanning en moeite met ontspannen. Soms merk je dat je steeds moeilijker tot rust komt en uit balans raakt.',
		services: ['cranio-fascia-unwinding', 'brtt-body', 'mahatma-healing', 'spinal-touch'],
		sources: [
			'langdurige stress en burn-outklachten',
			'spanning die niet verdwijnt met praten of sporten',
			'chronische spanning en pantsering',
			'overbelasting en burn-outklachten',
			'stress en innerlijke onrust',
			'stress en opgebouwde spanning'
		]
	},
	{
		id: 'slecht-slapen-en-vermoeidheid',
		title: 'Slecht slapen en vermoeidheid',
		body: 'Moeite met inslapen, regelmatig wakker worden of vermoeid zijn ondanks voldoende slaap? Stress en spanning kunnen je zenuwstelsel alert houden, waardoor ontspannen soms lastig is.',
		services: ['spinal-touch', 'mahatma-healing', 'brtt-body', 'cranio-fascia-unwinding'],
		sources: [
			'moeite met ontspannen of slapen',
			'vermoeidheid en weinig energie',
			'slaapkwaliteit',
			'vermoeidheid, onrust en overprikkeling'
		]
	},
	{
		id: 'angst-en-somberheid',
		title: 'Angst en somberheid',
		body: 'Heb je last van angstgevoelens, blijf je piekeren of voel je je regelmatig somber? Soms kunnen deze gevoelens je dagelijkse leven beïnvloeden en verlang je naar meer innerlijke rust en balans.',
		services: ['goldhealing', 'trb-breathwork', 'mahatma-healing', 'spinal-touch'],
		sources: [
			'angstgevoelens en innerlijke onrust',
			'negatieve gedachten en sombere gevoelens',
			'angstgevoelens en sombere gevoelens',
			'emotionele spanning en angsten'
		]
	},
	{
		id: 'trauma-en-verwerking',
		title: 'Trauma en onverwerkte ervaringen',
		body: 'Sommige ingrijpende ervaringen kunnen nog lange tijd invloed hebben op hoe je je voelt. Misschien merk je dat je moeite hebt met ontspannen, bepaalde emoties steeds terugkomen of dat je lichaam gespannen blijft.',
		services: ['trb-breathwork', 'brtt-body', 'mahatma-healing'],
		sources: [
			'PTSS-symptomen',
			'onderdrukte gevoelens en emotionele blokkades',
			'rouw en verlies',
			'emotionele verwerking na intensieve periodes'
		]
	},
	{
		id: 'pijn-en-lichamelijke-klachten',
		title: 'Pijn en lichamelijke klachten',
		body: 'Ervaar je regelmatig spanning of pijn in je rug, nek of schouders? Of heb je last van hoofdpijn of andere lichamelijke ongemakken? Soms kan het moeilijk zijn om je lichaam volledig te ontspannen. Bij fysieke klachten ga je altijd eerst naar de huisarts.',
		services: ['spinal-touch', 'brtt-body', 'cranio-fascia-unwinding'],
		sources: ['spanning in rug, nek en schouders', 'migraine, rug-, nek- en schouderklachten']
	},
	{
		id: 'overprikkeling-en-hooggevoeligheid',
		title: 'Overprikkeling en hooggevoeligheid',
		body: 'Ervaar je prikkels en emoties intens, raak je snel overbelast of heb je moeite om tot rust te komen? Soms kan alles om je heen te veel worden en verlang je naar rust, ruimte en balans.',
		services: ['goldhealing', 'cranio-fascia-unwinding', 'mahatma-healing'],
		sources: [
			'stress en overprikkeling',
			'hooggevoeligheid bij kinderen',
			'behoefte aan rust en ontspanning bij ADHD of autisme',
			'vermoeidheid, onrust en overprikkeling'
		]
	},
	{
		id: 'vastzitten-zonder-duidelijke-klacht',
		title: 'Vastzitten, zonder dat je het kunt benoemen',
		body: 'Soms voel je dat je vastloopt, zonder precies te weten waarom. Oude patronen, overtuigingen of emoties kunnen je persoonlijke groei in de weg staan. Misschien voel je dat het tijd is om los te laten en ruimte te maken voor verandering.',
		services: ['raster-energie', 'mahatma-healing', 'trb-breathwork', 'clearing-ascensie'],
		sources: [
			'energetische blokkades',
			'inzicht en bewustwording',
			'activeren van je zelfgenezend vermogen',
			'moeite met voelen of ontspannen',
			'bewustwording van oude patronen'
		]
	}
];
