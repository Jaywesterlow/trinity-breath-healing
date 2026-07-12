#!/usr/bin/env bash
# no-shared-css.sh — Assert only static/global.css exists as a shared CSS file.
# FND-02 enforcement per CONTEXT.md D-09: NO src/styles/, NO shared .css files beyond global.css.
# Component styles must live in <style> blocks inside .svelte files.
#
# Usage: bash scripts/no-shared-css.sh
# Wired into CI by Plan 08.
set -euo pipefail

# Find all .css files under static/ and src/, excluding node_modules
found=$(find static src -type f -name "*.css" \
  -not -path "*/node_modules/*" \
  -not -path "*/.svelte-kit/*" \
  2>/dev/null | sort)

# The only allowed file is static/global.css (normalised path)
allowed="static/global.css"
violations=""

while IFS= read -r f; do
  # Normalize: strip leading ./ if present
  normalized="${f#./}"
  if [ "$normalized" != "$allowed" ]; then
    violations="${violations}  ${normalized}\n"
  fi
done <<< "$found"

# Also reject any src/styles/ directory existing at all
if [ -d "src/styles" ]; then
  violations="${violations}  src/styles/ (directory must not exist)\n"
fi

if [ -n "$violations" ]; then
  echo "FND-02 VIOLATION: only static/global.css is allowed as a shared CSS file." >&2
  echo "Component styles must live in <style> blocks inside .svelte files (auto-scoped by Svelte)." >&2
  echo "Found rogue CSS files:" >&2
  printf "%b" "$violations" >&2
  exit 1
fi

echo "no-shared-css.sh: OK — only static/global.css exists as a shared CSS file"
exit 0
