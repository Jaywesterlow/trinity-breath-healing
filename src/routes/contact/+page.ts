import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';

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
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH })
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
