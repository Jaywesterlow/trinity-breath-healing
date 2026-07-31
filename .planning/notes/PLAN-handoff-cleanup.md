# Plan — clean up the handoff documents

Written **2026-07-26**. For an agent picking this up cold.

## Why

There are five handoff-shaped documents in this repo and no way to tell which one is live.
An agent asked to "read the handoff" currently has to guess, and guessed wrong. Four of the
five describe work that is finished or that happened on branches which no longer exist.

**The rule this establishes: exactly one live handoff, at the repository root, named
`HANDOFF.md`.** Everything else is either archived or is not a handoff.

## Scope boundary — read before starting

This task touches **documentation only**: `HANDOFF.md`, `.planning/**`, `docs/**`.

**Do not touch `src/`, `tests/`, or `scripts/`.** Another agent is working on the fade
rollout on the same branch. Keeping this to docs means the two cannot collide.

Branch: `polish/site-polish`. Commit and push as normal.

---

## Task 1 — salvage before archiving

`.planning/HANDOFF.json` and `.planning/.continue-here.md` are both from one paused session
on the Behandelingen carousel (Embla). They read as dead, but the topic is **still open**:
the card transitions are janky, and three `[carousel-debug]` `console.log` calls are still
shipping in `src/lib/components/global/Behandelingen.svelte`, one firing on every seek.

Before archiving either file, copy the genuinely useful engineering notes into the
Behandelingen entry in `.planning/notes/KNOWN-ISSUES.md`. Specifically worth keeping:

- `engine.animation.stop()` is never restarted once Embla's own `render()` judges the
  carousel settled and idle — this is the root cause of the fresh-page-load freeze.
- Embla only emits `select` from `ScrollTo.scrollTo()`, so pagination and the active-card
  state never update from pure ticker motion; the session added `emitSelectIfIndexChanged()`.
- Hover was changed from a full stop to a 30% slowdown (`HOVER_FACTOR`) so it stops fighting
  drag.
- The freeze bug was root-caused but **not fixed**, and never verified in a real browser.

Do not copy the task lists or timestamps. Just the findings, so whoever fixes Behandelingen
does not re-derive them.

## Task 2 — make one canonical handoff

1. Move the current root `HANDOFF.md` to `.planning/archive/2026-07-06-slice-1-2-handoff.md`.
2. Move `.planning/notes/HANDOFF-polish-branch.md` to the root as `HANDOFF.md`.
3. Fix its internal references: it points at companion docs "in `.planning/notes/`", which
   stays true, but check every relative path still resolves from the new location.
4. Add a line at the top of the new root `HANDOFF.md`:
   *"This is the only live handoff. Superseded ones are in `.planning/archive/`."*

Root is the right home because it is where an agent looks first, and it is the name they
search for.

## Task 3 — archive the superseded

Create `.planning/archive/` and move these in, renamed with their date so the ordering is
obvious. **Move, do not delete** — the reasoning in them is worth keeping, it is just not
current.

| file | why it goes |
|---|---|
| `HANDOFF.md` (root, the old one) | slice-1/slice-2 work; those branches are gone and the work is merged |
| `.planning/HANDOFF.json` | paused carousel session, `status: paused`, salvage first |
| `.planning/.continue-here.md` | same carousel session, longer form, duplicate content |
| `.planning/phases/01-landing-sections/.continue-here.md` | says the footer is uncommitted and Hero/Werkwijze/Behandelingen/About/FAQ are unbuilt. All built and merged. |
| `.planning/quick/20260713-hero-draw-on/FIX-PLAN.md` | explicitly superseded by `DRAW-ON-PLAYBOOK.md`; fix landed in `c098714` |
| `.planning/debug/hero-enhanced-img-hydration.md` | `status: resolved`, fix applied |

Deleting a stale `HANDOFF.json` has precedent in this project — `.planning/STATE.md` line 132
records a previous session doing exactly that — so this is routine, not risky. Archiving
rather than deleting is the safer version of the same move.

## Task 4 — correct three verdicts that are wrong

An inventory was made of these files and three of its conclusions do not survive checking.
Whatever summary ends up in the archive or in `STATE.md` should not repeat them.

**4a. The draw-on work is NOT complete.** `DRAW-ON-PLAYBOOK.md`'s work list looks done because
`drawtrace.py` is committed and `WerkwijzeCard.svelte` / `AboutFeature.svelte` do wire up
`DrawOn`. Wired up is not working. Check for yourself:

```
cd src/lib/images && for f in *.svg; do echo "$f groups=$(grep -o '<g[ >]' $f|wc -l)"; done
```

`hero-illustration.svg` has 4 semantic groups. **All seven others have 1.** A single flat
group means the paths animate in raw trace order, which looks random — this is a live,
reported visual bug and it is outstanding item 2 in the handoff. Two related facts from the
2026-07-25/26 session: all seven of those files were also **malformed XML** (missing
`</mask>`, invisible when inlined, fatal as `<img>`) and are now fixed; and the Werkwijze card
art is currently **parked as static `<img>`**, so its draw-on is switched off entirely.

**Keep `DRAW-ON-PLAYBOOK.md` live.** It documents `drawtrace.py`, which is the tool needed to
finish the job.

**4b. The carousel handoffs are not simply orphaned.** See Task 1 — the topic is open and the
debug logging is still in the shipped bundle.

**4c. The root `HANDOFF.md` is not "orphaned to a local machine".** The `slice-1-foundation`
and `slice-2-readiness` branches genuinely do not exist on this remote, but their work is in
this repository's history — see commit `a7bf28e`, "merge: slice-2-readiness into
slice-1-foundation", sitting on the fork baseline `e934f8c`. It is a completed handoff, not
lost work. Nobody should go looking for another machine.

## Task 5 — tidy statuses and cross off what is done

- `.planning/quick/20260713-hero-draw-on/PLAN.md` — `status: in-progress` with every checkbox
  unticked, but its own `SUMMARY.md` is `status: complete`. Set it to `complete` or mark it
  superseded. Same situation in `.planning/quick/20260724-restore-faq-section/PLAN.md`, whose
  work shipped in PR #7.
- `.planning/quick/20260713-hero-draw-on/SUMMARY.md` lists "Prettier flags 92 files" as an
  open follow-up. **Done** — commit `6aef78e` formatted the repo and it is a CI gate now.
  Cross it off.
- The same file's "collapse 3 overlapping asset dirs" follow-up is **real and still open**.
  All three exist: `src/lib/images`, `src/lib/assets/images`, `static/images`. Move it into
  `KNOWN-ISSUES.md` so it does not stay buried in a completed summary.
- `docs/E2E-TRIAGE.md` — its counts (33 → 20) predate 15 tests added on 2026-07-25/26
  (`werkwijze-scrolljack.spec.ts`, `faq-disclosure.spec.ts`). **Re-run the suite and update the
  numbers before acting on any of its recommendations.** Its three buckets are still the right
  shape; only the arithmetic is stale.
- `.planning/quick/20260724-restore-faq-section/SUMMARY.md` flags three follow-ups that are
  genuinely open: the `/faq` route is still a stub although the footer links to it,
  `image.test.ts` times out flakily, and the Contact copy assertions are still commented out.
  Move those into `KNOWN-ISSUES.md` too.

## Task 6 — leave these alone

| file | why |
|---|---|
| `.planning/STATE.md` | living project state, not a handoff. Its roadmap todos are a separate decision for the owner. |
| `.planning/notes/KNOWN-ISSUES.md` | current, dated, actively used |
| `.planning/notes/RESEARCH-werkwijze-*.md` | current; explain why Werkwijze is built as it is |
| `DRAW-ON-PLAYBOOK.md` | see 4a — still needed |
| `docs/E2E-TRIAGE.md` | still actionable once renumbered |
| phase `PLAN.md` / `SUMMARY.md` pairs | project history, fine where they are |
| `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md` | reference documents |

## Verification

1. `find . -path ./node_modules -prune -o \( -iname "*handoff*" -o -iname "*continue-here*" \) -print`
   returns exactly one live file — root `HANDOFF.md` — plus whatever sits under
   `.planning/archive/`.
2. Root `HANDOFF.md` is the polish-branch one, and every path it references resolves.
3. `grep -rn "HANDOFF\|continue-here" --include="*.md" .planning/ docs/ *.md` turns up no link
   pointing at a file that has moved. `STATE.md` line 132 is a historical note and is fine.
4. `git status` shows changes only under `.planning/`, `docs/`, and root `HANDOFF.md`.

## Do not

- Do not delete anything. Archive it.
- Do not touch `src/`, `tests/`, or `scripts/` — another agent is working there.
- Do not fix the issues these documents describe. This task is filing, not engineering. The
  one exception is copying findings into `KNOWN-ISSUES.md`, which is still filing.
- Do not rewrite `.planning/STATE.md`'s history section.
