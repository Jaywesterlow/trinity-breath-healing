<script lang="ts">
	import { onMount } from 'svelte';
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import HeroServiceCard from '$lib/components/ui/HeroServiceCard.svelte';

	// The hero illustration is a centerline trace of the original line art, inlined as SVG so
	// its strokes can draw themselves on load (stroke-dashoffset, see .hero__draw below).
	// Inlined via ?raw + {@html} rather than <img>: an external SVG can't be reached by this
	// component's CSS, and inlining also drops the 790 KB PNG request off the LCP path.
	// Regenerate with .planning/quick/20260713-hero-draw-on/trace/ if the artwork changes.
	import heroSvg from '$lib/images/hero-illustration.svg?raw';

	let sectionEl: HTMLElement | null = $state(null);
	let leftEl: HTMLDivElement | null = $state(null);

	// The desktop hero image must never grow taller than the content column beside it
	// (heading + body + CTA + service cards). CSS percentage-height on a replaced
	// element (img) nested this deep in grid+flex doesn't resolve as a definite value —
	// confirmed empirically, it falls back to matching the viewport width outright and
	// crops the image (the same failure mode documented on .hero__img below for a
	// different combo). A ResizeObserver measures .hero__left's real rendered height
	// and writes it as a plain px custom property, which var() substitutes into a
	// genuinely definite length — sidestepping the percentage-resolution issue entirely.
	onMount(() => {
		if (!leftEl || !sectionEl) return;

		const ro = new ResizeObserver((entries) => {
			const height = entries[0]?.contentRect.height;
			if (height && sectionEl) {
				sectionEl.style.setProperty('--hero-content-height', `${height}px`);
			}
		});
		ro.observe(leftEl);

		return () => ro.disconnect();
	});
</script>

<section class="hero" bind:this={sectionEl}>
	<div class="hero__inner">

		<!-- Image column: top on mobile (DOM order), right on desktop (order:2) -->
		<div class="hero__image-col">
			<!-- Wrapper stands in for the <picture> that <enhanced:img> used to emit: a
			     full-width block box. It keeps this flex item's width constant across the
			     ResizeObserver's height write, so only height shifts (as before) — without it
			     the SVG becomes the flex item itself and its width shifts too, tripling CLS. -->
			<div class="hero__img-wrap">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time asset, not user input -->
				{@html heroSvg}
			</div>
			<nav class="hero__social" aria-label="Sociale media">
				<ul class="hero__social-list">
					<li>
						<SocialIcon
							icon="x"
							href="https://x.com/trinitybnh"
							label="Volg ons op X (Twitter)"
							color="var(--brand-border)"
							background="var(--color-bg-sand)"
							responsiveSize={false}
						/>
					</li>
					<li>
						<SocialIcon
							icon="facebook"
							href="https://facebook.com/trinitybnh"
							label="Volg ons op Facebook"
							color="var(--brand-border)"
							background="var(--color-bg-sand)"
							responsiveSize={false}
						/>
					</li>
					<li>
						<SocialIcon
							icon="instagram"
							href="https://instagram.com/trinitybnh"
							label="Volg ons op Instagram"
							color="var(--brand-border)"
							background="var(--color-bg-sand)"
							responsiveSize={false}
						/>
					</li>
				</ul>
			</nav>
		</div>

		<!-- Content column: below image on mobile (DOM order), left on desktop (order:1) -->
		<div class="hero__left" bind:this={leftEl}>
			<div class="hero__content">
				<h1 class="hero__heading">
					Rust in je hoofd.<br />
					Ontspanning in je lichaam.
				</h1>
				<p class="hero__body">
					Ik weet hoe het voelt om vast te lopen, fysiek, mentaal en emotioneel.
					Via lichaamsgerichte therapie, ademwerk en energetische behandelingen
					help ik jou terug naar rust, herstel en jezelf.
				</p>
				<ButtonLink href="/contact" label="Maak een afspraak" />
			</div>

			<ul class="hero__cards" aria-label="Behandelingen">
				<li>
					<HeroServiceCard
						href="/diensten/goldhealing"
						label="Goldhealing"
						imgSrc="/images/card-goldhealing.png"
						variant="forest"
					/>
				</li>
				<li>
					<HeroServiceCard
						href="/diensten/spinal-touch"
						label="Spinal Touch"
						imgSrc="/images/card-spinal-touch.png"
						variant="border"
					/>
				</li>
				<li>
					<a href="/behandelingen" class="card card--outline">
						<div class="card__head">
							<span class="card__title">Meer klachten</span>
							<span class="card__arrow" aria-hidden="true">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M6 18L18 6M18 6H11M18 6V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</span>
						</div>
						<p class="card__desc">
							Er altijd is een aanpak die bij jou past.
							Ik leg per therapie uit wat je kunt verwachten.
						</p>
					</a>
				</li>
			</ul>
		</div>

	</div>
</section>

<style>
	/* ─── Section ─── */
	.hero {
		background: var(--color-bg-sand);
		overflow: hidden; /* clips mobile image bleed */
	}

	.hero__inner {
		display: flex;
		flex-direction: column;
		max-width: var(--container-max); /* 1200px — same cap as nav/footer, so content edges line up */
		margin: 0 auto;
	}

	/* ─── Image column — mobile: top via DOM order ─── */
	.hero__image-col {
		/* Hero's mobile content is fixed-height (image is width-bound, not vh-bound), so on
		   tall viewports the next section starts creeping into view below the fold. Content
		   height also varies by viewport WIDTH (heading/body text wraps to a different number
		   of lines at different widths, non-monotonically) — 808px is calibrated to the
		   worst case in the ≤389px bucket (~340-375px, where text wraps tallest). The ≥390px
		   bucket below uses a later threshold since its content is naturally shorter, keeping
		   the added margin closer to the minimum actually needed at those widths. Verified via
		   a full width x height scan (320-430 x 667-1300) to leave zero peek in either bucket. */
		margin-top: calc(var(--space-6) + max(0px, 100vh - 808px));
		width: 100%;
		overflow: hidden; /* clip the symmetric bleed to the viewport edges */
		position: relative;
	}

	/* ≥390px: heading/body text wraps to fewer lines here, so content is naturally shorter —
	   a later threshold keeps the added margin closer to the minimum actually needed. */
	@media (min-width: 390px) and (max-width: 767px) {
		.hero__image-col {
			margin-top: calc(var(--space-6) + max(0px, 100vh - 861px));
		}
	}

	/* The illustration is injected via {@html}, so Svelte's scoping classes never land on it —
	   :global() under the (scoped) parent reaches it without leaking outside the hero.
	   Every sizing rule below is carried over unchanged from the <img> this replaced, with one
	   addition: an inline <svg> is NOT a replaced element the way <img> is — `width: auto`
	   resolves to "fill the container" rather than "follow the intrinsic aspect ratio", which
	   letterboxed the art inside a too-wide box on desktop (measured 1.093 vs the true 1.171).
	   An explicit aspect-ratio restores the <img> behaviour the surrounding CSS was tuned for. */
	.hero__img-wrap {
		display: block;
		width: 100%;
	}

	.hero__image-col :global(.hero__img) {
		display: block;
		position: relative;
		left: 50%;
		transform: translateX(-50%); /* symmetric bleed — centres the image whatever its width */
		aspect-ratio: 2015 / 1721; /* the artwork's intrinsic ratio — see note above */
		width: auto; /* auto width keeps aspect locked — never crops, never stretches */
		height: auto;
		/* Was 130%. That ceiling was never actually reachable before: <enhanced:img> served a
		   downscaled raster (intrinsic 389px at this breakpoint), so `width: auto` landed well
		   under the cap and the art sat inside the column. The SVG's intrinsic width is the
		   artwork's full 2015px, which WOULD hit 130% and bleed off both edges — a size change
		   nobody asked for. 100% reproduces the shipped rendering exactly (390x333 at 390px). */
		max-width: 100%;
		max-height: max(220px, calc(100vh - 24rem)); /* full-bleed on tall phones; shrinks (never below 220px) on short screens, in step with the heading */
		color: #211f1d; /* the original artwork's ink colour; strokes are currentColor */
	}

	/* ─── Draw-on: the strokes paint themselves on load ─────────────────────────────
	   Each <path> carries pathLength="1", so one dash covers the whole path whatever its
	   real length, and offsetting 1 → 0 draws it end to end. Per-path --t (delay) and
	   --d (duration) are baked into the SVG, staggered ridges → tree → river → waterfall.
	   Composited on the GPU; no JS, no layout, no scroll coupling. */
	.hero__image-col :global(.hero__draw path) {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: hero-draw var(--d, 0.6s) ease-out var(--t, 0s) forwards;
	}

	@keyframes hero-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Reduced motion: show the finished drawing immediately, never animate. */
	@media (prefers-reduced-motion: reduce) {
		.hero__image-col :global(.hero__draw path) {
			stroke-dashoffset: 0;
			animation: none;
		}
	}

	/* Social: desktop only */
	.hero__social {
		display: none;
	}

	.hero__social-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* ─── Content ─── */
	.hero__content {
		padding: var(--space-4) var(--space-6) var(--space-16); /* bottom space so the section doesn't butt the next one */
		--btn-label-size: var(--font-size-sm); /* 14px on mobile, Figma spec */
	}

	.hero__heading {
		font-family: var(--font-display);
		font-size: min(var(--fs-title), 4.8vh); /* mobile: token size, but shrinks with the image on short screens */
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
		line-height: var(--line-height-tight);
		margin-bottom: var(--space-4);
	}

	.hero__body {
		font-family: var(--font-body);
		font-size: var(--fs-body-xs); /* fluid hero-intro clamp: 11px → 16px */
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
		margin-bottom: var(--space-4);
	}

	/* ─── Service cards ─── */
	.hero__cards {
		list-style: none;
		padding: var(--space-8) var(--space-6) 3.5rem; /* 3.5rem = 56px; between --space-12 and --space-16 */
		margin: 0;
		display: none; /* mobile: cards hidden per Figma; keeps the CTA above the fold */
		gap: var(--space-4);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.hero__cards::-webkit-scrollbar {
		display: none;
	}

	/* ─── Outline card (Meer klachten) ─── */
	.card--outline {
		background: var(--color-bg-sand);
		border: 2px solid var(--color-fg-forest);
		border-radius: 1.25rem; /* 20px — Figma spec; see HeroServiceCard for same value */
		color: var(--color-fg-forest);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: 12.5rem; /* 200px — Figma text-card width */
		height: 8.125rem; /* 130px — match photo cards (HeroServiceCard) */
		box-sizing: border-box;
		padding: var(--space-4) var(--space-5);
		gap: var(--space-2);
		text-decoration: none;
		transition: opacity var(--motion-fast);
		overflow: hidden;
	}

	.card--outline:hover {
		opacity: 0.88;
	}

	.card__head {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.card__title {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
	}

	.card__arrow {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		color: inherit;
	}

	.card__desc {
		font-family: var(--font-body);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-light);
		color: var(--color-text-subtle); /* neutral stone gray token (was --color-muted sage) */
		line-height: var(--line-height-normal);
	}

	/* ─── Desktop / tablet (≥ 768px) — two-column, image beside text ─── */
	@media (min-width: 768px) {
		.hero__inner {
			display: grid;
			grid-template-columns: 44% 1fr; /* content keeps its reserved 44% share; image gets the rest */
			/* align-items: start (not the grid default, stretch) is load-bearing: .hero__left
			   must report its own intrinsic content height to the ResizeObserver in the
			   script block, unaffected by the row's track height. Stretch would make it
			   match the row instead — which the image's height also feeds — a circular
			   dependency that compounds every frame into runaway values (confirmed
			   empirically: heights spiralled into the thousands of px). */
			align-items: start;
			position: relative; /* anchor for the absolutely-positioned social icons */
		}

		/* Content column: heading group + cards stack from the top, fixed gap between them.
		   flex-start (not space-between) keeps the gap tight and constant at every viewport
		   height, so the content never drifts and the cards stay above the fold. */
		.hero__left {
			grid-column: 1;
			grid-row: 1;
			position: relative;
			z-index: 1; /* content always paints above the artwork — no absolute positioning needed */
			min-width: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
		}

		.hero__content {
			padding: var(--space-12) var(--space-10) 0 0; /* left is 0 — max-width + centering sets the edge */
			margin-bottom: var(--space-8); /* desktop-only floor gap so content never butts the service cards */
			--btn-label-size: var(--font-size-xl); /* 20px on desktop */
		}

		.hero__heading {
			font-size: var(--fs-title-sm); /* tablet 768–1023: smaller token; ≥1024 restores full --fs-title */
			max-width: 25rem;
			margin-bottom: var(--space-4);
		}

		.hero__body {
			max-width: 27.5rem;
			margin-bottom: var(--space-6);
		}

		.hero__cards {
			display: flex; /* re-enabled at desktop (hidden on mobile) */
			padding: 0 0 var(--space-10) 0; /* left is 0 — max-width + centering sets the edge */
			overflow: visible; /* let the third card render fully; column is wide enough now */
		}

		/* Image column sits in the right grid track (col 2), which spans exactly from the content's
		   right edge to the screen's right edge. The illustration is centred within it — i.e. at the
		   midpoint between the hero content and the right edge of the screen. */
		.hero__image-col {
			grid-column: 2; /* right track only — no longer spans/overlaps the content column */
			grid-row: 1;
			min-width: 0;
			margin-top: 0;
			display: flex;
			align-items: flex-start;
			justify-content: center; /* centre the illustration in the right zone (content-right ↔ screen-right) */
			padding-top: var(--space-12);
			overflow: hidden; /* clip only if the art is wider than the track — never a horizontal scrollbar */
		}

		.hero__image-col :global(.hero__img) {
			left: auto;
			transform: none; /* reset the mobile bleed-centring; desktop positions via the grid column */
			width: auto;
			/* Definite height, not auto+max-height/percentage: confirmed empirically (twice,
			   with two different approaches) that this replaced element's sizing inside
			   nested grid+flex falls back to matching the viewport width outright instead
			   of the aspect-ratio + height-clamped size, badly cropping the image. A
			   genuinely definite length sidesteps it. --hero-content-height is a plain px
			   value written by a ResizeObserver in the script block, measuring
			   .hero__left's real rendered height (heading + body + CTA + cards) — so the
			   image is capped at exactly the content column's height and never grows past
			   it. The var() fallback only matters for the brief pre-hydration paint,
			   before the observer has measured anything. */
			height: var(--hero-content-height, min(calc(100vh - var(--nav-height)), 1000px, 55vw));
			max-width: none; /* width follows aspect */
			max-height: none; /* cancels the mobile-base max-height, which otherwise keeps cascading through */
		}

		/* Social icons appear at desktop — top-right, matches Figma */
		.hero__social {
			display: block;
			position: absolute;
			right: 0; /* max-width + centering on .hero__inner sets the edge */
			top: var(--space-12);
			z-index: 5;
		}

		.hero__social-list {
			display: flex;
			flex-direction: column;
			gap: var(--space-6);
		}
	}

	/* Tablet only (768–1023px): row is too narrow for content to breathe flush against
	   the edge the way it can once max-width takes over at 1024px+, or the way the
	   true-mobile stacked layout can below 768px. */
	@media (min-width: 768px) and (max-width: 1023.98px) {
		.hero__content {
			padding-left: var(--space-6);
		}

		.hero__cards {
			padding-left: var(--space-6);
		}

		.hero__social {
			right: var(--space-6);
		}
	}

	/* ─── Desktop (≥ 1024px) — restore the full-size hero title (tablet uses --fs-title-sm) ─── */
	@media (min-width: 1024px) {
		.hero__heading {
			font-size: var(--fs-title); /* full 36→48 above the tablet range */
		}
	}
</style>
