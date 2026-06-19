import type { PageLoad } from './$types';
import { defaults } from '$lib/seo/defaults';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildWebPage } from '$lib/schema/webpage';

/**
 * Landing page load — overrides layout's base graph with page-specific WebPage node.
 * Plan 05 will replace this with a version that passes dateModified: BUILD_DATE for SEO-09.
 * The wiring is already plumbed (buildWebPage accepts dateModified as optional param).
 */
export const load: PageLoad = async () => ({
	meta: defaults,
	graph: buildGraph({
		pageSpecific: [
			buildWebPage({
				title: defaults.title,
				description: defaults.description,
				path: '/'
				// dateModified: BUILD_DATE — Plan 05 wires this (SEO-09 recency signal)
			})
		],
		path: '/'
	})
});
