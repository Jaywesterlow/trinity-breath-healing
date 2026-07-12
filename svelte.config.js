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
		}
	}
};

export default config;
