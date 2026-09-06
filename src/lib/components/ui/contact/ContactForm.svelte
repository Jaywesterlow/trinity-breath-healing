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
			<button
				class="form__submit text-roll"
				class:roll-host={!sending}
				type="submit"
				disabled={sending}
				data-label={sending ? 'Versturen…' : 'Verstuur email'}
			>
				<span class="text-roll__face">{sending ? 'Versturen…' : 'Verstuur email'}</span>
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
	/* Every value in this file now comes from DatePlanner: the two panels sit in
	   the same slot, one behind the other, and any difference between them reads
	   as the card changing shape when you switch. Sand ground, hairline border,
	   18px radius, 28px padding — the planner's card, exactly. */
	.contact-panel {
		display: flex; /* gives the form a real box to stretch into, so the textarea can grow */
		flex-direction: column;
		width: 100%;
		min-height: 0; /* the wrapper sets the height; this just fills its cell */
		padding: 1.75rem; /* 28px */
		--panel-bg: var(--color-panel);
		background: var(--panel-bg);
		border: 1px solid rgba(124, 94, 73, 0.22);
		border-radius: 1.125rem; /* 18px */
		color: var(--color-fg-forest);
		font-family: var(--font-body);
	}

	/* .planner__fields gap. */
	.form {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		gap: 0.875rem; /* 14px */
		min-height: 0;
	}

	/* .planner__field-row. */
	.form__row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem; /* 12px */
	}

	/* .planner__field. */
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem; /* 7px */
		min-width: 0;
	}

	/* Sized by its own content now, like .planner__field--grow: the card is as
	   tall as the calendar needs, and a stretching field would take all of it. */
	.field--grow {
		flex: 0 1 auto;
	}

	/* .planner__label: 11px uppercase brown at .12em. */
	.field__label {
		font-size: 0.6875rem; /* 11px */
		font-weight: var(--font-weight-medium);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--brand-border);
		line-height: 1.2;
	}

	/* .planner__input: transparent, hairline border, 48px, 13/16 padding. The
	   type size is the one place the two can differ from the design's 14px —
	   iOS Safari zooms the page when a focused input is under 16px — so 14px
	   applies from 1024px up, where no phone is looking. */
	.field__input {
		width: 100%;
		min-height: 3rem; /* 48px */
		padding: 0.8125rem 1rem; /* 13px 16px */
		background: transparent;
		border: 1px solid rgba(124, 94, 73, 0.28);
		border-radius: 0.625rem; /* 10px */
		color: var(--color-fg-forest);
		font-family: inherit;
		font-size: 1rem;
		line-height: var(--line-height-normal);
		transition: border-color var(--motion-hover) var(--ease-hover);
	}

	@media (min-width: 1024px) {
		.field__input {
			font-size: 0.875rem; /* 14px */
		}
	}

	.field__input::placeholder {
		/* Lighter than the value it stands in for, so the two cannot be confused —
		   --color-text-subtle is the body-copy colour and read as real input.
		   72% lands at 3.01:1 on the panel: clearly a placeholder, and still above
		   the 3:1 floor. Every field has a real visible <label>, so this text is a
		   redundant example rather than the only cue. */
		color: color-mix(in srgb, var(--color-text-subtle) 72%, transparent);
	}

	/* Chrome paints its own fill behind an autofilled field, as a background the
	   page cannot restyle — square, so it cut the corners off the 10px radius.
	   An inset shadow is the one thing that paints inside the border box and
	   follows its radius, so it covers Chrome's fill instead of fighting it. */
	.field__input:-webkit-autofill,
	.field__input:-webkit-autofill:focus {
		-webkit-box-shadow: 0 0 0 3rem var(--panel-bg) inset;
		-webkit-text-fill-color: var(--color-fg-forest);
		caret-color: var(--color-fg-forest);
		transition: background-color 100000s ease-in-out 0s;
	}

	@media (hover: hover) and (pointer: fine) {
		.field__input:-webkit-autofill:hover {
			-webkit-box-shadow: 0 0 0 3rem var(--panel-bg) inset;
			-webkit-text-fill-color: var(--color-fg-forest);
			caret-color: var(--color-fg-forest);
			transition: background-color 100000s ease-in-out 0s;
		}
	}

	.field__input:focus {
		border-color: var(--brand-border);
	}

	@media (hover: hover) and (pointer: fine) {
		.field__input:hover {
			border-color: var(--brand-border);
		}
	}

	.field__input:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	.field__input[aria-invalid='true'] {
		border-color: #a8442f;
	}

	/* The planner's textarea is 76px. This one is the whole point of the panel
	   rather than an optional note, so it gets more room — but a fixed amount,
	   not flex: 1, which handed it every spare pixel of a card sized for the
	   calendar. */
	.field__input--area {
		min-height: 8rem; /* 128px */
		/* No drag handle: dragging it grew the textarea past the card and took
		   the send button with it. Long messages scroll inside instead. */
		resize: none;
		overflow-y: auto;
	}

	/* --- Telefoon: static +31 segment fused to the number input --- */
	.phone {
		display: flex;
		align-items: stretch;
		background: transparent;
		border: 1px solid rgba(124, 94, 73, 0.28);
		border-radius: 0.625rem;
		/* Not overflow:hidden — the country popup has to escape this box. */
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.phone {
		min-height: 3rem; /* 48px — matches the other inputs */
	}

	.phone:focus-within {
		border-color: var(--brand-border);
	}

	@media (hover: hover) and (pointer: fine) {
		.phone:hover {
			border-color: var(--brand-border);
		}
	}

	.phone--invalid {
		border-color: #a8442f;
	}

	.phone__divider {
		width: 1px;
		align-self: stretch;
		margin: 0.5rem 0;
		background: rgba(124, 94, 73, 0.28);
		flex-shrink: 0;
	}

	.phone__input {
		background: transparent;
		border: none;
		border-radius: 0;
		flex: 1 1 auto;
	}

	.phone__input:focus-visible {
		background: transparent;
		box-shadow: none;
		border-color: transparent;
	}

	@media (hover: hover) and (pointer: fine) {
		.phone__input:hover {
			background: transparent;
			box-shadow: none;
			border-color: transparent;
		}
	}

	/* .planner__error. */
	.field__error {
		font-size: 0.75rem; /* 12px */
		line-height: var(--line-height-normal);
		color: #a8442f;
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

	/* .planner__footer: one row, pinned to the bottom of the card. */
	.form__actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		margin-top: auto;
	}

	.form__status {
		font-size: clamp(0.75rem, 3.2vw, 0.875rem);
		line-height: var(--line-height-normal);
		/* Reserve the line so a message never shifts the button (CLS). */
		min-height: 1em;
	}

	.form__status--sent {
		color: var(--brand-muted);
	}

	.form__status--error {
		color: #a8442f;
	}

	/* .planner__proceed: ButtonLink's own values — Cormorant 400 at 20px on
	   --brand-border, 13/30 padding, right-aligned in the footer row. */
	.form__submit {
		align-self: flex-end;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* Height rather than vertical padding, and the same 40px every other pill
		   on the site uses. The label roll clips at the padding edge, so a pill
		   padded to its height would leave the outgoing word sitting in the
		   padding instead of leaving the button. */
		height: var(--space-10);
		padding: 0 1.875rem; /* 30px */
		border: none;
		border-radius: var(--radius-full);
		/* Was --color-accent-gold-soft, which put sand on #c7a27a at 2.1:1 — the
		   worst contrast on the page, on its primary action. No gold in the palette
		   works here: forest on gold-soft is 3.98:1 and on the brighter gold 4.34:1,
		   both under the 4.5:1 this 16px label needs. --brand-border carries sand at
		   5.25:1 and is what every other primary button on the site already uses. */
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl); /* 20px */
		font-weight: 400;
		line-height: 1;
		cursor: pointer;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.form__submit:hover:not(:disabled) {
			transform: translateY(var(--lift-hover));
			box-shadow: var(--shadow-hover);
		}
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
		color: var(--color-text-subtle);
	}

	.form__noscript a {
		color: inherit;
	}

	/* Voornaam/Achternaam sit side by side as soon as there is room for two
	   comfortable targets — Figma only specifies the desktop pairing. Pairing
	   them early is what keeps the form close to the calendar's height on a
	   phone; stacked, they cost a whole extra field's worth of card. */
	@media (min-width: 22rem) {
		.form__row {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 1024px) {
		/* The wrapper (.contact__panel in Contact.svelte) owns the height now, so
		   this panel and the planner are the same size by construction and
		   switching between them cannot resize the card. */
		.contact-panel {
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
