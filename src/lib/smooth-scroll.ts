/**
 * Smooth wheel scrolling for the whole site (2026-10-17), with Lenis.
 *
 * Gentle on purpose: lerp 0.12 is a short glide after each wheel notch, not the
 * long float of a showcase site, so the page still feels like it is under the
 * reader's hand. Touch keeps the phone's own scrolling (Lenis leaves touch alone
 * unless syncTouch is set), and a reader who asks for reduced motion gets the
 * browser's native scrolling and no Lenis at all.
 *
 * Scrollable boxes inside the page (the service modal, the form's country list)
 * keep their own scroll: allowNestedScroll hands the wheel to whichever element
 * under the pointer can still scroll. In-page anchors glide too, landing below
 * the fixed nav.
 */
import type Lenis from 'lenis';

export async function startSmoothScroll(): Promise<(() => void) | undefined> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

	const { default: LenisCtor } = await import('lenis');
	const navHeight =
		parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;

	const lenis: Lenis = new LenisCtor({
		autoRaf: true,
		lerp: 0.12,
		allowNestedScroll: true,
		anchors: { offset: -navHeight }
	});

	return () => lenis.destroy();
}
