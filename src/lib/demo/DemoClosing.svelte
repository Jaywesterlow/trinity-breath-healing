<script lang="ts">
	/**
	 * The closing: a still lake at dusk, full-bleed, with the contact card on
	 * it. The two routes are the live contact section's: pick one and the pair
	 * gives way to the e-mail form or the date planner in place (the site's own
	 * ContactForm and DatePlanner, so a message or a booking from the demo is
	 * real). Both buttons are one tier with one hover, the card keeps its air
	 * below the panel, and it reaches over the next section's edge (the page's
	 * one overlap break).
	 */
	import dusk from './images/dusk.jpg?enhanced';
	import ContactForm from '$lib/components/ui/contact/ContactForm.svelte';
	import DatePlanner from '$lib/components/ui/contact/DatePlanner.svelte';
	import { magnetic } from '$lib/actions/magnetic';
	import { BRAND } from '$lib/constants/brand';

	let active = $state<'form' | 'meeting' | null>(null);
	let phase = $state<'idle' | 'out' | 'in'>('idle');
	let over = $state<'form' | 'meeting' | null>(null);
	const FADE_MS = 180;

	function choose(next: 'form' | 'meeting' | null) {
		if (phase !== 'idle') return;
		phase = 'out';
		setTimeout(() => {
			active = next;
			phase = 'in';
			requestAnimationFrame(() => requestAnimationFrame(() => (phase = 'idle')));
		}, FADE_MS);
	}
</script>

<section class="close" id="contact" aria-labelledby="close-heading">
	<div class="close__media" aria-hidden="true">
		<enhanced:img src={dusk} alt="" sizes="100vw" loading="lazy" />
	</div>
	<div class="frame">
		<div class="close__card">
			<header class="close__header">
				<span class="eyebrow">Contact</span>
				<h2 id="close-heading">Hoe wil je contact opnemen?</h2>
				<p class="lead lead--centre">
					Vul het formulier in of plan een kennismaking, wanneer het jou uitkomt.
				</p>
			</header>

			<div class="close__routes" class:is-leaving={phase !== 'idle'} hidden={active !== null}>
				<button
					type="button"
					class="route"
					use:magnetic={{
						enabled: over === null || over === 'meeting',
						dragging: false,
						margin: 120,
						strength: 0.035
					}}
					onpointerenter={() => (over = 'meeting')}
					onpointerleave={() => (over = null)}
					onclick={() => choose('meeting')}
				>
					<span class="route__title">Plan een kennismaking</span>
					<span class="route__body"
						>Kies zelf een moment. Dertig minuten, online, vrijblijvend.</span
					>
					<span class="pill route__pill">Kies een datum</span>
				</button>
				<button
					type="button"
					class="route"
					use:magnetic={{
						enabled: over === null || over === 'form',
						dragging: false,
						margin: 120,
						strength: 0.035
					}}
					onpointerenter={() => (over = 'form')}
					onpointerleave={() => (over = null)}
					onclick={() => choose('form')}
				>
					<span class="route__title">Stuur een bericht</span>
					<span class="route__body">
						Liever eerst een vraag stellen? Mailen en appen kan de hele dag.
					</span>
					<span class="pill route__pill">Schrijf een bericht</span>
				</button>
			</div>

			<div class="close__chosen" class:is-leaving={phase !== 'idle'} hidden={active === null}>
				<button
					type="button"
					class="close__switch"
					onclick={() => choose(active === 'form' ? 'meeting' : 'form')}
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
				<div class="close__panel">
					<div class="close__pane" hidden={active === 'meeting'}>
						<ContactForm />
					</div>
					<div class="close__pane" hidden={active === 'form'}>
						<DatePlanner />
					</div>
				</div>
			</div>

			<p class="close__direct">
				Of direct: <a href="mailto:{BRAND.email}">{BRAND.email}</a> of
				<a href="tel:{BRAND.phone}">{BRAND.phoneDisplay}</a>, tussen {BRAND.phoneHours}.
			</p>
			<p class="close__disclaimer">{BRAND.disclaimer}</p>
		</div>
	</div>
</section>

<style>
	.close {
		position: relative;
		padding-block: var(--d-s8) 0;
		isolation: isolate;
	}
	.close__media {
		position: absolute;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		background: var(--d-deep);
	}
	.close__media :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.close__card {
		position: relative;
		max-width: 56rem;
		margin: 0 auto -5rem;
		padding: var(--d-s5) var(--d-s3);
		background: var(--d-paper);
		border-radius: var(--d-radius);
	}
	.close__header {
		text-align: center;
	}
	.close :global(.lead--centre) {
		margin-inline: auto;
	}

	.close__routes {
		margin-top: var(--d-s5);
		display: grid;
		gap: var(--d-s3);
	}
	.close__routes[hidden],
	.close__chosen[hidden] {
		display: none;
	}
	.close__routes,
	.close__chosen {
		transition:
			opacity 180ms var(--d-ease),
			transform 180ms var(--d-ease);
	}
	.close__routes.is-leaving,
	.close__chosen.is-leaving {
		opacity: 0;
		transform: translateY(8px);
	}
	.route {
		--magnet-x: 0px;
		--magnet-y: 0px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--d-s2);
		padding: var(--d-s3);
		border: 1px solid var(--d-line);
		border-radius: var(--d-radius);
		background: var(--d-tint);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transform: translate(var(--magnet-x), var(--magnet-y));
		transition: border-color 150ms var(--d-ease);
	}
	.route:hover,
	.route:focus-visible {
		border-color: var(--d-water);
	}
	.route__title {
		font-family: var(--d-font-display);
		font-size: var(--d-fs-h3);
		font-weight: 700;
		line-height: 1.15;
	}
	.route__body {
		color: var(--d-ink-soft);
		flex: 1;
	}
	.route :global(.route__pill) {
		margin-top: var(--d-s1);
	}
	/* One tier, one hover: both pills are the filled action and both go one
	   step darker when the card is hovered. */
	.route:hover :global(.route__pill),
	.route:focus-visible :global(.route__pill) {
		background: var(--d-ink);
		border-color: var(--d-ink);
	}

	.close__chosen {
		margin-top: var(--d-s4);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--d-s3);
	}
	.close__switch {
		display: inline-flex;
		align-items: center;
		gap: var(--d-s1);
		padding: 0;
		border: 0;
		background: none;
		color: var(--d-deep);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.close__panel {
		width: 100%;
	}
	.close__pane[hidden] {
		display: none;
	}

	.close__direct {
		margin-top: var(--d-s5);
		text-align: center;
		color: var(--d-ink-soft);
	}
	.close__direct a {
		color: var(--d-deep);
		font-weight: 700;
		text-decoration: none;
		border-bottom: 1px solid currentColor;
	}
	.close__disclaimer {
		margin: var(--d-s3) auto 0;
		max-width: 56ch;
		text-align: center;
		font-size: var(--d-fs-eyebrow);
		color: var(--d-ink-soft);
	}
	@media (min-width: 768px) {
		.close__routes {
			grid-template-columns: 1fr 1fr;
		}
		.close__card {
			padding: var(--d-s6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.close__routes.is-leaving,
		.close__chosen.is-leaving {
			transform: none;
		}
	}
</style>
