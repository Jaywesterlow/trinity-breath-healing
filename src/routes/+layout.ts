import type { LayoutLoad } from './$types';
import { defaults } from '$lib/seo/defaults';
import { buildGraph } from '$lib/schema/buildGraph';

export const prerender = true; // SSG default for the whole site (Pattern 1)
export const trailingSlash = 'never'; // canonical = no trailing slash; SvelteKit 301s slashed form

export const load: LayoutLoad = async ({ url }) => {
	return {
		meta: { ...defaults, path: url.pathname }, // root defaults; route +page.ts overrides
		// SCH-01: graph composed here as base; route +page.ts overrides with page-specific nodes
		// (WebPage, BreadcrumbList, FAQPage etc.) via their own buildGraph() call
		graph: buildGraph({ pageSpecific: [], path: url.pathname })
	};
};
