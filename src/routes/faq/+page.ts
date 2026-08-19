import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { buildFaqPage } from '$lib/schema/faq';
import { faqItems } from '$lib/content/faq/index';

/**
 * /faq — the first stub route to ship real content. Was `StubLayout`; a crawlable page
 * with no content is a liability for a site whose primary success metric is SEO/AEO
 * discoverability, and `Footer.svelte` links here.
 *
 * JSON-LD decision: this route — not the landing page — owns the FAQPage entity.
 * `src/lib/components/global/Faq.svelte` (and its `faqItems` source of truth) is still
 * rendered on both `/` and here, but emitting the identical FAQPage node from two different
 * URLs is a duplication risk with no upside. `/faq` is the dedicated, citeable resource for
 * these exact questions — the URL a search engine or AI Overview should point to when citing
 * an answer — so it's the one that carries the structured-data claim. See `../+page.ts` for
 * the landing-page side of this decision.
 */
export const prerender = true;

const PATH = '/faq';
const TITLE = 'Veelgestelde vragen over ademwerk en behandelingen';
const DESCRIPTION =
	'Antwoord op de vragen die we het vaakst horen over ademwerk, Mahatma Healing, Goldhealing, ' +
	'Raster Energie en Spinal Touch: duur, kosten, geschiktheid en meer.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Veelgestelde vragen', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH }),
		buildFaqPage(faqItems)
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
