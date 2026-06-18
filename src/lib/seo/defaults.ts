/**
 * SEO defaults and SITE_URL source-of-truth.
 * FND-07: SITE_URL must come from $env/dynamic/public.PUBLIC_SITE_URL — never hardcoded.
 * Pitfall #13: per-environment URLs (prod vs preview) differ correctly via env.
 * Pitfall #15: no localhost default — throw loudly when unset.
 */
import { env } from '$env/dynamic/public';
import type { PageMeta } from '$lib/seo/types';

if (!env.PUBLIC_SITE_URL) {
	// Fail loud at build — NEVER default to localhost (FND-07 / Pitfall #15)
	throw new Error(
		'PUBLIC_SITE_URL is required. Set it in Vercel env per environment (see .env.example).'
	);
}

/** Canonical site origin — no trailing slash. e.g. 'https://trinity-breath-healing.vercel.app' */
export const SITE_URL: string = env.PUBLIC_SITE_URL.replace(/\/$/, '');

/**
 * Build a canonical URL from siteUrl origin + path.
 * Guarantees no double-slash regardless of whether path starts with '/'.
 * Used by <Head> component and JSON-LD @id builders.
 */
export function buildCanonical(siteUrl: string, path: string): string {
	const base = siteUrl.replace(/\/$/, '');
	// path always starts with '/' per PageMeta contract
	return base + path;
}

/**
 * Site-wide SEO defaults. Individual +page.ts load() functions override as needed.
 * Description is 150–160 chars (SEO-01 audit gate target).
 */
export const defaults: PageMeta = {
	title: 'TRINITY Breath & Healing',
	// 155 chars — within 150–160 target range (verified)
	description:
		'Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie, ' +
		'ademwerk en energetische behandelingen in Almere en de wijde regio.',
	path: '/',
	og: {
		image: `${SITE_URL}/og-default.jpg`, // TODO: replace with real OG image in Phase 1
		type: 'website'
	}
};
