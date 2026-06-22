import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	// SEO-09: BUILD_DATE is inlined at build time and consumed by src/routes/+page.ts + +page.svelte.
	// Single source of truth between visible <time datetime> and JSON-LD WebPage.dateModified.
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0])
	},
	plugins: [
		enhancedImages(), // PRF-01: AVIF/WebP + responsive srcset + dimensions — MUST come BEFORE sveltekit()
		sveltekit()
		// NO Tailwind plugin, NO PostCSS preset — plain CSS locked per CONTEXT.md D-09
	],
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			$schema: resolve('./src/lib/schema'),
			$content: resolve('./src/content')
		}
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()], // Required for @testing-library/svelte to resolve browser Svelte
				test: {
					name: 'unit',
					environment: 'jsdom',
					include: ['tests/unit/**/*.{test,spec}.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'scripts',
					environment: 'node',
					include: ['tests/scripts/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
