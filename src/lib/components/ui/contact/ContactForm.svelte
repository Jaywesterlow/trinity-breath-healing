<script lang="ts">
	/**
	 * Landing-page contact form (Figma: Desktop _ Home 5).
	 *
	 * Validates with the same zod schema the endpoint uses, so a message can
	 * only be wrong in one place. The <form> keeps a real method/action pair:
	 * with JS it posts through fetch and stays on the page, without JS the
	 * browser navigates to /api/contact, which answers with an HTML page.
	 */
	import { tick } from 'svelte';
	import PhonePrefix from './PhonePrefix.svelte';
	import { contactSchema, emptyContact, toFieldErrors } from '$lib/forms/contact';
	import type { ContactInput, FieldErrors } from '$lib/forms/contact';
	import { BRAND } from '$lib/constants/brand';

	let values = $state<ContactInput>({ ...emptyContact });
	let errors = $state<FieldErrors>({});
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let statusMessage = $state('');

	const sending = $derived(status === 'sending');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (sending) return;

		const parsed = contactSchema.safeParse(values);
		if (!parsed.success) {
			errors = toFieldErrors(parsed.error);
			status = 'error';
			statusMessage = 'Controleer de gemarkeerde velden en probeer het opnieuw.';
			// Move the user to the first thing they need to fix — after the DOM has
			// caught up with the state change, or nothing is marked invalid yet.
			await tick();
			document.querySelector<HTMLElement>('.form [aria-invalid="true"]')?.focus();
			return;
		}

		errors = {};
		status = 'sending';
		statusMessage = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify(parsed.data)
			});
			const payload = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				message?: string;
				errors?: FieldErrors;
			};

			if (response.ok && payload.ok) {
				values = { ...emptyContact };
				status = 'sent';
				statusMessage =
					payload.message ?? 'Bedankt voor je bericht. Ik neem zo snel mogelijk contact met je op.';
				return;
			}

			errors = payload.errors ?? {};
			status = 'error';
			statusMessage =
				payload.message ??
				`Het bericht kon niet worden verzonden. Mail gerust naar ${BRAND.email}.`;
		} catch {
			status = 'error';
			statusMessage = `Er is geen verbinding. Probeer het later opnieuw of mail naar ${BRAND.email}.`;
		}
	}
</script>

<div class="contact-panel">
	<form
		class="form"
		method="post"
		action="/api/contact"
		novalidate
		onsubmit={handleSubmit}
		aria-describedby="contact-form-status"
	>
		<div class="form__row">
			<div class="field">
				<label class="field__label" for="contact-voornaam">Voornaam</label>
				<input
					class="field__input"
					id="contact-voornaam"
					name="voornaam"
					type="text"
					autocomplete="given-name"
					placeholder="John"
					bind:value={values.voornaam}
					aria-invalid={errors.voornaam ? 'true' : undefined}
					aria-describedby={errors.voornaam ? 'contact-voornaam-error' : undefined}
				/>
				{#if errors.voornaam}
					<p class="field__error" id="contact-voornaam-error">{errors.voornaam}</p>
				{/if}
			</div>

			<div class="field">
				<label class="field__label" for="contact-achternaam">Achternaam</label>
				<input
					class="field__input"
					id="contact-achternaam"
					name="achternaam"
					type="text"
					autocomplete="family-name"
					placeholder="Williams"
					bind:value={values.achternaam}
					aria-invalid={errors.achternaam ? 'true' : undefined}
					aria-describedby={errors.achternaam ? 'contact-achternaam-error' : undefined}
				/>
				{#if errors.achternaam}
					<p class="field__error" id="contact-achternaam-error">{errors.achternaam}</p>
				{/if}
			</div>
		</div>

		<div class="field">
			<label class="field__label" for="contact-email">Email</label>
			<input
				class="field__input"
				id="contact-email"
				name="email"
				type="email"
				inputmode="email"
				autocomplete="email"
				placeholder="voorbeeld@email.com"
				bind:value={values.email}
				aria-invalid={errors.email ? 'true' : undefined}
				aria-describedby={errors.email ? 'contact-email-error' : undefined}
			/>
			{#if errors.email}
				<p class="field__error" id="contact-email-error">{errors.email}</p>
			{/if}
		</div>

		<div class="field">
			<label class="field__label" for="contact-telefoon">Telefoon</label>
			<div class="phone" class:phone--invalid={Boolean(errors.telefoon)}>
				<PhonePrefix bind:value={values.landcode} />
				<span class="phone__divider" aria-hidden="true"></span>
				<input
					class="field__input phone__input"
					id="contact-telefoon"
					name="telefoon"
					type="tel"
					inputmode="tel"
					autocomplete="tel-national"
					placeholder="6 123 456 78"
					bind:value={values.telefoon}
					aria-invalid={errors.telefoon ? 'true' : undefined}
					aria-describedby={errors.telefoon ? 'contact-telefoon-error' : undefined}
				/>
			</div>
			{#if errors.telefoon}
				<p class="field__error" id="contact-telefoon-error">{errors.telefoon}</p>
			{/if}
		</div>

		<div class="field field--grow">
			<label class="field__label" for="contact-bericht">Bericht</label>
			<textarea
				class="field__input field__input--area"
				id="contact-bericht"
				name="bericht"
				rows="6"
				placeholder="Schrijf jouw bericht"
				bind:value={values.bericht}
				aria-invalid={errors.bericht ? 'true' : undefined}
				aria-describedby={errors.bericht ? 'contact-bericht-error' : undefined}></textarea>
			{#if errors.bericht}
				<p class="field__error" id="contact-bericht-error">{errors.bericht}</p>
			{/if}
		</div>

		<!-- Honeypot: off-screen, never announced, never tabbed into. -->
		<div class="honeypot" aria-hidden="true">
			<label for="contact-website">Laat dit veld leeg</label>
			<input
				id="contact-website"
				name="website"
				type="text"
				tabindex="-1"
				autocomplete="off"
				bind:value={values.website}
			/>
		</div>

		<div class="form__actions">
			<p
				class="form__status"
				class:form__status--sent={status === 'sent'}
				class:form__status--error={status === 'error'}
				id="contact-form-status"
				role="status"
				aria-live="polite"
			>
				{statusMessage}
			</p>
			<button class="form__submit" type="submit" disabled={sending}>
				{sending ? 'Versturen…' : 'Verstuur email'}
			</button>
		</div>

		<noscript>
			<p class="form__noscript">
				Versturen werkt ook zonder JavaScript. Liever direct mailen? Dat kan naar
				<a href="mailto:{BRAND.email}">{BRAND.email}</a>.
			</p>
		</noscript>
	</form>
</div>

<style>
	.contact-panel {
		/* Field fills are the card green lifted toward the sand background —
		   derived from the card colour so both stay in step if the token moves. */
		--field-bg: color-mix(in srgb, var(--color-bg-sand) 10%, var(--color-fg-forest));
		--field-bg-hover: color-mix(in srgb, var(--color-bg-sand) 15%, var(--color-fg-forest));
		--field-placeholder: color-mix(in srgb, var(--color-bg-sand) 45%, transparent);

		display: flex; /* gives the form a real box to stretch into, so the textarea can grow */
		flex-direction: column;
		width: 100%;
		min-height: 26.25rem; /* 420px — matches the planner so toggling never shifts layout */
		padding: 2rem 1.75rem; /* was 24px all round — the copy sat too close to the edge */
		background: var(--color-fg-forest);
		border-radius: 1.5625rem; /* 25px */
		color: var(--color-bg-sand);
		font-family: var(--font-body);
	}

	.form {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		gap: 1.25rem; /* 20px between field groups */
		min-height: 0;
	}

	.form__row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem; /* 8px, label -> input */
		min-width: 0;
	}

	.field--grow {
		flex: 1 1 auto;
	}

	.field__label {
		font-size: 1rem; /* 16px */
		font-weight: var(--font-weight-regular);
		color: var(--color-bg-sand);
		line-height: 1.2;
	}

	.field__input {
		width: 100%;
		min-height: 3rem; /* 48px */
		padding: 0.75rem 1rem; /* 12px / 16px */
		background: var(--field-bg);
		border: 1px solid transparent;
		border-radius: 0.625rem; /* 10px */
		color: var(--color-bg-sand);
		font-family: inherit;
		font-size: 1rem;
		line-height: var(--line-height-normal);
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.field__input::placeholder {
		color: var(--field-placeholder);
	}

	.field__input:hover {
		background: var(--field-bg-hover);
	}

	.field__input:focus-visible {
		outline: none;
		border-color: var(--color-accent-gold-soft);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-gold-soft) 55%, transparent);
	}

	.field__input[aria-invalid='true'] {
		border-color: var(--color-accent-gold);
	}

	.field__input--area {
		/* Grows into whatever height the card has left, so the send button stays
		   pinned just under it on the tall desktop card (Figma). */
		flex: 1 1 auto;
		min-height: 8.75rem; /* 140px */
		/* No drag handle: dragging it grew the textarea past the card and took
		   the send button with it. Long messages scroll inside instead. */
		resize: none;
		overflow-y: auto;
	}

	/* --- Telefoon: static +31 segment fused to the number input --- */
	.phone {
		display: flex;
		align-items: stretch;
		background: var(--field-bg);
		border: 1px solid transparent;
		border-radius: 0.625rem;
		/* Not overflow:hidden — the country popup has to escape this box. */
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.phone {
		min-height: 3rem; /* matches the other inputs */
	}

	.phone:hover {
		background: var(--field-bg-hover);
	}

	.phone:focus-within {
		border-color: var(--color-accent-gold-soft);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-gold-soft) 55%, transparent);
	}

	.phone--invalid {
		border-color: var(--color-accent-gold);
	}

	.phone__divider {
		width: 1px;
		align-self: stretch;
		margin: 0.5rem 0;
		background: color-mix(in srgb, var(--color-bg-sand) 25%, transparent);
		flex-shrink: 0;
	}

	.phone__input {
		background: transparent;
		border: none;
		border-radius: 0;
		flex: 1 1 auto;
	}

	.phone__input:hover,
	.phone__input:focus-visible {
		background: transparent;
		box-shadow: none;
		border-color: transparent;
	}

	.field__error {
		font-size: 0.8125rem; /* 13px */
		line-height: var(--line-height-normal);
		color: var(--color-accent-gold);
	}

	.honeypot {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.form__actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.75rem;
		margin-top: auto; /* pin to the bottom of the card, per Figma */
	}

	.form__status {
		font-size: 0.875rem; /* 14px */
		line-height: var(--line-height-normal);
		min-height: 1.3125rem; /* reserve the line so a message never shifts the button (CLS) */
	}

	.form__status--sent {
		color: var(--color-card-warm);
	}

	.form__status--error {
		color: var(--color-accent-gold);
	}

	.form__submit {
		align-self: stretch;
		height: 2.5rem; /* 40px */
		padding: 0 1.5rem; /* 24px */
		border: none;
		border-radius: var(--radius-full);
		background: var(--color-accent-gold-soft);
		color: var(--color-bg-sand);
		font-family: inherit;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover);
	}

	.form__submit:hover:not(:disabled) {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.form__submit:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	.form__submit:focus-visible {
		outline: 2px solid var(--color-card-warm);
		outline-offset: 2px;
	}

	.form__submit:disabled {
		cursor: progress;
		opacity: 0.7;
	}

	.form__noscript {
		font-size: 0.8125rem;
		line-height: var(--line-height-normal);
		color: color-mix(in srgb, var(--color-bg-sand) 75%, transparent);
	}

	.form__noscript a {
		color: inherit;
	}

	/* Voornaam/Achternaam sit side by side as soon as there is room for two
	   comfortable targets — Figma only specifies the desktop pairing. */
	@media (min-width: 30rem) {
		.form__row {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 1024px) {
		/* Figma draws this card 800px tall inside a 1440x1024 frame. Taken
		   literally it overflows every real laptop, so the card is capped at
		   80vh and only reaches its Figma height on a screen tall enough to
		   hold it. Everything inside is sized off vh with the same floor/ceiling
		   shape, so the card scales down as a whole instead of overflowing. */
		.contact-panel {
			height: min(80vh, 50rem); /* 50rem = 800px, the Figma height */
			min-height: 0;
			padding: clamp(1.75rem, 3.6vh, 2.75rem); /* 40px at the reference frame, floor raised */
		}

		.form {
			gap: clamp(0.625rem, 1.6vh, 1.5rem);
		}

		.form__row {
			gap: 2rem; /* 32px column gap, per Figma */
		}

		.field {
			gap: clamp(0.25rem, 0.8vh, 0.5rem);
		}

		.field__label {
			font-size: clamp(0.875rem, 1.8vh, 1rem);
		}

		.field__input:not(.phone__input) {
			min-height: clamp(2.25rem, 5vh, 3rem);
			padding: clamp(0.375rem, 1.2vh, 0.75rem) 1rem;
			font-size: clamp(0.875rem, 1.8vh, 1rem);
		}

		.field__input--area {
			min-height: clamp(3.5rem, 9vh, 8.75rem);
		}

		.form__actions {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 1.5rem;
		}

		.form__status {
			flex: 1 1 auto;
			margin: 0;
		}

		.form__submit {
			align-self: flex-end;
			flex: 0 0 auto;
		}
	}
</style>
