/**
 * The demo's motion, ported from the animation library (jwcreative.nl/
 * animations) with the library's own timings and easings:
 *
 *   03b  lines rise from masks once        [data-lines]       children `.line > *`
 *   08a  cards float up, staggered         [data-float]       direct children
 *   12   a photo wipes open                [data-reveal-img]  with data-dir, an <img> inside
 *   23   a line draws itself on scroll     [data-draw]        a <path>, [data-milestone] rows
 *        and the milestones appear as the line reaches them, on the same scrub
 *   27b  cards tilt toward the cursor      [data-tilt]
 *   44a+44b the breath badge turns on its own and faster with the scroll  [data-spin]
 *   stroke icons draw on entry             [data-icon-draw]   paths with pathLength="1"
 *
 * 16 (the headline rising out of the line below it) is pure CSS in
 * DemoHero.svelte. 27c (the magnetic button) is the site's own `use:magnetic`.
 * Her portrait draws itself through the site's own DrawOn component.
 *
 * GSAP and ScrollTrigger load here, after mount, so they are not in the initial
 * bundle; Lenis is left out on purpose (a scroll library is class C in the
 * motion rules, and ScrollTrigger runs on the native scroll). Under
 * prefers-reduced-motion nothing is set up: the server-rendered page is
 * complete without any of it, and every start state below is applied by
 * script, never by CSS, so a page without script shows everything.
 */

export async function initMotion(root: HTMLElement): Promise<() => void> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	const [{ gsap }, { ScrollTrigger }] = await Promise.all([
		import('gsap'),
		import('gsap/ScrollTrigger')
	]);
	gsap.registerPlugin(ScrollTrigger);
	const tickers: Array<(time: number, dt: number) => void> = [];
	const listeners: Array<() => void> = [];

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
				scrollTrigger: { trigger: section, start: 'top 65%', once: true }
			});
		});

		/* 08a — a grid's cards rise and fade in one after another, once */
		root.querySelectorAll<HTMLElement>('[data-float]').forEach((grid) => {
			const items = Array.from(grid.children);
			if (!items.length) return;
			gsap.from(items, {
				y: 20,
				opacity: 0,
				duration: 0.45,
				ease: 'power2.out',
				stagger: 0.07,
				scrollTrigger: { trigger: grid, start: 'top 82%', once: true }
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

		/* 23 — the line draws as the section scrolls through the middle of the
		   screen, and each step appears the moment the line reaches it: one
		   scrubbed timeline, the step's position on it is its position on the line. */
		root.querySelectorAll<HTMLElement>('[data-draw]').forEach((section) => {
			const path = section.querySelector<SVGPathElement>('path');
			if (!path) return;
			const len = path.getTotalLength();
			path.style.strokeDasharray = `${len}`;
			path.style.strokeDashoffset = `${len}`;
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: section, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 }
			});
			tl.to(path, { strokeDashoffset: 0, duration: 1 }, 0);
			const total = section.offsetHeight || 1;
			section.querySelectorAll<HTMLElement>('[data-milestone]').forEach((m) => {
				const at = Math.min(0.92, Math.max(0, (m.offsetTop + 24) / total));
				tl.fromTo(
					m,
					{ opacity: 0, y: 18 },
					{ opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
					at
				);
			});
		});

		/* 27b — the card tilts toward the cursor, 3D, and settles back on leave */
		if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
			root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
				const max = Number(card.dataset.tilt) || 6;
				card.style.transformStyle = 'preserve-3d';
				const set = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
				const setY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });
				gsap.set(card, { transformPerspective: 900 });
				const move = (e: PointerEvent) => {
					const r = card.getBoundingClientRect();
					const px = (e.clientX - r.left) / r.width - 0.5;
					const py = (e.clientY - r.top) / r.height - 0.5;
					set(-py * max * 2);
					setY(px * max * 2);
				};
				const leave = () => {
					set(0);
					setY(0);
				};
				card.addEventListener('pointermove', move);
				card.addEventListener('pointerleave', leave);
				listeners.push(() => {
					card.removeEventListener('pointermove', move);
					card.removeEventListener('pointerleave', leave);
				});
			});
		}

		/* 44a + 44b — the badge turns slowly on its own and the scroll speeds it
		   up or turns it back; the velocity is smoothed so it never jumps. */
		root.querySelectorAll<HTMLElement>('[data-spin]').forEach((el) => {
			let angle = 0;
			let boost = 0;
			ScrollTrigger.create({
				onUpdate(self) {
					boost = self.getVelocity() * 0.012;
				}
			});
			const tick = (_time: number, dt: number) => {
				const s = dt / 1000;
				boost += (0 - boost) * Math.min(1, s * 6);
				angle += (14 + boost) * s;
				el.style.transform = `rotate(${angle}deg)`;
			};
			gsap.ticker.add(tick);
			tickers.push(tick);
		});

		/* Stroke icons draw themselves once as the card comes in. */
		root.querySelectorAll<HTMLElement>('[data-icon-draw]').forEach((icon) => {
			const paths = icon.querySelectorAll('path, circle, line, polyline');
			if (!paths.length) return;
			gsap.fromTo(
				paths,
				{ strokeDasharray: 1, strokeDashoffset: 1 },
				{
					strokeDashoffset: 0,
					duration: 1.1,
					ease: 'power2.inOut',
					stagger: 0.15,
					scrollTrigger: { trigger: icon, start: 'top 85%', once: true }
				}
			);
		});
	}, root);

	return () => {
		tickers.forEach((t) => gsap.ticker.remove(t));
		listeners.forEach((off) => off());
		ctx.revert();
	};
}
