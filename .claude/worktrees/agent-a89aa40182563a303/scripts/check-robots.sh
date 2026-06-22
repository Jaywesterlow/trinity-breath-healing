#!/usr/bin/env bash
# check-robots.sh — Assert named AI/training bot Allow blocks appear BEFORE
# the wildcard User-agent: * in robots.txt. Exits 1 with diagnostic on violation.
#
# Usage: bash scripts/check-robots.sh [path/to/robots.txt]
#        Defaults to static/robots.txt.
#
# Wired into the CI build-and-audit job by Plan 08.
set -euo pipefail

ROBOTS_FILE="${1:-static/robots.txt}"

if [ ! -f "$ROBOTS_FILE" ]; then
  echo "ERROR: robots.txt not found at $ROBOTS_FILE" >&2
  exit 1
fi

# Line number of the wildcard block
WILDCARD_LINE=$(grep -n "^User-agent: \*" "$ROBOTS_FILE" | head -1 | cut -d: -f1)

if [ -z "$WILDCARD_LINE" ]; then
  echo "ERROR: 'User-agent: *' not found in $ROBOTS_FILE" >&2
  exit 1
fi

FAILED=0
for BOT in OAI-SearchBot ChatGPT-User PerplexityBot Perplexity-User ClaudeBot Claude-User Google-Extended Applebot-Extended; do
  BOT_LINE=$(grep -n "^User-agent: ${BOT}$" "$ROBOTS_FILE" | head -1 | cut -d: -f1)
  if [ -z "$BOT_LINE" ]; then
    echo "ERROR: 'User-agent: ${BOT}' not found in $ROBOTS_FILE" >&2
    FAILED=1
    continue
  fi
  if [ "$BOT_LINE" -ge "$WILDCARD_LINE" ]; then
    echo "ORDER VIOLATION: 'User-agent: ${BOT}' (line ${BOT_LINE}) must appear before 'User-agent: *' (line ${WILDCARD_LINE})" >&2
    FAILED=1
  fi
done

# Verify Sitemap line exists
if ! grep -q "^Sitemap: https://" "$ROBOTS_FILE"; then
  echo "ERROR: Sitemap line starting with 'Sitemap: https://' not found in $ROBOTS_FILE" >&2
  FAILED=1
fi

if [ "$FAILED" -eq 1 ]; then
  exit 1
fi

echo "check-robots.sh: OK — all named bot blocks precede wildcard, Sitemap present"
exit 0
