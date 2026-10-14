<script lang="ts">
	/**
	 * Five questions in a centred column, hairline rows, all closed on load,
	 * each one a native <details> so they work without a script. The same five
	 * are in the page's FAQPage JSON-LD; the full list lives on /contact.
	 */
	import { DEMO_FAQ } from './content';
</script>

<section class="faq" id="faq" aria-labelledby="faq-heading">
	<div class="frame">
		<header class="faq__header" data-lines>
			<span class="eyebrow">Vragen</span>
			<h2 id="faq-heading"><span class="line"><span>Veelgestelde vragen</span></span></h2>
		</header>
		<div class="faq__list">
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
					<p class="faq__a">{item.answer}</p>
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
	}
	.faq__q::-webkit-details-marker {
		display: none;
	}
	.faq__q svg {
		flex-shrink: 0;
		color: var(--d-deep);
		transition: transform 200ms var(--d-ease);
	}
	.faq__item[open] .faq__q svg {
		transform: rotate(45deg);
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
</style>
