import { env } from '$env/dynamic/public';

if (!env.PUBLIC_SITE_URL) {
	// Fail loud at build — NEVER default to localhost (FND-07 / Pitfall #15)
	throw new Error('PUBLIC_SITE_URL is required. Set it in Vercel env per environment.');
}

export const SITE_URL = env.PUBLIC_SITE_URL.replace(/\/$/, '');

export const defaults = {
	title: 'TRINITY Breath & Healing',
	description:
		'Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie, ' +
		'ademwerk en energetische behandelingen in Almere en omgeving.',
	path: '/',
	og: {
		image: `${SITE_URL}/og-default.jpg`, // TODO: replace with real OG image in Phase 1
		type: 'website' as const
	}
};
