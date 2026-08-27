<script lang="ts">
	/**
	 * What the practitioner sees when she clicks through from her inbox.
	 *
	 * Two buttons in one form, both submitting a POST. The GET that renders
	 * this page changes nothing, which is what makes it safe for an e-mail
	 * scanner to have fetched it first.
	 */
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let sending = $state(false);

	/* Already decided before she arrived — she clicked the link twice, or came
	   back to it later. Show the outcome, hide the buttons. */
	const settled = $derived(data.status === 'approved' || data.status === 'rejected');
</script>

<svelte:head>
	<title>Afspraakaanvraag beoordelen</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="decide" id="main">
	<article class="card">
		<p class="eyebrow">Afspraakaanvraag</p>
		<h1>{data.naam}</h1>

		<dl class="facts">
			<dt>Wanneer</dt>
			<dd>{data.spoken}</dd>
			<dt>Hoe laat</dt>
			<dd>{data.start} – {data.end} <span class="muted">(30 minuten)</span></dd>
			<dt>E-mail</dt>
			<dd><a href="mailto:{data.email}">{data.email}</a></dd>
		</dl>

		{#if data.klachten}
			<section class="note">
				<h2>Waar deze persoon tegenaan loopt</h2>
				<p>{data.klachten}</p>
			</section>
		{/if}

		{#if form?.done}
			<p class="result" class:result--no={form.decision === 'rejected'}>{form.message}</p>
		{:else if form?.message}
			<p class="result result--no">{form.message}</p>
		{:else if settled}
			<p class="result">
				Deze aanvraag is al {data.status === 'approved' ? 'goedgekeurd' : 'afgewezen'}.
			</p>
		{:else}
			<form
				method="POST"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update();
						sending = false;
					};
				}}
			>
				<div class="actions">
					<button class="btn btn--yes" name="decision" value="approved" disabled={sending}>
						Goedkeuren
					</button>
					<button class="btn btn--no" name="decision" value="rejected" disabled={sending}>
						Afwijzen
					</button>
				</div>
				<p class="hint">
					Bij goedkeuren krijgt deze persoon een bevestiging met een agenda-uitnodiging. Bij
					afwijzen komt het tijdslot direct weer vrij op de website.
				</p>
			</form>
		{/if}
	</article>
</main>

<style>
	.decide {
		min-height: 70vh;
		display: grid;
		place-items: center;
		padding: clamp(1.5rem, 6vw, 4rem) 1rem;
		color: var(--color-fg-forest);
	}

	.card {
		width: 100%;
		max-width: 34rem;
		background: var(--color-bg-sand);
		border: 1px solid var(--brand-border);
		border-radius: var(--radius-lg, 1rem);
		padding: clamp(1.25rem, 5vw, 2rem);
	}

	.eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--brand-muted);
		margin: 0 0 0.35rem;
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 5vw, 2.1rem);
		line-height: 1.15;
		margin: 0 0 1.25rem;
	}

	.facts {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.4rem 1rem;
		margin: 0 0 1.25rem;
		font-size: 0.95rem;
	}

	dt {
		font-weight: 600;
		color: var(--brand-muted);
	}

	dd {
		margin: 0;
	}

	.muted {
		color: var(--brand-muted);
	}

	.note {
		border-left: 2px solid var(--brand-border);
		padding: 0.6rem 0 0.6rem 0.9rem;
		margin-bottom: 1.5rem;
	}

	.note h2 {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--brand-muted);
		margin: 0 0 0.35rem;
		font-weight: 600;
	}

	.note p {
		margin: 0;
		line-height: 1.65;
		white-space: pre-wrap;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.btn {
		flex: 1 1 10rem;
		font: inherit;
		font-size: 1rem;
		min-height: 3rem;
		padding: 0 1.5rem;
		border-radius: var(--radius-full, 999px);
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			transform var(--motion-hover, 180ms) var(--ease-hover, ease),
			opacity var(--motion-hover, 180ms) var(--ease-hover, ease);
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.btn--yes {
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
	}

	.btn--no {
		background: transparent;
		border-color: var(--brand-border);
		color: var(--color-fg-forest);
	}

	.hint {
		margin: 1rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--brand-muted);
	}

	.result {
		margin: 0;
		padding: 0.9rem 1.1rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--color-fg-forest) 8%, transparent);
		border-left: 3px solid var(--color-fg-forest);
		line-height: 1.6;
	}

	.result--no {
		background: color-mix(in srgb, var(--brand-destructive) 8%, transparent);
		border-left-color: var(--brand-destructive);
	}
</style>
