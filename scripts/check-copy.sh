#!/usr/bin/env bash
set -euo pipefail

# check-copy.sh — Copy preservation + hedge-language CI gate
# Phase 1 landing-page requirements: LND-09 (locked Figma copy) + LND-10 (no hedge language)
#
# Reads .svelte-kit/output/prerendered/pages/index.html — must be built before running.
# Exit 1 if any locked copy string is absent.
# Exit 1 if hedge language is detected.

INDEX=".svelte-kit/output/prerendered/pages/index.html"

if [ ! -f "$INDEX" ]; then
  echo "ERROR: $INDEX not found. Run 'npm run build' before check-copy.sh." >&2
  exit 1
fi

echo "check-copy.sh: checking locked Figma copy strings in $INDEX ..."

FAILED=0

check_string() {
  local str="$1"
  if grep -qF "$str" "$INDEX"; then
    echo "  [OK]  \"$str\""
  else
    echo "  [MISSING] \"$str\"" >&2
    FAILED=1
  fi
}

# LND-09 — locked Figma copy strings (must appear verbatim in rendered HTML)
check_string "Rust in je hoofd. Ontspanning in je lichaam."
check_string "Rustig, persoonlijk en op jouw tempo."
check_string "Vanuit eigen ervaring weet ik wat jij doormaakt."
check_string "Een eerste stap hoeft niet groot te zijn."
check_string "Maak een afspraak"
check_string "Verstuur email"

if [ "$FAILED" -ne 0 ]; then
  echo "" >&2
  echo "ERROR (LND-09): One or more locked Figma copy strings are missing from the built HTML." >&2
  echo "These strings are contractually locked in the UI-SPEC and must not be removed or altered." >&2
  exit 1
fi

echo "check-copy.sh: all locked copy strings present."

# LND-10 — hedge-language scan (must NOT appear in rendered landing copy)
echo "check-copy.sh: scanning for hedge language (LND-10) ..."

if grep -iE 'misschien|zou kunnen|wellicht|mogelijk|eventueel' "$INDEX" > /dev/null 2>&1; then
  echo "" >&2
  echo "ERROR (LND-10): Hedge language detected in $INDEX." >&2
  echo "Matches:" >&2
  grep -inE 'misschien|zou kunnen|wellicht|mogelijk|eventueel' "$INDEX" >&2
  echo "" >&2
  echo "Remove hedge language before merging. Use direct, confident copy per UI-SPEC." >&2
  exit 1
fi

echo "check-copy.sh: no hedge language detected."
echo "check-copy.sh: all checks passed."
