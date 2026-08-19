---
id: 260809-jwg
slug: finish-handoff-carousel-session
date: 2026-08-09
type: quick
mode: default
---

# Finish the interrupted 2026-08-09 HANDOFF.md update

## Why

The 2026-08-09 handoff update was cut off mid-file. Two of three edits landed and are
sitting **uncommitted** in the working tree:

1. A new header paragraph ("Updated again **2026-08-09**") that tells the reader to
   **"Read 'Carousel session 2026-08-08/09' below before touching that component"**.
2. A rewritten Branches table plus a new "Branch cleanup, 2026-08-08" subsection.

The third edit — the section the header points at — was never written. So `HANDOFF.md`
currently forwards every reader to a section that does not exist, while the older
"The Behandelingen carousel rebuild" section (2026-08-07) still describes mechanisms that
~20 commits on this branch have since deleted.

## Verified state (evidence)

Confirmed by reading the file, `git diff HANDOFF.md`, `git log`, and grepping the component:

| Claim in HANDOFF.md today | Actual state on `claude/accessible-work-repos-kb67gy` |
|---|---|
| "Read 'Carousel session 2026-08-08/09' below" | No such section exists |
| `commitSteps(n)` / `FAST_STEP_MS` / `.treatments__pivot--fast` 180ms cascade is the multi-step mechanism | Deleted in `8e0e582`. Only survives in historical code comments (`Behandelingen.svelte:169,191,1059`) |
| `MAX_FLING_STEPS` caps a flick | Deleted in `b4d69b7` — no step counter left on the release path |
| *What is not done:* "Desktop click-a-non-center-card-to-jump … never implemented" | Implemented in `92fa716`, quick task `260808-ctj`, 6 Playwright tests |
| (nothing) | 8 TESTKAART diagnostic cards from `aa9522d` are **still live** in the working tree — `Behandelingen.svelte:26`, `TreatmentCard.svelte:26` |
| Notes table lists 3 files in `.planning/notes/` | `RESEARCH-carousel-physics-gsap.md` exists, is **untracked**, and is cited by name inside commit `001fe6a` |

## Tasks

1. **Write the missing "Carousel session 2026-08-08/09" section** into `HANDOFF.md`,
   placed directly after "The Behandelingen carousel rebuild" so the older section reads
   as the background it now is. Must cover, in order of what a reader needs first:
   - The TESTKAART diagnostic still being live, and how to remove it. Loudest item.
   - The bug that caused the release stutter (`c4a98f2` — no recycling during drag).
   - The physics rewrite: stepped cascade → continuous coast + critically-damped latch.
   - Buttons joining that same path, and the retarget behaviour it bought.
   - The tuning constants and what each owner complaint moved.
   - The drag-band fix and why the first attempt was wrong (rotated bounding boxes).
   - Desktop geometry churn and the 8-card caveat from `f8927b9`.
2. **Correct the stale bullets** in the older section rather than deleting it — mark the
   superseded mechanisms as history, fix the click-to-jump "not done" claim.
3. **Add `RESEARCH-carousel-physics-gsap.md`** to the notes table near the top of the file.
4. **Commit** the HANDOFF.md changes and the untracked research note.

## Explicitly out of scope

- **Do not revert the TESTKAART diagnostic.** The owner is still reviewing the carousel on
  desktop with numbered cards. Reverting is their call and gets its own commit. This task
  only documents that it must happen before PR #10 merges.
- No changes to `Behandelingen.svelte` or `TreatmentCard.svelte`.
- No merging or rebasing of PR #10.

## Verification

- `HANDOFF.md` contains a heading matching "Carousel session 2026-08-08/09" — the header's
  forward reference resolves.
- No surviving claim in `HANDOFF.md` that `commitSteps`, `FAST_STEP_MS`,
  `MAX_FLING_STEPS`, or `.treatments__pivot--fast` are current mechanisms.
- The notes table lists the research note.
- `git status` shows no untracked file under `.planning/notes/`.
