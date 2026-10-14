<script lang="ts">
	/**
	 * The hero: real water, full-viewport, with the headline rising out of
	 * the line below it (library 16, pure CSS, in force from the first frame so
	 * nothing flashes and no script is needed) and the water itself flowing
	 * (water.ts, the signature moment). The still photo is the LCP element and
	 * the whole hero when WebGL or motion is unavailable. The badge at the
	 * bottom right is 44b: it turns with the scroll and stops when it stops.
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

	<div class="hero__inner">
		<h1 class="hero__title">
			{#each HERO.lines as words, i (i)}
				<span class="hline hline-{i + 1}">
					{#each words as word, j (j)}
						<span class="clip"><span class="clip__text">{word + ' '}</span></span>
					{/each}
				</span>
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
	</div>

	<div class="hero__badge" aria-hidden="true">
		<svg viewBox="0 0 200 200" data-spin>
			<defs>
				<path id="demo-badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
			</defs>
			<text font-size="15" letter-spacing="0.24em">
				<textPath href="#demo-badge-circle"
					>ADEM IN &#160;&#160; ADEM UIT &#160;&#160; ADEM IN &#160;&#160; ADEM UIT &#160;&#160;</textPath
				>
			</text>
		</svg>
		<span class="hero__badge-dot"></span>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100svh;
		display: grid;
		place-items: center;
		padding: calc(var(--d-bar) + var(--d-s6)) var(--d-gutter) var(--d-s7);
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
	/* The scrim: the headline sits on the water's quieter half, but the
	   brightest pixel under it is still near white, so a flat 42% plus an
	   eased gradient toward the bottom keep the sand type above 4.5:1. */
	.hero__scrim {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(to top, rgba(23, 51, 58, 0.72) 0%, rgba(23, 51, 58, 0) 55%),
			rgba(23, 51, 58, 0.42);
	}

	.hero__inner {
		text-align: center;
		max-width: 44rem;
	}
	.hero__title {
		font-family: var(--d-font-display);
		font-size: var(--d-fs-h1);
		font-weight: 700;
		line-height: 1.05;
		margin: 0;
		text-wrap: balance;
	}
	/* 16: a line is a window; each word rises from under the line below it. */
	.hline {
		display: block;
		overflow: hidden;
		padding-bottom: 0.1em;
		margin-bottom: -0.1em;
	}
	.clip {
		display: inline-block;
		overflow: hidden;
		vertical-align: top;
	}
	.clip__text {
		display: inline-block;
	}
	/* The word's trailing space is in the DOM (so the heading reads as a
	   sentence) but collapses at the edge of its inline-block; this is the gap. */
	.clip + .clip {
		margin-left: 0.25em;
	}
	.hero__lead {
		margin: var(--d-s3) auto 0;
		max-width: 46ch;
		font-size: var(--d-fs-lead);
		color: var(--d-on-dark);
	}
	.hero__actions {
		margin-top: var(--d-s4);
		display: flex;
		flex-wrap: wrap;
		gap: var(--d-s2);
		justify-content: center;
	}

	.hero__badge {
		position: absolute;
		right: var(--d-s4);
		bottom: var(--d-s4);
		width: 7.5rem;
		height: 7.5rem;
		display: none;
	}
	.hero__badge svg {
		width: 100%;
		height: 100%;
		fill: var(--d-on-dark);
		font-family: var(--d-font-body);
		font-weight: 700;
		transition: transform 100ms linear;
	}
	.hero__badge-dot {
		position: absolute;
		inset: 50%;
		width: 0.5rem;
		height: 0.5rem;
		margin: -0.25rem;
		border-radius: 50%;
		background: var(--d-on-dark);
	}
	@media (min-width: 1024px) {
		.hero__badge {
			display: block;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.hline {
			animation: rise-line 1.4s var(--d-ease-16) both;
		}
		.clip {
			animation: rise-clip 1.7s var(--d-ease-16) both;
		}
		.hline-2,
		.hline-2 .clip {
			animation-delay: 0.1s;
		}
		.hero__lead {
			animation: fade-up 1.3s var(--d-ease) 0.9s both;
		}
		.hero__actions {
			animation: fade-up 1.3s var(--d-ease) 1.1s both;
		}
	}
	@keyframes rise-line {
		from {
			transform: translate3d(0, 50%, 0);
		}
		to {
			transform: none;
		}
	}
	@keyframes rise-clip {
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
