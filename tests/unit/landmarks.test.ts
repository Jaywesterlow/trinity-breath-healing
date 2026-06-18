/**
 * landmarks.test.ts — Task 2 TDD gate
 * Tests: SiteNav + SiteFooter semantic landmark elements
 * Requirements: SEO-03 (semantic HTML5 landmarks on every page)
 *
 * Note: The root layout test (Test 11) is complex because it requires
 * rendering +layout.svelte with $page store mocked. We test SiteNav and
 * SiteFooter individually here, which is sufficient for BLOCKER-5.
 * The build-time landmark check (pnpm build + node-html-parser) is the
 * authoritative integration gate for the layout composition.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SiteNav from '$lib/components/SiteNav.svelte';
import SiteFooter from '$lib/components/SiteFooter.svelte';

describe('SiteNav component (src/lib/components/SiteNav.svelte)', () => {
	it('Test 9: renders a single <nav> with aria-label="Hoofdnavigatie"', () => {
		const { container } = render(SiteNav);
		const navs = container.querySelectorAll('nav');
		expect(navs.length).toBe(1);
		expect(navs[0]!.getAttribute('aria-label')).toBe('Hoofdnavigatie');
	});

	it('Test 9b: Phase 0 <nav> contains no <a> link children', () => {
		const { container } = render(SiteNav);
		const links = container.querySelectorAll('nav a');
		expect(links.length).toBe(0);
	});
});

describe('SiteFooter component (src/lib/components/SiteFooter.svelte)', () => {
	it('Test 10: renders a single <footer> with aria-labelledby="site-footer-heading"', () => {
		const { container } = render(SiteFooter);
		const footers = container.querySelectorAll('footer');
		expect(footers.length).toBe(1);
		expect(footers[0]!.getAttribute('aria-labelledby')).toBe('site-footer-heading');
	});

	it('Test 10b: <footer> contains an <h2 id="site-footer-heading"> labelling element', () => {
		const { container } = render(SiteFooter);
		const heading = container.querySelector('h2#site-footer-heading');
		expect(heading, '<h2 id="site-footer-heading"> must exist for aria-labelledby').not.toBeNull();
	});
});

/**
 * Test 11: landmark order in layout (nav → main → footer).
 *
 * This is a structural contract test. The authoritative gate is the post-build
 * node-html-parser check in the Task 2 verify command. Here we test the
 * structural intent by asserting the components individually provide their
 * landmarks — layout composition order is verified by the build gate.
 *
 * If @testing-library/svelte gains stable layout-with-page-store support,
 * this can be promoted to a full render test. For now, the build-time
 * index.html parse covers Test 11 end-to-end.
 */
describe('Layout landmark order (structural contract)', () => {
	it('Test 11: SiteNav provides <nav>, SiteFooter provides <footer> (order verified by build gate)', () => {
		const { container: navContainer } = render(SiteNav);
		const { container: footerContainer } = render(SiteFooter);
		expect(navContainer.querySelector('nav')).not.toBeNull();
		expect(footerContainer.querySelector('footer')).not.toBeNull();
		// The layout mounts: <SiteNav> → <main>{children}</main> → <SiteFooter>
		// Order verified by the post-build HTML parse in Task 2 verify command.
	});
});
