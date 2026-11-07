import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';

/**
 * Prices live in `$lib/content/tarieven`; the Offer data is on each service's own
 * Service node, so this page claims nothing a /diensten page does not.
 */
export const prerender = true;

const PATH = '/tarieven';
const TITLE = 'Tarieven – behandelingen en prijzen | TRINITY Breath & Healing';
const DESCRIPTION =
	'Alle tarieven van Trinity Breath & Healing op een rij: energetische behandelingen vanaf €45, ' +
	'lichaamsgericht werk, ademwerk en sessies aan huis. Inclusief btw.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Tarieven', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH })
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
