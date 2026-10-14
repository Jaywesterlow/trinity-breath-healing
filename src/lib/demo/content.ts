/**
 * Copy for the water demo. Everything a visitor reads comes from the same
 * sources the live page uses (BRAND, the FAQ items, the about intro); the few
 * lines that are new to this page are here, in one place, so they can be
 * checked against the owner's voice before any of it goes live.
 */
import { BRAND } from '$lib/constants/brand';
import { faqItems } from '$lib/content/faq/index';

/** The hero, as locked on the live page. */
export const HERO = {
	lines: [
		['Rust', 'in', 'je', 'hoofd.'],
		['Ontspanning', 'in', 'je', 'lichaam.']
	],
	body:
		'Ik weet hoe het voelt om vast te lopen, fysiek, mentaal en emotioneel. Via lichaamsgerichte ' +
		'therapie, ademwerk en energetische behandelingen help ik jou terug naar rust, herstel en jezelf.',
	cta: 'Maak een afspraak',
	phone: `Bel ${BRAND.phoneDisplay}`
} as const;

/** The closing line of the live treatments section, here as the statement. */
export const STATEMENT =
	'Je hoeft niet te weten welke behandeling je nodig hebt. Dat zoeken we in het eerste gesprek samen uit.';

/** Where and how she works, from BRAND.practice. */
export const PRACTICE = [
	{ label: 'Zaterdag', text: BRAND.practice.locationNote },
	{ label: 'Doordeweeks', text: BRAND.practice.homeVisitNote },
	{ label: 'Op afstand', text: BRAND.practice.remoteNote }
] as const;

/** The three steps of the live Werkwijze section, each body with the title it describes. */
export const STEPS = [
	{
		title: 'Kennismaking',
		body: 'We beginnen rustig. In een eerste gesprek kijken we samen wat er speelt en wat je nodig hebt.'
	},
	{
		title: 'De sessie',
		body: 'Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft.'
	},
	{
		title: 'Verdieping',
		body: 'Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf.'
	}
] as const;

/** The first five questions of the FAQ: the homepage's share, the rest lives on /contact. */
export const DEMO_FAQ = faqItems.slice(0, 5);
