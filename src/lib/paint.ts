/**
 * One of the ten watercolour greens declared in app.css (--paint-green-1 … -10), so cards
 * that sit side by side never share a background (owner, 2026-10-28). Pass a stable index:
 * a service's place in BRAND.services, so its carousel card and its modal match.
 */
export const PAINT_VARIANTS = 10;

export function paintGreen(index: number): string {
	const n = (((index % PAINT_VARIANTS) + PAINT_VARIANTS) % PAINT_VARIANTS) + 1;
	return `var(--paint-green-${n})`;
}
