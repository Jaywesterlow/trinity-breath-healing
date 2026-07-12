---
quick_id: 260704-fj7
status: incomplete
last_updated: "2026-07-04"
---

# Quick Task 260704-fj7: Werkwijze card-peek fix + mobile scroll-jack

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 (unplanned, Rule 3) | Restore missing Werkwijze/WerkwijzeCard baseline + 2 CSS tokens | `868936b` | `src/lib/components/global/Werkwijze.svelte`, `src/lib/components/ui/WerkwijzeCard.svelte`, `static/global.css`, `deferred-items.md` |
| 1 | Fix card-peek gap calc (mobile) | `b6d9799` | `src/lib/components/global/Werkwijze.svelte` |
| 2 | Add mobile scroll-jack | `fd14cd0` | `src/lib/components/global/Werkwijze.svelte` |
| — | Deferred-items update (build failure note) | `8004213` | `deferred-items.md` |

## Deviations

**Unplanned scaffolding (Task 0):** `Werkwijze.svelte` and `WerkwijzeCard.svelte` existed only as uncommitted, untracked files in the primary repo checkout (`fix/hero-fit-cards`) — they were never committed, so the isolated worktree (created from committed HEAD) didn't have them. The executor recreated both files verbatim, verified byte-identical against the primary checkout's uncommitted copies, plus added 2 missing CSS tokens (`--color-text-subtle`, `--font-weight-light`) referenced by `WerkwijzeCard.svelte`, matching the primary checkout's values. This was confirmed byte-identical by the orchestrator before merge (diff against primary checkout showed no differences).

**Pre-existing, unrelated build failure:** `npm run build` fails, but on the same issue present before this task's edits — `Footer.svelte` and `Hero.svelte` reference missing `SocialIcon.svelte` / `HeroServiceCard.svelte` modules (out of scope for this task, both files existed as untracked/incomplete elsewhere in the working tree). Logged in `deferred-items.md`, not a regression from this task.

## Verification

- `npm run check` — 0 new errors from `Werkwijze.svelte` / `WerkwijzeCard.svelte` (6 pre-existing errors remain, unrelated — see above)
- `npm run build` — fails, but on the pre-existing unrelated issue, confirmed identical before and after this task's edits
- Manual browser checkpoint — **not yet performed**, requires a human (see below)

## Checkpoint: human-verify (blocking, unresolved)

Per plan `<how-to-verify>`, a human must confirm in a real browser:

1. `npm run dev`, check 412px / 428px / 430px / 767px widths — no neighbour-card peek
2. Scroll into Werkwijze at a mobile width — section pins, cards translate horizontally in sync with scroll until the 3rd card, then normal vertical scroll resumes
3. Direct swipe/drag on the card track still works mid-pin (escape hatch)
4. DevTools "Emulate prefers-reduced-motion: reduce" — restores prior behavior exactly (no pinning, native swipe/snap only)
5. Desktop (≥1024px) — pixel-identical to before this change
6. Keyboard Tab reaches "Maak een afspraak" CTA without getting stuck, and continues past the section afterward

**Status: incomplete** until the above is confirmed by the user.

## Orchestrator Notes (post-execution)

- Worktree branch `worktree-agent-a6bdf8615bf2fd627` merged into `fix/hero-fit-cards` via `--no-ff` merge, no conflicts (verified `static/global.css` token additions were an identical subset of already-present local uncommitted changes; `Werkwijze.svelte`/`WerkwijzeCard.svelte` were removed locally pre-merge since they matched the pre-fix baseline commit exactly, then restored by the merge with the fixes applied).
- Worktree removed and branch deleted after merge.
- This SUMMARY.md was reconstructed by the orchestrator after the fact — the executor's original copy was lost when the worktree was force-removed without first rescuing uncommitted `.planning/` files (deviation from the standard cleanup script, which normally copies stray `*SUMMARY.md` files out before `git worktree remove --force`). Content reconstructed verbatim from the executor's returned completion report.
