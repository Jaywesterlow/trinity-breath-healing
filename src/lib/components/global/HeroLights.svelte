<script lang="ts">
	import { onMount } from 'svelte';
	import litLandscape from '$lib/images/redesign/hero-lit-landscape.webp?url';
	import litPortrait from '$lib/images/redesign/hero-lit-portrait.webp?url';

	// The living lights on the hero tree, ported from the approved prototype
	// (Figma/Hero-redesign/lights-prototype, Jay's slider values of 2026-10-27):
	//   - four tree lights that breathe on their own clocks and drift a little;
	//   - twelve fireflies in three clusters of four, blinking on their own schedules;
	//   - a streak of light down the river every few seconds, clipped to the river so it
	//     comes out from behind the mound and never crosses a bank;
	//   - the painting's gold lines brightening where any of them shines (lit layer, masked).
	// Purely decorative and client-only: the SVG ships empty in the HTML and fills on mount.
	// It fades in 0.2s after the paint starts washing in (Hero.svelte), then lives on its own.

	const V = {
		period: 6.5,
		size: 42,
		rest: 0.5,
		bloom: 0.6,
		drift: 10,
		driftspeed: 0.6,
		treedim: 0.85,
		reach: 30,
		// strength 2 (the line boost) is baked into the lit images: intro-prototype/bake-lit.cjs
		flylight: 1,
		flyreach: 60,
		streaklight: 0.6,
		streakreach: 70,
		flies: 12,
		flysize: 8,
		flyspeed: 1,
		every: 3.5,
		run: 1.2,
		len: 0.3,
		width: 1.2,
		glow: 2
	};
	/** When the lights come in, from navigation start (ms): paint wash at 1.82s + 0.2s. */
	const LIGHTS_AT = 2020;
	/** Judge the device once the intro is over (text in from 4.1s), not during it. */
	const PROBE_AT = 5600;

	type Range = [number, number];
	type Scene = {
		w: number;
		h: number;
		u: number;
		fit: string;
		lit: string;
		lights: [number, number][];
		lanes: string[];
		river: string;
		homes: { x: Range; y: Range }[];
	};
	// Coordinates are in each image's own space (2000 × 848 and 750 × 1004.5). `u` keeps sizes in
	// proportion to the tree, which the portrait painting draws smaller.
	const SCENES: Record<'landscape' | 'portrait', Scene> = {
		landscape: {
			w: 2000,
			h: 848,
			u: 1,
			fit: 'xMidYMid slice',
			lit: litLandscape,
			lights: [
				[1306, 402],
				[1405, 418],
				[1305, 555],
				[1382, 598]
			],
			lanes: [
				'M1119 665 C1060 671 1020 678 990 684 C930 690 860 697 790 703 C740 708 704 716 676 723 C656 729 656 734 680 737 C705 739 730 746 744 758 C756 768 756 786 740 798 C722 810 690 816 650 821 C610 826 580 832 540 838',
				'M1119 665 C1060 674 1020 683 990 690 C950 694 915 698 880 704 C820 712 790 730 800 752 C810 775 860 800 960 825 C1000 835 1030 842 1060 848',
				'M1119 665 C1060 677 1020 689 990 697 C975 699 962 701 950 704 C915 714 896 728 896 744 C897 764 920 782 960 790 C1020 798 1090 808 1150 820 C1190 828 1220 838 1250 848'
			],
			river:
				'1119,665 1100,670.5 1050,674 1000,677 960,680.5 900,682 825,685 750,690 700,698 660,710 635,719 630,722 638,732 662,743 691,749 721,757 737,767 740,775 735,785 722,793 681,802 651,808 601,815 551,823 501,833 451,843 425,851 1420,851 1400,851 1350,838 1250,813 1150,788 1050,768 950,758 918,755 909,745 913,736 928,727 948,717 960,713 1010,704 1035,692 1072,684 1097,672',
			homes: [
				{ x: [1530, 1600], y: [215, 270] },
				{ x: [1400, 1480], y: [610, 650] },
				{ x: [860, 960], y: [625, 655] }
			]
		},
		portrait: {
			w: 750,
			h: 1004.5,
			u: 0.7,
			fit: 'none',
			lit: litPortrait,
			lights: [
				[393, 330],
				[477, 340],
				[408, 468],
				[452, 505]
			],
			lanes: [
				'M334 526 C322 530 311 533 300 536 C270 541 200 550 130 563 C80 569 42 574 36 582 C32 590 55 587 90 591 C120 594 160 597 195 600',
				'M334 526 C322 532 311 537 300 541 C265 547 210 554 160 563 C120 570 100 580 115 588 C130 595 170 598 200 600',
				'M334 526 C322 534 311 541 300 546 C275 551 240 558 222 568 C208 578 200 590 196 604'
			],
			river:
				'334,526 300,530.5 270,534 200,539.5 150,545.5 100,552.5 50,564.5 30,573 19.5,580 26,590.5 50,596.5 90,605.5 130,610 140,622 330,622 325,613.5 275,608.5 237,603.5 216.5,597 219.5,590 237,576.5 274,561.5 276,556.5 292,549 311,540.5 323,530.5',
			homes: [
				{ x: [560, 610], y: [205, 245] },
				{ x: [480, 540], y: [540, 570] },
				{ x: [150, 230], y: [505, 525] }
			]
		}
	};
	const SPEEDS = [1.0, 0.77, 0.91, 0.68];
	const PEAKS = [1.0, 0.8, 0.95, 0.75];
	/** Share of the streak's length each layer covers, back from the head; base widths. */
	const SHARE = [0.6, 1, 0.55, 0.18];
	const BASE_W = [7, 1.2, 2, 2.8];
	const TAU = Math.PI * 2;
	const NS = 'http://www.w3.org/2000/svg';

	let svg: SVGSVGElement;
	let reachLayer: SVGGElement;
	let blooms: SVGGElement;
	let orbs: SVGGElement;
	let flyLayer: SVGGElement;
	let streakGroup: SVGGElement;
	let riverPoly: SVGPolygonElement;
	let lightMask: SVGMaskElement;
	let blur: SVGFEGaussianBlurElement;

	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const portraitQuery = matchMedia('(max-aspect-ratio: 1/1)');
		const rand = (a: number, b: number) => a + Math.random() * (b - a);
		const el = (tag: string, attrs: Record<string, string | number>, parent: Element) => {
			const n = document.createElementNS(NS, tag);
			for (const k in attrs) n.setAttribute(k, String(attrs[k]));
			return parent.appendChild(n);
		};
		const parts = [...streakGroup.querySelectorAll('path')];

		type Four = [number, number, number, number];
		type Light = {
			x: number;
			y: number;
			speed: number;
			peak: number;
			phase: number;
			f: Four;
			p: Four;
			t: number;
			reach: Element;
			bloom: Element;
			orb: Element;
		};
		type Fly = {
			x: number;
			y: number;
			a: Four;
			f: Four;
			p: Four;
			t: number;
			state: 'off' | 'in' | 'on' | 'out';
			until: number;
			dark: boolean;
			reach: Element;
			node: Element;
		};
		let S: Scene;
		let lights: Light[] = [];
		let flies: Fly[] = [];
		let streakReach: Element;
		let live = reduced || performance.now() >= LIGHTS_AT;
		let lite = false; // see goLite

		function build() {
			S = SCENES[portraitQuery.matches ? 'portrait' : 'landscape'];
			svg.setAttribute('viewBox', `0 0 ${S.w} ${S.h}`);
			svg.setAttribute('preserveAspectRatio', S.fit);
			for (const [k, v] of Object.entries({ x: 0, y: 0, width: S.w, height: S.h }))
				lightMask.setAttribute(k, String(v));
			riverPoly.setAttribute('points', S.river);
			svg.querySelectorAll('.lit').forEach((img) => {
				img.setAttribute('href', S.lit);
				img.setAttribute('width', String(S.w));
				img.setAttribute('height', String(S.h));
			});
			for (const g of [reachLayer, blooms, orbs, flyLayer]) g.replaceChildren();
			lights = S.lights.map(([x, y], i) => ({
				x,
				y,
				speed: SPEEDS[i] ?? 1,
				peak: PEAKS[i] ?? 1,
				phase: Math.random(),
				// drift: two slow unrelated sines per axis (x: f[0..1], y: f[2..3])
				f: [rand(0.05, 0.09), rand(0.12, 0.19), rand(0.05, 0.1), rand(0.13, 0.2)] as Four,
				p: [rand(0, TAU), rand(0, TAU), rand(0, TAU), rand(0, TAU)] as Four,
				t: rand(0, 30),
				reach: el('circle', { fill: 'url(#hero-falloff)' }, reachLayer),
				bloom: el('circle', { fill: 'url(#hero-bloom)', r: V.size * S.u * 2.2 }, blooms),
				orb: el('circle', { fill: 'url(#hero-orb)' }, orbs)
			}));
			streakReach = el(
				'circle',
				{ fill: 'url(#hero-falloff)', opacity: 0, r: V.streakreach * S.u },
				reachLayer
			);
			flies =
				reduced || lite
					? []
					: Array.from({ length: V.flies }, (_, i) => {
							const h = S.homes[i % S.homes.length]!;
							return {
								x: rand(...h.x),
								y: rand(...h.y),
								a: [rand(10, 25), rand(4, 10), rand(6, 16), rand(3, 8)] as Four,
								f: [rand(0.03, 0.08), rand(0.11, 0.2), rand(0.04, 0.09), rand(0.13, 0.22)] as Four,
								p: [rand(0, TAU), rand(0, TAU), rand(0, TAU), rand(0, TAU)] as Four,
								t: rand(0, 20),
								state: 'off' as const,
								until: rand(0, 4),
								dark: false,
								reach: el(
									'circle',
									{ fill: 'url(#hero-falloff)', opacity: 0, r: V.flyreach * S.u },
									reachLayer
								),
								node: el(
									'circle',
									{ fill: 'url(#hero-fly)', opacity: 0, r: V.flysize * S.u },
									flyLayer
								)
							};
						});
			parts.forEach((p, i) =>
				p.setAttribute(
					'stroke-width',
					String((BASE_W[i] ?? 1) * V.width * S.u * (i === 0 ? V.glow : 1))
				)
			);
			blur.setAttribute('stdDeviation', String(2.5 * V.glow * S.u));
			parts[0]?.setAttribute('stroke-opacity', String(Math.min(0.95, 0.45 * Math.sqrt(V.glow))));
			draw(0);
		}

		function drawLights(dt: number) {
			const u = S.u,
				size = V.size * u,
				reach = V.reach * u,
				drift = reduced ? 0 : V.drift * u;
			for (const l of lights) {
				l.phase = (l.phase + (dt * l.speed) / V.period) % 1;
				l.t += dt * V.driftspeed;
				const b = reduced ? 1 : 0.5 - 0.5 * Math.cos(l.phase * TAU);
				const k = l.peak * (V.rest + (1 - V.rest) * b);
				const x =
					l.x +
					drift *
						(0.7 * Math.sin(TAU * l.f[0] * l.t + l.p[0]) +
							0.3 * Math.sin(TAU * l.f[1] * l.t + l.p[1]));
				const y =
					l.y +
					drift *
						(0.7 * Math.sin(TAU * l.f[2] * l.t + l.p[2]) +
							0.3 * Math.sin(TAU * l.f[3] * l.t + l.p[3]));
				for (const c of [l.orb, l.bloom, l.reach]) {
					c.setAttribute('cx', x.toFixed(1));
					c.setAttribute('cy', y.toFixed(1));
				}
				l.orb.setAttribute('r', (size * (0.85 + 0.2 * k)).toFixed(2));
				l.orb.setAttribute('opacity', k.toFixed(3));
				l.bloom.setAttribute('opacity', (k * V.bloom).toFixed(3));
				// the lines follow the breath more steeply than the light, so the tree visibly dims
				const lk = reduced ? l.peak : l.peak * (1 - V.treedim * (1 - b));
				l.reach.setAttribute('r', (reach * (0.8 + 0.3 * lk)).toFixed(2));
				l.reach.setAttribute('opacity', lk.toFixed(3));
			}
		}

		const NEXT = {
			off: ['in', () => 0.8],
			in: ['on', () => rand(1.5, 4)],
			on: ['out', () => 1],
			out: ['off', () => rand(1.5, 6)]
		} as const;
		function drawFlies(dt: number) {
			const u = S.u;
			for (const f of flies) {
				f.t += dt * V.flyspeed;
				f.until -= dt;
				if (f.until <= 0) {
					const [s, d] = NEXT[f.state];
					f.state = s;
					f.until = d();
				}
				const fade =
					f.state === 'in'
						? 1 - f.until / 0.8
						: f.state === 'out'
							? f.until
							: f.state === 'on'
								? 1
								: 0;
				const o = live ? fade * fade * (3 - 2 * fade) : 0;
				// a dark fly has nothing to move: touching it would still repaint the layer
				if (o === 0 && f.dark) continue;
				f.dark = o === 0;
				const x =
					f.x +
					u *
						(f.a[0] * Math.sin(TAU * f.f[0] * f.t + f.p[0]) +
							f.a[1] * Math.sin(TAU * f.f[1] * f.t + f.p[1]));
				const y =
					f.y +
					u *
						(f.a[2] * Math.sin(TAU * f.f[2] * f.t + f.p[2]) +
							f.a[3] * Math.sin(TAU * f.f[3] * f.t + f.p[3]));
				for (const c of [f.node, f.reach]) {
					c.setAttribute('cx', x.toFixed(1));
					c.setAttribute('cy', y.toFixed(1));
				}
				f.node.setAttribute('opacity', o.toFixed(3));
				f.reach.setAttribute('opacity', (o * V.flylight).toFixed(3));
			}
		}

		// River streaks: a lane at random (never the same twice running), a short dash runs it,
		// its head lights the lines around it.
		let anims: Animation[] = [];
		let timer = 0;
		let lastLane = -1;
		let run: { L: number; full: number; move: Animation } | null = null;
		function streak() {
			let lane;
			do lane = Math.floor(Math.random() * S.lanes.length);
			while (lane === lastLane);
			lastLane = lane;
			anims.forEach((a) => a.cancel());
			const opts: KeyframeAnimationOptions = {
				duration: V.run * 1000,
				easing: 'cubic-bezier(0.3, 0, 0.7, 1)',
				fill: 'forwards'
			};
			let L = 0,
				full = 0;
			anims = parts.map((p, i) => {
				p.setAttribute('d', S.lanes[lane] ?? '');
				L = p.getTotalLength();
				full = L * V.len;
				const dash = full * (SHARE[i] ?? 1);
				p.style.strokeDasharray = `${dash} ${L * 2}`;
				return p.animate([{ strokeDashoffset: dash }, { strokeDashoffset: dash - L - full }], opts);
			});
			anims.push(
				streakGroup.animate(
					[
						{ opacity: 0 },
						{ opacity: 1, offset: 0.12 },
						{ opacity: 1, offset: 0.8 },
						{ opacity: 0 }
					],
					opts
				)
			);
			run = { L, full, move: anims[0]! };
			schedule();
		}
		function drawStreakLight() {
			if (!run) return;
			const p = run.move.effect?.getComputedTiming().progress ?? 1;
			if (run.move.playState === 'finished') {
				// finished: dark until the next run
				streakReach.setAttribute('opacity', '0');
				run = null;
				return;
			}
			const pt = parts[3]!.getPointAtLength(Math.min(run.L, p * (run.L + run.full)));
			streakReach.setAttribute('cx', pt.x.toFixed(1));
			streakReach.setAttribute('cy', pt.y.toFixed(1));
			// the group's fade (in by 12%, out from 80%), read from the same eased progress
			// instead of getComputedStyle, which would force a style pass every frame
			const fade = p < 0.12 ? p / 0.12 : p > 0.8 ? (1 - p) / 0.2 : 1;
			streakReach.setAttribute('opacity', (fade * V.streaklight).toFixed(3));
		}
		function schedule(first?: number) {
			clearTimeout(timer);
			if (!reduced && !lite)
				timer = window.setTimeout(streak, first ?? V.every * 1000 * (0.5 + Math.random()));
		}

		function draw(dt: number) {
			drawLights(dt);
			drawFlies(dt);
			drawStreakLight();
		}

		build();

		// Low-end devices (measured in Chrome at 6x CPU, 3x DPR, 2026-10-27): every frame
		// repaints the whole layer, so on touch screens the lights draw at 30fps. The breath
		// and the drift move a pixel or less a frame, so it looks the same; the streaks are
		// WAAPI and keep the display's rate. If the device still cannot keep up in its first
		// two seconds after the intro (frames averaging over 25ms), the fireflies and streaks stop and
		// the breathing lights stay.
		const step = matchMedia('(pointer: coarse)').matches ? 1000 / 30 - 4 : 0;
		let probe = 0,
			probeSum = 0,
			prev = 0;
		function goLite() {
			lite = true;
			clearTimeout(timer);
			anims.forEach((a) => a.cancel());
			run = null;
			streakReach.setAttribute('opacity', '0');
			for (const f of flies) {
				f.node.setAttribute('opacity', '0');
				f.reach.setAttribute('opacity', '0');
			}
			flies = [];
		}

		// Run only while the hero is on screen and the tab is visible.
		let raf = 0,
			last = 0,
			onScreen = true;
		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			if (now > PROBE_AT && !lite && probe < 120) {
				if (prev) probeSum += now - prev;
				if (++probe === 120 && probeSum / 119 > 25) goLite();
			}
			prev = now;
			if (now - last < step) return;
			draw(Math.min(0.1, (now - last) / 1000));
			last = now;
		};
		const start = () => {
			if (raf || reduced || !onScreen || document.hidden) return;
			last = prev = performance.now();
			raf = requestAnimationFrame(frame);
		};
		const stop = () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};
		// The hero is sticky and the page scrolls over it, so "intersecting" stays true while
		// it is buried. Hidden = the svg is out of view, or the sheet after the hero (the
		// next sibling of .hero) has reached the top 1% of the screen.
		let inView = true,
			covered = false;
		const update = () => {
			onScreen = inView && !covered;
			if (onScreen) start();
			else stop();
		};
		const io = new IntersectionObserver(([e]) => {
			inView = !!e?.isIntersecting;
			update();
		});
		io.observe(svg);
		const sheet = svg.closest('.hero')?.nextElementSibling;
		const coverIo = new IntersectionObserver(
			([e]) => {
				covered = !!e?.isIntersecting;
				update();
			},
			{ rootMargin: '0px 0px -99% 0px' }
		);
		if (sheet) coverIo.observe(sheet);
		const onVisibility = () => (document.hidden ? stop() : start());
		document.addEventListener('visibilitychange', onVisibility);
		const goLive = window.setTimeout(
			() => {
				live = true;
				schedule(1500);
			},
			reduced ? 0 : Math.max(0, LIGHTS_AT - performance.now())
		);
		const onOrientation = () => {
			anims.forEach((a) => a.cancel());
			run = null;
			build();
		};
		portraitQuery.addEventListener('change', onOrientation);
		start();

		return () => {
			stop();
			io.disconnect();
			coverIo.disconnect();
			clearTimeout(timer);
			clearTimeout(goLive);
			anims.forEach((a) => a.cancel());
			document.removeEventListener('visibilitychange', onVisibility);
			portraitQuery.removeEventListener('change', onOrientation);
		};
	});
</script>

<svg class="hero-lights" bind:this={svg} aria-hidden="true" focusable="false">
	<defs>
		<!-- How a light falls on the lines around it: full at the light, gone at its reach. -->
		<radialGradient id="hero-falloff">
			<stop offset="0" stop-color="#fff" />
			<stop offset="0.3" stop-color="#fff" stop-opacity="0.55" />
			<stop offset="0.7" stop-color="#fff" stop-opacity="0.12" />
			<stop offset="1" stop-color="#fff" stop-opacity="0" />
		</radialGradient>
		<!-- Tree light: a white-hot centre, a tight warm halo. -->
		<radialGradient id="hero-orb">
			<stop offset="0" stop-color="#ffffff" />
			<stop offset="0.1" stop-color="#ffffff" />
			<stop offset="0.18" stop-color="#ffeab4" stop-opacity="0.9" />
			<stop offset="0.32" stop-color="#f6bd6c" stop-opacity="0.35" />
			<stop offset="0.6" stop-color="#e59a48" stop-opacity="0.08" />
			<stop offset="1" stop-color="#d98a3a" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="hero-bloom">
			<stop offset="0" stop-color="#ffcf86" stop-opacity="0.22" />
			<stop offset="1" stop-color="#ffcf86" stop-opacity="0" />
		</radialGradient>
		<!-- Firefly: smaller and yellow-green, so it never reads as a tree light. -->
		<radialGradient id="hero-fly">
			<stop offset="0" stop-color="#fbffe8" />
			<stop offset="0.18" stop-color="#e9fbb0" />
			<stop offset="0.45" stop-color="#c8ea7a" stop-opacity="0.3" />
			<stop offset="1" stop-color="#b5dc60" stop-opacity="0" />
		</radialGradient>
		<filter id="hero-streak-glow" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur bind:this={blur} stdDeviation="2.5" />
		</filter>
		<!-- The river between its banks, from the tip where it comes out from behind the mound. -->
		<clipPath id="hero-river" clipPathUnits="userSpaceOnUse"
			><polygon bind:this={riverPoly} /></clipPath
		>
		<!-- Everything that lights the gold lines draws its reach here. -->
		<mask id="hero-light-mask" maskUnits="userSpaceOnUse" bind:this={lightMask}>
			<g bind:this={reachLayer}></g>
		</mask>
	</defs>
	<!-- The lit lines carry their boost baked in (intro-prototype/bake-lit.cjs): a filter here
	     would run over the whole image on every frame. The prototype's blurred glow layer under
	     it is gone too: this image is opaque, so the glow never showed (0 pixels differ). -->
	<image class="lit" preserveAspectRatio="none" mask="url(#hero-light-mask)" />
	<g bind:this={blooms}></g>
	<g bind:this={orbs}></g>
	<g
		bind:this={streakGroup}
		fill="none"
		stroke-linecap="round"
		opacity="0"
		clip-path="url(#hero-river)"
	>
		<path stroke="#ffe2a6" stroke-opacity="0.45" filter="url(#hero-streak-glow)" />
		<path stroke="#ffe8b8" stroke-opacity="0.35" />
		<path stroke="#fff1d0" stroke-opacity="0.7" />
		<path stroke="#ffffff" />
	</g>
	<g bind:this={flyLayer}></g>
</svg>

<style>
	/* Light only (black-backed line response, orbs, streak, fireflies): screen adds it. */
	.hero-lights {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		mix-blend-mode: screen;
		pointer-events: none;
	}

	/* In 0.2s after the paint starts washing in (Hero.svelte: 1.82s). */
	@media (prefers-reduced-motion: no-preference) {
		.hero-lights {
			animation: hero-lights-in 1.6s ease 2.02s backwards;
		}
	}

	@keyframes hero-lights-in {
		from {
			opacity: 0;
		}
	}
</style>
