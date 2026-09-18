/**
 * Where the drawing sits inside each service SVG, as fractions of the
 * viewBox, plus the drawing's own width/height ratio. The three card SVGs
 * are mostly empty margin, so anything that shows one at a size has to
 * know where the lines actually are. Measured with getBBox() on the
 * rendered SVG: mahatma 4096×2235 → drawing 994×1724 at 1553,258;
 * goldhealing 1760×960 → 592×587 at 583,187; spinal-touch 1418×774 →
 * 380×613 at 518,82. Re-measure if an SVG is replaced.
 *
 * Read by the carousel's modal (through Behandelingen.svelte) and by the
 * service pages.
 */
export interface ServiceArt {
	src: string;
	x: number;
	y: number;
	w: number;
	h: number;
	ratio: number;
}

export const SERVICE_ART: Record<string, ServiceArt> = {
	'mahatma-healing': {
		src: '/images/card-mahatma-healing.svg',
		x: 0.3791,
		y: 0.1153,
		w: 0.2426,
		h: 0.7712,
		ratio: 0.5765
	},
	goldhealing: {
		src: '/images/card-goldhealing.svg',
		x: 0.3314,
		y: 0.195,
		w: 0.3363,
		h: 0.6117,
		ratio: 1.0078
	},
	'spinal-touch': {
		src: '/images/card-spinal-touch.svg',
		x: 0.365,
		y: 0.1061,
		w: 0.2681,
		h: 0.7919,
		ratio: 0.6203
	}
};
