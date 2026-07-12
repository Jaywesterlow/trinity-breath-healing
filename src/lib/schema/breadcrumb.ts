/**
 * SCH-06 source of truth — BreadcrumbList builder.
 * buildBreadcrumb(crumbs) returns a typed BreadcrumbList with absolute URLs.
 *
 * NO @id on BreadcrumbList (per-page transient — different list per page,
 * no cross-page dedup needed).
 */
import type { BreadcrumbList } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';

export function buildBreadcrumb(crumbs: { name: string; path: string }[]): BreadcrumbList {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: `${SITE_URL}${c.path}`
		}))
	};
}
