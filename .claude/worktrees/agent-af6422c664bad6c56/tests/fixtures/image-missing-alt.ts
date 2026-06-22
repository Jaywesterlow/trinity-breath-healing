/**
 * Fixture: missing `alt` prop — tsc must error (Test 5 in image.test.ts)
 * This file is intentionally invalid TypeScript and must NOT compile.
 */

// Mirror the Props type from EnhancedImage.svelte
type EnhancedImageProps = {
	src: string;
	alt: string; // required
	width: number; // required
	height: number; // required
	loading?: 'eager' | 'lazy';
	fetchpriority?: 'high' | 'low' | 'auto';
	class?: string;
};

// Intentionally omit `alt` — tsc must fail with a missing property error
const props: EnhancedImageProps = {
	src: '/test.png',
	// alt is intentionally missing
	width: 100,
	height: 50
};

export { props };
