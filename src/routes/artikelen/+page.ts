import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { STUB_META } from '$lib/seo/stub-meta';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const stub = STUB_META[url.pathname];
	if (!stub) throw new Error(`no STUB_META entry for ${url.pathname}`);
	const meta = { title: stub.title, description: stub.description, path: url.pathname };
	const pageSpecific = [
		buildBreadcrumb(stub.crumbs),
		buildWebPage({ title: stub.title, description: stub.description, path: url.pathname })
	];
	return { meta, graph: buildGraph({ pageSpecific, path: url.pathname }) };
};
