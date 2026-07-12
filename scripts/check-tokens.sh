#!/usr/bin/env bash
# check-tokens.sh — Assert Trinity's brand/design tokens still exist in src/app.css (or a given file).
# FND-04 + FND-05 + FND-06 intent, re-pointed at the Tailwind v4 + shadcn stack (Slice 1, D-09
# superseded — see CLAUDE.md). Tokens now live in src/app.css's @theme block, processed via Vite.
#
# Usage: bash scripts/check-tokens.sh [path/to/app.css]
#        Defaults to src/app.css.
# Wired into CI by Plan 08; re-pointed by Slice 1 Task 4.
set -euo pipefail

CSS_FILE="${1:-src/app.css}"

if [ ! -f "$CSS_FILE" ]; then
  echo "ERROR: CSS file not found at $CSS_FILE" >&2
  exit 1
fi

REQUIRED_TOKENS=(
  "--color-bg-sand"
  "--color-fg-forest"
  "--color-accent-gold"
  "--color-card-warm"
  "--color-muted"
  "--color-border"
  "--space-1"
  "--space-4"
  "--space-16"
  "--radius-sm"
  "--radius-md"
  "--radius-lg"
  "--radius-full"
  "--font-display"
  "--font-body"
  "--font-size-base"
  "--font-size-3xl"
  "--line-height-tight"
  "--line-height-normal"
  "--font-weight-regular"
  "--font-weight-bold"
  "--motion-fast"
  "--motion-base"
  "--ease-out"
  "--container-max"
)

FAILED=0

for token in "${REQUIRED_TOKENS[@]}"; do
  if ! grep -qF -- "${token}:" "$CSS_FILE"; then
    echo "MISSING TOKEN: '${token}:' not found in $CSS_FILE" >&2
    FAILED=1
  fi
done

# FND-06: font-display: swap must be declared for self-hosted fonts
if ! grep -q "font-display: swap" "$CSS_FILE"; then
  echo "MISSING: 'font-display: swap' not found in $CSS_FILE (FND-06 violation)" >&2
  FAILED=1
fi

if [ "$FAILED" -eq 1 ]; then
  exit 1
fi

echo "check-tokens.sh: OK — all required tokens present in $CSS_FILE"
exit 0
