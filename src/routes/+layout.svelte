<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Head from '$lib/components/Head.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<Head meta={data.meta} />
<JsonLd graph={data.graph} />
<Nav />
{@render children()}
<Footer />
