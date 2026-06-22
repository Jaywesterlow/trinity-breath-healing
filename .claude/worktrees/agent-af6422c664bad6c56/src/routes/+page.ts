import type { PageLoad } from './$types';
import { defaults } from '$lib/seo/defaults';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildWebPage } from '$lib/schema/webpage';

/**
 * Landing page load — SEO-09 wiring (Plan 05, BLOCKER-3 closure).
 * __BUILD_DATE__ is injected at build time by Vite define (vite.config.ts).
 * The SAME value flows to BOTH:
 *   1. meta.dateModified → visible <time datetime> in +page.svelte
 *   2. buildWebPage({ dateModified }) → JSON-LD WebPage.dateModified in @graph
 * Single source of truth: no drift between visible UI and structured data.
 */
export const load: PageLoad = async () => ({
	meta: { ...defaults, dateModified: __BUILD_DATE__ },
	graph: buildGraph({
		pageSpecific: [
			buildWebPage({
				title: defaults.title,
				description: defaults.description,
				path: '/',
				dateModified: __BUILD_DATE__
			})
		],
		path: '/'
	})
});
