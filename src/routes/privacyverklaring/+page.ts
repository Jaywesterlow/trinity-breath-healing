import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';

/**
 * /privacyverklaring — real content, graduated out of STUB_META.
 *
 * Indexed on purpose. A privacy statement is one of the trust signals Google
 * looks for in the YMYL health category, and a site that collects health
 * complaints through a form and then hides its privacy policy behind noindex
 * is making the opposite argument to the one it wants to make.
 */
export const prerender = true;

const PATH = '/privacyverklaring';
const TITLE = 'Privacyverklaring — zo ga ik met jouw gegevens om';
const DESCRIPTION =
	'Welke persoonsgegevens Trinity Breath & Healing verwerkt, waarom, hoe lang ze bewaard ' +
	'blijven en welke rechten je hebt onder de AVG. Ook wie ze nog meer ziet.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Privacyverklaring', path: PATH }
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
