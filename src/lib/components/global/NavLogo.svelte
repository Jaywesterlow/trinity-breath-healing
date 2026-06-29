<script lang="ts">
	let { inverted = false }: { inverted?: boolean } = $props();
</script>

<!-- TODO: self-host Cinzel + Montserrat woff2 to static/fonts/ and remove Google Fonts -->
<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Cinzel&family=Montserrat:wght@300&display=swap" rel="stylesheet" />
</svelte:head>

<a href="/" class="logo" class:logo--inverted={inverted} aria-label="TRINITY Breath & Healing — naar home">
	<div class="logo__icon">
		<img src="/trinity-logo.png" alt="" aria-hidden="true" />
	</div>
	<div class="logo__text">
		<span class="logo__name">TRINITY</span>
		<span class="logo__sub">Breath &amp; Healing</span>
	</div>
</a>

<style>
	.logo {
		display: flex;
		gap: var(--space-1);
		text-decoration: none;
		flex-shrink: 0;
		align-items: center;
	}

	/* Clipping wrapper matches Figma: 50×40 box, image slightly overflows and is cropped */
	.logo__icon {
		position: relative;
		width: 3.125rem;
		height: var(--space-10);
		flex-shrink: 0;
		overflow: hidden;
	}

	.logo__icon img {
		position: absolute;
		width: 115.13%;
		height: 120.11%;
		left: -7.49%;
		top: -10.06%;
		max-width: none;
	}

	.logo__text {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		width: 115px;
		height: 100%;
		flex-shrink: 0;
	}

	.logo__name {
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		font-weight: 400;
		letter-spacing: 2.88px;
		color: #404040;
		line-height: 1;
		width: 100%;
		transition: color var(--motion-base);
	}

	.logo__sub {
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		font-size: 10px;
		letter-spacing: 1.5px;
		color: #7a6f4f;
		line-height: 1;
		width: 100%;
		transition: color var(--motion-base);
	}

	/* Inverted: mobile overlay open (dark background) */
	.logo--inverted .logo__name {
		color: #f2f2f2;
	}

	.logo--inverted .logo__sub {
		color: #afa483;
	}
</style>
