<script lang="ts">
	import StubLayout from '$lib/components/StubLayout.svelte';
	import { STUB_META } from '$lib/seo/stub-meta';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const stub = $derived(STUB_META[data.meta.path]!);
</script>

<StubLayout title={data.meta.title} description={data.meta.description} crumbs={stub.crumbs} />
