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
 *
 * FAQPage stays on this page, and `/faq` carries its own. That is deliberate, and was briefly
 * reversed before being restored, so the reasoning is worth recording.
 *
 * The argument for removing it was that the same FAQPage on two URLs is a duplication risk.
 * That risk is asserted rather than evidenced — Google does not penalise it, it may simply
 * prefer one — while the cost of removing it is concrete: this page still renders the whole
 * FAQ section, so dropping the markup leaves the site's highest-value URL showing questions
 * and answers that no machine can read as questions and answers.
 *
 * The project's own research is unambiguous on which way that trade goes. Insights/
 * seo-aeo-samenvatting-checklist.md lists "FAQPage op FAQ-secties"; .planning/research/
 * SUMMARY.md calls the FAQ section plus FAQPage JSON-LD "the AEO money block";
 * research/FEATURES.md rates it "HIGHEST AEO LIFT"; PROJECT.md specifies FAQPage "sourced
 * from inline FAQ section" — this section. CLAUDE.md also forbids adopting an SEO tactic on
 * speculation, which is what removing it would have been.
 *
 * If the duplication ever needs settling, do it with evidence from Search Console, not by
 * pre-emptively giving up the markup on the page that matters most.
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
