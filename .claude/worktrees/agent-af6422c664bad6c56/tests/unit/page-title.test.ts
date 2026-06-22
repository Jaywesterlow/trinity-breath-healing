/**
 * page-title.test.ts — Task 2 TDD gate
 * Tests: <PageTitle> renders exactly one <h1>
 * Requirements: SEO-02 (one H1 per page)
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PageTitle from '$lib/components/PageTitle.svelte';

describe('PageTitle component (src/lib/components/PageTitle.svelte)', () => {
	it('Test 6: renders exactly one <h1>', () => {
		// PageTitle renders a <h1> wrapper; children snippet is optional
		// We test the structural contract: exactly one <h1> in the output
		const { container } = render(PageTitle);
		const h1s = container.querySelectorAll('h1');
		expect(h1s.length).toBe(1);
	});

	it('Test 6b: <h1> is present in the DOM when rendered', () => {
		const { container } = render(PageTitle);
		const h1 = container.querySelector('h1');
		expect(h1).not.toBeNull();
	});
});
