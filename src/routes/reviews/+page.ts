import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';

/**
 * /reviews — published 2026-11-24 with three client reviews (`$lib/content/reviews`).
 * Its metadata moved here from STUB_META when it graduated, like /tarieven; the
 * route is `kind: 'page'` in routes.ts, so it is in the sitemap and indexed.
 */
export const prerender = true;

const PATH = '/reviews';
const TITLE = 'Reviews en ervaringen van cliënten';
const DESCRIPTION =
	'Ervaringen van cliënten van Trinity Breath & Healing in hun eigen woorden: Mahatma & Gold Healing, Cranio & Fascia Unwinding, Clearing en Rasterenergie.';
const LEAD =
	'Drie cliënten vertellen in hun eigen woorden over hun behandelingen. Twee van hen schreven hun ervaring in het Engels.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Reviews', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH })
	];
	return { meta, crumbs: CRUMBS, lead: LEAD, graph: buildGraph({ pageSpecific, path: PATH }) };
};
