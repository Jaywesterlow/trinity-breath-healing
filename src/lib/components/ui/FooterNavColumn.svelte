<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	let {
		heading,
		links
	}: {
		heading: string;
		links: Array<{ href: string; label: string }>;
	} = $props();
</script>

<section class="col">
	<!-- The column heading and every link answer the band on their own edges: stacked in a
	     column they sit at different heights, and revealing the whole nav at once made a
	     link near the bottom fade on an edge two hundred pixels above itself. -->
	<h2 class="col__heading" use:reveal>{heading}</h2>
	<ul class="col__links">
		{#each links as link (link.href)}
			<li use:reveal><a class="link-underline" href={link.href}>{link.label}</a></li>
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
	/* The wipe is .link-underline in app.css. */

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
