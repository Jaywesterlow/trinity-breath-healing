<script lang="ts">
	/**
	 * SiteFooter — semantic <footer> landmark skeleton (BLOCKER-5, SEO-03).
	 * Phase 0 ships the labelled landmark only — Phase 1 LND-08 lands NAP block, KvK, social links.
	 * The <footer> must be present in initial HTML for every prerendered route.
	 * Plan 08 audit gate asserts <footer> presence on every prerendered page.
	 * No props in Phase 0 — Phase 1 LND-08 adds footer content.
	 *
	 * Uses aria-labelledby for a11y: <footer> is labelled by its hidden <h2>.
	 */
</script>

<footer aria-labelledby="site-footer-heading">
	<h2 id="site-footer-heading" class="sr-only">Site footer</h2>
	<!-- Phase 1 LND-08 lands NAP block, KvK number, social links, and copyright.
	     Phase 0 ships the labelled landmark only. -->
</footer>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
	/* Phase 1 LND-08 fills footer content styles. Reserved for landing phase. */
</style>
