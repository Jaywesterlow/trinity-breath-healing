# Deferred Items — 260704-fj7

Out-of-scope pre-existing issues discovered during execution. Not fixed (Scope Boundary rule — only auto-fix issues directly caused by this task's changes).

## svelte-check errors, pre-existing, unrelated to Werkwijze.svelte

Discovered via `npm run check` baseline run before Task 1/2 edits:

- `src/lib/components/global/Footer.svelte:3` — Cannot find module `$lib/components/ui/SocialIcon.svelte` (file not present in this worktree; exists only as an uncommitted file in the primary repo checkout on `fix/hero-fit-cards`).
- `src/lib/components/global/Footer.svelte:48,57,66` — `footer`/`inverted` props not in `$$ComponentProps`/`Props` types (likely resolves once `SocialIcon.svelte` is restored/committed).
- `src/lib/components/global/Hero.svelte:3` — Cannot find module `$lib/components/ui/SocialIcon.svelte`.
- `src/lib/components/global/Hero.svelte:4` — Cannot find module `$lib/components/ui/HeroServiceCard.svelte` (same cause — uncommitted file in primary checkout, absent from this isolated worktree).

None of these touch `Werkwijze.svelte`, `WerkwijzeCard.svelte`, or `static/global.css` — out of scope for this quick task. They pre-date this task's changes and were present in the baseline `npm run check` run.

**Root cause:** A large amount of Phase 1 work (Hero fit fixes, Werkwijze section, Footer social icons, hero service cards, images) exists only as *uncommitted* changes in the primary repo working tree, not committed to any branch. Isolated worktrees (like this one) do not inherit uncommitted changes from other checkouts. Recommend the primary session commit that work so future isolated-worktree quick tasks/plans don't hit this gap.

## npm run build — fails, pre-existing, unrelated to Werkwijze.svelte

`npm run build` fails with `[UNLOADABLE_DEPENDENCY] Could not load src/lib/components/ui/SocialIcon.svelte`, referenced from `Footer.svelte:3`. Same root cause as above — `SocialIcon.svelte` and `HeroServiceCard.svelte` exist only as uncommitted files in the primary repo checkout, absent here. This blocks the build for the *entire app*, not just Werkwijze — it fails identically with or without this task's changes (confirmed: build was never attempted successfully in this worktree even before Task 1/2 edits, since Footer.svelte/Hero.svelte were already broken at the pre-existing baseline). Out of scope for this task per Scope Boundary rule; not fixed. `npm run check` (svelte-check) is the reliable automated proxy for this task's changes — it reports 0 new errors from `Werkwijze.svelte`/`WerkwijzeCard.svelte`.
