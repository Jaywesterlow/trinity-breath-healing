<script lang="ts">
	/**
	 * Country dial-code picker for the contact form's phone field.
	 *
	 * A native <select> was the obvious choice and is the wrong one: browsers
	 * render the open option list with OS chrome, so it would drop a white
	 * menu into a dark green card on every platform. This is a listbox built
	 * from a button and a <ul>, which keeps the popup on-brand, and carries
	 * the keyboard behaviour a native select would have given for free:
	 * arrows and Home/End to move, Enter or Space to choose, Escape to close,
	 * and a click anywhere else to dismiss.
	 */
	import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '$lib/forms/countries';

	let { value = $bindable(DEFAULT_COUNTRY.dial) }: { value?: string } = $props();

	let open = $state(false);
	let activeIndex = $state(0);
	let root = $state<HTMLDivElement | null>(null);
	let listbox = $state<HTMLUListElement | null>(null);

	const selectedIndex = $derived(
		Math.max(
			COUNTRIES.findIndex((c) => c.dial === value),
			0
		)
	);
	const selected = $derived(COUNTRIES[selectedIndex]!);

	function openList() {
		activeIndex = selectedIndex;
		open = true;
		queueMicrotask(() => listbox?.focus());
	}

	function closeList(returnFocus = true) {
		open = false;
		if (returnFocus) queueMicrotask(() => root?.querySelector('button')?.focus());
	}

	function choose(country: Country) {
		value = country.dial;
		closeList();
	}

	function onListKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				activeIndex = Math.min(activeIndex + 1, COUNTRIES.length - 1);
				break;
			case 'ArrowUp':
				activeIndex = Math.max(activeIndex - 1, 0);
				break;
			case 'Home':
				activeIndex = 0;
				break;
			case 'End':
				activeIndex = COUNTRIES.length - 1;
				break;
			case 'Enter':
			case ' ':
				choose(COUNTRIES[activeIndex]!);
				break;
			case 'Escape':
			case 'Tab':
				closeList(event.key === 'Escape');
				return;
			default:
				return;
		}
		event.preventDefault();
	}

	function onButtonKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openList();
		}
	}

	/** Anything outside the control closes it — including a tap on mobile. */
	function onWindowPointerDown(event: PointerEvent) {
		if (!open || !root) return;
		if (!root.contains(event.target as Node)) open = false;
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="prefix" bind:this={root}>
	<button
		class="prefix__button"
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Landcode, nu {selected.name} {selected.dial}"
		onclick={() => (open ? closeList(false) : openList())}
		onkeydown={onButtonKeydown}
	>
		<span class="prefix__flag" aria-hidden="true">
			<svg viewBox="0 0 3 2">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- COUNTRIES is a hardcoded constant of trusted inline SVG; no user input -->
				{@html selected.flag}
			</svg>
		</span>
		<span class="prefix__dial">{selected.dial}</span>
		<svg class="prefix__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M4 6L8 10L12 6"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if open}
		<ul
			class="prefix__list"
			role="listbox"
			tabindex="-1"
			aria-label="Kies een landcode"
			aria-activedescendant="prefix-option-{COUNTRIES[activeIndex]!.code}"
			bind:this={listbox}
			onkeydown={onListKeydown}
		>
			{#each COUNTRIES as country, index (country.code)}
				<!-- In the ARIA listbox pattern the container owns the keyboard (see
				     onListKeydown) and the options only handle pointer input; a key
				     handler per option would double-fire every selection. -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					class="prefix__option"
					class:prefix__option--active={index === activeIndex}
					id="prefix-option-{country.code}"
					role="option"
					aria-selected={country.dial === value}
					onclick={() => choose(country)}
					onmouseenter={() => (activeIndex = index)}
				>
					<span class="prefix__flag" aria-hidden="true">
						<svg viewBox="0 0 3 2">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted constant, see above -->
							{@html country.flag}
						</svg>
					</span>
					<span class="prefix__name">{country.name}</span>
					<span class="prefix__dial">{country.dial}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.prefix {
		position: relative;
		flex-shrink: 0;
	}

	.prefix__button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		height: 100%;
		padding: 0 0.625rem 0 0.75rem;
		border: none;
		background: transparent;
		/* Sand on a sand card is invisible — this is why the +31 could not be seen,
		   only the flag beside it. */
		color: var(--color-fg-forest);
		font-family: inherit;
		font-size: inherit;
		line-height: 1;
		cursor: pointer;
		transition: background-color var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.prefix__button:hover {
			background: color-mix(in srgb, var(--brand-border) 8%, transparent);
		}
	}

	.prefix__button:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: -2px;
	}

	.prefix__flag {
		display: block;
		width: 1.25rem;
		flex-shrink: 0;
		border-radius: 0.125rem;
		overflow: hidden;
		line-height: 0;
	}

	.prefix__flag svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.prefix__dial {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.prefix__chevron {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.prefix__button[aria-expanded='true'] .prefix__chevron {
		transform: rotate(180deg);
	}

	/* The popup is the whole reason this is not a native select: it inherits the
	   card's palette instead of the operating system's. */
	.prefix__list {
		position: absolute;
		z-index: 20;
		top: calc(100% + 0.375rem);
		left: 0;
		min-width: max(100%, 14rem);
		max-height: 15rem;
		overflow-y: auto;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		background: var(--color-card-warm);
		border: 1px solid rgba(124, 94, 73, 0.28);
		border-radius: 0.625rem;
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.35);
		scrollbar-width: thin;
		scrollbar-color: rgba(124, 94, 73, 0.35) transparent;
	}

	.prefix__list:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.prefix__option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4375rem 0.5rem;
		border-radius: 0.375rem;
		color: var(--color-fg-forest);
		cursor: pointer;
	}

	.prefix__option--active {
		background: color-mix(in srgb, var(--brand-border) 12%, transparent);
	}

	.prefix__option[aria-selected='true'] .prefix__dial {
		font-weight: var(--font-weight-bold);
	}

	.prefix__name {
		flex: 1 1 auto;
		white-space: nowrap;
	}

	.prefix__list .prefix__dial {
		color: var(--color-text-subtle);
	}
</style>
