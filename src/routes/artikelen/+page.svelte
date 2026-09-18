<script lang="ts">
	import { StubLayout } from '$lib/components/global';
	import { STUB_META } from '$lib/seo/stub-meta';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const stub = $derived(STUB_META[data.meta.path]!);
</script>

<StubLayout heading={stub.heading} lead={stub.lead} crumbs={stub.crumbs} />
