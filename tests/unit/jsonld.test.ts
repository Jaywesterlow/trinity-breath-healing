/**
 * jsonld.test.ts — TDD gate for Task 2
 * Tests: <JsonLd> Svelte component + <Breadcrumbs> Svelte component
 * Requirements: SCH-01 (single JSON-LD per page), T-00-jsonld (</script escape)
 *
 * Behavior covered:
 * 1. <JsonLd graph> produces <script type="application/ld+json"> with @context + @graph
 * 2. </script in graph string value is escaped to <\/script (T-00-jsonld defense in depth)
 * 3. Breadcrumbs renders visible <nav> with links
 * 4. Breadcrumbs does NOT emit its own JSON-LD <script> (Pitfall #6 — single mount in layout)
 *
 * Uses @testing-library/svelte for component rendering in jsdom environment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';

// Svelte components (imported after mocking env)
import JsonLd from '$lib/components/JsonLd.svelte';
import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

// Mock env — JsonLd doesn't need it directly but shared.ts is indirectly imported in tests
// via Breadcrumbs. We mock here to avoid unset PUBLIC_SITE_URL errors.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
}));

describe('<JsonLd> component', () => {
	it('Test 1: renders <script type="application/ld+json"> in head with @context and @graph', () => {
		const graph = [{ '@type': 'Organization' as const, name: 'Trinity' }];
		render(JsonLd, { props: { graph } });

		// @testing-library/svelte renders into document; svelte:head content goes to document.head
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts.length).toBeGreaterThanOrEqual(1);

		const lastScript = scripts[scripts.length - 1]!;
		const parsed = JSON.parse(lastScript.textContent ?? '{}');
		expect(parsed['@context']).toBe('https://schema.org');
		expect(Array.isArray(parsed['@graph'])).toBe(true);
	});

	it('Test 2 (T-00-jsonld): </script in graph value is escaped to <\\/script', () => {
		// Inject a malicious string to verify XSS defense in depth
		const graph = [
			{
				'@type': 'Organization' as const,
				description: 'Hello </script><script>alert(1)</script>'
			}
		];
		render(JsonLd, { props: { graph } });

		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		const lastScript = scripts[scripts.length - 1]!;
		const rawContent = lastScript.textContent ?? '';

		// The raw text content in jsdom won't contain literal </script> because the browser
		// parser already closes the script tag at </script. Instead, verify via innerHTML
		// approach: the serialized JSON should have replaced </script with <\/script
		// We test the component's $derived serialized value by checking the outer HTML.
		// jsdom parses </script> in textContent as closing the script — so we check outerHTML
		const outerHTML = lastScript.outerHTML;
		// The escaped form <\/script should appear in the raw HTML
		// jsdom stores textContent after parsing; check that no unescaped </script appears
		// in any remaining parseable manner — the raw serialization used <\/script
		expect(outerHTML).toContain('<\\/script');
	});
});

describe('<Breadcrumbs> component', () => {
	it('Test 3: renders visible <nav> with breadcrumb items', () => {
		const items = [
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		];
		const { container } = render(Breadcrumbs, { props: { items } });

		const nav = container.querySelector('nav');
		expect(nav).not.toBeNull();
		// Should contain visible links
		const links = container.querySelectorAll('a');
		expect(links.length).toBeGreaterThanOrEqual(1);
	});

	it('Test 4: Breadcrumbs does NOT emit its own <script type="application/ld+json">', () => {
		// Pitfall #6: BreadcrumbList enters the page graph via +page.ts load(),
		// NOT via a second <JsonLd> inside <Breadcrumbs>.
		// Count scripts BEFORE render
		const beforeCount = document.head.querySelectorAll('script[type="application/ld+json"]').length;

		render(Breadcrumbs, {
			props: { items: [{ name: 'Home', path: '/' }] }
		});

		// Count AFTER render — should not have increased
		const afterCount = document.head.querySelectorAll('script[type="application/ld+json"]').length;
		expect(afterCount).toBe(beforeCount);
	});
});
