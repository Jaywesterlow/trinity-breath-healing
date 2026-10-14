import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildWebPage } from '$lib/schema/webpage';
import { buildFaqPage } from '$lib/schema/faq';
import { DEMO_FAQ } from '$lib/demo/content';

/**
 * /demo — the water demo of the landing page (2026-10-14).
 *
 * A second homepage built from scratch on its own philosophy (calm, grounded,
 * real water, more colour) so the owner can compare it with the live one. It
 * is a complete page on its own: one H1, the site's JSON-LD graph plus its own
 * WebPage and FAQPage nodes, hreflang through <Head>, and the same copy source
 * (BRAND, the FAQ items) as the live page.
 *
 * `bare: true` tells the root layout to leave its Nav and Footer off: the demo
 * carries its own. `noindex` keeps it out of the index until it is chosen; it
 * is not in ALL_ROUTES, so it is not in the sitemap either.
 */
export const load: PageLoad = () => {
	const title = 'Ademwerk en lichaamswerk, Amsterdam';
	const description =
		'Lichaamsgerichte therapie, ademwerk en energetische behandelingen in Amsterdam en omgeving. ' +
		'Rustig, persoonlijk en op jouw tempo. Plan een vrijblijvende kennismaking.';
	return {
		bare: true,
		meta: { title, description, path: '/demo', noindex: true, dateModified: __BUILD_DATE__ },
		graph: buildGraph({
			pageSpecific: [
				buildWebPage({ title, description, path: '/demo', dateModified: __BUILD_DATE__ }),
				buildFaqPage(DEMO_FAQ)
			],
			path: '/demo'
		})
	};
};
