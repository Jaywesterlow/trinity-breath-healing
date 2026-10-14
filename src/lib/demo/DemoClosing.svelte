<script lang="ts">
	/**
	 * The closing: a still lake at dusk, full-bleed, with the contact card on
	 * it. The card reaches down over the next section's edge (the page's one
	 * overlap break). Two routes, as on the live contact section, each a link
	 * to the page that does the work; e-mail and phone under them; the
	 * disclaimer last, in her words.
	 */
	import dusk from './images/dusk.jpg?enhanced';
	import { magnetic } from '$lib/actions/magnetic';
	import { BRAND } from '$lib/constants/brand';
</script>

<section class="close" id="contact" aria-labelledby="close-heading">
	<div class="close__media" aria-hidden="true">
		<enhanced:img src={dusk} alt="" sizes="100vw" loading="lazy" />
	</div>
	<div class="frame">
		<div class="close__card">
			<span class="eyebrow">Contact</span>
			<h2 id="close-heading">Hoe wil je contact opnemen?</h2>
			<div class="close__routes">
				<a
					class="route"
					href="/contact#contact"
					use:magnetic={{ enabled: true, dragging: false, margin: 24, strength: 0.05 }}
				>
					<h3>Plan een kennismaking</h3>
					<p>Kies zelf een moment. Dertig minuten, online, vrijblijvend.</p>
					<span class="pill">Kies een datum</span>
				</a>
				<a
					class="route"
					href="/contact"
					use:magnetic={{ enabled: true, dragging: false, margin: 24, strength: 0.05 }}
				>
					<h3>Stuur een bericht</h3>
					<p>Liever eerst een vraag stellen? Mailen en appen kan de hele dag.</p>
					<span class="pill pill--ghost">Schrijf een bericht</span>
				</a>
			</div>
			<p class="close__direct">
				Of direct: <a href="mailto:{BRAND.email}">{BRAND.email}</a> en
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
		padding: var(--d-s5) var(--d-s4);
		background: var(--d-paper);
		border-radius: var(--d-radius);
		text-align: center;
	}
	.close__routes {
		margin-top: var(--d-s5);
		display: grid;
		gap: var(--d-s3);
		text-align: left;
	}
	.route {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--d-s2);
		padding: var(--d-s3);
		border-radius: var(--d-radius);
		background: var(--d-tint);
		color: inherit;
		text-decoration: none;
	}
	.route p {
		color: var(--d-ink-soft);
		flex: 1;
	}
	.route :global(.pill) {
		margin-top: var(--d-s1);
	}
	.route:hover :global(.pill),
	.route:focus-visible :global(.pill) {
		background: var(--d-ink);
		border-color: var(--d-ink);
		color: #fff;
	}
	.close__direct {
		margin-top: var(--d-s4);
		color: var(--d-ink-soft);
	}
	.close__direct a {
		color: var(--d-deep);
		font-weight: 700;
		text-decoration: none;
		border-bottom: 1px solid currentColor;
	}
	.close__disclaimer {
		margin: var(--d-s4) auto 0;
		max-width: 56ch;
		font-size: var(--d-fs-eyebrow);
		color: var(--d-ink-soft);
	}
	@media (min-width: 768px) {
		.close__routes {
			grid-template-columns: 1fr 1fr;
		}
		.close__card {
			padding: var(--d-s6) var(--d-s6);
		}
	}
</style>
