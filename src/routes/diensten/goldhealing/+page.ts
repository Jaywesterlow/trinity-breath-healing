import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { makeServiceNode } from '$lib/schema/services';

/**
 * Real content as of 2026-09-09, so this route is indexed and in the sitemap.
 * It was a `service-stub`; the copy it now renders is the practitioner's own,
 * held in `BRAND.services`.
 *
 * The Service node is emitted here rather than only on the landing page. This
 * is the canonical URL for Goldhealing — the one an AI Overview should cite when it
 * answers a question about it — so it is the page that carries the claim.
 */
export const prerender = true;

const PATH = '/diensten/goldhealing';
const TITLE = 'Goldhealing in Amsterdam – Trinity Breath & Healing';
const DESCRIPTION =
	'Gouden lichtenergie die negativiteit omzet, beschermt en vooral op het psychische vlak werkt. Bij Trinity Breath & Healing in Amsterdam en omgeving.';

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Diensten', path: '/diensten' },
	{ name: 'Goldhealing', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH }),
		makeServiceNode('goldhealing', 'Goldhealing')
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
