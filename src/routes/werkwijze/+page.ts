import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';

/** /werkwijze — real content as of 2026-09-09, indexed and in the sitemap. */
export const prerender = true;

const PATH = '/werkwijze';
const TITLE = 'Werkwijze – zo verloopt een sessie | Trinity Breath & Healing';
const DESCRIPTION =
	'Van kennismaking tot de dagen na een behandeling: wat er gebeurt, hoe lang ' +
	'het duurt en wat je zelf moet doen. Amsterdam, bij jou thuis of op afstand.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Werkwijze', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH })
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
