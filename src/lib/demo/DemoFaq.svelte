<script lang="ts">
	/**
	 * Five questions in a centred column, hairline rows, all closed on load,
	 * each a native <details> so they work without a script. The rows float
	 * up one after another as the list comes in (library 08a); an answer
	 * opens by growing (grid-template-rows, no height jump) while the plus
	 * turns into a cross. The same five are in the page's FAQPage JSON-LD; the
	 * full list lives on /contact.
	 */
	import { DEMO_FAQ } from './content';

	// Animate the close: a <details> drops its content the instant `open` is
	// removed, so the click is intercepted, the row is marked closing, and the
	// attribute goes once the transition has run.
	function onToggle(e: MouseEvent) {
		const summary = (e.target as HTMLElement).closest('summary');
		const item = summary?.parentElement as HTMLDetailsElement | null;
		if (!summary || !item || !item.open) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		e.preventDefault();
		item.classList.add('is-closing');
		const done = () => {
			item.open = false;
			item.classList.remove('is-closing');
		};
		const inner = item.querySelector('.faq__inner');
		inner?.addEventListener('transitionend', done, { once: true });
		window.setTimeout(done, 320);
	}
</script>

<section class="faq" id="faq" aria-labelledby="faq-heading">
	<div class="frame">
		<header class="faq__header" data-lines>
			<span class="eyebrow">Vragen</span>
			<h2 id="faq-heading"><span class="line"><span>Veelgestelde vragen</span></span></h2>
		</header>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="faq__list" data-float onclick={onToggle}>
			{#each DEMO_FAQ as item (item.question)}
				<details class="faq__item">
					<summary class="faq__q">
						<span>{item.question}</span>
						<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
							<path
								d="M10 4v12M4 10h12"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</svg>
					</summary>
					<div class="faq__inner">
						<p class="faq__a">{item.answer}</p>
					</div>
				</details>
			{/each}
		</div>
		<p class="faq__more"><a href="/contact#faq">Alle vragen en antwoorden</a></p>
	</div>
</section>

<style>
	.faq {
		padding-block: calc(var(--d-s7) + 5rem) var(--d-s7);
	}
	.faq__header {
		text-align: center;
	}
	.faq__list {
		max-width: 45rem;
		margin: var(--d-s5) auto 0;
		border-top: 1px solid var(--d-line);
	}
	.faq__item {
		border-bottom: 1px solid var(--d-line);
	}
	.faq__q {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--d-s3);
		min-height: 4.25rem;
		padding: var(--d-s2) 0;
		cursor: pointer;
		list-style: none;
		font-size: var(--d-fs-lead);
		font-weight: 700;
		transition: color 150ms var(--d-ease);
	}
	.faq__q:hover {
		color: var(--d-deep);
	}
	.faq__q::-webkit-details-marker {
		display: none;
	}
	.faq__q svg {
		flex-shrink: 0;
		color: var(--d-deep);
		transition: transform 240ms var(--d-ease);
	}
	.faq__item[open]:not(.is-closing) .faq__q svg {
		transform: rotate(45deg);
	}
	/* The answer grows from zero rows to its own height, so the row below
	   slides instead of jumping. */
	.faq__inner {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 280ms var(--d-ease);
	}
	.faq__item[open]:not(.is-closing) .faq__inner {
		grid-template-rows: 1fr;
	}
	.faq__inner > * {
		overflow: hidden;
	}
	.faq__a {
		padding: 0 0 var(--d-s3);
		max-width: 65ch;
		color: var(--d-ink-soft);
	}
	.faq__more {
		margin-top: var(--d-s4);
		text-align: center;
	}
	.faq__more a {
		color: var(--d-deep);
		font-weight: 700;
		text-decoration: none;
		border-bottom: 1px solid currentColor;
	}
	@media (prefers-reduced-motion: reduce) {
		.faq__inner,
		.faq__q svg {
			transition: none;
		}
	}
</style>
