import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/seo/defaults';
import { buildRobotsTxt } from '$lib/seo/robots';

// Prerendered at build time, same as sitemap.xml — robots.txt lands in the static output.
export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(buildRobotsTxt(SITE_URL), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400'
		}
	});
