/**
 * PageMeta — the single TypeScript contract every route composes with.
 * Non-conforming meta is a compile error.
 * SEO-01..06 plumbing. dateModified field is BLOCKER-3 plumbing for SEO-09.
 */
export interface PageMeta {
	/** Page title — target 50–60 chars. Audit gate in Plan 08 enforces this. */
	title: string;

	/** Meta description — target 150–160 chars. Audit gate enforces this. */
	description: string;

	/** Absolute URL path, leading slash, no trailing slash. e.g. '/over-mij' */
	path: string;

	/** Open Graph overrides. Defaults: type='website', image=SITE_URL+'/og-default.jpg' */
	og?: {
		image?: string;
		type?: 'website' | 'article';
	};

	/**
	 * Set to true to emit <meta name="robots" content="noindex,nofollow">.
	 * Used for Vercel preview environments (Plan 08 wires the env-conditional check).
	 * Default: false.
	 */
	noindex?: boolean;

	/**
	 * YYYY-MM-DD date of last meaningful content change.
	 * Passed through to JSON-LD WebPage.dateModified (Plan 03) and
	 * rendered visibly on landing (Plan 05 — SEO-09 recency signal).
	 */
	dateModified?: string;
}
