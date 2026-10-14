/**
 * The demo's scroll motion, ported from the animation library (jwcreative.nl/
 * animations) with the library's own timings and easings:
 *
 *   03b  lines rise from masks once      [data-lines]      children `.line > *`
 *   12   a photo wipes open              [data-reveal-img] with data-dir, an <img> inside
 *   23   a line draws itself on scroll   [data-draw]       a <path> inside, [data-milestone] rows
 *   44b  circle text spins with scroll   [data-spin]       an <svg>
 *
 * 16 (the headline rising out of the line below it) is pure CSS in
 * DemoHero.svelte and needs nothing from here. 27c (the magnetic button) is
 * the site's own `use:magnetic` action.
 *
 * GSAP and ScrollTrigger are loaded here, after mount, so they are not in the
 * initial bundle; the library's Lenis smooth-scroll is left out on purpose
 * (a scroll library is class C in the motion rules, and ScrollTrigger runs on
 * the native scroll). Under prefers-reduced-motion nothing is set up at all:
 * the server-rendered page is complete without any of it.
 */

export async function initMotion(root: HTMLElement): Promise<() => void> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	const [{ gsap }, { ScrollTrigger }] = await Promise.all([
		import('gsap'),
		import('gsap/ScrollTrigger')
	]);
	gsap.registerPlugin(ScrollTrigger);
	const ctx = gsap.context(() => {
		/* 03b — lines out of a mask, once, at 'top 65%' */
		root.querySelectorAll<HTMLElement>('[data-lines]').forEach((section) => {
			const lines = section.querySelectorAll('.line > *');
			if (!lines.length) return;
			gsap.from(lines, {
				yPercent: 110,
				duration: 0.9,
				ease: 'power3.out',
				stagger: 0.12,
				scrollTrigger: { trigger: section, start: 'top 65%' }
			});
		});

		/* 12 — the image wipes open from one edge while it settles from 130% to 100% */
		const REVEAL_FROM: Record<string, string> = {
			up: 'inset(100% 0% 0% 0%)',
			down: 'inset(0% 0% 100% 0%)',
			right: 'inset(0% 100% 0% 0%)',
			left: 'inset(0% 0% 0% 100%)'
		};
		root.querySelectorAll<HTMLElement>('[data-reveal-img]').forEach((wrap) => {
			const media = wrap.querySelector('img, picture, video');
			if (!media) return;
			const from = REVEAL_FROM[wrap.dataset.dir ?? 'up'] ?? REVEAL_FROM.up;
			const tl = gsap
				.timeline({ paused: true })
				.fromTo(
					wrap,
					{ clipPath: from },
					{ clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.out', delay: 0.2 },
					0
				)
				.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 4, ease: 'power2.out' }, 0);
			ScrollTrigger.create({ trigger: wrap, start: 'top 60%', onEnter: () => tl.play() });
			ScrollTrigger.create({ trigger: wrap, start: 'top bottom', onLeaveBack: () => tl.pause(0) });
		});

		/* 23 — the path draws as the section scrolls through; milestones fade in along it */
		root.querySelectorAll<HTMLElement>('[data-draw]').forEach((section) => {
			const path = section.querySelector<SVGPathElement>('path');
			if (!path) return;
			const len = path.getTotalLength();
			path.style.strokeDasharray = `${len}`;
			path.style.strokeDashoffset = `${len}`;
			gsap.to(path, {
				strokeDashoffset: 0,
				ease: 'none',
				scrollTrigger: { trigger: section, start: 'top 70%', end: 'bottom 70%', scrub: 0.3 }
			});
			// The library scrubs the milestones with the line; here they play once
			// as they come into view instead, so a step never fades back out while
			// someone is reading it (scrubs stay off text opacity, M rules).
			section.querySelectorAll<HTMLElement>('[data-milestone]').forEach((m) => {
				gsap.fromTo(
					m,
					{ opacity: 0.35, y: 12 },
					{
						opacity: 1,
						y: 0,
						duration: 0.5,
						ease: 'power2.out',
						scrollTrigger: { trigger: m, start: 'top 80%', once: true }
					}
				);
			});
		});

		/* 44b — the circle turns with the scroll's velocity and stops when it stops */
		root.querySelectorAll<HTMLElement>('[data-spin]').forEach((el) => {
			let angle = 0;
			ScrollTrigger.create({
				onUpdate(self) {
					angle += self.getVelocity() * 0.02;
					el.style.transform = `rotate(${angle}deg)`;
				}
			});
		});
	}, root);

	return () => ctx.revert();
}
