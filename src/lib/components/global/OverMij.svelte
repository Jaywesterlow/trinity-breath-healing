<script lang="ts">
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import DriftingLeaves from '$lib/components/ui/DriftingLeaves.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { BRAND } from '$lib/constants/brand';
	import { onMount } from 'svelte';

	// Her photo since 2026-10-28, in place of the line-art portrait (about-portrait-1.svg,
	// kept under $lib/images). The photo is real on purpose (trust, E-E-A-T); what ties it
	// to the painted site is baked into the file: a ragged watercolour edge in its alpha,
	// fading into the sand, and a slightly warmer grade. The gold line round it is drawn
	// below. Source: "Warme portretfoto in de tuin.png", masked by the script in
	// .planning/quick/261028-amc-about-motion-contact/.
	import photo from '$lib/images/about-portrait-photo.webp?w=320;480;640;960;1122&enhanced';

	// The gold line draws itself once the portrait is on screen. Armed from JS, so
	// without JS (and for crawlers, and with reduced motion) it is simply there.
	let ringEl: SVGSVGElement | undefined = $state();
	onMount(() => {
		const el = ringEl;
		if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (el.getBoundingClientRect().top < innerHeight) return; // already in view: leave it drawn
		el.classList.add('about__ring--armed');
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				el.classList.add('about__ring--drawn');
				io.disconnect();
			},
			{ threshold: 0.35 }
		);
		io.observe(el);
		return () => io.disconnect();
	});

	/* Shared with /over-mij, which shows the same introduction. One constant, so
	   editing her words in one place cannot leave the other version behind. */
	import { ABOUT_INTRO as bodyText } from '$lib/content/about';
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
			<h2 class="about__heading">Vanuit eigen ervaring weet ik wat jij doormaakt.</h2>
		</header>

		<!-- No reveal: the gold line draws itself on entry, which is an entrance of its
		     own, and at ~590px on desktop the portrait is well over the third of the
		     viewport the 2026-09-15 audit set as the ceiling for a fading box. -->
		<div class="about__portrait">
			<enhanced:img
				class="about__photo"
				src={photo}
				alt={`Portret van ${BRAND.practitionerFullName}`}
				sizes="(min-width: 1100px) 34rem, 17.5rem"
				loading="lazy"
				decoding="async"
			/>
			<!-- A loose hand-drawn arc in the hero's gold, open at the top left like the
			     circle in the Werkwijze cards. Same box as the photo (1122x1402). -->
			<svg
				class="about__ring"
				viewBox="0 0 1122 1402"
				preserveAspectRatio="none"
				aria-hidden="true"
				bind:this={ringEl}
			>
				<path
					pathLength="1"
					d="M728 50C744 62 795 94 827 118C859 142 891 167 920 197C948 227 976 261 998 299C1020 337 1037 381 1052 424C1067 468 1078 513 1089 559C1099 605 1110 653 1114 701C1118 749 1119 801 1112 849C1105 897 1089 945 1070 988C1052 1031 1026 1070 1002 1107C978 1144 952 1179 923 1210C895 1242 865 1273 832 1296C800 1319 763 1336 727 1348C691 1360 653 1363 616 1367C579 1371 543 1374 505 1373C468 1372 428 1373 391 1363C354 1353 315 1337 282 1313C248 1290 218 1256 190 1222C163 1188 139 1150 116 1110C94 1071 72 1030 56 986C40 942 28 869 22 846"
				/>
			</svg>
		</div>

		<!-- Body and button fade as one block, separate from the header above because on
		     mobile the portrait sits between them. -->
		<div class="about__text" use:reveal>
			<p class="about__body">{bodyText}</p>
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

	.about__ring {
		position: absolute;
		inset: -4% -5%; /* a little outside the photo, so the line rings it rather than cutting in */
		width: 110%;
		height: 108%;
		overflow: visible;
		pointer-events: none;
	}

	.about__ring path {
		fill: none;
		stroke: var(--color-accent-gold);
		stroke-width: 1.5px;
		vector-effect: non-scaling-stroke;
		stroke-linecap: round;
		opacity: 0.85;
	}

	:global(.about__ring--armed) path {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
	}

	:global(.about__ring--drawn) path {
		stroke-dashoffset: 0;
		transition: stroke-dashoffset 2.4s cubic-bezier(0.45, 0, 0.2, 1) 0.2s;
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
