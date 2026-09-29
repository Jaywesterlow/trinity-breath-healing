/**
 * `use:scrollDraw` — animation 23 from the library, "Lijn tekent zichzelf op scroll"
 * (jwcreative.nl/animations/23-scroll-svg-draw.html), ported from its source.
 *
 * The original, in GSAP:
 *
 *   var len = path.getTotalLength();
 *   path.style.strokeDasharray = len;
 *   path.style.strokeDashoffset = len;
 *   gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: {
 *     trigger: '.draw-section', start: 'top top', end: 'bottom bottom', scrub: .3 } });
 *   milestones.forEach((m, i) => gsap.to(m, { opacity: 1, scrollTrigger: { …, scrub: true } }));
 *
 * Kept exactly: the dash trick on the real path length, the linear mapping from
 * 'top top' to 'bottom bottom' of the section, and the 0.3s scrub, which is how GSAP
 * does it: the drawn length does not jump to the scroll position but eases to it over
 * 0.3s with an expo-out (ScrollTrigger's own scrub tween). The milestones fade in
 * scrubbed with no lag (`scrub: true`), each as it comes into view itself — the fix the
 * library file notes over the collected version, where they appeared only after they had
 * already left the top of the screen.
 *
 * Changed, because the site does not ship GSAP or Lenis: plain scroll and rAF instead.
 * And the hidden state is set here rather than in CSS (the site's reveal contract): with
 * no JS, for a crawler, or under reduced motion the line stands drawn and every step is
 * visible, which is also what the original's reduced-motion branch shows.
 *
 * Markup it expects inside the node: one `[data-draw-path]` and any number of
 * `[data-milestone]`.
 */

const SCRUB_S = 0.3;
/** How much scroll, as a share of the viewport, a milestone takes to fade from 0 to 1.
 *  The original's window is 7% of a 300vh section: 21vh. */
const FADE_SPAN = 0.21;

const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function scrollDraw(node: HTMLElement) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const path = node.querySelector<SVGPathElement>('[data-draw-path]');
	if (!path) return;
	const milestones = [...node.querySelectorAll<HTMLElement>('[data-milestone]')];

	const len = path.getTotalLength();
	path.style.strokeDasharray = `${len}`;

	/** Section progress: 0 when its top meets the top of the viewport, 1 when its bottom
	 *  meets the bottom — ScrollTrigger's start 'top top', end 'bottom bottom'. */
	const target = () => {
		const r = node.getBoundingClientRect();
		const run = r.height - window.innerHeight;
		return run > 0 ? clamp01(-r.top / run) : r.top <= 0 ? 1 : 0;
	};

	const drawAt = (p: number) => {
		path.style.strokeDashoffset = `${len * (1 - p)}`;
	};

	const fadeMilestones = () => {
		const vh = window.innerHeight;
		for (const m of milestones) {
			const top = m.getBoundingClientRect().top;
			m.style.opacity = `${clamp01((vh - top) / (vh * FADE_SPAN))}`;
		}
	};

	// Arm at the true position, so a page opened halfway down (a #sessie link, a
	// restored scroll) shows the line as far as it would be, without a catch-up.
	let shown = target();
	drawAt(shown);
	fadeMilestones();

	let from = shown;
	let to = shown;
	let start = 0;
	let raf = 0;

	const tick = (now: number) => {
		const t = clamp01((now - start) / (SCRUB_S * 1000));
		shown = from + (to - from) * expoOut(t);
		drawAt(shown);
		raf = t < 1 ? requestAnimationFrame(tick) : 0;
	};

	const onScroll = () => {
		fadeMilestones();
		const next = target();
		if (next === to) return;
		from = shown;
		to = next;
		start = performance.now();
		if (!raf) raf = requestAnimationFrame(tick);
	};

	// Listen only while the section is on or near the screen.
	let listening = false;
	const io = new IntersectionObserver(
		([entry]) => {
			if (entry?.isIntersecting && !listening) {
				window.addEventListener('scroll', onScroll, { passive: true });
				window.addEventListener('resize', onScroll, { passive: true });
				listening = true;
				onScroll();
			} else if (!entry?.isIntersecting && listening) {
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', onScroll);
				listening = false;
				onScroll();
			}
		},
		{ rootMargin: '25% 0px' }
	);
	io.observe(node);

	return {
		destroy() {
			io.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		}
	};
}
