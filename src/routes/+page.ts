import type { PageLoad } from './$types';
import { defaults } from '$lib/seo/defaults';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildWebPage } from '$lib/schema/webpage';
import { faqItems } from '$lib/content/faq/index';
import { buildFaqPage } from '$lib/schema/faq';

/**
 * Landing page load — SEO-09 / BLOCKER-3.
 *
 * __BUILD_DATE__ is injected by Vite at build time (vite.config.ts `define` block).
 * It resolves to a YYYY-MM-DD string (e.g. '2026-06-20').
 *
 * Single source of truth: the same BUILD_DATE value flows to:
 *   1. meta.dateModified → rendered as visible <time datetime={data.meta.dateModified}> in +page.svelte
 *   2. buildWebPage({ dateModified: __BUILD_DATE__ }) → JSON-LD WebPage.dateModified in @graph
 *
 * Both UI and structured data agree — no drift possible. Phase 1 may add per-section
 * dateModified from MDX/Sanity frontmatter; this landing date persists as the site-level signal.
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
			}),
			buildFaqPage(faqItems)
		],
		path: '/'
	})
});
