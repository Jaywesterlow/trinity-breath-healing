import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { buildFaqPage } from '$lib/schema/faq';
import { faqItems } from '$lib/content/faq/index';

/** /contact — real content as of 2026-09-09, indexed and in the sitemap. */
export const prerender = true;

const PATH = '/contact';
const TITLE = 'Contact en afspraak maken | TRINITY Breath & Healing';
const DESCRIPTION =
	'Plan een vrijblijvende kennismaking van dertig minuten, stuur een bericht of ' +
	'app gerust. Trinity Breath & Healing, Amsterdam-Zuidoost en de hele regio.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Contact', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH }),
		// The FAQ lives on this page since 2026-09-18 (was /faq); its schema comes along.
		buildFaqPage(faqItems)
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
