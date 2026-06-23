<script lang="ts">
	import { onMount } from 'svelte';
	let activeTab = $state<'email' | 'online'>('email');

	onMount(() => {
		document.body.classList.add('js-enabled');
	});
</script>

<section id="contact">
	<div class="container">
		<p class="eyebrow">Contact</p>
		<h2>Een eerste stap hoeft niet groot te zijn.</h2>
		<p class="contact-body">
			Of je nu wilt mailen, bellen of direct een online afspraak wilt inplannen — kies wat voor jou
			werkt. Ik reageer zo snel mogelijk, meestal binnen één werkdag.
		</p>

		<!-- Toggle group — hidden when no JS (js-enabled class approach) -->
		<div class="toggle-group" role="radiogroup" aria-label="Contactmethode kiezen">
			<label class="toggle-pill" class:active={activeTab === 'email'}>
				<input
					type="radio"
					name="contact-method"
					value="email"
					checked={activeTab === 'email'}
					onchange={() => (activeTab = 'email')}
				/>
				Email formulier
			</label>
			<label class="toggle-pill" class:active={activeTab === 'online'}>
				<input
					type="radio"
					name="contact-method"
					value="online"
					checked={activeTab === 'online'}
					onchange={() => (activeTab = 'online')}
				/>
				Online meeting
			</label>
		</div>

		<!-- Email form panel — always in initial HTML -->
		<div class="panel panel-email" class:panel--active={activeTab === 'email'}>
			<form method="POST" action="">
				<div class="form-row">
					<div class="form-field">
						<label for="firstName">Voornaam *</label>
						<input type="text" id="firstName" name="firstName" required autocomplete="given-name" />
					</div>
					<div class="form-field">
						<label for="lastName">Achternaam *</label>
						<input type="text" id="lastName" name="lastName" required autocomplete="family-name" />
					</div>
				</div>
				<div class="form-field">
					<label for="email">E-mailadres *</label>
					<input type="email" id="email" name="email" required autocomplete="email" />
				</div>
				<div class="form-field">
					<label for="phone">Telefoonnummer</label>
					<input type="tel" id="phone" name="phone" autocomplete="tel" placeholder="+31" />
				</div>
				<p class="disclaimer">
					Trinity Breath &amp; Healing begeleidt bij lichaamsgerichte therapie. Wij zijn geen
					medische zorgverlener en behandelen geen diagnoses. Bij medische klachten raadpleeg altijd
					een arts.
				</p>
				<div class="form-field">
					<label for="message">Bericht *</label>
					<textarea id="message" name="message" required rows={5}></textarea>
				</div>
				<div class="form-field form-field--checkbox">
					<input type="checkbox" id="avg-consent" name="avg-consent" required />
					<label for="avg-consent">
						Ik ga akkoord met de verwerking van mijn gegevens conform de <a
							href="/privacyverklaring">privacyverklaring</a
						>. *
					</label>
				</div>
				<button type="submit" class="btn-submit">Verstuur email</button>
			</form>
		</div>

		<!-- Online meeting panel — always in initial HTML -->
		<div class="panel panel-online" class:panel--active={activeTab === 'online'}>
			<div id="cal-mount" aria-label="Agenda voor online afspraak">
				<!-- Phase 3 mounts Cal.com inline embed here -->
				<p class="cal-placeholder">Online afspraakenboek wordt hier geladen zodra beschikbaar.</p>
			</div>
		</div>
	</div>
</section>

<style>
	section {
		padding-block: var(--space-12);
		background: var(--color-bg-sand);
	}

	.container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--space-6);
	}

	.eyebrow {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: var(--space-4);
	}

	h2 {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-4);
	}

	.contact-body {
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-8);
	}

	.toggle-group {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-8);
		background: var(--color-card-warm);
		border-radius: var(--radius-full);
		padding: var(--space-2);
		width: fit-content;
	}

	.toggle-pill {
		display: flex;
		align-items: center;
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-full);
		cursor: pointer;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-muted);
		min-height: 44px;
		transition: background var(--motion-base) var(--ease-out);
	}

	.toggle-pill.active {
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
	}

	.toggle-pill input[type='radio'] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.panel {
		display: none;
	}

	.panel--active {
		display: block;
	}

	:global(body:not(.js-enabled)) .toggle-group {
		display: none;
	}

	:global(body:not(.js-enabled)) .panel-email {
		display: block;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
	}

	input,
	textarea {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-base);
		color: var(--color-fg-forest);
		background: var(--color-bg-sand);
		width: 100%;
	}

	input:focus,
	textarea:focus {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	.form-field--checkbox {
		flex-direction: row;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.form-field--checkbox input {
		width: auto;
		margin-top: var(--space-1);
		flex-shrink: 0;
	}

	.disclaimer {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
		line-height: var(--line-height-normal);
		margin-bottom: var(--space-4);
		padding: var(--space-4);
		background: var(--color-card-warm);
		border-radius: var(--radius-md);
	}

	.btn-submit {
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
		border: none;
		border-radius: var(--radius-full);
		padding: var(--space-3) var(--space-8);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		cursor: pointer;
		min-height: 44px;
	}

	.cal-placeholder {
		font-size: var(--font-size-sm);
		color: var(--color-muted);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	@media (min-width: 1024px) {
		section {
			padding-block: var(--space-16);
		}
	}
</style>
