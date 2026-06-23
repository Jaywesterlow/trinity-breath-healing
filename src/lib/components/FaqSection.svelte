<script lang="ts">
	import { faqItems } from '$lib/content/faq/index';
</script>

<section class="faq-section">
	<div class="container">
		<p class="eyebrow">FAQ</p>
		<h2>Veelgestelde vragen</h2>
		<div class="faq-list">
			{#each faqItems as item}
				<details class="faq-item">
					<summary class="faq-question">
						<span>{item.question}</span>
						<svg class="chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
							<polyline
								points="5,8 10,13 15,8"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</summary>
					<p class="faq-answer">{item.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<style>
	.faq-section {
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
		margin-bottom: var(--space-8);
	}

	.faq-list {
		display: flex;
		flex-direction: column;
	}

	.faq-item {
		border-bottom: 1px solid var(--color-border);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-5) 0;
		cursor: pointer;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-fg-forest);
		list-style: none;
		min-height: 44px;
	}

	.faq-question::marker,
	.faq-question::-webkit-details-marker {
		display: none;
	}

	.faq-question span {
		flex: 1;
	}

	.chevron {
		flex-shrink: 0;
		transition: transform var(--motion-fast) var(--ease-out);
	}

	.faq-item[open] .chevron {
		transform: rotate(180deg);
	}

	.faq-answer {
		padding-bottom: var(--space-5);
		font-size: var(--font-size-base);
		line-height: var(--line-height-loose);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.faq-section {
			padding-block: var(--space-16);
		}
	}
</style>
