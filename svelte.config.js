import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'] })],
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			// regions: ['fra1'] applies to Vercel Functions only; static prerender ships globally via Vercel CDN
			regions: ['fra1']
		}),
		alias: {
			$schema: 'src/lib/schema',
			$content: 'src/content'
		},
		prerender: {
			entries: ['*'], // prerender every discoverable route (Pitfall #8)
			handleHttpError: 'fail' // any 404 during prerender fails the build
		},
		/**
		 * CSP lives here rather than in vercel.json so SvelteKit can hash its own
		 * inline hydration script at build time. A hand-written header would have
		 * needed 'unsafe-inline' to let that script run, which defeats the point
		 * of having a script-src at all.
		 *
		 * The remaining headers (HSTS, nosniff, Referrer-Policy, X-Frame-Options,
		 * Permissions-Policy) stay in vercel.json — a meta-tag CSP cannot express
		 * frame-ancestors, so X-Frame-Options carries that.
		 *
		 * Plausible is the only third party in the list, and only because it is
		 * the one that replaces a worse third party: without it the alternative
		 * is GA4, which would bring cookies and a consent banner with it. It
		 * gets script-src (to load) and connect-src (to post the pageview) and
		 * nothing else — no img-src, so it cannot fall back to a tracking pixel.
		 *
		 * Everything else is 'self': the site loads no other third-party
		 * resource at all, which is what keeps it out of cookie-banner
		 * territory. Adding an embed, a CDN script or a captcha later means
		 * widening this — treat that as the warning it is. A self-hosted
		 * Plausible (PUBLIC_PLAUSIBLE_HOST) needs its origin added here too;
		 * CSP is a build-time header and cannot read a runtime env var.
		 */
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'https://plausible.io'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self', 'https://plausible.io'],
				'form-action': ['self'],
				'base-uri': ['self'],
				'object-src': ['none']
			}
		}
	}
};

export default config;
