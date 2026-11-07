import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';
import { buildWebPage } from '$lib/schema/webpage';
import { makeServiceNode } from '$lib/schema/services';

/** One page for both, her wish (WhatsApp 2026-10-31, 20:45): the Clearing and its two activations. */
export const prerender = true;

const PATH = '/diensten/clearing-ascensie';
const TITLE = 'Clearing & Ascensie-activatie – TRINITY Breath & Healing';
const DESCRIPTION =
	'Energetische opschoning van lichaam en energieveld, gevolgd door twee activaties van je ' +
	"chakra's. Los te boeken of als compleet traject, in Amsterdam en omgeving.";

const CRUMBS = [
	{ name: 'Home', path: '/' },
	{ name: 'Diensten', path: '/diensten' },
	{ name: 'Clearing & Ascensie-activatie', path: PATH }
];

export const load: PageLoad = async () => {
	const meta = { title: TITLE, description: DESCRIPTION, path: PATH };
	const pageSpecific = [
		buildBreadcrumb(CRUMBS),
		buildWebPage({ title: TITLE, description: DESCRIPTION, path: PATH }),
		makeServiceNode('clearing-ascensie', 'Clearing & Ascensie-activatie')
	];
	return { meta, crumbs: CRUMBS, graph: buildGraph({ pageSpecific, path: PATH }) };
};
