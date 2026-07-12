#!/usr/bin/env bash
# grep-placeholders.sh — Informational grep for TODO and PLACEHOLDER markers.
#
# Phase 0: non-blocking (always exit 0). Prints all matches for visibility.
# LGL-11 plumbing: Phase 4 will change the line below from "|| true" to
# an explicit exit 1 on any match. Phase 0 ships intentional TODO/PLACEHOLDER
# markers in static/global.css (placeholder design tokens) and
# src/lib/constants/ (practitioner name, phone, KvK, BIG, Instagram handle).
#
# Usage: bash scripts/grep-placeholders.sh
# Wired into CI build-and-audit job (continue-on-error: true) by Plan 08.
set -uo pipefail

echo "=== Placeholder grep (informational — non-blocking in Phase 0) ==="
grep -rEn 'TODO|PLACEHOLDER|TBD_' src/ static/ || true
echo "=== End placeholder grep ==="

# Always exit 0 in Phase 0.
# LGL-11: flip this script to exit 1 on any match when Phase 4 ships.
exit 0
