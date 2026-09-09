import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { allServiceNodes } from '$lib/schema/services';

/**
 * /diensten — real content as of 2026-09-09, indexed and in the sitemap.
 *
 * This route carries all seven Service nodes, because it is the page that lists
 * all seven. Each individual /diensten/{slug} page emits only its own node, so
 * nothing is claimed twice from the same URL and every modality still has one
 * canonical page to be cited from.
 */
export const prerender = true;

const PATH = '/diensten';
const TITLE = 'Diensten – alle behandelingen | TRINITY Breath & Healing';
const DESCRIPTION =
	'Alle zeven behandelingen van Trinity Breath & Healing op een rij: ademwerk, ' +
	'lichaamsgericht werk en energetische sessies in Amsterdam, Zaandam en omgeving.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Diensten', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH }),
		...allServiceNodes
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
