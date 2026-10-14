<script lang="ts">
	/**
	 * The hero: real water, full-viewport. The copy sits on the water's quiet
	 * right half, left-aligned in a 6-column block, so it never fights the
	 * stones. The headline rises out of the line below it (library 16, pure
	 * CSS, in force from the first frame so nothing flashes), the water flows
	 * (water.ts, the signature moment), and the breath badge under the buttons
	 * turns on its own and with the scroll (44a + 44b). The still photo is the
	 * LCP element and the whole hero when WebGL or motion is unavailable.
	 */
	import { onMount } from 'svelte';
	import heroImg from './images/hero-water.jpg?enhanced';
	import heroTex from './images/hero-water-tex.jpg';
	import { startWater, type WaterHandle } from './water';
	import { magnetic } from '$lib/actions/magnetic';
	import { BRAND } from '$lib/constants/brand';
	import { HERO } from './content';

	let canvas: HTMLCanvasElement | undefined = $state();
	let flowing = $state(false);

	onMount(() => {
		if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let handle: WaterHandle | null = null;
		let cancelled = false;
		const begin = () => {
			const idle =
				(window as Window & { requestIdleCallback?: (cb: () => void) => number })
					.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 250));
			idle(() => {
				if (cancelled || !canvas) return;
				handle = startWater(canvas, heroTex, () => (flowing = true));
			});
		};
		if (document.readyState === 'complete') begin();
		else window.addEventListener('load', begin, { once: true });
		return () => {
			cancelled = true;
			window.removeEventListener('load', begin);
			handle?.stop();
		};
	});
</script>

<section class="hero">
	<div class="hero__media" aria-hidden="true">
		<enhanced:img
			class="hero__img"
			src={heroImg}
			alt=""
			sizes="100vw"
			fetchpriority="high"
			loading="eager"
		/>
		<canvas bind:this={canvas} class="hero__water" class:hero__water--on={flowing}></canvas>
		<div class="hero__scrim"></div>
	</div>

	<div class="frame hero__frame">
		<div class="hero__inner">
			<h1 class="hero__title">
				{#each HERO.lines as line, i (i)}
					<span class="hline hline-{i + 1}"><span class="hline__text">{line}</span></span>
				{/each}
			</h1>
			<p class="hero__lead">{HERO.body}</p>
			<div class="hero__actions">
				<a
					class="pill pill--sand"
					href="/contact"
					use:magnetic={{ enabled: true, dragging: false, margin: 40, strength: 0.14 }}
				>
					{HERO.cta}
				</a>
				<a class="pill pill--light" href="tel:{BRAND.phone}">{HERO.phone}</a>
			</div>

			<div class="hero__badge" aria-hidden="true">
				<svg viewBox="0 0 200 200" data-spin>
					<defs>
						<path
							id="demo-badge-circle"
							d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
						/>
					</defs>
					<text font-size="16" letter-spacing="0.26em">
						<textPath href="#demo-badge-circle"
							>ADEM IN &#160;&#160;&#160; ADEM UIT &#160;&#160;&#160; ADEM IN &#160;&#160;&#160;
							ADEM UIT &#160;&#160;&#160;</textPath
						>
					</text>
				</svg>
				<span class="hero__badge-mark"></span>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100svh;
		display: grid;
		align-items: center;
		padding-block: calc(var(--d-bar) + var(--d-s6)) var(--d-s7);
		color: var(--d-on-dark);
		isolation: isolate;
	}
	.hero__media {
		position: absolute;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		background: var(--d-deep);
	}
	.hero :global(.hero__img) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.hero__water {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 900ms var(--d-ease);
	}
	.hero__water--on {
		opacity: 1;
	}
	/* Three scrims with one job each: a band at the top for the bar and the
	   logo, a flat tint that keeps the sand type above 4.5:1 wherever it lands,
	   and an eased foot so the water hands over to the sand page. */
	.hero__scrim {
		position: absolute;
		inset: 0;
		/* Four scrims with one job each: a band at the top for the bar, a flat
		   tint over the whole photo, a deeper tint on the text side, and an
		   eased foot so the water hands over to the sand page. Measured with
		   the type hidden and the brightest pixel under each block taken (see
		   demo-shots/contrast.mjs): the headline and lead clear 4.5:1 on sand
		   at 1366, 1440 and 390. */
		background:
			linear-gradient(to bottom, rgba(23, 51, 58, 0.7) 0%, rgba(23, 51, 58, 0) 24%),
			linear-gradient(to top, rgba(23, 51, 58, 0.6) 0%, rgba(23, 51, 58, 0) 45%),
			rgba(23, 51, 58, 0.62);
	}
	@media (min-width: 1024px) {
		.hero__scrim {
			background:
				linear-gradient(to bottom, rgba(23, 51, 58, 0.7) 0%, rgba(23, 51, 58, 0) 24%),
				linear-gradient(to top, rgba(23, 51, 58, 0.6) 0%, rgba(23, 51, 58, 0) 45%),
				linear-gradient(
					to left,
					rgba(23, 51, 58, 0.42) 0%,
					rgba(23, 51, 58, 0.42) 50%,
					rgba(23, 51, 58, 0) 78%
				),
				rgba(23, 51, 58, 0.36);
		}
	}

	.hero__frame {
		width: 100%;
	}
	.hero__inner {
		max-width: 36rem;
	}
	.hero__title {
		font-family: var(--d-font-display);
		font-size: var(--d-fs-h1);
		font-weight: 400;
		line-height: 1.08;
		margin: 0;
		text-wrap: balance;
	}
	/* 16: each line is a window with room for the descenders; the text rises
	   into it from under the line below. */
	.hline {
		display: block;
		overflow: hidden;
		padding-bottom: 0.22em;
		margin-bottom: -0.22em;
	}
	.hline__text {
		display: block;
	}
	.hero__lead {
		margin: var(--d-s3) 0 0;
		max-width: 44ch;
		font-size: var(--d-fs-lead);
		line-height: 1.55;
		color: var(--d-on-dark);
	}
	.hero__actions {
		margin-top: var(--d-s4);
		display: flex;
		flex-wrap: wrap;
		gap: var(--d-s2);
	}

	.hero__badge {
		position: relative;
		margin-top: var(--d-s6);
		width: 6.5rem;
		height: 6.5rem;
	}
	.hero__badge svg {
		display: block;
		width: 100%;
		height: 100%;
		fill: var(--d-on-dark);
		font-family: var(--d-font-body);
		font-weight: 700;
		will-change: transform;
	}
	.hero__badge-mark {
		position: absolute;
		inset: 50%;
		width: 0.625rem;
		height: 0.625rem;
		margin: -0.3125rem;
		border-radius: 50%;
		background: var(--d-gold);
	}

	@media (min-width: 1024px) {
		.hero__frame {
			display: grid;
			grid-template-columns: repeat(12, 1fr);
			column-gap: var(--d-s3);
		}
		.hero__inner {
			grid-column: 6 / span 7;
			max-width: none;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.hline__text {
			animation: rise-line 1.4s var(--d-ease-16) both;
		}
		.hline-2 .hline__text {
			animation-delay: 0.12s;
		}
		.hero__lead {
			animation: fade-up 1.3s var(--d-ease) 0.9s both;
		}
		.hero__actions,
		.hero__badge {
			animation: fade-up 1.3s var(--d-ease) 1.1s both;
		}
	}
	@keyframes rise-line {
		from {
			transform: translate3d(0, 120%, 0);
		}
		to {
			transform: none;
		}
	}
	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translate3d(0, 10px, 0);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
