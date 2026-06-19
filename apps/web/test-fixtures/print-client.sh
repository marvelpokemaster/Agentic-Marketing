#!/usr/bin/env bash
# Print copy-paste values from a client fixture for manual form entry.
# Usage: ./print-client.sh nexresume

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ID="${1:-}"

if [[ -z "$ID" ]]; then
  echo "Usage: $0 <client-id>"
  echo
  echo "Available clients:"
  for f in "$ROOT/clients"/*.json; do
    jq -r '"  " + .id + " — " + .scenario' "$f"
  done
  exit 1
fi

FILE="$ROOT/clients/${ID}.json"
if [[ ! -f "$FILE" ]]; then
  echo "Unknown client: $ID"
  exit 1
fi

echo "══════════════════════════════════════════════════════════════"
jq -r '"Client: " + .client_name + " (" + .id + ")"' "$FILE"
jq -r '"Scenario: " + .scenario' "$FILE"
echo "══════════════════════════════════════════════════════════════"
echo
echo "── Product form (/products/new) ──"
echo
jq -r '.product | "Name:\n  " + .name' "$FILE"
echo
jq -r '.product | "Description:\n  " + (.description // "")' "$FILE"
echo
echo "Features (one per line in form):"
jq -r '.product.features[]?' "$FILE" | sed 's/^/  /'
echo
jq -r '.product | "Target audience:\n  " + (.target_audience // "")' "$FILE"
echo
jq -r '.product | "Industry:\n  " + (.industry // "")' "$FILE"
echo
echo "── Files to upload ──"
LOGO=$(jq -r '.assets.logo // empty' "$FILE")
if [[ -n "$LOGO" ]]; then
  echo "  Logo: $ROOT/$LOGO"
else
  echo "  Logo: (none)"
fi
echo "  Images:"
jq -r '.assets.images[]?' "$FILE" | while read -r img; do
  echo "    $ROOT/$img"
done
if [[ $(jq -r '.assets.images | length' "$FILE") -eq 0 ]]; then
  echo "    (none)"
fi
echo
echo "── Generate step — select platforms ──"
jq -r '.platforms | join(", ")' "$FILE"
echo
echo "── Expected results ──"
jq -r '.expected' "$FILE"
