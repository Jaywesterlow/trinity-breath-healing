/** Single source-of-truth for all 15 site routes.
 * Consumed by: sitemap.xml endpoint, Plan 05 stub pages, Phase 1 SiteNav, Phase 5 verification.
 * Slugs locked by CONTEXT.md D-04 (14 stubs + landing) and D-08 (4 service slugs).
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
	{ path: '/diensten/spinal-touch', title: 'Spinal Touch', kind: 'service-stub' },
	{ path: '/blog', title: 'Blog', kind: 'stub' },
	{ path: '/artikelen', title: 'Artikelen', kind: 'stub' },
	{ path: '/faq', title: 'Veelgestelde vragen', kind: 'stub' },
	{ path: '/privacyverklaring', title: 'Privacyverklaring', kind: 'stub' },
	{ path: '/algemene-voorwaarden', title: 'Algemene voorwaarden', kind: 'stub' }
] as const;

export type RouteEntry = (typeof ALL_ROUTES)[number];
