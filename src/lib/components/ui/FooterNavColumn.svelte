<script lang="ts">
	let {
		heading,
		links
	}: {
		heading: string;
		links: Array<{ href: string; label: string }>;
	} = $props();
</script>

<section class="col">
	<h2 class="col__heading">{heading}</h2>
	<ul class="col__links">
		{#each links as link (link.href)}
			<li><a href={link.href}>{link.label}</a></li>
		{/each}
	</ul>
</section>

<style>
	.col__heading {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-regular);
		color: var(--color-bg-sand);
		margin: 0 0 var(--space-3);
		line-height: var(--line-height-snug);
	}

	.col__links {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.col__links a {
		font-family: var(--font-body);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		color: var(--color-bg-sand);
		text-decoration: none;
		line-height: var(--line-height-normal);
		position: relative;
	}

	/* Underline reveal — same vocabulary as the footer's legal links. */
	.col__links a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.125rem;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.col__links a:hover::after,
	.col__links a:focus-visible::after {
		transform: scaleX(1);
	}

	@media (min-width: 1024px) {
		.col__heading {
			font-size: var(--font-size-heading-sm);
			margin-bottom: var(--space-4);
		}

		.col__links {
			gap: var(--space-4); /* 16px; Figma spec 15px — 1px deviation acceptable */
		}

		.col__links a {
			font-size: var(--font-size-base);
		}
	}
</style>
