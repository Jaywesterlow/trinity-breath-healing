<script lang="ts">
	/**
	 * /diensten/clearing-ascensie — content and layout both come from ServicePage; this
	 * route only names the service. See ServicePage.svelte for why the copy is not here.
	 */
	import { ServicePage } from '$lib/components/global';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<ServicePage slug="clearing-ascensie" crumbs={data.crumbs} />
