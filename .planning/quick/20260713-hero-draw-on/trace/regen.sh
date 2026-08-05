#!/usr/bin/env bash
# regen.sh — the regroup.py invocation for each traced asset, saved here instead of a commit
# message or a terminal history that nobody can grep.
#
# Background (KNOWN-ISSUES.md item 12): the --section indices used for card-kennismaking were
# typed once on a command line and never wrote to a commit or this repo. Checked on 2026-08-01
# by searching the full history of every commit touching this directory (`git log --all -p`)
# for the literal flag values (--section, --anchor) — none exist anywhere as text. Only prose
# describing the technique was ever committed. So the historical numbers are not "recoverable
# from git history" as KNOWN-ISSUES.md optimistically put it — they are gone. This file exists
# so that never happens again: from now on, if you run regroup.py by hand, the invocation goes
# in here before you close the terminal.
#
# Usage: bash regen.sh <asset>
#   bash regen.sh verdieping
#   bash regen.sh sessie
#   bash regen.sh kennismaking   # currently refuses — see below

set -euo pipefail
cd "$(dirname "$0")"

asset="${1:-}"

case "$asset" in
  verdieping)
    # card-verdieping-bg — nearest-neighbour order fixed the scanline (e501a5f), wave pacing
    # brought total from 3.4s to 2.2s (32c968e). The trunk-base --anchor coordinate itself was
    # never recorded as text anywhere either; if you need to re-run this from a fresh trace,
    # re-derive it by eye from the source PNG (see DRAW-ON-PLAYBOOK.md "Ground truth PNGs") and
    # update this line once you have it.
    echo "Anchor coordinate for card-verdieping-bg is not recorded — see comment above." >&2
    echo "Fill it in here once re-derived, then remove this guard." >&2
    exit 1
    # python3 regroup.py ../../../../src/lib/images/card-verdieping-bg.svg \
    #   --order nn --anchor <trunk-base-x>,<trunk-base-y> --pace wave --total 2.2
    ;;

  sessie)
    # card-sessie — same technique as verdieping, different source figure. Anchor unrecorded,
    # same caveat.
    echo "Anchor coordinate for card-sessie is not recorded — see comment above." >&2
    exit 1
    # python3 regroup.py ../../../../src/lib/images/card-sessie.svg \
    #   --order nn --anchor <figure-base-x>,<figure-base-y> --pace wave --total 2.2
    ;;

  kennismaking)
    # card-kennismaking — six named sections (front rim -> front body -> back rim -> back body
    # -> front smoke -> back smoke), each a set of stroke indices into the RAW trace (before any
    # regrouping), plus two --last regions for the steam curls. None of those index lists were
    # ever written down — see the top-of-file note. Regenerating this trace means:
    #   1. Recover the source PNG: see DRAW-ON-PLAYBOOK.md "Ground truth PNGs"
    #      (git show a74eb55^:static/images/card-kennismaking.png > <scratch>/card-kennismaking.png)
    #   2. Re-trace it with drawtrace.py --animate to get a fresh, unordered SVG
    #   3. Re-derive the six section index lists by eye, verifying with --dump-sections and by
    #      rendering each section in its own colour (the method the original run used, per
    #      commit 4e26cb6) — not by guessing from this file
    #   4. Paste the finished command below, replacing this guard
    echo "card-kennismaking's --section indices are not recorded anywhere — see comment above." >&2
    echo "This is a from-scratch re-derivation, not a lookup. Do not fabricate indices." >&2
    exit 1
    # python3 regroup.py ../../../../src/lib/images/card-kennismaking.svg \
    #   --section "front rim:<indices>" --section "front body:<indices>" \
    #   --section "back rim:<indices>" --section "back body:<indices>" \
    #   --last "front-steam:<indices>" --last "back-steam:<indices>" --last-order y-up \
    #   --total 2.2
    ;;

  *)
    echo "Usage: bash regen.sh {verdieping|sessie|kennismaking}" >&2
    exit 1
    ;;
esac
