<script lang="ts">
	import DemoPage from '$lib/demo/DemoPage.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DemoPage dateModified={data.meta.dateModified} />
