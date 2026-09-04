<script lang="ts">
	import ContactForm from '$lib/components/ui/contact/ContactForm.svelte';
	import DatePlanner from '$lib/components/ui/contact/DatePlanner.svelte';
	import { BRAND } from '$lib/constants/brand';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	/* Instagram, WhatsApp, e-mail — the same list the footer renders, built once
	   in constants/socials.ts. */
	import { SOCIAL_LINKS } from '$lib/constants/socials';

	/* null is the rest state: neither route chosen, both cards on offer. Picking
	   one replaces the pair with that panel, and the switch link above it goes
	   straight to the other — so the two panels still alternate in place, which
	   is what the panel's fixed sizing below exists for. */
	let active = $state<'form' | 'meeting' | null>(null);

</script>

<section id="contact" class="contact" aria-labelledby="contact-heading">
	<div class="contact__inner">
		<div class="contact__text">
			<p class="contact__eyebrow">Contact</p>
			<h2 id="contact-heading" class="contact__heading">
				Een eerste stap hoeft niet groot te zijn.
			</h2>
			<p class="contact__subtitle">Zo bereik je mij</p>
			<div class="contact__description">
				<p class="contact__description-intro">
					Wil je iets vragen, of meteen een gesprek plannen? Laat een bericht achter of kies een
					moment dat jou uitkomt. Ik neem zo snel mogelijk contact op.
				</p>
				<p class="contact__description-main">
					U kunt contact opnemen door <strong>het contactformulier in te vullen</strong>, direct te
					mailen naar
					<strong><a href="mailto:{BRAND.email}">{BRAND.email}</a></strong>, of door een
					<strong>30 minuten online meeting</strong> in te plannen. Kies wat voor jou prettig voelt.
				</p>
			</div>

		</div>

		<!-- Whole card is the control, so the visible pill inside it is a span, not a
		     nested button — one target, and the pill is still free to answer the
		     hover on its own. -->
		<div class="contact__routes" hidden={active !== null}>
			<button type="button" class="route" onclick={() => (active = 'meeting')}>
				<span class="route__title">Plan een kennismaking</span>
				<span class="route__body">Kies zelf een moment. Dertig minuten, online, vrijblijvend.</span>
				<span class="route__cta">Kies een datum</span>
			</button>
			<button type="button" class="route" onclick={() => (active = 'form')}>
				<span class="route__title">Stuur een bericht</span>
				<span class="route__body">
					Liever eerst een vraag stellen? Mailen en appen kan de hele dag.
				</span>
				<span class="route__cta">Schrijf een bericht</span>
			</button>
		</div>

		<!-- Both panels are always in the DOM, and only their visibility changes.
		     Rendering the chosen one with {#if} kept the e-mail form out of the
		     prerendered HTML entirely, which is the one thing this site cannot
		     trade away: no crawler, and nobody without JS, would have found a
		     contact form at all. -->
		<div class="contact__chosen" hidden={active === null}>
			<button
				type="button"
				class="contact__switch"
				onclick={() => (active = active === 'form' ? 'meeting' : 'form')}
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M14 6 8 12l6 6"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{active === 'form' ? 'Liever een afspraak plannen' : 'Liever een bericht sturen'}
			</button>
			<div class="contact__panel">
				<div class="contact__pane" hidden={active === 'meeting'}>
					<ContactForm />
				</div>
				<div class="contact__pane" hidden={active === 'form'}>
					<DatePlanner />
				</div>
			</div>
		</div>
	</div>

	<!-- Under the whole section rather than beside the copy: the column beside
	     the card is short, and stacking these into it was what left the two
	     sides visibly mismatched. -->
	<nav class="contact__socials" aria-label="Sociale media">
		<ul class="contact__socials-list">
			{#each SOCIAL_LINKS as social (social.icon)}
				<li>
					<SocialIcon
						icon={social.icon}
						href={social.href}
						label={social.label}
						newTab={social.newTab}
						text={social.text}
						color="var(--brand-border)"
						responsiveSize={false}
					/>
				</li>
			{/each}
		</ul>
	</nav>
</section>

<style>
	.contact {
		background: var(--color-bg-sand);
		padding: var(--space-16) 1.5rem; /* 24px gutter */
	}

	.contact__inner {
		max-width: 22.125rem; /* 354px */
		margin: 0 auto;
		display: flex;
		flex-direction: column;
	}

	/* Between phone and desktop the card used to stay pinned at 354px while the
	   viewport grew to 1023, which is what made the tablet case worst of all:
	   the calendar could not grow, the e-mail form stayed tall, and the gap
	   between the two panels was at its widest. Letting the card use the room
	   closes it — wider card, bigger tiles, shorter form. */
	@media (min-width: 30rem) {
		.contact__inner {
			max-width: min(100%, 36.75rem); /* 588px, the desktop card width */
		}
	}

	.contact__text {
		display: flex;
		flex-direction: column;
		text-align: center;
	}

	/* Line heights below are Figma's own, derived from measured text-box
	   heights rather than eyeballed: 21/16 body, 26/20 eyebrow, 96/(2*40)
	   heading. They are deliberately tighter than --line-height-normal —
	   using the token here pushed every element under it progressively
	   lower and put the toggle 78px below where the design has it. */
	.contact__eyebrow {
		font-family: var(--font-body);
		font-size: 1rem; /* 16px */
		font-weight: var(--font-weight-light);
		line-height: 1.3125; /* 21/16 — Figma 519:53 is 21px tall */
		color: var(--brand-muted);
		/* No gap: Figma stacks the heading directly on the eyebrow's line
		   box (mobile 519:53 ends at 21, 519:54 starts at 21). */
		margin-bottom: 0;
	}

	.contact__heading {
		font-family: var(--font-display);
		font-size: 2rem; /* 32px */
		font-weight: var(--font-weight-medium);
		line-height: 1.21875; /* 78/(2*32) — Figma 519:54 */
		color: var(--color-fg-forest);
		margin-bottom: 1rem; /* 16px — Figma 519:52 -> 519:67 */
	}

	/* Sits between the heading and the copy — the copy is three dense lines and
	   ran straight on from the heading with nothing to break the fall. */
	.contact__subtitle {
		font-family: var(--font-body);
		font-size: 0.875rem; /* 14px */
		font-weight: var(--font-weight-medium);
		line-height: 1.3;
		color: var(--color-fg-forest);
		margin-bottom: 0.5rem; /* 8px */
	}

	.contact__description {
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		font-size: 0.75rem; /* 12px */
		line-height: 1.3333; /* 16/12 — Figma 519:56 is 64px over 4 lines */
		color: var(--color-text-subtle);
		margin-bottom: 1rem; /* 16px — copy block -> toggle row (519:66 at y=355) */
	}

	/* Intro paragraph is desktop-only per Figma — mobile shows only the
	   "U kunt contact opnemen..." paragraph. */
	.contact__description-intro {
		display: none;
	}

	.contact__description strong {
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
	}

	.contact__description a {
		position: relative;
		color: inherit;
		text-decoration: none;
	}

	/* Sits permanently (the link must read as a link in body copy) and thickens
	   on hover — the reveal vocabulary, adapted to an always-underlined link. */
	.contact__description a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.0625rem;
		height: 1px;
		background: currentColor;
		transform-origin: left center;
		transition:
			height var(--motion-hover) var(--ease-hover),
			transform var(--motion-hover) var(--ease-hover);
	}

	.contact__description a:hover::after,
	.contact__description a:focus-visible::after {
		height: 2px;
	}

	/* One row, full width, spread with space-around — not stacked beside the
	   copy, where they made the right column read as the odd one out. */
	.contact__socials {
		max-width: var(--container-max);
		margin: var(--space-12) auto 0;
	}

	.contact__socials-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		width: 100%;
		justify-content: space-around;
		align-items: center;
	}

	/* ─── The two routes ─── */
	.contact__routes {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin-top: 1.5rem; /* same 24px the panel used to take */
	}

	.route {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-6);
		border: none;
		border-radius: 1.125rem; /* 18px */
		background: var(--color-brand-green);
		color: var(--color-bg-sand);
		text-align: left;
		cursor: pointer;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.route:hover {
		transform: translateY(var(--lift-hover));
	}

	.route:active {
		transform: translateY(0);
	}

	.route:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	.route__title {
		font-family: var(--font-display);
		font-size: 1.5rem; /* 24px */
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
	}

	.route__body {
		font-family: var(--font-body);
		font-size: 0.9375rem; /* 15px */
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
	}

	/* Not a button — the card is. It still answers the hover on its own so the
	   call to action stays distinguishable inside its own target. */
	.route__cta {
		display: inline-flex;
		align-items: center;
		height: var(--space-10);
		margin-top: var(--space-2);
		padding: 0 var(--space-6);
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		line-height: 1;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	.route:hover .route__cta,
	.route:focus-visible .route__cta {
		background: var(--color-bg-sand);
		color: var(--brand-border);
	}

	/* ─── The chosen route ─── */
	.contact__chosen {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
	}

	/* The only way back, so it sits above the panel where the pair of cards
	   started, not buried under the form. */
	.contact__switch {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: 1.5rem;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.9375rem; /* 15px */
		color: var(--brand-border);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.contact__switch:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	/* The wrapper owns the card's size and its single child stretches to fill —
	   that is what makes the e-mail form and the planner identical, so the
	   toggle cannot resize anything. */
	.contact__panel {
		display: grid;
		width: 100%;
	}

	/* Both panes occupy the same cell, so the wrapper is the size of whichever is
	   showing and never the sum of the two. */
	.contact__pane {
		grid-column: 1;
		grid-row: 1;
		display: grid;
		min-width: 0;
	}

	.contact__pane[hidden] {
		display: none;
	}

	.contact__routes[hidden],
	.contact__chosen[hidden] {
		display: none;
	}

	/* Below the desktop breakpoint the e-mail form is usually the taller panel,
	   so the card needs a floor that clears it — otherwise the wrapper would be
	   the height of whichever panel is showing and the toggle would resize it.
	   The floor tracks the form's own height, which grows with the card's width
	   until the fields stop widening, hence the fluid value and the cap. */
	@media (max-width: 1023px) {
		.contact__panel {
			min-height: min(calc(15rem + 78vw), 41rem);
		}
	}

	@media (min-width: 1024px) {
		.contact {
			/* 112px block padding, not --space-16: Figma's 1440x1024 frame
			   centres an 800px card in it (112 + 800 + 112 = 1024). Scaled by
			   vh below that height so the section still clears the viewport
			   once the card itself is capped at 80vh. */
			padding: clamp(3rem, 7vh, 7rem) var(--space-8);
		}

		.contact__inner {
			max-width: none;
			display: grid;
			grid-template-columns: minmax(0, 36.75rem) minmax(0, 30.375rem); /* 588px / 486px */
			/* 126px at the 1440px reference frame: Figma's card ends at x=708
			   and the copy starts at x=834, which also lands the whole
			   1200px composition on symmetric 120px side margins. Expressed
			   in vw so narrower desktops close the gap proportionally
			   instead of forcing the two columns to shrink. */
			column-gap: clamp(3.5rem, 8.75vw, 7.875rem);
			/* NOT centre: the copy is deliberately high against the card —
			   Figma puts the card at y=112 and the copy at y=212, so it sits
			   100px below the card's top, not on its centre line. */
			align-items: start;
			justify-content: center;
		}

		/* Desktop: routes / panel LEFT, text RIGHT (node 424-113) */
		.contact__routes,
		.contact__chosen {
			grid-column: 1;
			grid-row: 1;
			margin-top: 0;
			align-self: start;
		}

		.contact__routes {
			gap: var(--space-6);
		}

		.contact__switch {
			margin-top: 0;
		}

		.contact__panel {
			/* Height follows width instead of the viewport, so the calendar's tiles
			   stay square at every screen size. The ratio is the planner's own
			   natural height at this width — the taller of the two panels — and
			   the e-mail form stretches into it, so switching between them cannot
			   change the card's size. */
			aspect-ratio: 588 / 648;
			max-height: 82vh;
			/* At the narrow end of desktop the two-column grid squeezes the card,
			   and the ratio alone makes it too short for the e-mail form's fields.
			   The floor keeps the form inside; the calendar just gains slack. */
			min-height: 35rem;
		}

		.contact__text {
			grid-column: 2;
			grid-row: 1;
			align-items: flex-start;
			text-align: left;
			padding-top: 6.25rem; /* 100px — card y=112 -> copy y=212 */
		}

		.contact__eyebrow {
			font-size: 1.25rem; /* 20px */
			line-height: 1.3; /* 26/20 — Figma 449:6 */
			margin-bottom: 0;
		}

		.contact__heading {
			font-size: 2.5rem; /* 40px */
			line-height: 1.2; /* 96/(2*40) — Figma 449:7 */
			max-width: 30.375rem; /* 486px */
			margin-bottom: 1rem; /* 16px — 449:7 ends 122, 449:8 starts 138 */
		}

		.contact__subtitle {
			font-size: 1rem; /* 16px */
			margin-bottom: 0.5rem;
		}

		.contact__description {
			font-size: 1rem; /* 16px */
			line-height: 1.3125; /* 21/16 — Figma 449:8 is 63px over 3 lines */
			text-align: left;
			margin-bottom: 0.5625rem; /* 9px — 452:65 ends 301, toggle starts 310 */
		}

		.contact__description-intro {
			display: block;
			margin-bottom: 1rem; /* 16px — 449:8 ends 201, 452:65 starts 217 */
		}

		.contact__toggle {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.34375rem; /* 5.5px — 454:424 ends 352, 454:436 starts 357.5 */
		}

		.contact__toggle-btn {
			flex: 0 0 auto;
			align-self: flex-start;
			padding: 0.5rem 1rem; /* 8px vertical / 16px horizontal */
			/* Was 20px. Every control on the site now speaks at 16px — the toggle
			   is a choice between two panels, not a headline. */
			font-size: 1rem;
			line-height: 1.3;
		}
	}
</style>
