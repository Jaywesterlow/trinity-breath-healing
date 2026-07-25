<script lang="ts">
	import ContactForm from '$lib/components/ui/contact/ContactForm.svelte';
	import DatePlanner from '$lib/components/ui/contact/DatePlanner.svelte';

	let active = $state<'form' | 'meeting'>('form');
</script>

<section class="contact" aria-labelledby="contact-heading">
	<div class="contact__inner">
		<div class="contact__text">
			<p class="contact__eyebrow">Over mij</p>
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

			<div class="contact__toggle">
				<button
					type="button"
					class="contact__toggle-btn"
					class:contact__toggle-btn--active={active === 'form'}
					aria-pressed={active === 'form'}
					onclick={() => (active = 'form')}
				>
					<span class="contact__toggle-dot" aria-hidden="true"></span>
					<span class="contact__toggle-label">Email formulier</span>
				</button>
				<button
					type="button"
					class="contact__toggle-btn"
					class:contact__toggle-btn--active={active === 'meeting'}
					aria-pressed={active === 'meeting'}
					onclick={() => (active = 'meeting')}
				>
					<span class="contact__toggle-dot" aria-hidden="true"></span>
					<span class="contact__toggle-label">Online meeting</span>
				</button>
			</div>
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

	.contact__text {
		display: flex;
		flex-direction: column;
		text-align: center;
	}

	.contact__eyebrow {
		font-family: var(--font-body);
		font-size: 1rem; /* 16px */
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: 1.3125rem; /* 21px */
	}

	.contact__heading {
		font-family: var(--font-display);
		font-size: 2rem; /* 32px */
		font-weight: var(--font-weight-medium);
		line-height: 1.1;
		color: var(--color-fg-forest);
		margin-bottom: 1rem; /* 16px */
	}

	.contact__description {
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		font-size: 0.75rem; /* 12px */
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
		margin-bottom: 1.5rem; /* 24px */
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
		color: inherit;
		text-decoration: underline;
	}

	.contact__toggle {
		display: flex;
		gap: 0.5rem; /* 8px */
	}

	.contact__toggle-btn {
		display: inline-flex;
		flex: 1 1 0;
		align-items: center;
		justify-content: center;
		gap: 0.5rem; /* 8px */
		padding: 0.5rem; /* 8px */
		border: none;
		background: transparent;
		border-radius: 0.625rem; /* 10px */
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 1rem; /* 16px */
		color: var(--color-fg-forest);
		transition: background-color var(--motion-fast);
	}

	.contact__toggle-btn--active {
		background: var(--color-card-warm);
	}

	.contact__toggle-dot {
		width: 0.875rem; /* 14px */
		height: 0.875rem;
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

	.contact__panel {
		width: 100%;
		margin-top: 1.5rem; /* 24px, buttons -> panel gap */
	}

	@media (min-width: 1024px) {
		.contact {
			padding: var(--space-16) var(--space-8);
		}

		.contact__inner {
			max-width: none;
			display: grid;
			grid-template-columns: minmax(0, 36.75rem) minmax(0, 30.375rem); /* 588px / 486px */
			column-gap: 3.5rem; /* 56px */
			align-items: center;
			justify-content: center;
		}

		/* Desktop: panel LEFT, text RIGHT (node 424-113) */
		.contact__panel {
			grid-column: 1;
			grid-row: 1;
			margin-top: 0;
		}

		.contact__text {
			grid-column: 2;
			grid-row: 1;
			align-items: flex-start;
			text-align: left;
		}

		.contact__eyebrow {
			font-size: 1.25rem; /* 20px */
			margin-bottom: 1.625rem; /* 26px */
		}

		.contact__heading {
			font-size: 2.5rem; /* 40px */
			max-width: 30.375rem; /* 486px */
			margin-bottom: 1.75rem; /* 28px, title -> paragraph 1 gap */
		}

		.contact__description {
			font-size: 1rem; /* 16px */
			text-align: left;
			margin-bottom: 1.75rem; /* 28px, paragraph 2 -> buttons gap */
		}

		.contact__description-intro {
			display: block;
			margin-bottom: 1.25rem; /* 20px, paragraph 1 -> paragraph 2 gap */
		}

		.contact__toggle {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem; /* 12px */
		}

		.contact__toggle-btn {
			flex: 0 0 auto;
			align-self: flex-start;
			padding: 0.5rem 1rem; /* 8px vertical / 16px horizontal */
			font-size: 1.25rem; /* 20px */
		}
	}
</style>
