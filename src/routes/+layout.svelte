<script lang="ts">
	import { Nav, Footer, Head, JsonLd } from '$lib/components';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<Head meta={data.meta} />
<JsonLd graph={data.graph} />
<Nav />
{@render children()}
<Footer />
