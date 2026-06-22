import type { LayoutLoad } from './$types';
import { defaults } from '$lib/seo/defaults';

export const prerender = true; // SSG default for the whole site (Pattern 1)
export const trailingSlash = 'never'; // canonical = no trailing slash; SvelteKit 301s slashed form

export const load: LayoutLoad = async ({ url }) => {
	return {
		meta: { ...defaults, path: url.pathname }, // root defaults; route +page.ts overrides
		graph: [] // placeholder until Plan 02 wires <JsonLd> and schema primitives
	};
};
