<script lang="ts">
	/**
	 * SiteNav — semantic <nav> landmark skeleton (BLOCKER-5, SEO-03).
	 * Phase 0 ships the empty landmark only — Phase 1 LND-XX populates the link list.
	 * The <nav> must be present in initial HTML for every prerendered route.
	 * Plan 08 audit gate asserts <nav> presence on every prerendered page.
	 * No props in Phase 0 — Phase 1 adds navigation items.
	 */
</script>

<nav aria-label="Hoofdnavigatie">
	<!-- Phase 1 LND-XX populates the link list.
	     Phase 0 ships the landmark only so initial HTML has <nav> for SEO-03 + Plan 08 audit gate. -->
</nav>
