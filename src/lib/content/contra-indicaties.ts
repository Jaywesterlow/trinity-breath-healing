/**
 * Contra-indicaties per groep behandelingen. /disclaimer toont alle groepen, elke
 * /diensten-pagina alleen de zijne, allebei uit dit bestand, zodat de twee niet
 * uit elkaar kunnen lopen.
 *
 * Bronnen, in haar woorden:
 * - energetisch: WhatsApp 2026-10-31, 19:51
 * - TRB: formulier 2026-10-31, haar twee lijsten samengevoegd
 * - Spinal Touch: haar intakeformulier, pagina 7 (WhatsApp 2026-10-31, 19:21)
 *
 * Bewust niet hier: de medicijnnamen uit haar TRB-lijst. Die horen in de intake,
 * niet op een openbare pagina. De neusspray staat er wel, als iets om te
 * bespreken: de disclaimer zegt dat niemand zelf met medicatie stopt, dus de site
 * mag dat ook niet vragen (Jaymar, 2026-11-01).
 *
 * Cranio & Fascia Unwinding en BRTT Body hebben nog geen lijst van haar, zie
 * TODO.md §11.
 */

export interface ContraGroup {
	id: string;
	title: string;
	/** Treatments in this group, as written on /disclaimer. */
	treatments: string;
	/** Slugs in BRAND.services whose page shows this group. */
	slugs: readonly string[];
	/** Sentence(s) above the list, or the whole text when there is no list. */
	intro: string;
	items?: readonly string[];
	prepTitle?: string;
	prep?: readonly string[];
	outro?: string;
}

export const CONTRA_GROUPS: readonly ContraGroup[] = [
	{
		id: 'energetisch',
		title: 'Energetische sessies',
		treatments: 'Mahatma Healing, Raster Energie, Goldhealing en Clearing & Ascensie-activaties',
		slugs: ['mahatma-healing', 'goldhealing', 'raster-energie', 'clearing-ascensie'],
		intro:
			'Bij epilepsie, een pacemaker of ernstige psychische aandoeningen, zoals schizofrenie of psychosegevoeligheid, is het belangrijk dit vooraf te melden. Er kan dan geen energetische sessie gedaan worden.',
		outro: 'We kunnen dan kijken voor een andere passende en verantwoorde behandeling.'
	},
	{
		id: 'spinal-touch',
		title: 'Spinal Touch',
		treatments: 'Spinal Touch',
		slugs: ['spinal-touch'],
		intro: 'Spinal Touch wordt afgeraden bij:',
		items: [
			'gediagnosticeerde complexe PTSS',
			'ernstige psychische aandoeningen (bipolair, schizofrenie, psychose)',
			'zware medicatie die de hersenchemie verandert (antidepressiva, anti-angst, antipsychotica)',
			'recentelijke lichamelijke verwondingen als breuken en/of operaties',
			'epilepsie',
			"geschiedenis of diagnose van aneurysma's",
			'cardiovasculaire problemen',
			'geschiedenis van aanvallen',
			'ernstig astma',
			'hartaandoening(en)',
			'opname voor een psychiatrische aandoening, emotionele crisis of spirituele awakening in de afgelopen drie jaar',
			'alle andere medische, psychiatrische of fysieke aandoeningen die het vermogen om deel te nemen aan activiteiten met intense fysieke en/of emotionele ontlading zouden aantasten of beïnvloeden'
		]
	},
	{
		id: 'trb',
		title: 'Trauma Release Breathwork',
		treatments: 'Trauma Release Breathwork',
		slugs: ['trb-breathwork'],
		intro: 'Je kunt niet deelnemen aan een TRB-sessie bij:',
		items: [
			'hartziektes of hartklachten',
			'zwangerschap',
			'recente hersenbloedingen',
			'epilepsie',
			'glaucoom',
			'ernstige astmatische aandoeningen',
			'psychose',
			'borderline',
			'schizofrenie',
			'meervoudige persoonlijkheidsstoornis',
			'een verslaving aan psychoactieve middelen, zowel soft- als harddrugs',
			'een medische behandeling, denk aan glaucoom, hartklachten of een hersenbloeding',
			'een huidige of eerdere behandeling voor psychische klachten, bijvoorbeeld schizofrenie, psychose en/of epilepsie'
		],
		prepTitle: 'Ter voorbereiding',
		prep: [
			'geen drugs 2 weken voor aanvang van de sessie',
			'geen entheogene middelen of psilocybine 1 week voor aanvang van de sessie, microdosing in overleg',
			'geen alcohol 3 dagen voor aanvang'
		],
		outro:
			'Gebruik je medicatie? Bespreek dit vooraf met mij. Neusspray wordt rond een sessie afgeraden: geef het aan als je die gebruikt, dan kijken we samen wat past.'
	}
];

export function contraGroupFor(slug: string): ContraGroup | undefined {
	return CONTRA_GROUPS.find((group) => group.slugs.includes(slug));
}
