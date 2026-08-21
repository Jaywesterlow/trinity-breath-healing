import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/seo/defaults';
import { ALL_ROUTES } from '$lib/constants/routes';

// Prerendered at build time — sitemap.xml lands in static output (SEO-07).
export const prerender = true;

export const GET: RequestHandler = () => {
	const today = new Date().toISOString().split('T')[0];

	/**
	 * Stubs are excluded. Submitting fourteen placeholder pages invites Google to
	 * index them, and thin content at that ratio is judged against the whole
	 * domain rather than only those URLs. They stay reserved in ALL_ROUTES — the
	 * zero-301 guarantee of FND-08 — and rejoin the sitemap by flipping `kind`
	 * once they carry content.
	 */
	const urls = ALL_ROUTES.filter((r) => r.kind !== 'stub' && r.kind !== 'service-stub')
		.map(
			(r) => `
  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${r.path === '/' ? '1.0' : '0.5'}</priority>
  </url>`
		)
		.join('');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400'
		}
	});
};
