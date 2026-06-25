/**
 * landmarks.test.ts — semantic landmark smoke gate
 * Tests: Nav + Footer global components expose HTML5 landmarks
 * Requirements: SEO-03 (semantic HTML5 landmarks on every page)
 *
 * Scope note: the frontend was reset to a blank slate (Nav stub + empty Footer
 * stub), so this asserts the landmarks the CURRENT components actually render.
 * The richer footer contract (aria-labelledby + <h2>) returns when the Footer
 * section is built out in a later phase — extend these assertions then.
 * The build-time landmark check (build + node-html-parser) remains the
 * authoritative integration gate for layout composition order.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';

// Nav reads $page from $app/stores — mock it so the component renders in jsdom.
vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/') }) };
});

import { Nav, Footer } from '$lib/components/global';

describe('Nav landmark (src/lib/components/global/Nav.svelte)', () => {
	it('renders a <nav> landmark with an aria-label', () => {
		const { container } = render(Nav);
		const nav = container.querySelector('nav[aria-label="Site navigatie"]');
		expect(nav, 'nav[aria-label="Site navigatie"] must exist').not.toBeNull();
	});

	it('nav contains navigation links', () => {
		const { container } = render(Nav);
		const links = container.querySelectorAll('nav a');
		expect(links.length).toBeGreaterThan(0);
	});
});

describe('Footer landmark (src/lib/components/global/Footer.svelte)', () => {
	it('renders exactly one <footer> landmark', () => {
		const { container } = render(Footer);
		expect(container.querySelectorAll('footer').length).toBe(1);
	});
});
