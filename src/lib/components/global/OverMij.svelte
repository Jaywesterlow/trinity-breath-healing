<script lang="ts">
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import DriftingLeaves from '$lib/components/ui/DriftingLeaves.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	import { onMount } from 'svelte';

	// Her photo since 2026-10-28, in place of the line-art portrait (about-portrait-1.svg,
	// kept under $lib/images). The photo is real on purpose (trust, E-E-A-T); what ties it
	// to the painted site is baked into the file: a ragged watercolour edge in its alpha,
	// fading into the sand, and a slightly warmer grade. Source: "Warme portretfoto in
	// de tuin.png", masked by the script in .planning/quick/261028-amc-about-motion-contact/.
	// The gold line that ringed it went on 2026-10-29 (owner: the ragged sides are
	// "already enough").
	import photo from '$lib/images/about-portrait-photo.webp?w=320;480;640;960;1122&enhanced';

	// The photo paints itself in once it is on screen (owner, 2026-10-29: "a painting
	// effect, a lot of ease-out"). A mask of horizontal brush strokes (three panels:
	// painted, the wet edge, empty; .planning/quick/261029-apl-autumn-paint-leaves/
	// paint-mask.cjs) slides across the photo, so the strokes sweep it in from the
	// left. Library 48a (the ink edge) was read and not used: it is scrubbed by
	// scroll and its edge filter does not render in Safari or Firefox, and this has
	// to work on every screen. A CSS mask image does.
	//
	// Armed from JS and only once the mask has loaded, so without JS, for crawlers,
	// with reduced motion, or with the photo already on screen, it is simply there.
	// The mask is dropped when the stroke is done.
	import paintMask from '$lib/images/about-paint-mask.webp';

	let portraitEl: HTMLDivElement | undefined = $state();
	onMount(() => {
		const el = portraitEl;
		if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (el.getBoundingClientRect().top < innerHeight) return;
		let io: IntersectionObserver | undefined;
		let cancelled = false;
		const mask = new Image();
		mask.src = paintMask;
		mask
			.decode()
			.then(() => {
				if (cancelled || el.getBoundingClientRect().top < innerHeight) return;
				el.style.setProperty('--paint-mask', `url(${paintMask})`);
				el.classList.add('about__portrait--armed');
				io = new IntersectionObserver(
					([entry]) => {
						if (!entry?.isIntersecting) return;
						io?.disconnect();
						el.classList.add('about__portrait--painted');
						el.addEventListener(
							'transitionend',
							() => el.classList.remove('about__portrait--armed', 'about__portrait--painted'),
							{ once: true }
						);
					},
					{ threshold: 0.3 }
				);
				io.observe(el);
			})
			.catch(() => {}); // no mask, no effect: the photo just stays as it is
		return () => {
			cancelled = true;
			io?.disconnect();
		};
	});

	/* Shared with /over-mij, which shows the same introduction. One constant, so
	   editing her words in one place cannot leave the other version behind. */
</script>

<!-- Design "A, grootboek" (2026-09-16), minus its ledger: the three figures moved to
     the proof band straight under the hero on 2026-10-17 (Proof.svelte), so a visitor
     sees them before scrolling instead of after four sections. Two columns on desktop:
     the portrait drawn straight onto the sand, and the words.

     DOM order is the reading order on every width: eyebrow and heading, portrait,
     body and button. Desktop places the same three blocks on a grid (see the
     ≥1100 rules); below that they simply stack in this order, everything centred on
     one axis (2026-09-17). -->
<section class="about" id="over-mij">
	<DriftingLeaves />
	<div class="about__inner">
		<header class="about__header" use:reveal>
			<p class="about__eyebrow">Over mij</p>
			<h2 class="about__heading">Mijn reis naar bewustwording.</h2>
		</header>

		<!-- No reveal: the photo paints itself in on entry, which is an entrance of its
		     own, and at ~590px on desktop the portrait is well over the third of the
		     viewport the 2026-09-15 audit set as the ceiling for a fading box. -->
		<div class="about__portrait" bind:this={portraitEl}>
			<enhanced:img
				class="about__photo"
				src={photo}
				alt={`Portret van ${BRAND.practitionerFullName}`}
				sizes="(min-width: 1100px) 34rem, 17.5rem"
				loading="lazy"
				decoding="async"
			/>
		</div>

		<!-- Body and button fade as one block, separate from the header above because on
		     mobile the portrait sits between them. -->
		<div class="about__text" use:reveal>
			<!-- Her words, verbatim (2026-10-30). Homepage only: /over-mij keeps its own
			     intro (ABOUT_INTRO) until her full story arrives. -->
			<p class="about__body">
				Mijn naam is Brigitte. Mijn persoonlijke levensreis heeft mij geleerd hoe belangrijk het is
				om stil te staan bij jezelf, naar je gevoel te luisteren en opnieuw verbinding te maken met
				wie je werkelijk bent.
			</p>
			<div class="about__more">
				<ButtonLink label="Lees meer over mij" href="/over-mij" variant="secondary" />
			</div>
		</div>

		<!-- The two feature bullets, parked for now (2026-09-16) so they can come back.
		     They need `AboutFeature` from $lib/components/ui and the heart/sprout traces
		     from $lib/images (import heartSvg from '$lib/images/heart.svg?raw', same for
		     sprout.svg), and sat between the body and the button:

		     <ul class="about__features" use:reveal>
		       <li>
		         <AboutFeature
		           artSvg={heartSvg}
		           title="Vanuit eigen ervaring"
		           body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
		         />
		       </li>
		       <li>
		         <AboutFeature
		           artSvg={sproutSvg}
		           iconScale={1.2}
		           title="Vakkundig opgeleid"
		           body="Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
		         />
		       </li>
		     </ul>

		     with `.about__features { display: flex; flex-direction: column; gap: var(--space-6);
		     list-style: none; padding: 0; margin: 0; }`. -->
	</div>
</section>

<style>
	.about {
		position: relative; /* the leaves layer fills the section */
		background: var(--color-bg-sand);
	}

	.about__inner {
		position: relative;
		z-index: 1; /* above the leaves */
		max-width: var(--container-max); /* same cap as nav/footer/hero/werkwijze */
		margin: 0 auto;
		padding: var(--section-pad) var(--space-6);
	}

	/* --- Header --- */
	.about__header {
		max-width: 24rem; /* 384px — matches Werkwijze convention */
		margin: 0 auto var(--space-8);
		text-align: center;
	}

	.about__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	/* The heading and the paragraph under it share one measure — the site's rule for
	   any block that is not centred. On mobile the header's 24rem cap is the narrower
	   of the two and wins; on desktop 38ch is the one that bites. */
	.about__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 38ch;
		/* The block itself sits on the header's centre line, not only its text: with
		   a max-width narrower than the header, a left-hugging block would put the
		   heading's centre off the paragraph's and the button's below it. */
		margin-inline: auto;
	}

	/* --- Portrait --- */
	/* The photo fades into the sand through its own alpha: no card, border or shadow. */
	.about__portrait {
		position: relative;
		max-width: 17.5rem; /* ~280px on a phone; the grid column sets it on desktop */
		margin: 0 auto var(--space-8);
	}

	.about__photo {
		display: block;
		width: 100%;
		height: auto;
	}

	/* Paint-in: the mask is three panels wide, so at 100% the empty panel covers the
	   photo and at 0% the painted one does; the strokes of the middle panel pass over
	   it in between. Long and soft at the end: an expo ease-out. */
	.about__portrait:global(.about__portrait--armed) {
		-webkit-mask-image: var(--paint-mask);
		mask-image: var(--paint-mask);
		-webkit-mask-size: 300% 100%;
		mask-size: 300% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		-webkit-mask-position: 100% 0;
		mask-position: 100% 0;
	}

	.about__portrait:global(.about__portrait--painted) {
		-webkit-mask-position: 0 0;
		mask-position: 0 0;
		transition:
			-webkit-mask-position 3.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s,
			mask-position 3.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
	}

	/* --- Body + button --- */
	/* Below the desktop grid (< 1100px, phones and tablets alike since 2026-09-17)
	   the whole column reads as one centred stack: eyebrow, heading, portrait,
	   paragraph, button, ledger, all on the same axis. The header above was
	   already centred; the paragraph, the button and the ledger rows used to hug
	   the left edge under a centred heading and a centred portrait. */
	.about__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-10);
		text-align: center;
	}

	.about__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
		line-height: var(--line-height-normal);
		max-width: 38ch; /* the same measure as the heading — see .about__heading */
	}

	/* The wrapper is what centres the button; ButtonLink itself is untouched. */
	.about__more {
		align-self: center;
		display: flex;
		justify-content: center;
	}

	/* --- Ledger --- */
	/* --- Desktop (>=1100px) --- */
	/* 1100, not 1024, since 2026-09-17: the owner's rule is that tablets render as
	   mobile, and the hero and the Werkwijze pin switch at 1100px (b827984), so this
	   section switches on the same line rather than giving a 1024px iPad Pro the
	   desktop grid between a mobile hero and a pinned track.

	   Portrait and words: 5fr 6fr on a 64px gutter (the ledger of figures moved to
	   the proof band under the hero on 2026-10-17), everything centred on the
	   row. The header and the text block are separate siblings (the phone puts the
	   portrait between them), so they take the two rows of the middle column and hug
	   the seam between them — header at the end of its row, text at the start of the
	   next — which centres the pair as a unit against the portrait, which spans both
	   rows. */
	@media (min-width: 1100px) {
		.about__inner {
			display: grid;
			grid-template-columns: 5fr 6fr;
			grid-template-areas:
				'portrait header'
				'portrait text';
			column-gap: var(--space-16); /* 64px */
			row-gap: var(--space-6);
			align-items: center;
			padding: var(--section-pad) 0; /* horizontal is 0 — max-width + centering sets the edge */
		}

		.about__header {
			grid-area: header;
			align-self: end;
			max-width: none;
			margin: 0;
			text-align: left;
		}

		.about__heading {
			margin-inline: 0; /* left-aligned in its column; the base rule's auto is the stack's */
			/* The words column is wider since the ledger left; the heading keeps a
			   heading's measure rather than running the full column. */
			max-width: 22ch;
			text-wrap: balance;
		}

		.about__portrait {
			grid-area: portrait;
			max-width: none;
			margin: 0;
		}

		/* The grid's middle column is a left-aligned reading column: text, button
		   and ledger go back to the left edge the base rules centre below 1100. */
		.about__text {
			grid-area: text;
			align-self: start;
			align-items: flex-start;
			margin: 0;
			text-align: left;
		}

		.about__more {
			align-self: flex-start;
			justify-content: flex-start;
		}
	}
</style>
