import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { STUB_META } from '$lib/seo/stub-meta';

/**
 * /over-mij — structure and layout are finished; the biography is not.
 *
 * The landing page's "Lees meer over mij" has always pointed here, so this
 * could not stay a "komt binnenkort" card: it is the one page a visitor clicks
 * precisely when they are deciding whether to trust the practitioner.
 *
 * Still `noindex`, deliberately. The page renders <Todo> markers where the
 * practitioner's training, credentials and story go, and this is a health/YMYL
 * site where the About page is the E-E-A-T page — publishing it with visible
 * gaps would put the weakest version of the trust argument in front of Google
 * on the exact URL that carries it.
 *
 * To publish: fill the markers in +page.svelte, delete `noindex` below, and
 * flip this route's `kind` to 'page' in src/lib/constants/routes.ts so it
 * enters the sitemap.
 */
export const prerender = true;

const PATH = '/over-mij';

export const load: PageLoad = async () => {
	const stub = STUB_META[PATH]!;
	const meta = {
		title: stub.title,
		description: stub.description,
		path: PATH,
		noindex: true
	};
	const pageSpecific = [
		buildBreadcrumb(stub.crumbs),
		buildWebPage({ title: stub.title, description: stub.description, path: PATH })
	];
	return { meta, crumbs: stub.crumbs, graph: buildGraph({ pageSpecific, path: PATH }) };
};
