<script lang="ts">
	import ContactForm from '$lib/components/ui/contact/ContactForm.svelte';
	import DatePlanner from '$lib/components/ui/contact/DatePlanner.svelte';

	let active = $state<'form' | 'meeting'>('form');
</script>

<section id="contact" class="contact" aria-labelledby="contact-heading">
	<div class="contact__inner">
		<div class="contact__text">
			<p class="contact__eyebrow">Contact</p>
			<h2 id="contact-heading" class="contact__heading">
				Een eerste stap hoeft niet groot te zijn.
			</h2>
			<div class="contact__description">
				<p class="contact__description-intro">
					Wil je iets vragen, of meteen een gesprek plannen? Laat een bericht achter of kies een
					moment dat jou uitkomt. Ik neem zo snel mogelijk contact op.
				</p>
				<p class="contact__description-main">
					U kunt contact opnemen door <strong>het contactformulier in te vullen</strong>, direct te
					mailen naar
					<strong><a href="mailto:info@trinitybnh.nl">info@trinitybnh.nl</a></strong>, of door een
					<strong>30 minuten online meeting</strong> in te plannen. Kies wat voor jou prettig voelt.
				</p>
			</div>

			<!-- Figma draws these as radio dots, and that is what they are: one
			     choice out of two. Native radios come with arrow-key navigation
			     and the right announcement for free — a pair of aria-pressed
			     buttons would have to fake both. -->
			<fieldset class="contact__toggle">
				<legend class="visually-hidden">Hoe wil je contact opnemen?</legend>
				<label class="contact__toggle-btn" class:contact__toggle-btn--active={active === 'form'}>
					<input
						class="contact__toggle-input visually-hidden"
						type="radio"
						name="contact-mode"
						value="form"
						bind:group={active}
					/>
					<span class="contact__toggle-dot" aria-hidden="true"></span>
					<span class="contact__toggle-label">Email formulier</span>
				</label>
				<label class="contact__toggle-btn" class:contact__toggle-btn--active={active === 'meeting'}>
					<input
						class="contact__toggle-input visually-hidden"
						type="radio"
						name="contact-mode"
						value="meeting"
						bind:group={active}
					/>
					<span class="contact__toggle-dot" aria-hidden="true"></span>
					<span class="contact__toggle-label">Online meeting</span>
				</label>
			</fieldset>
		</div>

		<div class="contact__panel">
			{#if active === 'form'}
				<ContactForm />
			{:else}
				<DatePlanner />
			{/if}
		</div>
	</div>
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

	.contact__toggle {
		display: flex;
		gap: clamp(0.25rem, 1.5vw, 0.5rem);
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0; /* fieldset defaults to min-content — would blow out the grid column */
	}

	.contact__toggle-btn {
		position: relative; /* containing block for the visually-hidden radio inside */
		display: inline-flex;
		flex: 1 1 0;
		align-items: center;
		justify-content: center;
		gap: clamp(0.25rem, 1.8vw, 0.5rem);
		padding: clamp(0.375rem, 2vw, 0.5rem);
		border: none;
		background: transparent;
		border-radius: 0.625rem; /* 10px */
		cursor: pointer;
		font-family: var(--font-body);
		font-size: clamp(0.8125rem, 3.6vw, 1rem);
		color: var(--color-fg-forest);
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			transform var(--motion-hover) var(--ease-hover);
	}

	.contact__toggle-btn:has(.contact__toggle-input:focus-visible) {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	.contact__toggle-btn:hover {
		background: color-mix(in srgb, var(--color-card-warm) 55%, transparent);
		transform: translateY(var(--lift-hover));
	}

	.contact__toggle-btn:active {
		transform: translateY(0);
	}

	.contact__toggle-btn--active:hover {
		background: var(--color-card-warm);
	}

	.contact__toggle-btn--active {
		background: var(--color-card-warm);
	}

	.contact__toggle-dot {
		width: clamp(0.6875rem, 3vw, 0.875rem);
		height: clamp(0.6875rem, 3vw, 0.875rem);
		border-radius: var(--radius-full);
		border: 2px solid var(--color-fg-forest);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.contact__toggle-btn--active .contact__toggle-dot::before {
		content: '';
		width: 0.375rem; /* 6px */
		height: 0.375rem;
		border-radius: var(--radius-full);
		background: var(--color-fg-forest);
	}

	.contact__toggle-label {
		white-space: nowrap;
	}

	/* The wrapper owns the card's size and its single child stretches to fill —
	   that is what makes the e-mail form and the planner identical, so the
	   toggle cannot resize anything. */
	.contact__panel {
		display: grid;
		width: 100%;
		margin-top: 1.5rem; /* 24px, buttons -> panel gap */
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

		/* Desktop: panel LEFT, text RIGHT (node 424-113) */
		.contact__panel {
			grid-column: 1;
			grid-row: 1;
			margin-top: 0;
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
