/**
 * `use:spotlight` — animation 33 from the library, "Randen lichten op onder de cursor"
 * (jwcreative.nl/animations/33-spotlight-border-cards.html), ported from its source.
 *
 * The original, on the grid:
 *
 *   grid.addEventListener('mousemove', e => {
 *     grid.querySelectorAll('.spot-card').forEach(c => {
 *       var r = c.getBoundingClientRect();
 *       c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
 *       c.style.setProperty('--my', (e.clientY - r.top) + 'px');
 *     });
 *   });
 *
 * Kept exactly: one listener on the grid, and every card gets the pointer's position in
 * its own coordinates, so the light moves across the whole grid as one surface rather
 * than restarting per card. The light itself is CSS on the card (`::before`, see
 * ServiceCard.svelte). Only on a device with a real pointer; touch has no position to
 * follow.
 *
 * Options: the selector for the cards inside the node.
 */
export function spotlight(node: HTMLElement, selector = '[data-spotlight]') {
	if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

	const onMove = (e: MouseEvent) => {
		node.querySelectorAll<HTMLElement>(selector).forEach((c) => {
			const r = c.getBoundingClientRect();
			c.style.setProperty('--mx', `${e.clientX - r.left}px`);
			c.style.setProperty('--my', `${e.clientY - r.top}px`);
		});
	};

	node.addEventListener('mousemove', onMove, { passive: true });
	return {
		destroy() {
			node.removeEventListener('mousemove', onMove);
		}
	};
}
