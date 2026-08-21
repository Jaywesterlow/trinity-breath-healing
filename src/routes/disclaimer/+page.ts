import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';

/**
 * /disclaimer — het medisch voorbehoud.
 *
 * Indexed, and deliberately so. This is the page that states plainly that the
 * practice is not medical care, does not diagnose, and does not replace a
 * doctor. In the YMYL health category that statement is precisely what a search
 * engine — and a reader — should be able to find, and hiding it behind noindex
 * would be the wrong instinct entirely.
 */
export const prerender = true;

const PATH = '/disclaimer';
const TITLE = 'Disclaimer en medisch voorbehoud bij behandelingen';
const DESCRIPTION =
	'Ademwerk en energetisch werk vervangen geen medische zorg. Lees wat een sessie wel en ' +
	'niet is, wanneer je eerst met je arts overlegt en wat je kunt verwachten.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Disclaimer', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({
			title: TITLE,
			description: DESCRIPTION,
			path: PATH,
			dateModified: LEGAL_LAST_UPDATED
		})
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
