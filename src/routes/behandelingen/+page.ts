import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';

/**
 * /behandelingen — real content as of 2026-09-09, indexed and in the sitemap.
 *
 * No Service nodes here on purpose. /diensten and the seven /diensten/{slug}
 * pages already carry those, and emitting the same seven a third time from a
 * page that is organised by complaint rather than by service would give the
 * same entity three competing homes.
 */
export const prerender = true;

const PATH = '/behandelingen';
const TITLE = 'Behandelingen – waar kom je mee? | Trinity Breath & Healing';
const DESCRIPTION =
	'Stress, slecht slapen, angst, trauma of pijn: vind bij welke klacht welke ' +
	'behandeling past. Ademwerk en energetisch werk in Amsterdam, Zaandam en omgeving.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Behandelingen', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH })
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
