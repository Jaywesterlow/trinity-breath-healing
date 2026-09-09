/** Single source-of-truth for all 21 site routes.
 *
 * `kind` is what the sitemap filters on: 'stub' and 'service-stub' are excluded,
 * everything else is submitted. Eleven routes graduated to 'page' on 2026-09-09
 * when they got real content — the seven modalities, their /diensten index, plus
 * /behandelingen, /werkwijze and /contact. Flipping the kind is the whole switch;
 * their +page.ts files dropped `noindex: true` at the same time.
 *
 * Consumed by: sitemap.xml endpoint, Plan 05 stub pages, Phase 1 SiteNav, Phase 5 verification.
 * Slugs locked by CONTEXT.md D-04 (14 stubs + landing) and D-08 (originally 4 service slugs) —
 * D-08 superseded 260810-mdl: the owner approved 7 real services (BRTT Body and Trauma Release
 * Breathwork ship as separate services, not one), so 3 more service-stub routes joined here.
 */
/**
 * The vocabulary, declared rather than inferred. Without this, `as const` narrows
 * `kind` to whatever values happen to be in use today, and the moment the last
 * 'service-stub' graduated every `r.kind === 'service-stub'` comparison in the
 * sitemap and its tests became a type error for describing a state the codebase
 * is designed to return to.
 */
export type RouteKind = 'landing' | 'page' | 'stub' | 'service-stub';

export const ALL_ROUTES: readonly { path: string; title: string; kind: RouteKind }[] = [
	{ path: '/', title: 'TRINITY Breath & Healing', kind: 'landing' },
	{ path: '/werkwijze', title: 'Werkwijze', kind: 'page' },
	{ path: '/over-mij', title: 'Over mij', kind: 'stub' },
	{ path: '/behandelingen', title: 'Behandelingen', kind: 'page' },
	{ path: '/contact', title: 'Contact', kind: 'page' },
	{ path: '/diensten', title: 'Diensten', kind: 'page' },
	{ path: '/diensten/mahatma-healing', title: 'Mahatma Healing', kind: 'page' },
	{ path: '/diensten/goldhealing', title: 'Goldhealing', kind: 'page' },
	{ path: '/diensten/raster-energie', title: 'Raster Energie', kind: 'page' },
	{
		path: '/diensten/cranio-fascia-unwinding',
		title: 'Cranio & Fascia Unwinding',
		kind: 'page'
	},
	{ path: '/diensten/spinal-touch', title: 'Spinal Touch', kind: 'page' },
	{ path: '/diensten/brtt-body', title: 'BRTT Body', kind: 'page' },
	{ path: '/diensten/trb-breathwork', title: 'Trauma Release Breathwork', kind: 'page' },
	{ path: '/blog', title: 'Blog', kind: 'stub' },
	{ path: '/artikelen', title: 'Artikelen', kind: 'stub' },
	{ path: '/faq', title: 'Veelgestelde vragen', kind: 'page' },
	/* The three legal pages carry real content and are indexed on purpose: in the
	   YMYL health category a findable privacy statement and a findable medical
	   disclaimer are trust signals, not boilerplate to hide. */
	{ path: '/privacyverklaring', title: 'Privacyverklaring', kind: 'page' },
	{ path: '/algemene-voorwaarden', title: 'Algemene voorwaarden', kind: 'page' },
	{ path: '/disclaimer', title: 'Disclaimer', kind: 'page' },
	/* Reserved for Review + AggregateRating structured data. The footer already
	   links "Reviews", so the URL has to exist before launch either way. */
	{ path: '/reviews', title: 'Reviews', kind: 'stub' }
] as const;

export type RouteEntry = (typeof ALL_ROUTES)[number];
