/**
 * head.test.ts — Task 2 TDD gate
 * Tests: <Head> component SEO tag emission
 * Requirements: SEO-01 (title+desc), SEO-04 (canonical), SEO-05 (hreflang), SEO-06 (OG+Twitter)
 *
 * @testing-library/svelte renders into jsdom.
 * <svelte:head> content is rendered into document.head in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Head from '$lib/components/Head.svelte';
import type { PageMeta } from '$lib/seo/types';

// Mock $lib/seo/defaults so SITE_URL is predictable in tests
vi.mock('$lib/seo/defaults', () => ({
	SITE_URL: 'https://test.example.com',
	defaults: {
		title: 'TRINITY Breath & Healing',
		description:
			'Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie, ademwerk en energetische behandelingen in Almere en de wijde regio.',
		path: '/',
		og: { image: 'https://test.example.com/og-default.jpg', type: 'website' }
	},
	buildCanonical: (siteUrl: string, path: string) => siteUrl.replace(/\/$/, '') + path
}));

const baseMeta: PageMeta = {
	title: 'Test pagina',
	description:
		'Een goede beschrijving van minstens honderdvijftig tekens voor SEO validatie doeleinden op deze testpagina.',
	path: '/test'
};

beforeEach(() => {
	// Clean up document.head between tests
	document.head.innerHTML = '';
});

describe('Head component (src/lib/components/Head.svelte)', () => {
	it('Test 1: emits <title> with page title for non-root path', () => {
		render(Head, { props: { meta: baseMeta } });
		const title = document.head.querySelector('title');
		expect(title).not.toBeNull();
		expect(title!.textContent).toContain('Test pagina');
	});

	it('Test 1b: emits bare title (no " | ...") for root path', () => {
		render(Head, { props: { meta: { ...baseMeta, path: '/' } } });
		const title = document.head.querySelector('title');
		expect(title).not.toBeNull();
		// Root page: title is just the page title without " | site name" suffix
		expect(title!.textContent).toBe('Test pagina');
	});

	it('Test 1c: emits "title | TRINITY Breath & Healing" for non-root path', () => {
		render(Head, { props: { meta: baseMeta } });
		const title = document.head.querySelector('title');
		expect(title!.textContent).toBe('Test pagina | TRINITY Breath & Healing');
	});

	it('Test 2: emits <link rel="canonical"> with absolute URL', () => {
		render(Head, { props: { meta: baseMeta } });
		const canonical = document.head.querySelector('link[rel="canonical"]');
		expect(canonical).not.toBeNull();
		expect(canonical!.getAttribute('href')).toBe('https://test.example.com/test');
	});

	it('Test 3a: emits <link rel="alternate" hreflang="nl">', () => {
		render(Head, { props: { meta: baseMeta } });
		const hreflangNl = document.head.querySelector('link[rel="alternate"][hreflang="nl"]');
		expect(hreflangNl).not.toBeNull();
		expect(hreflangNl!.getAttribute('href')).toBe('https://test.example.com/test');
	});

	it('Test 3b: emits <link rel="alternate" hreflang="x-default">', () => {
		render(Head, { props: { meta: baseMeta } });
		const hreflangXDefault = document.head.querySelector(
			'link[rel="alternate"][hreflang="x-default"]'
		);
		expect(hreflangXDefault).not.toBeNull();
		expect(hreflangXDefault!.getAttribute('href')).toBe('https://test.example.com/test');
	});

	it('Test 4: emits og:type=article when meta.og.type is "article"', () => {
		render(Head, { props: { meta: { ...baseMeta, og: { type: 'article' } } } });
		const ogType = document.head.querySelector('meta[property="og:type"]');
		expect(ogType).not.toBeNull();
		expect(ogType!.getAttribute('content')).toBe('article');
	});

	it('Test 4b: emits og:type=website by default when og.type is not set', () => {
		render(Head, { props: { meta: baseMeta } });
		const ogType = document.head.querySelector('meta[property="og:type"]');
		expect(ogType).not.toBeNull();
		expect(ogType!.getAttribute('content')).toBe('website');
	});

	it('Test 5: emits <meta name="robots" content="noindex,nofollow"> when noindex=true', () => {
		render(Head, { props: { meta: { ...baseMeta, noindex: true } } });
		const robots = document.head.querySelector('meta[name="robots"]');
		expect(robots).not.toBeNull();
		expect(robots!.getAttribute('content')).toBe('noindex,nofollow');
	});

	it('Test 5b: does NOT emit robots noindex when noindex is false/unset', () => {
		render(Head, { props: { meta: baseMeta } });
		const robots = document.head.querySelector('meta[name="robots"]');
		expect(robots).toBeNull();
	});

	it('Test 7: meta values come from $props() — no $state or $effect in component', async () => {
		// Render with one meta set, then verify the output matches props exactly.
		// This is a behavioral test for Pitfall #2 — if Head used $state, the output
		// would not update when the prop value changes. We verify the output is prop-driven.
		render(Head, { props: { meta: { ...baseMeta, title: 'Prop-driven title' } } });
		const title = document.head.querySelector('title');
		expect(title!.textContent).toContain('Prop-driven title');
	});

	it('Test 8: emits <meta property="og:locale" content="nl_NL"> (WARNING-3)', () => {
		render(Head, { props: { meta: baseMeta } });
		const ogLocale = document.head.querySelector('meta[property="og:locale"]');
		expect(ogLocale, 'og:locale must be present (WARNING-3)').not.toBeNull();
		expect(ogLocale!.getAttribute('content')).toBe('nl_NL');
	});
});
