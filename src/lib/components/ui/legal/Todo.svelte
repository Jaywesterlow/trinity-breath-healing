<script lang="ts">
	/**
	 * An inline marker for a fact only the practitioner can supply — KvK number,
	 * postal address, cancellation window.
	 *
	 * These pages are written and complete apart from those values, and the
	 * alternative to marking them is worse: inventing a KvK number puts a false
	 * statement in a legal document, and quietly omitting the line leaves a
	 * privacy statement that does not identify its own controller.
	 *
	 * Deliberately loud. It renders as visible bracketed text in the site's
	 * warning colour, so it cannot survive a read-through of the page, and it is
	 * greppable (`data-todo`) so the launch gate can refuse to ship one.
	 */
	let { children }: { children: import('svelte').Snippet } = $props();
</script>

<mark data-todo>[{@render children()}]</mark>

<style>
	mark {
		background: color-mix(in srgb, var(--brand-destructive, #b3402c) 10%, transparent);
		color: var(--brand-destructive, #b3402c);
		font-style: italic;
		padding: 0 0.15em;
		border-radius: 0.125rem;
	}
</style>
