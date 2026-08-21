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
		 * Everything is 'self': the site loads no third-party resources at all,
		 * which is also what keeps it out of cookie-banner territory. Adding an
		 * embed, a CDN script or a captcha later means widening this — treat that
		 * as the warning it is.
		 */
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'form-action': ['self'],
				'base-uri': ['self'],
				'object-src': ['none']
			}
		}
	}
};

export default config;
