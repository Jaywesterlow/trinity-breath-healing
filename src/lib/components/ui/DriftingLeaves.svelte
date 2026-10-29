<script lang="ts">
	import { onMount } from 'svelte';
	import leaf1 from '$lib/images/leaves/leaf-1.webp';
	import leaf2 from '$lib/images/leaves/leaf-2.webp';
	import leaf3 from '$lib/images/leaves/leaf-3.webp';
	import leaf4 from '$lib/images/leaves/leaf-4.webp';
	import leaf5 from '$lib/images/leaves/leaf-5.webp';
	import leaf6 from '$lib/images/leaves/leaf-6.webp';
	import leaf7 from '$lib/images/leaves/leaf-7.webp';
	import leaf8 from '$lib/images/leaves/leaf-8.webp';

	/**
	 * Leaves drifting from left to right behind a section (owner, 2026-10-28: "leaves
	 * kind of floating in the background from left to right ... it would be nice to
	 * still have it drift even if the user doesn't scroll, so it still has movement,
	 * but the movement is just accelerated by the scroll").
	 *
	 * No video or frame sequence: each leaf is one painted image. The tumbling comes
	 * from CSS, a slow 3D turn on the image (rotateY/rotateX flip it edge-on and over,
	 * rotateZ spins it), while JS only moves the leaf's box across the section. Both are
	 * transforms, so the browser does them on the compositor.
	 *
	 * The leaves are reused: one that leaves on the right comes back in on the left
	 * at a new height. How many there are follows the section's
	 * width (one per LEAF_SPACING_PX), so an ultra-wide screen gets more leaves, not
	 * more images.
	 *
	 * Scroll in either direction speeds them up (owner, 2026-10-29), the same rule as
	 * the services fan. Nothing renders on the server, nothing runs off screen, and
	 * reduced motion shows no leaves at all.
	 *
	 * Eight autumn leaves (2026-10-29, owner: orange-ish, mixed, some still green,
	 * yellow, dark orange, red), all one red-maple shape after the owner's reference photo, drawn by
	 * .planning/quick/261029-apl-autumn-paint-leaves/autumn-leaves.cjs.
	 */

	const IMAGES = [leaf1, leaf2, leaf3, leaf4, leaf5, leaf6, leaf7, leaf8];
	const LEAF_SPACING_PX = 180;
	const MIN_LEAVES = 5;
	const MAX_LEAVES = 24;
	const BASE_SPEED_PX_S = [28, 62]; // range, scaled by size below: big leaves are nearer, so faster
	const SCROLL_BOOST_PER_PX = 0.012; // 400px of scroll ≈ five times the speed, briefly
	const SCROLL_DECAY_MS = 450;
	const MIN_FACTOR = 0.12;
	const MAX_FACTOR = 6;

	interface Leaf {
		src: string;
		size: number;
		x: number;
		y: number;
		speed: number;
		bobAmp: number;
		bobPeriod: number;
		bobPhase: number;
		tumble: number;
		tumbleDelay: number;
		opacity: number;
		reverse: boolean;
	}

	let layer: HTMLDivElement | undefined = $state();
	// raw: the frame loop mutates x every frame, and nothing in the markup reads it.
	let leaves: Leaf[] = $state.raw([]);
	let leafEls: HTMLElement[] = $state([]);

	function rand(a: number, b: number): number {
		return a + Math.random() * (b - a);
	}

	function freshLeaf(width: number, height: number, x: number): Leaf {
		const size = rand(26, 58);
		const depth = (size - 26) / 32; // 0 far … 1 near
		return {
			src: IMAGES[Math.floor(Math.random() * IMAGES.length)]!,
			size,
			x,
			y: rand(0.04, 0.92) * height,
			speed:
				BASE_SPEED_PX_S[0]! + depth * (BASE_SPEED_PX_S[1]! - BASE_SPEED_PX_S[0]!) * rand(0.8, 1.2),
			bobAmp: rand(10, 34),
			bobPeriod: rand(5, 11),
			bobPhase: rand(0, Math.PI * 2),
			tumble: rand(7, 15),
			tumbleDelay: -rand(0, 15),
			opacity: 0.55 + depth * 0.35,
			reverse: Math.random() < 0.4
		};
	}

	onMount(() => {
		if (!layer) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		if (reduce.matches) return;
		const el = layer;

		let width = 0;
		let height = 0;
		let lastScrollY = window.scrollY;
		let boost = 0;
		let raf: number | null = null;
		let last = 0;
		let t = 0;

		function build(): void {
			width = el.clientWidth;
			height = el.clientHeight;
			const n = Math.min(MAX_LEAVES, Math.max(MIN_LEAVES, Math.round(width / LEAF_SPACING_PX)));
			leaves = Array.from({ length: n }, () => freshLeaf(width, height, rand(-0.1, 1) * width));
		}

		function frame(now: number): void {
			const dt = Math.min(now - last, 50);
			last = now;
			t += dt / 1000;
			boost *= Math.exp(-dt / SCROLL_DECAY_MS);
			const factor = Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, 1 + boost));
			for (let i = 0; i < leaves.length; i++) {
				const leaf = leaves[i]!;
				leaf.x += (leaf.speed * factor * dt) / 1000;
				if (leaf.x > width + 60) {
					// Same leaf (image, size, spin) back in on the left at a new height.
					leaf.x = -60 - rand(0, 0.25) * width;
					leaf.y = rand(0.04, 0.92) * height;
					leaf.bobPhase = rand(0, Math.PI * 2);
				}
				const y =
					leaf.y + leaf.bobAmp * Math.sin((t * Math.PI * 2) / leaf.bobPeriod + leaf.bobPhase);
				const node = leafEls[i];
				if (node) node.style.transform = `translate3d(${leaf.x}px, ${y}px, 0)`;
			}
			raf = requestAnimationFrame(frame);
		}

		function start(): void {
			if (raf !== null) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}

		function stop(): void {
			if (raf !== null) cancelAnimationFrame(raf);
			raf = null;
		}

		function onScroll(): void {
			const y = window.scrollY;
			const dy = y - lastScrollY;
			lastScrollY = y;
			if (Math.abs(dy) > 200) return; // a jump (anchor, programmatic), not a gesture
			boost += Math.abs(dy) * SCROLL_BOOST_PER_PX; // either direction speeds them up (owner, 2026-10-29)
		}

		build();
		const io = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
		io.observe(el);
		const ro = new ResizeObserver(() => {
			if (Math.abs(el.clientWidth - width) > 40) build();
			else height = el.clientHeight;
		});
		ro.observe(el);
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			stop();
			io.disconnect();
			ro.disconnect();
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<div class="leaves" aria-hidden="true" bind:this={layer}>
	{#each leaves as leaf, i (i)}
		<span
			class="leaves__leaf"
			style:width="{leaf.size}px"
			style:height="{leaf.size}px"
			bind:this={leafEls[i]}
		>
			<img
				class="leaves__img"
				class:leaves__img--reverse={leaf.reverse}
				src={leaf.src}
				alt=""
				width="180"
				height="180"
				decoding="async"
				style:opacity={leaf.opacity}
				style:animation-duration="{leaf.tumble}s"
				style:animation-delay="{leaf.tumbleDelay}s"
			/>
		</span>
	{/each}
</div>

<style>
	.leaves {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.leaves__leaf {
		position: absolute;
		top: 0;
		left: 0;
		perspective: 300px;
		will-change: transform;
	}

	.leaves__img {
		display: block;
		width: 100%;
		height: 100%;
		animation: leaf-tumble linear infinite;
	}

	.leaves__img--reverse {
		animation-direction: reverse;
	}

	/* One full turn: the leaf spins once, and on the way flips over and back, edge-on
	   at the quarter turns, which is what reads as a real leaf tumbling in air. */
	@keyframes leaf-tumble {
		0% {
			transform: rotateZ(0deg) rotateY(0deg) rotateX(15deg);
		}
		25% {
			transform: rotateZ(90deg) rotateY(70deg) rotateX(-20deg);
		}
		50% {
			transform: rotateZ(180deg) rotateY(180deg) rotateX(25deg);
		}
		75% {
			transform: rotateZ(270deg) rotateY(290deg) rotateX(-15deg);
		}
		100% {
			transform: rotateZ(360deg) rotateY(360deg) rotateX(15deg);
		}
	}
</style>
