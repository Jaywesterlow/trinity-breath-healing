<script lang="ts">
	/**
	 * Plausible, loaded only when PUBLIC_PLAUSIBLE_DOMAIN is set.
	 *
	 * Why Plausible and not GA4: Plausible measures without cookies or any
	 * device identifier, so there is nothing to ask consent for and no banner.
	 * That matters more here than on a normal marketing site — a banner is a
	 * layout shift on the LCP element and the first thing a visitor sees is a
	 * legal interruption, on a page whose whole job is to feel calm. It is also
	 * EU-hosted, which keeps a health-adjacent practice clear of a transfer
	 * question it has no appetite to answer.
	 *
	 * The domain is env-gated rather than hardcoded so preview deploys and local
	 * dev do not pollute production numbers: unset means no script at all, not a
	 * script pointed at the wrong site.
	 *
	 * `defer` (not `async`): the script has no work to do before the page has
	 * parsed, and deferring keeps it off the critical path entirely.
	 */
	import { env } from '$env/dynamic/public';

	const domain = env.PUBLIC_PLAUSIBLE_DOMAIN;
	const host = (env.PUBLIC_PLAUSIBLE_HOST ?? 'https://plausible.io').replace(/\/$/, '');
</script>

<svelte:head>
	{#if domain}
		<!-- Preconnect: the script is deferred, so without this the DNS + TLS
		     handshake starts only after parsing finishes. -->
		<link rel="preconnect" href={host} />
		<script defer data-domain={domain} src="{host}/js/script.js"></script>
	{/if}
</svelte:head>
