<script lang="ts">
	let {
		href,
		label,
		imgSrc,
		variant
	}: {
		href: string;
		label: string;
		imgSrc: string;
		variant: 'forest' | 'border';
	} = $props();
</script>

<a {href} class="card" class:card--forest={variant === 'forest'} class:card--border={variant === 'border'}>
	<img src={imgSrc} alt="" aria-hidden="true" class="card__bg" />
	<span class="card__arrow" aria-hidden="true">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M6 18L18 6M18 6H11M18 6V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</span>
	<span class="card__label">{label}</span>
</a>

<style>
	.card {
		position: relative;
		border-radius: 1.25rem; /* 20px — Figma spec; --radius-lg is 1rem (16px), 4px deviation visible */
		overflow: hidden;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-start;
		padding: var(--space-3);
		width: 8.125rem; /* 130px — Figma spec; no spacing token for fixed card sizes */
		height: 8.125rem;
		text-decoration: none;
		transition: opacity var(--motion-fast);
	}

	.card:hover {
		opacity: 0.88;
	}

	.card--forest {
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
	}

	.card--border {
		background: var(--brand-border);
		color: var(--color-bg-sand);
	}

	.card__bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.card__arrow {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		width: 1.5rem;
		height: 1.5rem;
		color: inherit;
	}

	.card__label {
		font-family: var(--font-body);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		position: relative;
		z-index: 1;
	}
</style>
