/**
 * SCH-05 + SEO-09 source of truth — WebPage builder with dateModified plumbing.
 *
 * SEO-09: when dateModified is provided, it lands in this WebPage node AND in the
 * visible <time datetime> element on the landing page (wired by Plan 05).
 * Single source = BUILD_DATE injected by Vite define __BUILD_DATE__.
 *
 * IMPORTANT: when dateModified is absent, the key must NOT appear on the returned
 * object (not even as undefined) — use conditional spread to ensure omission.
 * This prevents `dateModified: undefined` from appearing in JSON-LD output.
 *
 * No @id on WebPage (per-page transient — different WebPage per route).
 */
import type { WebPage } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';
import { webSiteNode } from '$lib/schema/shared';

// schema-dts WebSite type includes `string` union — cast to extract the @id string
const siteId = (webSiteNode as unknown as { '@id': string })['@id'];

export function buildWebPage(opts: {
	title: string;
	description: string;
	path: string;
	dateModified?: string;
}): WebPage {
	return {
		'@type': 'WebPage',
		name: opts.title,
		description: opts.description,
		url: `${SITE_URL}${opts.path}`,
		isPartOf: { '@id': siteId },
		...(opts.dateModified ? { dateModified: opts.dateModified } : {})
	};
}
