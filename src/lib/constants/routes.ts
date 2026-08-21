/** Single source-of-truth for all 18 site routes.
 * Consumed by: sitemap.xml endpoint, Plan 05 stub pages, Phase 1 SiteNav, Phase 5 verification.
 * Slugs locked by CONTEXT.md D-04 (14 stubs + landing) and D-08 (originally 4 service slugs) —
 * D-08 superseded 260810-mdl: the owner approved 7 real services (BRTT Body and Trauma Release
 * Breathwork ship as separate services, not one), so 3 more service-stub routes joined here.
 */
export const ALL_ROUTES = [
	{ path: '/', title: 'TRINITY Breath & Healing', kind: 'landing' },
	{ path: '/werkwijze', title: 'Werkwijze', kind: 'stub' },
	{ path: '/over-mij', title: 'Over mij', kind: 'stub' },
	{ path: '/behandelingen', title: 'Behandelingen', kind: 'stub' },
	{ path: '/contact', title: 'Contact', kind: 'stub' },
	{ path: '/diensten', title: 'Diensten', kind: 'stub' },
	{ path: '/diensten/mahatma-healing', title: 'Mahatma Healing', kind: 'service-stub' },
	{ path: '/diensten/goldhealing', title: 'Goldhealing', kind: 'service-stub' },
	{ path: '/diensten/raster-energie', title: 'Raster Energie', kind: 'service-stub' },
	{
		path: '/diensten/cranio-fascia-unwinding',
		title: 'Cranio & Fascia Unwinding',
		kind: 'service-stub'
	},
	{ path: '/diensten/spinal-touch', title: 'Spinal Touch', kind: 'service-stub' },
	{ path: '/diensten/brtt-body', title: 'BRTT Body', kind: 'service-stub' },
	{ path: '/diensten/trb-breathwork', title: 'Trauma Release Breathwork', kind: 'service-stub' },
	{ path: '/blog', title: 'Blog', kind: 'stub' },
	{ path: '/artikelen', title: 'Artikelen', kind: 'stub' },
	{ path: '/faq', title: 'Veelgestelde vragen', kind: 'page' },
	{ path: '/privacyverklaring', title: 'Privacyverklaring', kind: 'stub' },
	{ path: '/algemene-voorwaarden', title: 'Algemene voorwaarden', kind: 'stub' },
	/* Medisch voorbehoud. A health-adjacent site making any claim about what a
	   treatment does needs one, and Google treats this category as YMYL. */
	{ path: '/disclaimer', title: 'Disclaimer', kind: 'stub' },
	/* Reserved for Review + AggregateRating structured data. The footer already
	   links "Reviews", so the URL has to exist before launch either way. */
	{ path: '/reviews', title: 'Reviews', kind: 'stub' }
] as const;

export type RouteEntry = (typeof ALL_ROUTES)[number];
