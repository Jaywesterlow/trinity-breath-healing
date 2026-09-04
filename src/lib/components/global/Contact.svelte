<script lang="ts">
	import ContactForm from '$lib/components/ui/contact/ContactForm.svelte';
	import DatePlanner from '$lib/components/ui/contact/DatePlanner.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	/* Instagram, WhatsApp, e-mail — the same list the footer renders, built once
	   in constants/socials.ts. */
	import { SOCIAL_LINKS } from '$lib/constants/socials';
	/* The carousel's own magnet, not a copy of it: same action, same tuning, so
	   the two cards pull toward the cursor exactly the way a treatment card does. */
	import { magnetic } from '$lib/actions/magnetic';

	/* null is the rest state: neither route chosen, both cards on offer. Picking
	   one replaces the pair with that panel, and the switch link above it goes
	   straight to the other — so the two panels still alternate in place, which
	   is what the panel's fixed sizing below exists for. */
	let active = $state<'form' | 'meeting' | null>(null);

	/* The design lists the channels e-mail first and Instagram last — the reverse
	   of the footer's order, where the profile leads. Reversed here rather than
	   reordered in constants/socials.ts, so the footer keeps its own order. */
	const CONTACT_SOCIALS = [...SOCIAL_LINKS].reverse();

	const CHECKS = [
		'Een kennismaking van 30 minuten, online en vrijblijvend',
		'Je kiest zelf het moment, bevestiging komt meteen per mail',
		'Mailen en appen kan de hele dag, je hoeft niet te bellen',
		'Sessies bij jou thuis of op afstand, in Amsterdam en omgeving'
	];
</script>

<section id="contact" class="contact" aria-labelledby="contact-heading">
	<div class="contact__inner">
		<header class="contact__header">
			<p class="contact__eyebrow">Contact</p>
			<h2 id="contact-heading" class="contact__heading">Hoe wil je contact opnemen?</h2>
			<!-- Desktop shows this in the right-hand column; on mobile it belongs
			     under the heading, which is where the design puts it. -->
			<p class="contact__intro contact__intro--mobile">
				Vul het formulier in of plan een kennismaking, wanneer het jou uitkomt.
			</p>
		</header>

		<div class="contact__grid">
			<!-- Whole card is the control, so the visible pill inside it is a span,
			     not a nested button — one target, and the pill is still free to
			     answer the hover on its own. -->
			<div class="contact__routes" hidden={active !== null}>
				<button
					type="button"
					class="route"
					use:magnetic={{ enabled: true, dragging: false }}
					onclick={() => (active = 'meeting')}
				>
					<span class="route__title">Plan een kennismaking</span>
					<span class="route__body">Kies zelf een moment. Dertig minuten, online, vrijblijvend.</span>
					<span class="route__cta">Kies een datum</span>
				</button>
				<button
					type="button"
					class="route"
					use:magnetic={{ enabled: true, dragging: false }}
					onclick={() => (active = 'form')}
				>
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

			<div class="contact__aside">
				<p class="contact__intro contact__intro--desktop">
					Vul het formulier in of plan een kennismaking, wanneer het jou uitkomt.
				</p>

				<div class="contact__block">
					<p class="contact__block-title">Wat je kunt verwachten</p>
					<ul class="contact__checks">
						{#each CHECKS as check (check)}
							<li class="contact__check">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
									<path
										d="m8.5 12 2.4 2.4 4.6-4.8"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<span>{check}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="contact__rule"></div>

				<div class="contact__block contact__block--socials">
					<p class="contact__block-title">Of rechtstreeks</p>
					<nav aria-label="Sociale media">
						<ul class="contact__socials">
							{#each CONTACT_SOCIALS as social (social.icon)}
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
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.contact {
		background: var(--color-bg-sand);
		padding: var(--space-16) 1.5rem; /* 24px gutter */
	}

	.contact__inner {
		max-width: var(--container-max); /* 1200px — same cap as nav/footer/hero */
		margin: 0 auto;
	}

	/* ─── Header ─── */
	.contact__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.contact__eyebrow {
		font-family: var(--font-body);
		font-size: 1rem; /* 16px */
		font-weight: var(--font-weight-light);
		line-height: 1.3125;
		color: var(--brand-muted);
		margin: 0;
	}

	.contact__heading {
		font-family: var(--font-display);
		font-size: 2rem; /* 32px */
		font-weight: var(--font-weight-medium);
		line-height: 1.21875;
		color: var(--color-fg-forest);
		margin: 0;
		text-wrap: balance;
	}

	.contact__intro {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
		margin: 0;
	}

	/* One sentence, two homes: under the heading on mobile, in the right-hand
	   column on desktop. Rendered twice rather than moved, because moving it
	   would mean the column it is not in loses its first line of copy. */
	.contact__intro--desktop {
		display: none;
	}

	/* ─── Layout ─── */
	.contact__grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		margin-top: var(--space-8);
	}

	/* ─── The two routes ─── */
	.contact__routes {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.contact__routes[hidden],
	.contact__chosen[hidden] {
		display: none;
	}

	.route {
		--magnet-x: 0px;
		--magnet-y: 0px;
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
		/* The carousel's magnet, composed the same way TreatmentCard composes it:
		   use:magnetic only ever writes --magnet-x/y and, while tracking,
		   --tcard-transition-duration. Nothing rotates this card, so unlike a
		   treatment card it needs no counter-rotation around the translate. */
		transform: translate(var(--magnet-x), var(--magnet-y));
		transition: transform var(--tcard-transition-duration, var(--motion-fast)) var(--ease-out);
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
		justify-content: center;
		min-height: var(--space-10);
		margin-top: var(--space-2);
		padding: 0 var(--space-6);
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl); /* 20px */
		line-height: 1;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	/* Mobile: the pill spans the card, as the design has it. */
	.route__cta {
		align-self: stretch;
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
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: var(--brand-border);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.contact__switch:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	/* The wrapper owns the card's size and its single visible child stretches to
	   fill — that is what makes the e-mail form and the planner identical, so
	   switching between them cannot resize anything. */
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

	@media (max-width: 1023px) {
		.contact__panel {
			min-height: min(calc(15rem + 78vw), 41rem);
		}
	}

	/* ─── Right-hand column ─── */
	.contact__aside {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.contact__block {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.contact__block-title {
		font-family: var(--font-body);
		font-size: 0.9375rem; /* 15px */
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
		margin: 0;
	}

	.contact__checks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.contact__check {
		display: flex;
		align-items: flex-start;
		gap: 0.8125rem; /* 13px */
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.contact__check svg {
		flex: none;
		margin-top: 0.125rem;
		color: var(--brand-border);
	}

	.contact__rule {
		height: 1px;
		background: color-mix(in srgb, var(--brand-border) 25%, transparent);
	}

	.contact__socials {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* Mobile drops the channels: the design ends the section on the checks, and
	   the footer carries the same three icons a screen further down. */
	.contact__rule,
	.contact__block--socials {
		display: none;
	}

	/* ─── Desktop ─── */
	@media (min-width: 1024px) {
		.contact {
			padding: clamp(3rem, 7vh, 7rem) var(--space-8);
		}

		/* Header centred over both columns, per the design. */
		.contact__header {
			align-items: center;
			text-align: center;
			gap: 0.875rem;
		}

		.contact__eyebrow {
			font-size: 1.25rem; /* 20px */
			line-height: 1.3;
		}

		.contact__heading {
			font-size: 3rem; /* 48px */
			line-height: 1.2;
		}

		.contact__intro--mobile {
			display: none;
		}

		.contact__intro--desktop {
			display: block;
			font-size: 1rem;
		}

		.contact__grid {
			display: grid;
			grid-template-columns: 7fr 5fr;
			column-gap: clamp(3.5rem, 8.75vw, 6.5rem);
			align-items: start;
			margin-top: var(--space-12);
		}

		.contact__routes,
		.contact__chosen {
			grid-column: 1;
			grid-row: 1;
			gap: var(--space-6);
		}

		.contact__aside {
			grid-column: 2;
			grid-row: 1;
			gap: var(--space-8);
		}

		.route {
			padding: 2rem;
			gap: var(--space-4);
		}

		.route__title {
			font-size: 1.6875rem; /* 27px */
		}

		.route__body {
			font-size: 1rem;
		}

		/* Desktop: the pill sits at its natural width, left-aligned in the card. */
		.route__cta {
			align-self: flex-start;
		}

		.contact__rule,
		.contact__block--socials {
			display: flex;
		}

		.contact__rule {
			display: block;
		}

		.contact__panel {
			/* Was 588/648, which left the planner's stage ~40px short of what the
			   calendar actually needs: the tiles are square and sized from the
			   card's WIDTH, so the grid cannot shrink to fit a short card — it
			   just overflows and gets clipped by .planner's overflow: hidden.
			   The step row added on top of that. Measured need at 583px wide:
			   month head 36 + grid 539 + gaps, inside padding 52, step row 36 and
			   footer 36. */
			aspect-ratio: 588 / 745;
			max-height: 88vh;
			min-height: 38rem;
		}
	}
</style>
