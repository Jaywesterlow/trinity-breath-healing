import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { LEGAL_LAST_UPDATED } from '$lib/legal/meta';

/** /algemene-voorwaarden — real content, graduated out of STUB_META. */
export const prerender = true;

const PATH = '/algemene-voorwaarden';
const TITLE = 'Algemene voorwaarden voor sessies en behandelingen';
const DESCRIPTION =
	'De afspraken rond een sessie bij Trinity Breath & Healing: hoe een afspraak tot stand ' +
	'komt, tarieven, annuleren en verzetten, aansprakelijkheid en klachten.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Algemene voorwaarden', path: PATH }
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
